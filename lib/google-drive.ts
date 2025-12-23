import { google } from 'googleapis';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

interface UploadParams {
    fileName: string;
    mimeType: string;
    body: Readable | Buffer | string;
    folderId?: string;
}

async function getCredentials() {
    // 1. Try Environment Variables (Legacy Service Account)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return {
            type: 'service_account',
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
        };
    }

    // 2. Try Supabase Database (Configuración)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('configuraciones')
            .select('clave, valor')
            .in('clave', [
                'google_service_account_json',
                'google_drive_folder_id',
                'google_drive_refresh_token',
                'google_drive_email'
            ]);

        if (!error && data) {
            const configMap = data.reduce((acc: any, curr) => {
                acc[curr.clave] = curr.valor;
                return acc;
            }, {});

            // A. OAuth Flow (Preferred)
            if (configMap.google_drive_refresh_token && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
                return {
                    type: 'oauth',
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    refreshToken: configMap.google_drive_refresh_token,
                    folderId: configMap.google_drive_folder_id || undefined
                };
            }

            // B. Service Account JSON Flow (Fallback)
            if (configMap.google_service_account_json) {
                try {
                    const json = JSON.parse(configMap.google_service_account_json);
                    return {
                        type: 'service_account',
                        email: json.client_email,
                        privateKey: json.private_key,
                        folderId: configMap.google_drive_folder_id || undefined
                    };
                } catch (e) {
                    console.error("Invalid JSON in google_service_account_json config");
                }
            }
        }
    }

    throw new Error("Missing Google Drive credentials (OAuth or Service Account)");
}

export async function uploadToDrive({ fileName, mimeType, body, folderId }: UploadParams) {
    const creds: any = await getCredentials();
    let auth;

    if (creds.type === 'oauth') {
        const oauth2Client = new google.auth.OAuth2(
            creds.clientId,
            creds.clientSecret
        );
        oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
        auth = oauth2Client;
    } else {
        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: creds.email,
                private_key: creds.privateKey,
            },
            scopes: SCOPES,
        });
    }

    const drive = google.drive({ version: 'v3', auth: auth as any });
    const targetFolder = folderId || creds.folderId;

    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: targetFolder ? [targetFolder] : [],
            },
            media: {
                mimeType,
                body: body instanceof Readable ? body : Readable.from(body),
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        throw error;
    }
}

export async function findOrCreateFolder(auth: any, folderName: string, parentId?: string): Promise<string> {
    const drive = google.drive({ version: 'v3', auth });

    // 1. Check if folder exists
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false${parentId ? ` and '${parentId}' in parents` : ''}`;

    try {
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            console.log(`Folder found: ${folderName} (ID: ${res.data.files[0].id})`);
            return res.data.files[0].id!;
        }

        // 2. Create if not exists
        console.log(`Folder not found, creating: ${folderName}`);
        const fileMetadata: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        console.log(`Folder created: ${folderName} (ID: ${file.data.id})`);
        return file.data.id!;

    } catch (err) {
        console.error(`Error finding/creating folder ${folderName}:`, err);
        throw err;
    }
}

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
    // 1. Try Environment Variables
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return {
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
        };
    }

    // 2. Try Supabase Database (configuraciones table)
    // We need a SERVICE_ROLE client to read these sensitive configs safely if they are RLS protected for admins only
    // or arguably just use the standard client if the caller has rights.
    // Since this runs in a backend API route often, we probably use process.env.SUPABASE_SERVICE_ROLE_KEY
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('configuraciones')
            .select('clave, valor')
            .in('clave', ['google_service_account_json', 'google_drive_folder_id']);

        if (!error && data) {
            const configMap = data.reduce((acc: any, curr) => {
                acc[curr.clave] = curr.valor;
                return acc;
            }, {});

            if (configMap.google_service_account_json) {
                try {
                    const json = JSON.parse(configMap.google_service_account_json);
                    return {
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

    throw new Error("Missing Google Service Account credentials (env or db)");
}

export async function uploadToDrive({ fileName, mimeType, body, folderId }: UploadParams) {
    const creds = await getCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: creds.email,
            private_key: creds.privateKey,
        },
        scopes: SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });
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

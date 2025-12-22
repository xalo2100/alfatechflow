import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

interface UploadParams {
    fileName: string;
    mimeType: string;
    body: Readable | Buffer | string;
    folderId?: string;
}

export async function uploadToDrive({ fileName, mimeType, body, folderId }: UploadParams) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("Missing Google Service Account credentials");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: SCOPES,
    });

    const drive = google.drive({ version: 'v3', auth });

    const parentFolder = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: parentFolder ? [parentFolder] : [],
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

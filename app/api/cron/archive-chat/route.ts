
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadToDrive } from "@/lib/google-drive";
import archiver from "archiver";
import { Readable } from "stream";

// Init Supabase Admin (Service Role needed to read all chats)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    // Optional: Add a secret token check to prevent unauthorized calls
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting chat archival...");

        // 1. Fetch all messages
        // Join with sender info if possible, or just fetch raw
        const { data: messages, error } = await supabaseAdmin
            .from("mensajes")
            .select(`
                *,
                sender:perfiles!sender_id(nombre_completo, email)
            `)
            .order("created_at", { ascending: true });

        if (error) throw error;
        if (!messages || messages.length === 0) {
            return NextResponse.json({ message: "No messages to archive" });
        }

        // 2. Prepare Archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Buffer for the zip file
        const chunks: Buffer[] = [];
        const passThrough = new Readable({
            read() { }
        });

        // Pipe archive data to our buffer
        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('end', () => passThrough.push(null)); // Signal end

        // 3. Create Transcript
        let transcript = "CHAT HISTORY BACKUP\nGenerated at: " + new Date().toISOString() + "\n\n";
        transcript += "------------------------------------------------\n\n";

        for (const msg of messages) {
            const senderName = msg.sender?.nombre_completo || msg.sender?.email || "Unknown";
            const time = new Date(msg.created_at).toLocaleString();
            const content = msg.content || "[Media Message]";
            const receiver = msg.receiver_id ? `(to ${msg.receiver_id})` : "(General)";

            transcript += `[${time}] ${senderName} ${receiver}: ${content}\n`;
            if (msg.media_url) {
                transcript += `  -> Media: ${msg.media_url}\n`;
            }
            transcript += "\n";
        }

        // Add transcript to zip
        archive.append(transcript, { name: 'chat_transcript.txt' });

        // 4. Download and Add Media Files (Warning: This can be slow/heavy for many files)
        // For MVP, we'll list them in transcript. If immediate download is requested:
        // We would need to fetch each media_url and append.

        // Let's try to download a few or skip if too many?
        // User asked "guardar los chat con sus archivos multimredia".
        // We really should try to download them.

        let mediaCount = 0;
        for (const msg of messages) {
            if (msg.media_url) {
                try {
                    // media_url might be a public URL or a storage path.
                    // If it's a full URL:
                    const response = await fetch(msg.media_url);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();
                        const fileName = `media/${msg.id}_${msg.media_type || 'file'}`;
                        // Note: extension detection would be better, but...
                        archive.append(Buffer.from(buffer), { name: fileName });
                        mediaCount++;
                    }
                } catch (e) {
                    console.error(`Failed to download media for ${msg.id}`, e);
                    transcript += `[Error downloading media for message ${msg.id}]\n`;
                }
            }
        }

        // Finalize
        await archive.finalize();

        // Wait for 'end' (handled by chunks collection)
        // Since we collected chunks in memory (careful with RAM!), we consolidate them.
        // For distinct large streams, we'd need a temp file or pass stream to Google Drive directly.
        // Google Drive `body` accepts Readable.

        const zipBuffer = Buffer.concat(chunks);
        const dateStr = new Date().toISOString().split('T')[0];
        const zipName = `Chat_Backup_${dateStr}.zip`;

        // 5. Upload to Drive
        const driveFile = await uploadToDrive({
            fileName: zipName,
            mimeType: 'application/zip',
            body: Buffer.from(zipBuffer) // converting buffer to buffer?
        });

        console.log("Upload successful:", driveFile.id);

        return NextResponse.json({
            success: true,
            fileId: driveFile.id,
            messageCount: messages.length,
            mediaCount
        });

    } catch (error: any) {
        console.error("Archival failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { findOrCreateFolder } from "@/lib/google-drive";

// Initialize Supabase Admin for DB updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

    if (error) {
        return NextResponse.redirect(`${appUrl}/admin?config_error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${appUrl}/admin?config_error=no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    try {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        console.log("[OAUTH DEBUG] Tokens Received:", {
            has_access_token: !!tokens.access_token,
            has_refresh_token: !!tokens.refresh_token,
            expiry_date: tokens.expiry_date
        });

        if (!tokens.refresh_token) {
            console.warn("[OAUTH WARNING] No refresh_token returned.");
        }

        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        console.log("[OAUTH DEBUG] User Email:", email);

        // --- AUTOMATED FOLDER CREATION START ---
        console.log("[OAUTH DEBUG] Starting automatic folder creation...");

        // 1. Create/Find Root Folder "TechFlow Backup"
        const rootFolderId = await findOrCreateFolder(oauth2Client, "TechFlow Backup");

        // 2. Create/Find Subfolder "Conversaciones Guardadas" inside Root
        const targetFolderId = await findOrCreateFolder(oauth2Client, "Conversaciones Guardadas", rootFolderId);

        console.log(`[OAUTH DEBUG] Target Folder ID: ${targetFolderId}`);
        // --- AUTOMATED FOLDER CREATION END ---

        const updates = [];

        if (tokens.refresh_token) {
            console.log("[OAUTH DEBUG] Saving refresh token...");
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_refresh_token",
                    valor: tokens.refresh_token,
                    descripcion: "Token de refresco para acceso offline a Google Drive"
                }, { onConflict: "clave" })
            );
        }

        if (email) {
            console.log("[OAUTH DEBUG] Saving email...");
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_email",
                    valor: email,
                    descripcion: "Email de la cuenta conectada de Google Drive"
                }, { onConflict: "clave" })
            );
        }

        // Save Automagically Created Folder ID
        if (targetFolderId) {
            console.log("[OAUTH DEBUG] Saving folder ID...");
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_folder_id",
                    valor: targetFolderId,
                    descripcion: "ID de la carpeta 'Conversaciones Guardadas' en Google Drive"
                }, { onConflict: "clave" })
            );
        }

        const results = await Promise.all(updates);
        console.log("[OAUTH DEBUG] Results:", results);

        if (results.some(r => r.error)) {
            console.error("[OAUTH ERROR]", results.map(r => r.error));
        }

        return NextResponse.redirect(`${appUrl}/admin?config_success=drive_connected`);

    } catch (err: any) {
        console.error("Error exchanging code for token", err);
        return NextResponse.redirect(`${appUrl}/admin?config_error=${encodeURIComponent(err.message)}`);
    }
}

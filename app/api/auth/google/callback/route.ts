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
    const oauthError = searchParams.get("error");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

    if (oauthError) {
        console.error("[OAUTH ERROR] Error from Google:", oauthError);
        return NextResponse.redirect(`${appUrl}/admin?config_error=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
        return NextResponse.redirect(`${appUrl}/admin?config_error=no_code_provided`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        console.error("[OAUTH ERROR] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables.");
        return NextResponse.redirect(`${appUrl}/admin?config_error=missing_server_credentials`);
    }

    try {
        console.log("[OAUTH DEBUG] Initiating token exchange...");
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        console.log("[OAUTH DEBUG] Tokens Received successfully");

        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        console.log("[OAUTH DEBUG] Authenticated as:", email);

        // --- AUTOMATED FOLDER CREATION ---
        console.log("[OAUTH DEBUG] Preparing folder structure...");
        const rootFolderId = await findOrCreateFolder(oauth2Client, "TechFlow Backup");
        const targetFolderId = await findOrCreateFolder(oauth2Client, "Conversaciones Guardadas", rootFolderId);
        console.log("[OAUTH DEBUG] Target Folder ID established:", targetFolderId);

        const updates = [];

        if (tokens.refresh_token) {
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_refresh_token",
                    valor: tokens.refresh_token,
                    descripcion: "Token de refresco para acceso offline a Google Drive"
                }, { onConflict: "clave" })
            );
        }

        if (email) {
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_email",
                    valor: email,
                    descripcion: "Email de la cuenta conectada de Google Drive"
                }, { onConflict: "clave" })
            );
        }

        if (targetFolderId) {
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_folder_id",
                    valor: targetFolderId,
                    descripcion: "ID de la carpeta 'Conversaciones Guardadas' en Google Drive"
                }, { onConflict: "clave" })
            );
        }

        const results = await Promise.all(updates);
        const dbError = results.find(r => r.error);

        if (dbError) {
            console.error("[OAUTH ERROR] Database update failed:", dbError.error);
            return NextResponse.redirect(`${appUrl}/admin?config_error=database_update_failed`);
        }

        console.log("[OAUTH SUCCESS] Google Drive connection complete");
        return NextResponse.redirect(`${appUrl}/admin?config_success=drive_connected`);

    } catch (err: any) {
        console.error("[OAUTH CRITICAL ERROR]", err);
        const errorMessage = err.response?.data?.error_description || err.message || "Unknown error";
        return NextResponse.redirect(`${appUrl}/admin?config_error=${encodeURIComponent(errorMessage)}`);
    }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

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

        // If we didn't get a refresh token, we can't do offline access.
        // This happens if the user already granted access and we didn't use prompt=consent.
        // Our signin route uses prompt=consent, so we should be good.
        if (!tokens.refresh_token) {
            console.warn("No refresh_token returned. User might need to revoke access first to reset.");
            // We can't proceed effectively without a refresh token for a cron job
            // unless we store the access token and it happens to be valid for the job (unlikely long term).
            // For now, we'll try to save what we have, but ideally prompt user.
        }

        // Get user info to identify the connection
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Save tokens to DB
        const updates = [];

        // Save Refresh Token (if present)
        if (tokens.refresh_token) {
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_refresh_token",
                    valor: tokens.refresh_token,
                    descripcion: "Token de refresco para acceso offline a Google Drive"
                }, { onConflict: "clave" })
            );
        }

        // Save Email
        if (email) {
            updates.push(
                supabaseAdmin.from("configuraciones").upsert({
                    clave: "google_drive_email",
                    valor: email,
                    descripcion: "Email de la cuenta conectada de Google Drive"
                }, { onConflict: "clave" })
            );
        }

        await Promise.all(updates);

        return NextResponse.redirect(`${appUrl}/admin?config_success=drive_connected`);

    } catch (err: any) {
        console.error("Error exchanging code for token", err);
        return NextResponse.redirect(`${appUrl}/admin?config_error=${encodeURIComponent(err.message)}`);
    }
}

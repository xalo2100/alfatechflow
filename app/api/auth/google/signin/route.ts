import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""); // Remove trailing slash if present

    if (!clientId || !clientSecret || !appUrl) {
        return NextResponse.redirect(`${appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin?config_error=missing_env_vars`);
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline", // Crucial for receiving a refresh token
        scope: [
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/userinfo.email" // To identify which account is connected
        ],
        prompt: "consent", // Force consent to ensure we get a refresh token
        include_granted_scopes: true,
    });

    return NextResponse.redirect(authorizeUrl);
}

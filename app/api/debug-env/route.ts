
import { NextResponse } from "next/server";

export async function GET() {
    const vars = [
        "GEMINI_API_KEY",
        "PIPEDRIVE_API_KEY",
        "PIPEDRIVE_DOMAIN",
        "RESEND_API_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ENCRYPTION_KEY"
    ];

    const status: Record<string, string> = {};

    vars.forEach(key => {
        const value = process.env[key];
        if (!value) {
            status[key] = "❌ MISSING or EMPTY";
        } else {
            // Show first 4 chars for verification, hide the rest
            const preview = value.substring(0, 4) + "...";
            status[key] = `✅ PRESENT (${preview}, length: ${value.length})`;
        }
    });

    return NextResponse.json({
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        variables: status
    });
}

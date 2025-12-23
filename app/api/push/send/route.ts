import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // Initialize webpush inside the handler to avoid build-time errors when env vars are missing
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
            "mailto:soporte@alfapack.cl",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    }

    try {
        const { userId, title, body, url } = await req.json();

        if (!userId || !title || !body) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get all subscriptions for this user
        const { data: subs, error } = await supabaseAdmin
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", userId);

        if (error) throw error;

        if (!subs || subs.length === 0) {
            return NextResponse.json({ message: "No subscriptions found for user" });
        }

        const notifications = subs.map(sub => {
            const payload = JSON.stringify({ title, body, url });
            return webpush.sendNotification(sub.subscription_json, payload)
                .catch(async (err) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired or invalid, remove it
                        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
                    }
                    console.error(`Error sending push to sub ${sub.id}:`, err);
                });
        });

        await Promise.all(notifications);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Push send error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

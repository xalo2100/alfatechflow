import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { userId, subscription, deviceType } = await req.json();

        if (!userId || !subscription) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("push_subscriptions")
            .upsert({
                user_id: userId,
                subscription_json: subscription,
                device_type: deviceType || 'unknown'
            }, { onConflict: 'user_id, subscription_json' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Push subscribe error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const steps: string[] = [];
    const addStep = (msg: string) => steps.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`);

    try {
        addStep("🚀 Starting Diagnostic...");

        // 1. Check Env Vars
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const encKey = process.env.ENCRYPTION_KEY;

        addStep(`1. Env Check: URL=${url ? 'OK' : 'MISSING'}, ServiceKey=${key ? 'OK (' + key.substring(0, 5) + '...)' : 'MISSING'}, EncKey=${encKey ? 'OK' : 'MISSING'}`);

        if (!url || !key) throw new Error("Missing Supabase Env Vars");

        // 2. Init Client
        const supabase = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        addStep("2. Supabase Client Initialized");

        // 3. Query DB
        addStep("3. Querying 'configuraciones' table for 'gemini_api_key'...");
        const { data, error, count } = await supabase
            .from("configuraciones")
            .select("*", { count: 'exact' })
            .eq("clave", "gemini_api_key");

        if (error) {
            addStep(`❌ DB Query Error: ${error.message} (Code: ${error.code})`);
            return NextResponse.json({ success: false, steps, error: error });
        }

        addStep(`✅ DB Query Success. Rows found: ${data?.length || 0}`);

        if (!data || data.length === 0) {
            addStep("❌ No rows found with clave='gemini_api_key'");
            return NextResponse.json({ success: false, steps, message: "Key not found in DB" });
        }

        const row = data[0];
        addStep(`4. Row Data: ID=${row.id}, EncryptedLength=${row.valor_encriptado?.length}`);

        // 4. Decrypt
        if (!row.valor_encriptado) {
            addStep("❌ 'valor_encriptado' is empty/null");
            return NextResponse.json({ success: false, steps });
        }

        addStep("5. Attempting Decryption...");
        try {
            const decrypted = await decrypt(row.valor_encriptado);
            addStep(`✅ Decryption Success! Key prefix: ${decrypted.substring(0, 4)}...`);
        } catch (e: any) {
            addStep(`❌ Decryption Failed: ${e.message}`);
            return NextResponse.json({ success: false, steps, encryptionError: e.message });
        }

        addStep("🏁 Diagnostic Completed Successfully.");
        return NextResponse.json({ success: true, steps });

    } catch (error: any) {
        addStep(`💥 CRITICAL ERROR: ${error.message}`);
        return NextResponse.json({ success: false, steps, error: error.message });
    }
}

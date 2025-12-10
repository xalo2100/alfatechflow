
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/lib/encryption';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    const envKey = process.env.ENCRYPTION_KEY;
    const geminiEnv = process.env.GEMINI_API_KEY;

    const results: any = {
        checks: {
            encryptionHeader: envKey ? "Present (OK)" : "Missing",
            geminiFallback: geminiEnv ? "Present (OK)" : "Missing (Critical if DB fails)",
            keyLength: envKey?.length || 0
        },
        testCycle: {}
    };

    try {
        // 1. Test Crypto isolation
        const original = "iso-test-" + Date.now();
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);
        results.checks.cryptoIsolation = (original === decrypted) ? "OK" : "FAILED";

        // 2. Test DB Cycle
        const supabase = await createAdminClient();
        const dbTestKey = "db-test-key-" + Date.now();
        const dbTestValue = "db-value-" + Date.now();
        const encryptedForDb = await encrypt(dbTestValue);

        // Write
        const { error: writeError } = await supabase
            .from('configuraciones')
            .upsert({
                clave: dbTestKey,
                valor_encriptado: encryptedForDb,
                descripcion: 'Debug Test'
            }, { onConflict: 'clave' });

        if (writeError) throw new Error("DB Write Failed: " + writeError.message);
        results.testCycle.write = "OK";

        // Read
        const { data, error: readError } = await supabase
            .from('configuraciones')
            .select('valor_encriptado')
            .eq('clave', dbTestKey)
            .single();

        if (readError) throw new Error("DB Read Failed: " + readError.message);
        results.testCycle.read = "OK";

        // Decrypt
        const decryptedFromDb = await decrypt(data.valor_encriptado);
        results.testCycle.decrypt = (decryptedFromDb === dbTestValue) ? "OK" : "MISMATCH";

        // Cleanup
        await supabase.from('configuraciones').delete().eq('clave', dbTestKey);
        results.testCycle.cleanup = "OK";

        return NextResponse.json({ status: 'ok', results });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            results
        }, { status: 500 });
    }
}

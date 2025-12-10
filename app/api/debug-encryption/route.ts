
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
    const envKey = process.env.ENCRYPTION_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const keySource = envKey ? "ENCRYPTION_KEY" : (supabaseUrl ? "SUPABASE_URL" : "DEFAULT_STRING");
    const keyLength = envKey ? envKey.length : 0;

    try {
        const original = "test-string-" + Date.now();
        const encrypted = await encrypt(original);
        const decrypted = await decrypt(encrypted);

        return NextResponse.json({
            status: 'ok',
            keySource,
            keyLength,
            encryptionWorks: original === decrypted
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            keySource,
            keyLength,
            error: error.message
        }, { status: 500 });
    }
}

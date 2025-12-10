import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const supabase = await createAdminClient();

        // Eliminar la configuración corrupta de Gemini
        const { error } = await supabase
            .from('configuraciones')
            .delete()
            .eq('clave', 'gemini_api_key');

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Configuración de Gemini eliminada. Ahora usará la variable de entorno de Vercel.'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

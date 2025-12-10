import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function clearGeminiConfig() {
  const supabase = await createAdminClient();

  // Eliminar la configuración corrupta de Gemini
  const { error } = await supabase
    .from('configuraciones')
    .delete()
    .eq('clave', 'gemini_api_key');

  if (error) {
    return {
      success: false,
      error: error.message
    };
  }

  return {
    success: true,
    message: 'Configuración de Gemini eliminada. Ahora usará la variable de entorno de Vercel.'
  };
}

export async function GET() {
  try {
    const result = await clearGeminiConfig();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await clearGeminiConfig();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Crear cliente de Supabase usando las cookies del request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No hacer nada en API routes
          },
          remove(name: string, options: CookieOptions) {
            // No hacer nada en API routes
          },
        },
      }
    )

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Error de autenticación:", authError);
      return NextResponse.json(
        { error: "No autenticado. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea técnico
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!perfil || perfil.rol !== "tecnico") {
      return NextResponse.json(
        { error: "Solo los técnicos pueden guardar firmas de clientes" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { reporteId, firmaDataURL, nombreFirmante } = await request.json();

    if (!reporteId || !firmaDataURL || !nombreFirmante) {
      return NextResponse.json(
        { error: "ID del reporte, firma y nombre del firmante son requeridos" },
        { status: 400 }
      );
    }

    // Crear cliente de administración
    const adminClient = await createAdminClient();

    // Obtener el reporte actual
    const { data: reporte, error: reporteError } = await adminClient
      .from("reportes")
      .select("reporte_ia")
      .eq("id", reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    // Parsear el JSON del reporte
    let reporteData: any = {};
    try {
      reporteData = JSON.parse(reporte.reporte_ia as string);
    } catch {
      reporteData = {};
    }

    // Agregar la firma del cliente
    reporteData.firma_cliente = {
      imagen: firmaDataURL,
      nombre: nombreFirmante,
      fecha: new Date().toISOString(),
    };

    // Actualizar el reporte
    const { error: updateError } = await adminClient
      .from("reportes")
      .update({
        reporte_ia: JSON.stringify(reporteData),
      })
      .eq("id", reporteId);

    if (updateError) {
      console.error("Error actualizando reporte:", updateError);
      return NextResponse.json(
        { error: `Error al guardar la firma: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Firma del cliente guardada exitosamente",
    });
  } catch (error: any) {
    console.error("Error en guardar-firma-cliente API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}


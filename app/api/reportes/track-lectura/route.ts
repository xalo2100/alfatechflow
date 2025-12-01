import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Forzar que esta ruta sea dinámica (no pre-renderizar)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reporteId = searchParams.get("reporteId");

    if (!reporteId) {
      // Retornar un pixel transparente de 1x1
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new NextResponse(pixel, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    // Registrar la lectura del reporte
    const adminClient = createAdminClient();
    
    // Obtener el reporte actual
    const { data: reporte, error: reporteError } = await adminClient
      .from("reportes")
      .select("reporte_ia")
      .eq("id", parseInt(reporteId))
      .single();

    if (!reporteError && reporte) {
      let reporteData: any = {};
      try {
        reporteData = JSON.parse(reporte.reporte_ia as string);
      } catch {
        reporteData = {};
      }

      // Agregar información de lectura
      if (!reporteData.lectura_email) {
        reporteData.lectura_email = {
          leido: true,
          fecha_lectura: new Date().toISOString(),
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        };

        // Actualizar el reporte
        await adminClient
          .from("reportes")
          .update({ reporte_ia: JSON.stringify(reporteData) })
          .eq("id", parseInt(reporteId));
      }
    }

    // Retornar un pixel transparente de 1x1
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error en tracking de lectura:", error);
    // Retornar pixel incluso si hay error
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
      },
    });
  }
}





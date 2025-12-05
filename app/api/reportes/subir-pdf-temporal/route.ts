import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Iniciando subida de PDF temporal');
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reporteId = formData.get("reporteId") as string;

    console.log('[UPLOAD] Archivo recibido:', file?.name, 'Tamaño:', file?.size, 'bytes');
    console.log('[UPLOAD] ReporteId:', reporteId);

    if (!file || !reporteId) {
      console.error('[UPLOAD] Faltan parámetros requeridos');
      return NextResponse.json(
        { error: "Archivo y reporteId son requeridos" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      console.error('[UPLOAD] El archivo está vacío');
      return NextResponse.json(
        { error: "El archivo PDF está vacío" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[UPLOAD] Usuario no autenticado');
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    console.log('[UPLOAD] Usuario autenticado:', user.id);

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[UPLOAD] Buffer creado, tamaño:', buffer.length, 'bytes');

    // Generar nombre único para el archivo
    const fileName = `reporte-${reporteId}-${Date.now()}.pdf`;
    const filePath = `reportes-temporales/${fileName}`;

    console.log('[UPLOAD] Subiendo a Supabase Storage:', filePath);

    // Subir a Supabase Storage (bucket: fotos-tickets o crear uno nuevo)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("fotos-tickets")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600", // 1 hora de caché
        upsert: false,
      });

    if (uploadError) {
      console.error("[UPLOAD] Error subiendo PDF:", uploadError);
      return NextResponse.json(
        { error: `Error al subir PDF: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('[UPLOAD] Archivo subido exitosamente:', uploadData);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("fotos-tickets")
      .getPublicUrl(filePath);

    console.log('[UPLOAD] URL pública generada:', publicUrl);

    // Retornar URL pública
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error("[UPLOAD] Error en subir-pdf-temporal:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir PDF" },
      { status: 500 }
    );
  }
}






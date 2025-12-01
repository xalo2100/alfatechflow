import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reporteId = formData.get("reporteId") as string;

    if (!file || !reporteId) {
      return NextResponse.json(
        { error: "Archivo y reporteId son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generar nombre único para el archivo
    const fileName = `reporte-${reporteId}-${Date.now()}.pdf`;
    const filePath = `reportes-temporales/${fileName}`;

    // Subir a Supabase Storage (bucket: fotos-tickets o crear uno nuevo)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("fotos-tickets")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        cacheControl: "3600", // 1 hora de caché
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo PDF:", uploadError);
      return NextResponse.json(
        { error: `Error al subir PDF: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("fotos-tickets")
      .getPublicUrl(filePath);

    // Retornar URL pública
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error("Error en subir-pdf-temporal:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir PDF" },
      { status: 500 }
    );
  }
}


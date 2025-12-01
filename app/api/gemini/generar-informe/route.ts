import { NextRequest, NextResponse } from "next/server";
import { generarInforme } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { notas } = await request.json();

    if (!notas || typeof notas !== "string") {
      return NextResponse.json(
        { error: "Las notas son requeridas" },
        { status: 400 }
      );
    }

    const informe = await generarInforme(notas);

    return NextResponse.json(informe);
  } catch (error: any) {
    console.error("Error en API de Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el informe" },
      { status: 500 }
    );
  }
}









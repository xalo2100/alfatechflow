import { NextResponse } from "next/server";

/**
 * Endpoint de salud para verificar conectividad
 * Usado por el sistema offline para detectar conexión
 */
export async function HEAD() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: Date.now() });
}


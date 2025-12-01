import { NextRequest, NextResponse } from "next/server";
import { getPipedriveApiKey, getPipedriveDomain } from "@/lib/pipedrive";

// Forzar que esta ruta sea dinámica (no pre-renderizar)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "test";

    const apiKey = await getPipedriveApiKey();
    const domain = await getPipedriveDomain();
    const baseUrl = `https://${domain}.pipedrive.com/api/v1`;
    const term = encodeURIComponent(query.trim());

    console.log(`[TEST] 🔍 Probando búsqueda: "${query}"`);
    console.log(`[TEST] 🌐 Dominio: ${domain}`);
    console.log(`[TEST] 🔑 API Key: ${apiKey.substring(0, 10)}...`);

    const url = `${baseUrl}/organizations/search?term=${term}&fields=name&limit=10&api_token=${apiKey}`;
    console.log(`[TEST] 🔗 URL: ${url.replace(apiKey, '***')}`);

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      success: data.success,
      rawResponse: data,
      itemsCount: data.data?.items?.length || 0,
      items: data.data?.items || [],
      message: data.success 
        ? `✅ Búsqueda exitosa. Encontrados: ${data.data?.items?.length || 0} items`
        : `❌ Error: ${data.error || 'Desconocido'}`
    });
  } catch (error: any) {
    console.error("[TEST] ❌ Error:", error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}




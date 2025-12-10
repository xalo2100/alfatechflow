import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";

export const dynamic = 'force-dynamic';

// Cache simple en memoria (se resetea cuando se reinicia el servidor)
let lastTestResult: { success: boolean; data: any; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60000; // 1 minuto

export async function GET(request: NextRequest) {
  try {
    // Verificar si tenemos un resultado en caché reciente
    if (lastTestResult && (Date.now() - lastTestResult.timestamp) < CACHE_DURATION_MS) {
      console.log("✅ Usando resultado en caché para evitar exceder límite de 1 RPM");
      return NextResponse.json(lastTestResult.data);
    }

    // Obtener la API key de la base de datos
    let apiKey: string;
    try {
      apiKey = await getGeminiApiKey();
    } catch (error: any) {
      // Si hay un error al obtener la key, intentar con variables de entorno
      console.warn("⚠️ Error obteniendo configuración de Gemini desde DB, intentando con variables de entorno:", error.message);

      // Intentar con variables de entorno como fallback
      apiKey = process.env.GEMINI_API_KEY || "";

      if (!apiKey) {
        // Si hay un error de permisos y no hay variables de entorno, retornar mensaje claro
        if (error.message?.includes("permisos") || error.message?.includes("acceder a la configuración")) {
          return NextResponse.json(
            {
              success: false,
              error: "No se puede acceder a la configuración de Gemini y no hay variables de entorno configuradas.\\n\\nSolución:\\n1. Agrega GEMINI_API_KEY en .env.local\\n2. O verifica que la SERVICE_ROLE_KEY esté configurada correctamente\\n3. O configura la API key desde el panel de administración",
            },
            { status: 500 }
          );
        }
        throw error;
      }

      console.log("✅ Usando API key de Gemini desde variables de entorno");
    }

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "API key de Gemini no configurada. Por favor, configúrala en el panel de administración o agrega GEMINI_API_KEY en .env.local",
        },
        { status: 400 }
      );
    }

    // Limpiar la API key
    const cleanedKey = apiKey.trim().replace(/\\s+/g, "").replace(/\\n/g, "");

    // Usar gemini-2.5-flash que es el modelo gratuito disponible
    // NO probar múltiples modelos para evitar consumir cuota innecesariamente
    const modeloAProbar = "gemini-2.5-flash";

    console.log(`🌐 Probando modelo ${modeloAProbar} con API v1beta...`);

    // Usar API REST v1beta directamente
    const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modeloAProbar}:generateContent?key=${cleanedKey}`;
    const restResponse = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "OK"
          }]
        }]
      })
    });

    if (restResponse.ok) {
      const restData = await restResponse.json();
      if (restData.candidates && restData.candidates[0]?.content?.parts?.[0]?.text) {
        console.log(`✅ Modelo ${modeloAProbar} funciona con API v1beta`);
        const successResult = {
          success: true,
          message: "Conexión con Gemini exitosa",
          model: modeloAProbar,
          version: 'v1beta',
        };

        // Guardar en caché
        lastTestResult = {
          success: true,
          data: successResult,
          timestamp: Date.now()
        };

        return NextResponse.json(successResult);
      }
    }

    const errorData = await restResponse.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `HTTP ${restResponse.status}`;
    console.warn(`❌ API v1beta falló para ${modeloAProbar}:`, errorMsg);

    let mensajeTraducido = errorMsg;
    if (errorMsg.toLowerCase().includes("quota") || errorMsg.includes("429")) {
      mensajeTraducido = "Has excedido tu cuota de uso (Quota Exceeded). El tier gratuito tiene límite de 1 request/minuto. Espera 60 segundos antes de refrescar.";
    } else if (errorMsg.toLowerCase().includes("key") && (errorMsg.includes("valid") || errorMsg.includes("found"))) {
      mensajeTraducido = "La API Key no es válida (API Key Invalid).";
    }

    const errorResult = {
      success: false,
      error: `No se pudo conectar con Gemini.\\n\\nDetalle del error: ${mensajeTraducido}\\n\\nPosibles soluciones:\\n1. Si es error de cuota: El tier gratuito permite solo 1 request/minuto. Espera antes de refrescar.\\n2. Si es error de Key: Verifica que la API Key sea correcta en https://aistudio.google.com/\\n3. Asegúrate de tener habilitada la API 'Generative Language API'.`,
    };

    // Guardar error en caché también para evitar llamadas repetidas
    lastTestResult = {
      success: false,
      data: errorResult,
      timestamp: Date.now()
    };

    return NextResponse.json(errorResult, { status: 400 });
  } catch (error: any) {
    console.error("Error probando conexión con Gemini:", error);

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "Has excedido tu cuota de uso de la API de Gemini. El tier gratuito permite solo 1 request/minuto. Espera antes de refrescar.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al probar la conexión. Verifica que la API key sea correcta.",
      },
      { status: 500 }
    );
  }
}

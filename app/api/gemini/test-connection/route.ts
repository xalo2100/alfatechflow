import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
              error: "No se puede acceder a la configuración de Gemini y no hay variables de entorno configuradas.\n\nSolución:\n1. Agrega GEMINI_API_KEY en .env.local\n2. O verifica que la SERVICE_ROLE_KEY esté configurada correctamente\n3. O configura la API key desde el panel de administración",
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
    const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

    // Lista de modelos a probar en orden de preferencia
    // Priorizamos gemini-2.0-flash que es el más rápido y tiene mejor cuota
    const modelosParaProbar = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];

    let modeloFuncionando: string | null = null;
    let versionFuncionando: string | null = null;
    let ultimoError: any = null;

    // Probar cada modelo SOLO con v1beta (v1 no soporta gemini-1.5-pro)
    for (const nombreModelo of modelosParaProbar) {
      try {
        console.log(`🌐 Probando modelo ${nombreModelo} con API v1beta...`);

        // Usar API REST v1beta directamente
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${nombreModelo}:generateContent?key=${cleanedKey}`;
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
            modeloFuncionando = nombreModelo;
            versionFuncionando = 'v1beta';
            console.log(`✅ Modelo ${nombreModelo} funciona con API v1beta`);
            break;
          }
        } else {
          const errorData = await restResponse.json().catch(() => ({}));
          console.warn(`❌ API v1beta falló para ${nombreModelo}:`, errorData.error?.message || restResponse.status);
          if (!ultimoError) {
            ultimoError = new Error(errorData.error?.message || `HTTP ${restResponse.status}`);
          }
        }
      } catch (restError: any) {
        console.warn(`❌ Error en API v1beta para ${nombreModelo}:`, restError.message);
        if (!ultimoError) {
          ultimoError = restError;
        }
        continue;
      }
    }

    if (modeloFuncionando) {
      return NextResponse.json({
        success: true,
        message: "Conexión con Gemini exitosa",
        model: modeloFuncionando,
        version: versionFuncionando,
      });
    }

    // Si ningún modelo funcionó, retornar error con detalles
    const errorMsg = ultimoError?.message || "Error desconocido";

    let mensajeTraducido = errorMsg;
    if (errorMsg.toLowerCase().includes("quota") || errorMsg.includes("429")) {
      mensajeTraducido = "Has excedido tu cuota de uso (Quota Exceeded). Tu plan gratuito o de pago ha alcanzado su límite.";
    } else if (errorMsg.toLowerCase().includes("key") && (errorMsg.includes("valid") || errorMsg.includes("found"))) {
      mensajeTraducido = "La API Key no es válida (API Key Invalid).";
    }

    return NextResponse.json(
      {
        success: false,
        error: `No se pudo conectar con ningún modelo de Gemini.\n\nDetalle del error: ${mensajeTraducido}\n\nPosibles soluciones:\n1. Si es error de cuota: Revisa tu facturación en Google Cloud o espera a que se renueve tu cuota gratuita.\n2. Si es error de Key: Verifica que la API Key sea correcta en https://aistudio.google.com/\n3. Asegúrate de tener habilitada la API 'Generative Language API'.`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error probando conexión con Gemini:", error);

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "Has excedido tu cuota de uso de la API de Gemini. Por favor revisa tu plan y facturación en Google Cloud Console.",
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


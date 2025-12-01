import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { success: false, error: "API key no proporcionada" },
        { status: 400 }
      );
    }

    // Limpiar la API key (eliminar espacios y saltos de línea)
    const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

    if (cleanedKey.length < 20) {
      return NextResponse.json(
        { success: false, error: "API key inválida (muy corta)" },
        { status: 400 }
      );
    }

    console.log("🔑 Validando API key, longitud:", cleanedKey.length);
    console.log("🔑 API key empieza con:", cleanedKey.substring(0, 4));

    // Primero, listar los modelos disponibles
    console.log("📋 Listando modelos disponibles...");
    let modelosDisponibles: string[] = [];
    
    try {
      // Intentar con v1 primero
      const urlV1 = `https://generativelanguage.googleapis.com/v1/models?key=${cleanedKey}`;
      const responseV1 = await fetch(urlV1);
      
      if (responseV1.ok) {
        const data = await responseV1.json();
        if (data.models && Array.isArray(data.models)) {
          modelosDisponibles = data.models
            .map((m: any) => m.name?.replace('models/', '') || m.name)
            .filter((name: string) => name && name.includes('gemini'));
          console.log("✅ Modelos disponibles (v1):", modelosDisponibles);
        }
      }
      
      // Si v1 falla, intentar con v1beta
      if (modelosDisponibles.length === 0) {
        const urlV1Beta = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanedKey}`;
        const responseV1Beta = await fetch(urlV1Beta);
        
        if (responseV1Beta.ok) {
          const data = await responseV1Beta.json();
          if (data.models && Array.isArray(data.models)) {
            modelosDisponibles = data.models
              .map((m: any) => m.name?.replace('models/', '') || m.name)
              .filter((name: string) => name && name.includes('gemini'));
            console.log("✅ Modelos disponibles (v1beta):", modelosDisponibles);
          }
        }
      }
    } catch (error) {
      console.error("Error listando modelos:", error);
    }

    // Si no hay modelos disponibles, usar lista por defecto
    const modelosParaProbar = modelosDisponibles.length > 0 
      ? modelosDisponibles 
      : [
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-pro",
        ];

    let modeloFuncionando: string | null = null;
    let versionFuncionando: 'v1' | 'v1beta' = 'v1';
    let ultimoError: any = null;

    // Probar cada modelo con ambas versiones de API (v1 y v1beta)
    for (const nombreModelo of modelosParaProbar) {
      for (const version of ['v1', 'v1beta'] as const) {
        try {
          console.log(`🌐 Probando modelo ${nombreModelo} con API REST (${version})...`);
          const restUrl = `https://generativelanguage.googleapis.com/${version}/models/${nombreModelo}:generateContent?key=${cleanedKey}`;
          const restResponse = await fetch(restUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: "Responde solo: OK"
                }]
              }]
            })
          });

          if (restResponse.ok) {
            const restData = await restResponse.json();
            if (restData.candidates && restData.candidates[0]?.content?.parts?.[0]?.text) {
              modeloFuncionando = nombreModelo;
              versionFuncionando = version;
              console.log(`✅ Modelo ${nombreModelo} funciona con API REST (${version})`);
              break;
            }
          } else {
            const errorData = await restResponse.json().catch(() => ({}));
            console.log(`❌ API REST falló para ${nombreModelo} con ${version}:`, errorData);
            ultimoError = new Error(`API REST error: ${JSON.stringify(errorData)}`);
          }
        } catch (restError: any) {
          console.log(`❌ Error en API REST para ${nombreModelo} con ${version}:`, restError.message);
          ultimoError = restError;
          continue;
        }
      }
      if (modeloFuncionando) break;
    }

    if (modeloFuncionando) {
      return NextResponse.json({
        success: true,
        message: `API key válida y funcionando correctamente con modelo ${modeloFuncionando} (${versionFuncionando})`,
      });
    }

    // Si llegamos aquí, nada funcionó
    const errorDetails = ultimoError?.message || "Error desconocido";
    const modelosLista = modelosDisponibles.length > 0 
      ? `\n\nModelos disponibles detectados: ${modelosDisponibles.join(", ")}`
      : "";
    return NextResponse.json(
      {
        success: false,
        error: `Ninguno de los modelos de Gemini está disponible con esta API key.\n\nError: ${errorDetails}${modelosLista}\n\nEsto generalmente se debe a que:\n1. La API key no tiene acceso a los modelos de Gemini\n2. Necesitas habilitar la API de Generative AI en Google Cloud Console\n3. La API key puede estar restringida por región\n\nSolución:\n1. Ve a https://aistudio.google.com/\n2. Verifica que tu API key esté activa\n3. Crea una nueva API key si es necesario\n4. Asegúrate de que la API de Generative AI esté habilitada en tu proyecto de Google Cloud`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error validando API key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor al validar la API key",
      },
      { status: 500 }
    );
  }
}

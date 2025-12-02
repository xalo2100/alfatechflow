import { NextResponse } from 'next/server';
import { getGeminiApiKey } from '@/lib/gemini';

export async function POST(req: Request) {
  console.log("📨 API Route: Recibiendo solicitud...");

  try {
    const body = await req.json();
    const notas = body.notas || body.text || body.message || "";

    // Obtener API KEY de forma segura
    const API_KEY = await getGeminiApiKey();

    const prompt = `Eres un experto técnico. Notas: "${notas}"
Genera SOLO un JSON con:
{
  "diagnostico": "...",
  "trabajo_realizado": "...",
  "observacion": "..."
}`;

    // 🚀 PASO 1: Listar modelos disponibles desde Google
    console.log("🔍 Listando modelos disponibles...");
    let modelosDisponibles: Array<{ version: string; name: string }> = [];

    // Intentar listar modelos desde v1beta primero
    try {
      const listUrlV1Beta = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
      const listResponseV1Beta = await fetch(listUrlV1Beta);

      if (listResponseV1Beta.ok) {
        const listData = await listResponseV1Beta.json();
        if (listData.models && Array.isArray(listData.models)) {
          modelosDisponibles = listData.models
            .filter((m: any) => m.name && m.name.includes('gemini'))
            .map((m: any) => {
              const name = m.name.replace('models/', '').replace('models\\/', '');
              return { version: 'v1beta', name };
            });
          console.log(`✅ Encontrados ${modelosDisponibles.length} modelos en v1beta:`, modelosDisponibles.map(m => m.name));
        }
      } else {
        const errorText = await listResponseV1Beta.text();
        console.log(`⚠️ Error listando modelos v1beta (${listResponseV1Beta.status}): ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      console.log("⚠️ Error listando modelos v1beta:", error.message);
    }

    // Si no hay modelos en v1beta, intentar v1
    if (modelosDisponibles.length === 0) {
      try {
        const listUrlV1 = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
        const listResponseV1 = await fetch(listUrlV1);

        if (listResponseV1.ok) {
          const listData = await listResponseV1.json();
          if (listData.models && Array.isArray(listData.models)) {
            modelosDisponibles = listData.models
              .filter((m: any) => m.name && m.name.includes('gemini'))
              .map((m: any) => {
                const name = m.name.replace('models/', '').replace('models\\/', '');
                return { version: 'v1', name };
              });
            console.log(`✅ Encontrados ${modelosDisponibles.length} modelos en v1:`, modelosDisponibles.map(m => m.name));
          }
        } else {
          const errorText = await listResponseV1.text();
          console.log(`⚠️ Error listando modelos v1 (${listResponseV1.status}): ${errorText.substring(0, 200)}`);
        }
      } catch (error: any) {
        console.log("⚠️ Error listando modelos v1:", error.message);
      }
    }

    // 🚀 PASO 2: Si no se encontraron modelos, usar lista de respaldo
    if (modelosDisponibles.length === 0) {
      console.log("⚠️ No se pudieron listar modelos, usando lista de respaldo...");
      modelosDisponibles = [
        { version: 'v1beta', name: 'gemini-2.0-flash' },
        { version: 'v1beta', name: 'gemini-1.5-flash' },
        { version: 'v1beta', name: 'gemini-1.5-pro' },
        { version: 'v1beta', name: 'gemini-pro' },
      ];
    }

    let ultimoError: any = null;
    let modeloExitoso = null;

    // 🚀 PASO 3: Probar cada modelo disponible hasta encontrar uno que funcione
    console.log(`🔄 Probando ${modelosDisponibles.length} modelos disponibles...`);

    for (const modelo of modelosDisponibles) {
      try {
        const url = `https://generativelanguage.googleapis.com/${modelo.version}/models/${modelo.name}:generateContent?key=${API_KEY}`;

        console.log(`🔄 Probando: ${modelo.version}/${modelo.name}...`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ ${modelo.version}/${modelo.name} falló (${response.status}): ${errorText.substring(0, 200)}`);
          ultimoError = { status: response.status, text: errorText };
          continue; // Probar siguiente modelo
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          console.log(`⚠️ ${modelo.version}/${modelo.name} respondió vacío`);
          continue; // Probar siguiente modelo
        }

        // ✅ ¡Éxito! Este modelo funciona
        modeloExitoso = modelo;
        console.log(`✅ ¡Modelo exitoso encontrado: ${modelo.version}/${modelo.name}!`);

        // Limpiar y parsear JSON
        const jsonString = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonString);

        console.log("✅ Reporte generado exitosamente");
        return NextResponse.json(data);

      } catch (error: any) {
        console.log(`❌ Error con ${modelo.version}/${modelo.name}: ${error.message}`);
        ultimoError = error;
        continue; // Probar siguiente modelo
      }
    }

    // Si llegamos aquí, ningún modelo funcionó
    console.error("🔥 Todos los modelos fallaron");
    throw new Error(
      `Ningún modelo de Gemini está disponible. Último error: ${ultimoError?.status || ultimoError?.message || 'Desconocido'}`
    );

  } catch (error: any) {
    console.error("🔥 Error API:", error);
    return NextResponse.json(
      { error: `Error Gemini: ${error.message}` },
      { status: 500 }
    );
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";

/**
 * Obtiene la API key de Gemini desde la base de datos (encriptada)
 * Usa el cliente de administración para leer desde API routes del servidor
 */
export async function getGeminiApiKey(): Promise<string> {
  try {
    // Usar cliente de admin para tener permisos completos en el servidor
    const supabase = await createAdminClient();

    console.log(`[GEMINI] 🔑 Obteniendo API key desde base de datos...`);

    // Intentar obtener desde la base de datos
    const { data: config, error: configError } = await supabase
      .from("configuraciones")
      .select("valor_encriptado")
      .eq("clave", "gemini_api_key")
      .maybeSingle();

    if (configError) {
      console.error("❌ Error consultando configuración de Gemini:", configError);
      // Intentar usar variable de entorno como fallback
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey) {
        console.log("⚠️ Usando API key de Gemini de variable de entorno debido a error en base de datos");
        return envKey;
      }
      // Mensaje más claro sobre el problema
      const errorMsg = configError.message || "Error desconocido";
      if (errorMsg.includes("permission") || errorMsg.includes("policy") || errorMsg.includes("RLS")) {
        console.warn("⚠️ Error de permisos RLS. El service role debería bypasear RLS. Usando variable de entorno si está disponible.");
        throw new Error("No tienes permisos para leer la configuración y no hay API key en variables de entorno. Verifica que la SERVICE_ROLE_KEY esté configurada correctamente o agrega GEMINI_API_KEY en .env.local");
      }
      throw new Error(`Error al acceder a la configuración: ${errorMsg}. Si acabas de cambiar la configuración de Supabase, es posible que necesites configurar las API keys nuevamente.`);
    }

    if (config?.valor_encriptado) {
      try {
        console.log(`[GEMINI] 🔓 Desencriptando API key...`);
        const decrypted = await decrypt(config.valor_encriptado);
        if (!decrypted || decrypted.trim() === "") {
          throw new Error("API key de Gemini desencriptada está vacía");
        }
        console.log(`[GEMINI] ✅ API key obtenida correctamente`);
        return decrypted.trim();
      } catch (error: any) {
        console.error("❌ Error desencriptando API key de Gemini:", error);
        const envKey = process.env.GEMINI_API_KEY;
        if (envKey) {
          console.log("✅ Usando API key de Gemini de variable de entorno");
          return envKey;
        }
        throw new Error(`Error al desencriptar la API key de Gemini: ${error.message || "Error desconocido"}. Por favor, vuelve a configurar la API key en el panel de administración.`);
      }
    } else {
      console.warn(`[GEMINI] ⚠️ No se encontró configuración en base de datos`);
    }

    // Fallback a variable de entorno
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
      console.log("✅ Usando API key de Gemini de variable de entorno");
      return envKey;
    }

    throw new Error("API key de Gemini no configurada. Por favor, configúrala en el panel de administración.");
  } catch (error: any) {
    console.error(`[GEMINI] ❌ Error obteniendo API key:`, error);
    // Si es un error de configuración del cliente admin, intentar con variable de entorno
    if (error.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey) {
        console.log("✅ Usando API key de Gemini de variable de entorno como fallback");
        return envKey;
      }
    }
    throw error;
  }
}

const SYSTEM_PROMPT = `Eres un supervisor técnico de alto nivel experto en redacción de informes de servicio al cliente. Tu tarea es recibir notas breves, informales y posiblemente con errores ortográficos de un técnico de reparación. Debes transformar esas notas en un Informe de Servicio Técnico profesional, empático y claro.

Estructura de salida obligatoria (JSON): { "resumen_cliente": "Explicación sencilla de 1 frase para el cliente.", "detalle_tecnico": "Explicación técnica formal de lo realizado.", "estado_equipo": "Operativo / Requiere revisión / Irreparable" } NO inventes información que no esté en las notas, solo dales formato.`;

export async function generarInforme(notasBrutas: string): Promise<{
  resumen_cliente: string;
  detalle_tecnico: string;
  estado_equipo: string;
}> {
  console.log(`[GEMINI] 📝 Generando informe para notas: "${notasBrutas.substring(0, 50)}..."`);

  const apiKey = await getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  // Usar gemini-2.0-flash - confirmado funcionando en test-connection
  const modelName = "gemini-2.0-flash";
  console.log(`[GEMINI] 🤖 Usando modelo: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `${SYSTEM_PROMPT}\n\nNotas del técnico: ${notasBrutas}\n\nGenera el informe en formato JSON.`;

  try {
    console.log(`[GEMINI] 🚀 Enviando solicitud a Gemini...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`[GEMINI] ✅ Respuesta recibida: ${text.substring(0, 100)}...`);

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[GEMINI] ✅ JSON parseado correctamente`);
      return {
        resumen_cliente: parsed.resumen_cliente || "Equipo reparado exitosamente.",
        detalle_tecnico: parsed.detalle_tecnico || notasBrutas,
        estado_equipo: parsed.estado_equipo || "Operativo",
      };
    }

    // Fallback si no se encuentra JSON
    console.warn(`[GEMINI] ⚠️ No se encontró JSON en la respuesta, usando fallback`);
    return {
      resumen_cliente: "Equipo reparado exitosamente.",
      detalle_tecnico: text,
      estado_equipo: "Operativo",
    };
  } catch (error: any) {
    console.error("[GEMINI] ❌ Error generando informe:", error);
    console.error("[GEMINI] ❌ Detalles del error:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails
    });
    throw new Error(`Error al generar el informe: ${error.message || "Error desconocido"}. Por favor, intente nuevamente.`);
  }
}















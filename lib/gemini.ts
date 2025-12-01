import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

/**
 * Obtiene la API key de Gemini desde la base de datos (encriptada)
 */
export async function getGeminiApiKey(): Promise<string> {
  const supabase = await createClient();
  
  // Intentar obtener desde la base de datos
  const { data: config, error: configError } = await supabase
    .from("configuraciones")
    .select("valor_encriptado")
    .eq("clave", "gemini_api_key")
    .maybeSingle();

  if (configError) {
    console.error("❌ Error consultando configuración de Gemini:", configError);
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
      console.log("⚠️ Usando API key de Gemini de variable de entorno debido a error en base de datos");
      return envKey;
    }
    throw new Error("Error al acceder a la configuración de la API key de Gemini. Verifica tus permisos.");
  }

  if (config?.valor_encriptado) {
    try {
      const decrypted = await decrypt(config.valor_encriptado);
      if (!decrypted || decrypted.trim() === "") {
        throw new Error("API key de Gemini desencriptada está vacía");
      }
      return decrypted.trim();
    } catch (error: any) {
      console.error("❌ Error desencriptando API key de Gemini:", error);
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey) {
        console.log("✅ Usando API key de Gemini de variable de entorno");
        return envKey;
      }
      throw new Error("Error al desencriptar la API key de Gemini guardada. Por favor, vuelve a configurar la API key en el panel de administración.");
    }
  }

  // Fallback a variable de entorno
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    console.log("✅ Usando API key de Gemini de variable de entorno");
    return envKey;
  }

  throw new Error("API key de Gemini no configurada. Por favor, configúrala en el panel de administración.");
}

const SYSTEM_PROMPT = `Eres un supervisor técnico de alto nivel experto en redacción de informes de servicio al cliente. Tu tarea es recibir notas breves, informales y posiblemente con errores ortográficos de un técnico de reparación. Debes transformar esas notas en un Informe de Servicio Técnico profesional, empático y claro.

Estructura de salida obligatoria (JSON): { "resumen_cliente": "Explicación sencilla de 1 frase para el cliente.", "detalle_tecnico": "Explicación técnica formal de lo realizado.", "estado_equipo": "Operativo / Requiere revisión / Irreparable" } NO inventes información que no esté en las notas, solo dales formato.`;

export async function generarInforme(notasBrutas: string): Promise<{
  resumen_cliente: string;
  detalle_tecnico: string;
  estado_equipo: string;
}> {
  const apiKey = await getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `${SYSTEM_PROMPT}\n\nNotas del técnico: ${notasBrutas}\n\nGenera el informe en formato JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        resumen_cliente: parsed.resumen_cliente || "Equipo reparado exitosamente.",
        detalle_tecnico: parsed.detalle_tecnico || notasBrutas,
        estado_equipo: parsed.estado_equipo || "Operativo",
      };
    }

    // Fallback si no se encuentra JSON
    return {
      resumen_cliente: "Equipo reparado exitosamente.",
      detalle_tecnico: text,
      estado_equipo: "Operativo",
    };
  } catch (error) {
    console.error("Error generando informe con Gemini:", error);
    throw new Error("Error al generar el informe. Por favor, intente nuevamente.");
  }
}















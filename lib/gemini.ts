import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@supabase/supabase-js";

/**
 * Obtiene la API key de Gemini
 * PRIORIDAD: Variable de entorno primero (estable), base de datos como fallback opcional
 */
export async function getGeminiApiKey(): Promise<string> {
  // PRIMERO: Intentar variable de entorno (fuente principal, más estable)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() !== "") {
    console.log("[GEMINI] ✅ Usando API key de variable de entorno");
    return envKey.trim();
  }

  // SEGUNDO: Intentar base de datos solo si no hay variable de entorno
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Faltan variables de entorno de Supabase");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("[GEMINI] 🔍 Variable de entorno no encontrada, intentando base de datos...");

    const { data: config, error: configError } = await supabase
      .from("configuraciones")
      .select("valor_encriptado")
      .eq("clave", "gemini_api_key")
      .maybeSingle();

    if (!configError && config?.valor_encriptado) {
      try {
        const decrypted = await decrypt(config.valor_encriptado);
        if (decrypted && decrypted.trim() !== "") {
          console.log("[GEMINI] ✅ API key obtenida desde base de datos");
          return decrypted.trim();
        }
      } catch (decryptError) {
        console.warn("[GEMINI] ⚠️ Error desencriptando desde base de datos:", decryptError);
      }
    }
  } catch (dbError) {
    console.warn("[GEMINI] ⚠️ No se pudo acceder a la base de datos:", dbError);
  }

  // Si llegamos aquí, no hay API key configurada
  throw new Error(
    "API key de Gemini no configurada. " +
    "Por favor, agrega GEMINI_API_KEY en tu archivo .env.local"
  );
}

const SYSTEM_PROMPT = `Eres un supervisor técnico de alto nivel experto en redacción de informes de servicio al cliente.Tu tarea es recibir notas breves, informales y posiblemente con errores ortográficos de un técnico de reparación.Debes transformar esas notas en un Informe de Servicio Técnico profesional, empático y claro.

Estructura de salida obligatoria(JSON): { "resumen_cliente": "Explicación sencilla de 1 frase para el cliente.", "detalle_tecnico": "Explicación técnica formal de lo realizado.", "estado_equipo": "Operativo / Requiere revisión / Irreparable" } NO inventes información que no esté en las notas, solo dales formato.`;

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
  console.log(`[GEMINI] 🤖 Usando modelo: ${modelName} `);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `${SYSTEM_PROMPT} \n\nNotas del técnico: ${notasBrutas} \n\nGenera el informe en formato JSON.`;

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















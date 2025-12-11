import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";

/**
 * Obtiene la API key de Resend
 * PRIORIDAD: Variable de entorno primero (estable), base de datos como fallback opcional
 */
export async function getResendApiKey(): Promise<string> {
  // PRIMERO: Intentar variable de entorno (fuente principal, más estable)
  const envKey = process.env.RESEND_API_KEY;
  if (envKey && envKey.trim() !== "") {
    console.log("[RESEND] ✅ Usando API key de variable de entorno");
    return envKey.trim();
  }

  // SEGUNDO: Intentar base de datos solo si no hay variable de entorno
  try {
    const supabase = await createAdminClient();
    console.log("[RESEND] 🔍 Variable de entorno no encontrada, intentando base de datos...");

    const { data: config, error: configError } = await supabase
      .from("configuraciones")
      .select("valor_encriptado")
      .eq("clave", "resend_api_key")
      .maybeSingle();

    if (!configError && config?.valor_encriptado) {
      try {
        const decrypted = await decrypt(config.valor_encriptado);
        if (decrypted && decrypted.trim() !== "") {
          console.log("[RESEND] ✅ API key obtenida desde base de datos");
          return decrypted.trim();
        }
      } catch (decryptError) {
        console.warn("[RESEND] ⚠️ Error desencriptando desde base de datos:", decryptError);
      }
    }
  } catch (dbError) {
    console.warn("[RESEND] ⚠️ No se pudo acceder a la base de datos:", dbError);
  }

  // Si llegamos aquí, no hay API key configurada
  throw new Error(
    "API key de Resend no configurada. " +
    "Por favor, agrega RESEND_API_KEY en tu archivo .env.local"
  );
}


import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";

/**
 * Obtiene la API key de Resend desde la base de datos (encriptada)
 * Usa el cliente de administración para leer desde API routes del servidor
 */
export async function getResendApiKey(): Promise<string> {
  try {
    // Usar cliente de admin para tener permisos completos en el servidor
    const supabase = await createAdminClient();
    
    console.log(`[RESEND] 🔑 Obteniendo API key desde base de datos...`);
    
    // Intentar obtener desde la base de datos
    const { data: config, error: configError } = await supabase
      .from("configuraciones")
      .select("valor_encriptado")
      .eq("clave", "resend_api_key")
      .maybeSingle();

    if (configError) {
      console.error("❌ Error consultando configuración de Resend:", configError);
      // Intentar usar variable de entorno como fallback
      const envKey = process.env.RESEND_API_KEY;
      if (envKey) {
        console.log("⚠️ Usando API key de Resend de variable de entorno debido a error en base de datos");
        return envKey;
      }
      // Mensaje más claro sobre el problema
      const errorMsg = configError.message || "Error desconocido";
      if (errorMsg.includes("permission") || errorMsg.includes("policy") || errorMsg.includes("RLS")) {
        console.warn("⚠️ Error de permisos RLS. El service role debería bypasear RLS. Usando variable de entorno si está disponible.");
        throw new Error("No tienes permisos para leer la configuración y no hay API key en variables de entorno. Verifica que la SERVICE_ROLE_KEY esté configurada correctamente o agrega RESEND_API_KEY en .env.local");
      }
      throw new Error(`Error al acceder a la configuración: ${errorMsg}. Si acabas de cambiar la configuración de Supabase, es posible que necesites configurar las API keys nuevamente.`);
    }

    if (config?.valor_encriptado) {
      try {
        console.log(`[RESEND] 🔓 Desencriptando API key...`);
        const decrypted = await decrypt(config.valor_encriptado);
        if (!decrypted || decrypted.trim() === "") {
          throw new Error("API key de Resend desencriptada está vacía");
        }
        console.log(`[RESEND] ✅ API key obtenida correctamente`);
        return decrypted.trim();
      } catch (error: any) {
        console.error("❌ Error desencriptando API key de Resend:", error);
        const envKey = process.env.RESEND_API_KEY;
        if (envKey) {
          console.log("✅ Usando API key de Resend de variable de entorno");
          return envKey;
        }
        throw new Error(`Error al desencriptar la API key de Resend: ${error.message || "Error desconocido"}. Por favor, vuelve a configurar la API key en el panel de administración.`);
      }
    } else {
      console.warn(`[RESEND] ⚠️ No se encontró configuración en base de datos`);
    }

    // Fallback a variable de entorno
    const envKey = process.env.RESEND_API_KEY;
    if (envKey) {
      console.log("✅ Usando API key de Resend de variable de entorno");
      return envKey;
    }

    throw new Error("API key de Resend no configurada. Por favor, configúrala en el panel de administración.");
  } catch (error: any) {
    console.error(`[RESEND] ❌ Error obteniendo API key:`, error);
    // Si es un error de configuración del cliente admin, intentar con variable de entorno
    if (error.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      const envKey = process.env.RESEND_API_KEY;
      if (envKey) {
        console.log("✅ Usando API key de Resend de variable de entorno como fallback");
        return envKey;
      }
    }
    throw error;
  }
}


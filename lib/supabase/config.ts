/**
 * Utilidades para obtener configuración de Supabase desde la base de datos
 * Si hay configuraciones guardadas en la DB, se usan en lugar de variables de entorno
 */

import { createAdminClientSync } from "./admin";
import { decrypt } from "@/lib/encryption";

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Obtiene la configuración de Supabase desde la base de datos
 * Si no existe, retorna null para usar variables de entorno
 * 
 * NOTA: Usa createAdminClientSync() para evitar dependencia circular
 */
export async function getSupabaseConfigFromDB(): Promise<SupabaseConfig | null> {
  try {
    // Usar versión síncrona para evitar dependencia circular
    const adminClient = createAdminClientSync();

    // Obtener configuraciones desde la base de datos
    const [urlConfig, anonKeyConfig, serviceKeyConfig] = await Promise.all([
      adminClient
        .from("configuraciones")
        .select("valor_encriptado")
        .eq("clave", "supabase_url")
        .maybeSingle(),
      adminClient
        .from("configuraciones")
        .select("valor_encriptado")
        .eq("clave", "supabase_anon_key")
        .maybeSingle(),
      adminClient
        .from("configuraciones")
        .select("valor_encriptado")
        .eq("clave", "supabase_service_role_key")
        .maybeSingle(),
    ]);

    // Si hay errores al leer, verificar si es un error de permisos o tabla no existe
    if (urlConfig.error || anonKeyConfig.error || serviceKeyConfig.error) {
      const errors = [urlConfig.error, anonKeyConfig.error, serviceKeyConfig.error].filter(Boolean);
      const firstError = errors[0];
      
      // Si el error indica que la tabla no existe o problemas de permisos, retornar null silenciosamente
      if (firstError?.code === 'PGRST116' || firstError?.message?.includes('relation') || firstError?.message?.includes('permission')) {
        console.warn("No se puede acceder a la tabla configuraciones. Usando variables de entorno.");
        return null;
      }
      
      // Para otros errores, también retornar null (fallback a variables de entorno)
      console.warn("Error obteniendo configuración desde DB, usando variables de entorno:", firstError?.message);
      return null;
    }

    // Si no hay configuración de URL o Anon Key, usar variables de entorno
    if (!urlConfig.data?.valor_encriptado || !anonKeyConfig.data?.valor_encriptado) {
      return null;
    }

    // Desencriptar los valores
    const url = await decrypt(urlConfig.data.valor_encriptado);
    const anonKey = await decrypt(anonKeyConfig.data.valor_encriptado);
    const serviceKey = serviceKeyConfig.data?.valor_encriptado
      ? await decrypt(serviceKeyConfig.data.valor_encriptado)
      : undefined;

    return {
      url: url.trim(),
      anonKey: anonKey.trim(),
      serviceRoleKey: serviceKey?.trim(),
    };
  } catch (error: any) {
    console.error("Error obteniendo configuración de Supabase desde DB:", error);
    // Si es un error de SERVICE_ROLE_KEY no configurada, retornar null para usar variables de entorno
    if (error.message?.includes('SERVICE_ROLE_KEY') || error.message?.includes('configurada')) {
      console.warn("SERVICE_ROLE_KEY no configurada. Usando variables de entorno.");
      return null;
    }
    // Si hay error, usar variables de entorno como fallback
    return null;
  }
}

/**
 * Obtiene la URL de Supabase (desde DB o variables de entorno)
 */
export function getSupabaseUrl(): string {
  // En el cliente, siempre usar variables de entorno o las que vengan del servidor
  // La configuración dinámica se maneja mejor en el servidor
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
}

/**
 * Obtiene la Anon Key de Supabase (desde DB o variables de entorno)
 */
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
}


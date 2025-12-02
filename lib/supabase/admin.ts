import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfigFromDB } from './config'

/**
 * Cliente de administración de Supabase
 * Usa el service role key para operaciones administrativas
 * IMPORTANTE: Solo usar en API routes del servidor, nunca en el cliente
 * 
 * Primero intenta obtener la configuración desde la base de datos,
 * si no existe, usa las variables de entorno
 * 
 * NOTA: Esta función es async porque puede necesitar leer de la DB.
 * Si necesitas una versión síncrona, usa createAdminClientSync()
 */
export async function createAdminClient() {
  // Intentar obtener configuración desde la DB
  // Usar try-catch para evitar problemas si la DB no está disponible
  let dbConfig = null;
  try {
    dbConfig = await getSupabaseConfigFromDB();
  } catch (error) {
    // Si falla, usar variables de entorno
    console.warn("No se pudo obtener configuración de Supabase desde DB, usando variables de entorno:", error);
  }
  
  const supabaseUrl = dbConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = dbConfig?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
      'Agrega esta variable en tu archivo .env.local o configúrala desde el panel de administración.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Versión síncrona de createAdminClient (solo usa variables de entorno)
 * Úsala cuando no puedas usar async/await
 */
export function createAdminClientSync() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
      'Agrega esta variable en tu archivo .env.local'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}







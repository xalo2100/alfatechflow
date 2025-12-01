import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de administración de Supabase
 * Usa el service role key para operaciones administrativas
 * IMPORTANTE: Solo usar en API routes del servidor, nunca en el cliente
 */
export function createAdminClient() {
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







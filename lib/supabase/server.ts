import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfigFromDB } from './config'

export async function createClient() {
  const cookieStore = await cookies()

  // Intentar obtener configuración desde la DB, si no existe usar variables de entorno
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  /* 
  // DESHABILITADO TEMPORALMENTE: Esto causa problemas si la configuración en DB es diferente a las variables de entorno
  // Priorizamos las variables de entorno para asegurar consistencia entre cliente y servidor
  try {
    const dbConfig = await getSupabaseConfigFromDB();
    if (dbConfig) {
      supabaseUrl = dbConfig.url;
      supabaseKey = dbConfig.anonKey;
    }
  } catch (error) {
    // Si hay error obteniendo de la DB, usar variables de entorno
    console.warn("No se pudo obtener configuración de Supabase desde DB, usando variables de entorno:", error);
  }
  */

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición sea admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No hacer nada en API routes
          },
          remove(name: string, options: CookieOptions) {
            // No hacer nada en API routes
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!perfil || (perfil.rol !== "admin" && perfil.rol !== "super_admin")) {
      return NextResponse.json(
        { error: "Solo los administradores pueden probar configuraciones de Supabase" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { url, anonKey, serviceKey } = await request.json();

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "URL y API Key Anon son requeridas" },
        { status: 400 }
      );
    }

    // Validar formato de URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "La URL no tiene un formato válido" },
        { status: 400 }
      );
    }

    // Probar conexión con las nuevas credenciales
    try {
      const testClient = createClient(url, anonKey);

      // Intentar una operación simple para verificar la conexión
      const { data, error: testError } = await testClient
        .from("perfiles")
        .select("id")
        .limit(1);

      if (testError) {
        return NextResponse.json(
          { error: `Error de conexión: ${testError.message}. Verifica que la URL y la API key sean correctas y que la tabla 'perfiles' exista.` },
          { status: 400 }
        );
      }

      // Si se proporciona Service Role Key, probarla también
      if (serviceKey && serviceKey.trim() !== "") {
        try {
          const adminTestClient = createClient(url, serviceKey.trim());

          // Probar con una consulta simple que debería funcionar con Service Role
          const { error: adminTestError } = await adminTestClient
            .from("perfiles")
            .select("id")
            .limit(1);

          if (adminTestError) {
            // Si el error menciona "Invalid API key", la key es inválida
            if (adminTestError.message?.includes("Invalid API key") || adminTestError.message?.includes("JWT")) {
              return NextResponse.json(
                { error: `La Service Role Key no es válida. Verifica que:\n1. Sea la key correcta del proyecto\n2. No tenga espacios o saltos de línea\n3. Sea la key "service_role" y no la "anon"` },
                { status: 400 }
              );
            }

            // Si el error es que la tabla no existe, es un problema de estructura
            if (adminTestError.message?.includes("relation") || adminTestError.message?.includes("does not exist")) {
              return NextResponse.json(
                { error: `La Service Role Key es válida, pero la tabla 'perfiles' no existe en este proyecto. Asegúrate de que la base de datos tenga la estructura correcta.` },
                { status: 400 }
              );
            }

            return NextResponse.json(
              { error: `Error al validar Service Role Key: ${adminTestError.message}` },
              { status: 400 }
            );
          }
        } catch (serviceKeyError: any) {
          return NextResponse.json(
            { error: `Error al validar Service Role Key: ${serviceKeyError.message || "Error desconocido"}` },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Conexión exitosa. Las credenciales son válidas.",
      });
    } catch (error: any) {
      console.error("Error probando conexión:", error);
      return NextResponse.json(
        { error: `Error al probar la conexión: ${error.message || "Error desconocido"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en test-supabase-config API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}


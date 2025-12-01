import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Crear cliente de Supabase usando las cookies del request
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

    // Verificar que el usuario que hace la petición sea admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Error de autenticación:", authError);
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

    if (!perfil || perfil.rol !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden crear técnicos" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { run, email, password, nombre_completo } = await request.json();

    // Validaciones
    if (!run || !password || !nombre_completo) {
      return NextResponse.json(
        { error: "RUN, contraseña y nombre completo son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de RUN (7-8 dígitos + 1 dígito/K)
    const runRegex = /^\d{7,8}[\dkK]$/i;
    if (!runRegex.test(run)) {
      return NextResponse.json(
        { error: "El RUN no tiene un formato válido. Debe ser: 164121489 o 16412148K" },
        { status: 400 }
      );
    }

    // Normalizar RUN (sin guion, mayúscula)
    const runFormateado = run.replace(/-/g, "").toUpperCase();

    // Crear cliente de administración
    const adminClient = createAdminClient();

    // Verificar que el RUN no esté en uso
    const { data: runExistente } = await adminClient
      .from("perfiles")
      .select("id")
      .eq("run", runFormateado)
      .eq("rol", "tecnico")
      .single();

    if (runExistente) {
      return NextResponse.json(
        { error: "Este RUN ya está registrado en el sistema" },
        { status: 400 }
      );
    }

    // Generar email si no se proporciona (usar nombre en lugar de RUN)
    // Normalizar nombre: convertir a minúsculas, reemplazar espacios y caracteres especiales
    const nombreNormalizado = nombre_completo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9]/g, "") // Eliminar caracteres especiales
      .substring(0, 20); // Limitar longitud
    
    const emailUsuario = email?.trim() || `${nombreNormalizado}@tecnico.local`;

    // Crear usuario en Authentication usando el cliente de administración
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: emailUsuario,
      password: password,
      email_confirm: true, // Auto confirmar email
    });

    if (createUserError || !authData.user) {
      console.error("Error creando usuario:", createUserError);
      return NextResponse.json(
        { error: `Error al crear usuario: ${createUserError?.message || "Error desconocido"}` },
        { status: 500 }
      );
    }

    // Crear perfil del técnico
    const { error: perfilError } = await adminClient
      .from("perfiles")
      .insert({
        id: authData.user.id,
        run: runFormateado,
        email: email?.trim() || null,
        nombre_completo: nombre_completo,
        rol: "tecnico",
        activo: true,
      });

    if (perfilError) {
      // Si falla crear el perfil, intentar eliminar el usuario creado
      await adminClient.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: `Error al crear perfil: ${perfilError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Técnico creado exitosamente",
      data: {
        id: authData.user.id,
        run: runFormateado,
        email: emailUsuario,
        nombre_completo: nombre_completo,
      },
    });
  } catch (error: any) {
    console.error("Error en crear-tecnico API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}


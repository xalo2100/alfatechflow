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
        { error: "Solo los administradores pueden crear usuarios" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { email, password, nombre_completo, rol } = await request.json();

    // Validaciones
    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: "Email, contraseña, nombre completo y rol son requeridos" },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido
    if (rol !== "ventas" && rol !== "admin") {
      return NextResponse.json(
        { error: "El rol debe ser 'ventas' o 'admin'" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "El email no tiene un formato válido" },
        { status: 400 }
      );
    }

    // Crear cliente de administración
    const adminClient = await createAdminClient();

    // Verificar que el email no esté en uso
    const { data: emailExistente } = await adminClient
      .from("perfiles")
      .select("id")
      .eq("email", email.trim())
      .single();

    if (emailExistente) {
      return NextResponse.json(
        { error: "Este email ya está registrado en el sistema" },
        { status: 400 }
      );
    }

    // Crear usuario en Authentication usando el cliente de administración
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
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

    // Crear perfil del usuario
    const { error: perfilError } = await adminClient
      .from("perfiles")
      .insert({
        id: authData.user.id,
        email: email.trim(),
        nombre_completo: nombre_completo,
        rol: rol,
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
      message: `Usuario ${rol} creado exitosamente`,
      data: {
        id: authData.user.id,
        email: email.trim(),
        nombre_completo: nombre_completo,
        rol: rol,
      },
    });
  } catch (error: any) {
    console.error("Error en crear-usuario API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}





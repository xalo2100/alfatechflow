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
        { error: "Solo los administradores pueden cambiar contraseñas" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const { usuarioId, nuevaContraseña } = await request.json();

    if (!usuarioId || !nuevaContraseña) {
      return NextResponse.json(
        { error: "ID del usuario y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Validar longitud mínima de contraseña
    if (nuevaContraseña.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Crear cliente de administración
    const adminClient = createAdminClient();

    // Verificar que el usuario existe
    const { data: usuarioExistente } = await adminClient
      .from("perfiles")
      .select("id")
      .eq("id", usuarioId)
      .single();

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar la contraseña del usuario
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      usuarioId,
      {
        password: nuevaContraseña,
      }
    );

    if (updateError) {
      console.error("Error actualizando contraseña:", updateError);
      return NextResponse.json(
        { error: `Error al cambiar contraseña: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error: any) {
    console.error("Error en cambiar-contraseña API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}





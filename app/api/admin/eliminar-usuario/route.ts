import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function DELETE(request: NextRequest) {
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
        { error: "Solo los administradores pueden eliminar usuarios" },
        { status: 403 }
      );
    }

    // Obtener ID del usuario a eliminar
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("id");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "ID del usuario es requerido" },
        { status: 400 }
      );
    }

    // No permitir que un admin se elimine a sí mismo
    if (usuarioId === user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Crear cliente de administración
    const adminClient = createAdminClient();

    // Verificar que el usuario existe
    const { data: usuarioExistente } = await adminClient
      .from("perfiles")
      .select("id, rol")
      .eq("id", usuarioId)
      .single();

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el perfil primero
    const { error: perfilError } = await adminClient
      .from("perfiles")
      .delete()
      .eq("id", usuarioId);

    if (perfilError) {
      console.error("Error eliminando perfil:", perfilError);
      return NextResponse.json(
        { error: `Error al eliminar perfil: ${perfilError.message}` },
        { status: 500 }
      );
    }

    // Eliminar el usuario de Authentication
    const { error: userError } = await adminClient.auth.admin.deleteUser(usuarioId);

    if (userError) {
      console.error("Error eliminando usuario de auth:", userError);
      // El perfil ya se eliminó, pero el usuario de auth no
      // Esto puede pasar si el usuario ya no existe en auth
      return NextResponse.json({
        success: true,
        message: "Perfil eliminado. El usuario de autenticación puede que ya no exista.",
        warning: userError.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en eliminar-usuario API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}





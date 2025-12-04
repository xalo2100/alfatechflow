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

    if (!perfil || (perfil.rol !== "admin" && perfil.rol !== "super_admin")) {
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
    const adminClient = await createAdminClient();

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

    // Verificar si el usuario tiene tickets asignados
    const { data: ticketsAsignados, error: ticketsError } = await adminClient
      .from("tickets")
      .select("id")
      .eq("asignado_a", usuarioId);

    if (ticketsError) {
      console.error("Error verificando tickets:", ticketsError);
      return NextResponse.json(
        { error: `Error al verificar tickets: ${ticketsError.message}` },
        { status: 500 }
      );
    }

    // Si tiene tickets asignados, desasignarlos (poner asignado_a en null)
    if (ticketsAsignados && ticketsAsignados.length > 0) {
      console.log(`Usuario tiene ${ticketsAsignados.length} tickets asignados. Desasignando...`);

      const { error: updateError } = await adminClient
        .from("tickets")
        .update({ asignado_a: null })
        .eq("asignado_a", usuarioId);

      if (updateError) {
        console.error("Error desasignando tickets:", updateError);
        return NextResponse.json(
          { error: `Error al desasignar tickets: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ ${ticketsAsignados.length} tickets desasignados correctamente`);
    }

    // Verificar si el usuario tiene reportes asociados
    const { data: reportesAsociados, error: reportesError } = await adminClient
      .from("reportes")
      .select("id")
      .eq("tecnico_id", usuarioId);

    if (reportesError) {
      console.error("Error verificando reportes:", reportesError);
      return NextResponse.json(
        { error: `Error al verificar reportes: ${reportesError.message}` },
        { status: 500 }
      );
    }

    // Si tiene reportes asociados, desasociarlos (poner tecnico_id en null)
    if (reportesAsociados && reportesAsociados.length > 0) {
      console.log(`Usuario tiene ${reportesAsociados.length} reportes asociados. Desasociando...`);

      const { error: updateReportesError } = await adminClient
        .from("reportes")
        .update({ tecnico_id: null })
        .eq("tecnico_id", usuarioId);

      if (updateReportesError) {
        console.error("Error desasociando reportes:", updateReportesError);
        return NextResponse.json(
          { error: `Error al desasociar reportes: ${updateReportesError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ ${reportesAsociados.length} reportes desasociados correctamente`);
    }



    // Verificar si el usuario creó tickets (creado_por)
    const { data: ticketsCreados, error: ticketsCreadosError } = await adminClient
      .from("tickets")
      .select("id")
      .eq("creado_por", usuarioId);

    if (ticketsCreadosError) {
      console.error("Error verificando tickets creados:", ticketsCreadosError);
      return NextResponse.json(
        { error: `Error al verificar tickets creados: ${ticketsCreadosError.message}` },
        { status: 500 }
      );
    }

    // Si creó tickets, desvincularlos (poner creado_por en null)
    if (ticketsCreados && ticketsCreados.length > 0) {
      console.log(`Usuario creó ${ticketsCreados.length} tickets. Desvinculando...`);

      const { error: updateCreadosError } = await adminClient
        .from("tickets")
        .update({ creado_por: null })
        .eq("creado_por", usuarioId);

      if (updateCreadosError) {
        console.error("Error desvinculando tickets creados:", updateCreadosError);
        return NextResponse.json(
          { error: `Error al desvincular tickets creados: ${updateCreadosError.message}` },
          { status: 500 }
        );
      }
      console.log(`✅ ${ticketsCreados.length} tickets creados desvinculados correctamente`);
    }

    // Eliminar ubicaciones del técnico (si existen)
    // Aunque debería ser cascade, lo hacemos explícito por seguridad
    const { error: ubicacionesError } = await adminClient
      .from("ubicaciones_tecnicos")
      .delete()
      .eq("tecnico_id", usuarioId);

    if (ubicacionesError) {
      // Ignoramos error si la tabla no existe o hay otro problema menor
      console.warn("Advertencia al eliminar ubicaciones:", ubicacionesError);
    }

    // Ahora eliminar el perfil
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





import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function PUT(request: NextRequest) {
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
                { error: "Solo los administradores pueden editar usuarios" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, nombre_completo, email, rol, run, activo } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID del usuario es requerido" },
                { status: 400 }
            );
        }

        // Crear cliente de administración
        const adminClient = await createAdminClient();

        // 1. Actualizar perfil en tabla 'perfiles'
        const updateData: any = {};
        if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
        if (email !== undefined) updateData.email = email;
        if (rol !== undefined) updateData.rol = rol;
        if (run !== undefined) updateData.run = run;
        if (activo !== undefined) updateData.activo = activo;

        const { error: perfilError } = await adminClient
            .from("perfiles")
            .update(updateData)
            .eq("id", id);

        if (perfilError) {
            console.error("Error actualizando perfil:", perfilError);
            return NextResponse.json(
                { error: `Error al actualizar perfil: ${perfilError.message}` },
                { status: 500 }
            );
        }

        // 2. Actualizar usuario en Auth (si cambió el email o password - password se maneja aparte)
        // Si cambió el email, actualizar en Auth
        if (email) {
            const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
                id,
                { email: email }
            );

            if (authUpdateError) {
                console.error("Error actualizando email en Auth:", authUpdateError);
                return NextResponse.json(
                    {
                        success: true,
                        message: "Perfil actualizado, pero hubo un error al actualizar el email en autenticación.",
                        warning: authUpdateError.message
                    }
                );
            }
        }

        // Si se actualizó el nombre, también actualizar metadata en Auth
        if (nombre_completo || run) {
            const userMetadata: any = {};
            if (nombre_completo) userMetadata.nombre_completo = nombre_completo;
            if (run) userMetadata.run = run;

            const { error: metaError } = await adminClient.auth.admin.updateUserById(
                id,
                { user_metadata: userMetadata }
            );

            if (metaError) {
                console.warn("Error actualizando metadata en Auth:", metaError);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Usuario actualizado exitosamente",
        });

    } catch (error: any) {
        console.error("Error en editar-usuario API:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}

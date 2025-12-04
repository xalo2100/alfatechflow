import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identificador y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Determinar si es RUN o email
    // RUN: solo números y K, entre 7-9 caracteres (sin guion)
    const cleanedIdentifier = identifier.replace(/-/g, "").trim();
    const isRUN = /^[\dK]{7,9}$/i.test(cleanedIdentifier);

    let emailToUse = identifier.trim();

    // Si es RUN, buscar el email asociado
    if (isRUN) {
      const runFormateado = cleanedIdentifier.toUpperCase();

      // Usar cliente admin para buscar por RUN (bypasear RLS)
      const supabase = await createAdminClient();

      // Buscar perfil por RUN (la tabla perfiles debe tener RLS que permita SELECT público)
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("id, email, nombre_completo, rol")
        .eq("run", runFormateado)
        .eq("rol", "tecnico")
        .maybeSingle();

      if (perfilError) {
        console.error("Error buscando perfil por RUN:", perfilError);
        return NextResponse.json(
          { error: "Error al buscar RUN en el sistema. Verifica que las políticas RLS permitan lectura pública de la tabla perfiles." },
          { status: 500 }
        );
      }

      if (!perfil) {
        return NextResponse.json(
          { error: "RUN no encontrado en el sistema" },
          { status: 404 }
        );
      }

      // Usar el email del perfil
      if (!perfil.email) {
        return NextResponse.json(
          { error: "Este RUN no tiene email asociado. Contacta al administrador." },
          { status: 404 }
        );
      }

      emailToUse = perfil.email;
    }

    // Crear cliente de Supabase para autenticación (usando anon key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase no encontrada" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Intentar login con el email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Obtener perfil para verificar rol
    // Usar el cliente con la sesión del usuario autenticado para evitar problemas de RLS
    let perfil: any = null;
    let perfilError: any = null;

    // Crear cliente con la sesión del usuario autenticado
    const supabaseWithSession = createClient(supabaseUrl, supabaseKey);
    await supabaseWithSession.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

    // Intentar obtener perfil con el cliente autenticado
    const result = await supabaseWithSession
      .from("perfiles")
      .select("rol, nombre_completo")
      .eq("id", authData.user.id)
      .maybeSingle();

    perfil = result.data;
    perfilError = result.error;

    // Si falla, intentar con adminClient como fallback
    if (perfilError || !perfil) {
      try {
        const adminClient = await createAdminClient();
        const adminResult = await adminClient
          .from("perfiles")
          .select("rol, nombre_completo")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (adminResult.data) {
          perfil = adminResult.data;
          perfilError = null;
        }
      } catch (adminError: any) {
        console.error("Error con adminClient (puede faltar SERVICE_ROLE_KEY):", adminError.message);
        // Continuar con el error original
      }
    }

    if (perfilError) {
      console.error("Error obteniendo perfil:", perfilError);
      console.error("User ID:", authData.user.id);
      console.error("User Email:", authData.user.email);
      return NextResponse.json(
        {
          error: "Usuario sin perfil asignado. Contacta al administrador.",
          details: perfilError.message,
          user_id: authData.user.id
        },
        { status: 403 }
      );
    }

    if (!perfil) {
      console.error("❌ Perfil no encontrado para usuario:", authData.user.id);
      console.error("📧 Email del usuario:", authData.user.email);

      // Intentar buscar por email como último recurso
      try {
        const adminClient = await createAdminClient();
        const resultByEmail = await adminClient
          .from("perfiles")
          .select("rol, nombre_completo, id")
          .eq("email", authData.user.email || emailToUse)
          .maybeSingle();

        if (resultByEmail.data) {
          console.log("✅ Perfil encontrado por email, pero UUID no coincide");
          console.log("🔍 UUID en perfiles:", resultByEmail.data.id);
          console.log("🔍 UUID en auth.users:", authData.user.id);

          // Si el UUID no coincide, actualizar el perfil con el UUID correcto
          const { error: updateError } = await adminClient
            .from("perfiles")
            .update({ id: authData.user.id })
            .eq("id", resultByEmail.data.id);

          if (updateError) {
            // Si no se puede actualizar, intentar crear uno nuevo
            const { error: insertError } = await adminClient
              .from("perfiles")
              .insert({
                id: authData.user.id,
                email: authData.user.email || emailToUse,
                nombre_completo: resultByEmail.data.nombre_completo || "Gonzalo Sánchez",
                rol: resultByEmail.data.rol || "admin",
                activo: true,
              });

            if (insertError) {
              return NextResponse.json(
                {
                  error: "El UUID del perfil no coincide. Ejecuta este SQL en Supabase:\n\nUPDATE perfiles SET id = '" + authData.user.id + "' WHERE email = '" + (authData.user.email || emailToUse) + "';\n\nO elimina el perfil viejo y crea uno nuevo con el UUID correcto.",
                  user_id: authData.user.id,
                  perfil_id: resultByEmail.data.id
                },
                { status: 403 }
              );
            }

            // Si se creó exitosamente, usar ese perfil
            perfil = {
              rol: resultByEmail.data.rol || "admin",
              nombre_completo: resultByEmail.data.nombre_completo || "Gonzalo Sánchez"
            };
          } else {
            // Si se actualizó, buscar de nuevo
            const resultUpdated = await adminClient
              .from("perfiles")
              .select("rol, nombre_completo")
              .eq("id", authData.user.id)
              .maybeSingle();

            perfil = resultUpdated.data;
          }
        }
      } catch (e: any) {
        console.error("Error en búsqueda/actualización por email:", e);
      }

      // Si después de todo esto aún no hay perfil, retornar error
      if (!perfil) {
        return NextResponse.json(
          {
            error: "Usuario sin perfil asignado. Contacta al administrador.",
            user_id: authData.user.id,
            user_email: authData.user.email,
            hint: "Ejecuta este SQL en Supabase SQL Editor:\n\nINSERT INTO perfiles (id, email, nombre_completo, rol, activo)\nVALUES ('" + authData.user.id + "', '" + (authData.user.email || emailToUse) + "', 'Gonzalo Sánchez', 'admin', true)\nON CONFLICT (id) DO UPDATE SET rol = 'admin';"
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        rol: perfil.rol,
        nombre_completo: perfil.nombre_completo,
      },
      session: authData.session,
    });
  } catch (error: any) {
    console.error("Error en login API:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}


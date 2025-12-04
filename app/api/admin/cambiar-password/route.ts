import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Asegurar que siempre devolvamos JSON, incluso en caso de error
  try {
    // Crear cliente de Supabase usando el helper del servidor
    const supabase = await createClient();

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
    let adminClient;
    try {
      adminClient = await createAdminClient();

      // Verificar que la configuración sea válida haciendo una prueba simple
      const testConnection = await adminClient.from("perfiles").select("id").limit(1);
      if (testConnection.error) {
        const errorMsg = testConnection.error.message || "";
        console.error("❌ Error verificando conexión:", errorMsg);

        // Verificar si es un error de API key
        if (errorMsg.includes("API key") || errorMsg.includes("Invalid") || errorMsg.includes("JWT")) {
          return NextResponse.json(
            { error: "Error de configuración: La API key del servidor (SERVICE_ROLE_KEY) no es válida. Por favor, verifica tu archivo .env.local y asegúrate de que la SERVICE_ROLE_KEY sea correcta." },
            { status: 500 }
          );
        }

        // Si es otro tipo de error, continuar (puede ser que no haya perfiles aún)
        console.warn("⚠️ Advertencia al verificar conexión:", errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Error creando adminClient:", error.message);

      if (error.message?.includes("SERVICE_ROLE_KEY") || error.message?.includes("no está configurada")) {
        return NextResponse.json(
          { error: "Error de configuración: La SERVICE_ROLE_KEY no está configurada. Por favor, agrega SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Error de configuración del servidor: ${error.message || "Error desconocido"}. Por favor, verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada correctamente.` },
        { status: 500 }
      );
    }

    // Verificar que el usuario existe primero en perfiles
    const { data: perfilUsuario, error: perfilError } = await adminClient
      .from("perfiles")
      .select("id, email, nombre_completo, rol")
      .eq("id", usuarioId)
      .single();

    if (perfilError) {
      console.error("❌ Error buscando usuario en perfiles:", perfilError?.message);
      console.error("UsuarioId buscado:", usuarioId);
      console.error("Código de error:", perfilError?.code);
      console.error("Detalles del error:", perfilError);

      // Si es un error de autenticación/autorización, indicarlo claramente
      if (perfilError.message?.includes("API key") || perfilError.message?.includes("Invalid")) {
        return NextResponse.json(
          { error: "Error de configuración del servidor. La API key no es válida." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Usuario no encontrado en el sistema" },
        { status: 404 }
      );
    }

    if (!perfilUsuario) {
      console.error("❌ Usuario no encontrado en perfiles (sin datos)");
      console.error("UsuarioId buscado:", usuarioId);
      return NextResponse.json(
        { error: "Usuario no encontrado en el sistema" },
        { status: 404 }
      );
    }

    // Buscar el usuario en auth.users
    // El ID en perfiles debería ser el mismo que el ID en auth.users
    let authUserId = usuarioId;
    let usuarioEncontrado = false;

    console.log("🔍 Buscando usuario en auth.users:", {
      usuarioId,
      email: perfilUsuario.email || "Sin email",
      nombre: perfilUsuario.nombre_completo
    });

    try {
      // Intentar obtener el usuario directamente por ID
      const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(usuarioId);

      if (authUser?.user && !authUserError) {
        usuarioEncontrado = true;
        console.log("✅ Usuario encontrado en auth.users por ID:", usuarioId);
      } else {
        console.warn("⚠️ Usuario no encontrado por ID. Error:", authUserError?.message);

        // Si no se encuentra por ID, intentar buscar por email si existe
        if (perfilUsuario.email) {
          console.log("🔍 Buscando usuario por email:", perfilUsuario.email);

          // Listar usuarios y buscar por email
          const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers();

          if (!listError && usersList?.users) {
            const userByEmail = usersList.users.find(u => u.email === perfilUsuario.email);
            if (userByEmail) {
              authUserId = userByEmail.id;
              usuarioEncontrado = true;
              console.log("✅ Usuario encontrado por email, usando ID:", authUserId);
            } else {
              console.error("❌ Usuario no encontrado en auth.users ni por ID ni por email");
              return NextResponse.json(
                { error: `Usuario encontrado en perfiles pero no en auth.users. Por favor, verifica que el usuario tenga una cuenta de autenticación activa.` },
                { status: 404 }
              );
            }
          } else {
            console.error("❌ Error listando usuarios:", listError?.message);
            return NextResponse.json(
              { error: `Error al buscar usuario: ${listError?.message || 'Error desconocido'}` },
              { status: 500 }
            );
          }
        } else {
          // Usuario sin email - técnico con solo RUN
          console.error("❌ Usuario sin email en perfiles, ID:", usuarioId);
          return NextResponse.json(
            { error: `Este usuario no tiene email configurado. Para cambiar la contraseña, el usuario debe tener una cuenta de autenticación activa.` },
            { status: 400 }
          );
        }
      }
    } catch (error: any) {
      console.error("❌ Error verificando usuario en auth.users:", error.message);
      return NextResponse.json(
        { error: `Error al verificar el usuario: ${error.message}` },
        { status: 500 }
      );
    }

    // Actualizar la contraseña del usuario usando el authUserId encontrado
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      authUserId,
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





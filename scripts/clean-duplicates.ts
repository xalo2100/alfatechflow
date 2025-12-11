import { createClient } from "@supabase/supabase-js";

// Usar variables de entorno directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pprqdmeqavrcrpjguwrn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NzI2MCwiZXhwIjoyMDc5NjUzMjYwfQ.6WKvfGEnUWUV_SHaleIkM9b8sI7octr09iOriZsd3jg";

const adminClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanDuplicates() {
    console.log("🧹 Iniciando limpieza de usuarios duplicados...\n");

    // Obtener todos los usuarios de gsanchez@alfapack.cl
    const { data: duplicados, error } = await adminClient
        .from("perfiles")
        .select("id, email, nombre_completo, rol, created_at")
        .eq("email", "gsanchez@alfapack.cl")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (!duplicados || duplicados.length === 0) {
        console.log("✅ No se encontraron usuarios duplicados");
        return;
    }

    console.log(`📊 Encontrados ${duplicados.length} usuarios con email gsanchez@alfapack.cl\n`);

    if (duplicados.length === 1) {
        console.log("✅ Solo hay un usuario, no hay duplicados para eliminar");
        return;
    }

    // El primero es el más reciente (por el order ascending: false)
    const usuarioAMantener = duplicados[0];
    const usuariosAEliminar = duplicados.slice(1);

    console.log("✅ Usuario a MANTENER:");
    console.log(`   ID: ${usuarioAMantener.id}`);
    console.log(`   Nombre: ${usuarioAMantener.nombre_completo}`);
    console.log(`   Rol: ${usuarioAMantener.rol}`);
    console.log(`   Creado: ${new Date(usuarioAMantener.created_at).toLocaleString()}\n`);

    console.log(`🗑️  Usuarios a ELIMINAR (${usuariosAEliminar.length}):\n`);
    usuariosAEliminar.forEach((u, i) => {
        console.log(`${i + 1}. ID: ${u.id}`);
        console.log(`   Creado: ${new Date(u.created_at).toLocaleString()}\n`);
    });

    // Confirmar antes de eliminar
    console.log("⚠️  ADVERTENCIA: Esta acción eliminará permanentemente los usuarios duplicados.");
    console.log("   Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...\n");

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("🔄 Procediendo con la eliminación...\n");

    // Eliminar cada usuario duplicado
    for (const usuario of usuariosAEliminar) {
        console.log(`Eliminando usuario ${usuario.id}...`);

        try {
            // 1. Desasignar tickets
            const { error: ticketsError } = await adminClient
                .from("tickets")
                .update({ asignado_a: null })
                .eq("asignado_a", usuario.id);

            if (ticketsError) {
                console.warn(`  ⚠️  Error desasignando tickets: ${ticketsError.message}`);
            }

            // 2. Desasociar reportes
            const { error: reportesError } = await adminClient
                .from("reportes")
                .update({ tecnico_id: null })
                .eq("tecnico_id", usuario.id);

            if (reportesError) {
                console.warn(`  ⚠️  Error desasociando reportes: ${reportesError.message}`);
            }

            // 3. Desvincular tickets creados
            const { error: creadosError } = await adminClient
                .from("tickets")
                .update({ creado_por: null })
                .eq("creado_por", usuario.id);

            if (creadosError) {
                console.warn(`  ⚠️  Error desvinculando tickets creados: ${creadosError.message}`);
            }

            // 4. Eliminar ubicaciones
            const { error: ubicacionesError } = await adminClient
                .from("ubicaciones_tecnicos")
                .delete()
                .eq("tecnico_id", usuario.id);

            if (ubicacionesError) {
                console.warn(`  ⚠️  Error eliminando ubicaciones: ${ubicacionesError.message}`);
            }

            // 5. Eliminar o actualizar configuraciones creadas por este usuario
            const { error: configuracionesError } = await adminClient
                .from("configuraciones")
                .update({ creado_por: null })
                .eq("creado_por", usuario.id);

            if (configuracionesError) {
                console.warn(`  ⚠️  Error actualizando configuraciones: ${configuracionesError.message}`);
            }

            // 6. Eliminar perfil
            const { error: perfilError } = await adminClient
                .from("perfiles")
                .delete()
                .eq("id", usuario.id);

            if (perfilError) {
                console.error(`  ❌ Error eliminando perfil: ${perfilError.message}`);
                continue;
            }

            // 7. Eliminar de Auth
            const { error: authError } = await adminClient.auth.admin.deleteUser(usuario.id);

            if (authError) {
                console.warn(`  ⚠️  Error eliminando de auth: ${authError.message}`);
            }

            console.log(`  ✅ Usuario ${usuario.id} eliminado exitosamente\n`);
        } catch (err: any) {
            console.error(`  ❌ Error eliminando usuario ${usuario.id}:`, err.message);
        }
    }

    console.log("\n✅ Limpieza completada!");
    console.log("\n🔍 Verificando resultado...\n");

    // Verificar que solo quede un usuario
    const { data: verificacion } = await adminClient
        .from("perfiles")
        .select("id, email, nombre_completo, rol, created_at")
        .eq("email", "gsanchez@alfapack.cl");

    if (verificacion && verificacion.length === 1) {
        console.log("✅ Verificación exitosa: Solo queda 1 usuario con email gsanchez@alfapack.cl");
        console.log(`   ID: ${verificacion[0].id}`);
        console.log(`   Nombre: ${verificacion[0].nombre_completo}`);
        console.log(`   Rol: ${verificacion[0].rol}`);
    } else {
        console.log(`⚠️  Advertencia: Quedan ${verificacion?.length || 0} usuarios con email gsanchez@alfapack.cl`);
    }
}

cleanDuplicates().then(() => {
    console.log("\n🎉 Proceso completado");
    process.exit(0);
}).catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
});

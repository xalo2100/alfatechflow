
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = await createAdminClient();
        const email = 'gsanchez@alfapack.cl';
        const password = '123456'; // Contraseña extremadamente simple para probar
        const nombre = 'Gonzalo Sánchez';

        console.log(`☢️ INICIANDO RESET NUCLEAR PARA: ${email}`);

        // 1. Buscar usuario existente
        const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
        if (searchError) throw searchError;

        const existingUser = users.find(u => u.email === email);

        // 2. Eliminar usuario si existe (esto debería borrar el perfil por cascada si está configurado, pero lo haremos manual por si acaso)
        if (existingUser) {
            console.log(`🗑️ Eliminando usuario Auth existente: ${existingUser.id}`);

            // Primero borrar perfil para evitar conflictos de FK si no hay cascada
            await supabase.from('perfiles').delete().eq('id', existingUser.id);

            // Borrar usuario de Auth
            const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
            if (deleteError) {
                console.error("Error borrando usuario:", deleteError);
                // Si no se puede borrar, intentamos actualizar password
                console.log("⚠️ No se pudo borrar, intentando actualizar password...");
                const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, { password: password });
                if (updateError) throw updateError;

                // Asegurar perfil
                await supabase.from('perfiles').upsert({
                    id: existingUser.id,
                    email,
                    nombre_completo: nombre,
                    rol: 'super_admin',
                    activo: true
                });

                return NextResponse.json({ message: "Usuario actualizado (no se pudo borrar)", password });
            }
        }

        // 3. Crear usuario desde cero
        console.log(`✨ Creando usuario nuevo...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre_completo: nombre }
        });

        if (createError) throw createError;

        // 4. Crear perfil
        console.log(`✨ Creando perfil super_admin...`);
        const { error: profileError } = await supabase.from('perfiles').insert({
            id: newUser.user.id,
            email,
            nombre_completo: nombre,
            rol: 'super_admin',
            activo: true
        });

        if (profileError) {
            // Si falla por duplicado (race condition), intentar update
            await supabase.from('perfiles').upsert({
                id: newUser.user.id,
                email,
                nombre_completo: nombre,
                rol: 'super_admin',
                activo: true
            });
        }

        return NextResponse.json({
            success: true,
            message: "Usuario RECREADO exitosamente",
            email,
            password
        });

    } catch (error: any) {
        console.error("❌ Error en reset nuclear:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

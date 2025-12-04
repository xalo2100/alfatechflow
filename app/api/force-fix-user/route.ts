import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("🔧 === FORZAR ELIMINACIÓN Y RECREACIÓN ===");

        const email = "gsanchez@alfapack.cl";
        const password = "123456";

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const adminClient = createClient(supabaseUrl, serviceKey);

        // 1. Buscar usuario
        log("1️⃣ Buscando usuario...");
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const user = users.find(u => u.email === email);

        if (user) {
            log(`   Usuario encontrado: ${user.id}`);

            // 2. Forzar eliminación
            log("2️⃣ Forzando eliminación...");
            const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

            if (deleteError) {
                log(`   ⚠️ Error eliminando: ${deleteError.message} (continuando de todos modos...)`);
            } else {
                log(`   ✅ Usuario eliminado`);
            }

            // 3. Esperar 2 segundos para que se propague
            log("3️⃣ Esperando propagación...");
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            log("   Usuario no existía");
        }

        // 4. Crear nuevo usuario
        log("4️⃣ Creando nuevo usuario...");
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre_completo: 'Gonzalo Sánchez' }
        });

        if (createError) {
            log(`   ❌ Error creando: ${createError.message}`);
            throw createError;
        }

        log(`   ✅ Usuario creado exitosamente: ${newUser.user.id}`);

        // 5. Crear perfil
        log("5️⃣ Creando perfil super_admin...");
        const { error: profileError } = await adminClient.from('perfiles').upsert({
            id: newUser.user.id,
            email,
            nombre_completo: 'Gonzalo Sánchez',
            rol: 'super_admin',
            activo: true
        });

        if (profileError) {
            log(`   ⚠️ Error creando perfil: ${profileError.message}`);
        } else {
            log(`   ✅ Perfil creado`);
        }

        // 6. Esperar otro segundo
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 7. Probar login
        log("6️⃣ Probando login...");
        const supabase = createClient(supabaseUrl, anonKey);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            log(`   ❌ Login falló: ${authError.message}`);
            return NextResponse.json({ success: false, logs, error: authError.message });
        }

        log(`   ✅ LOGIN EXITOSO!`);
        log(`   User ID: ${authData.user.id}`);

        return NextResponse.json({
            success: true,
            logs,
            user_id: authData.user.id,
            message: "Usuario recreado y login exitoso. Usa email: gsanchez@alfapack.cl password: 123456"
        });

    } catch (error: any) {
        log(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    }
}

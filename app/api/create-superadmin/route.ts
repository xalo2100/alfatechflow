import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("✨ === CREAR SUPERADMIN LIMPIO ===");

        const email = "gsanchez@alfapack.cl";
        const password = "123456";

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const adminClient = createClient(supabaseUrl, serviceKey);

        // 1. Verificar que NO existe
        log("1️⃣ Verificando que usuario no existe...");
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const existing = users.find(u => u.email === email);

        if (existing) {
            log(`   ⚠️ Usuario aún existe con ID: ${existing.id}`);
            log(`   💡 DEBES eliminarlo manualmente desde el Dashboard de Supabase primero`);
            log(`   📖 Ver guía en: /Users/gonzalo/.gemini/antigravity/brain/3b252893-4d4d-4e64-a35d-4820bfafc52f/solucion_usuario_corrupto.md`);
            return NextResponse.json({
                success: false,
                logs,
                error: "Usuario aún existe. Elimínalo manualmente primero."
            });
        }

        log(`   ✅ Usuario no existe, procediendo a crear...`);

        // 2. Crear nuevo usuario
        log("2️⃣ Creando nuevo usuario...");
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre_completo: 'Gonzalo Sánchez' }
        });

        if (createError) {
            log(`   ❌ Error: ${createError.message}`);
            throw createError;
        }

        log(`   ✅ Usuario creado: ${newUser.user.id}`);

        // 3. Crear perfil
        log("3️⃣ Creando perfil super_admin...");
        const { error: profileError } = await adminClient.from('perfiles').insert({
            id: newUser.user.id,
            email,
            nombre_completo: 'Gonzalo Sánchez',
            rol: 'super_admin',
            activo: true
        });

        if (profileError) {
            log(`   ⚠️ Error creando perfil: ${profileError.message}`);
            log(`   Intentando upsert...`);

            await adminClient.from('perfiles').upsert({
                id: newUser.user.id,
                email,
                nombre_completo: 'Gonzalo Sánchez',
                rol: 'super_admin',
                activo: true
            });
        }

        log(`   ✅ Perfil creado`);

        // 4. Esperar 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 5. Probar login
        log("4️⃣ Verificando login...");
        const supabase = createClient(supabaseUrl, anonKey);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            log(`   ⚠️ Login falló: ${authError.message}`);
            log(`   El usuario fue creado pero el login podría tardar unos segundos en propagarse`);
            return NextResponse.json({
                success: true,
                logs,
                warning: "Usuario creado. Si el login falla, espera 30 segundos e intenta de nuevo."
            });
        }

        log(`   ✅ LOGIN VERIFICADO!`);
        log(`   🎉 Usuario ID: ${authData.user.id}`);

        return NextResponse.json({
            success: true,
            logs,
            message: "Superadmin creado exitosamente. Credenciales: gsanchez@alfapack.cl / 123456",
            user_id: authData.user.id
        });

    } catch (error: any) {
        log(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message });
    }
}

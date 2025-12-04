import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("🔍 === DIAGNÓSTICO DE CONFIGURACIÓN DE AUTH ===");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        log(`1️⃣ URLs y Keys:`);
        log(`   URL: ${supabaseUrl}`);
        log(`   Anon Key (primeros 30): ${anonKey.substring(0, 30)}...`);
        log(`   Service Key (primeros 30): ${serviceKey.substring(0, 30)}...`);

        // Verificar que las keys son diferentes
        if (anonKey === serviceKey) {
            log(`   ❌ ERROR: Anon Key y Service Key son iguales!`);
        } else {
            log(`   ✅ Keys son diferentes`);
        }

        const adminClient = createClient(supabaseUrl, serviceKey);

        // Crear usuario de prueba simple
        log("2️⃣ Creando usuario de prueba temporal...");
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = "test123456";

        const { data: testUser, error: createError } = await adminClient.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });

        if (createError) {
            log(`   ❌ Error creando usuario de prueba: ${createError.message}`);
            return NextResponse.json({ success: false, logs, error: "No se pudo crear usuario de prueba" });
        }

        log(`   ✅ Usuario de prueba creado: ${testUser.user.id}`);

        // Esperar 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Intentar login inmediatamente
        log("3️⃣ Probando login con usuario recién creado...");
        const supabase = createClient(supabaseUrl, anonKey);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (authError) {
            log(`   ❌ Login falló incluso con usuario nuevo: ${authError.message}`);
            log(`   🔍 Esto indica un problema de configuración de Supabase Auth`);
            log(`   🔍 Posibles causas:`);
            log(`      1. Email confirmations requeridas (aunque usamos email_confirm: true)`);
            log(`      2. Rate limiting`);
            log(`      3. Proyecto pausado o con problemas`);
            log(`      4. Auth hooks o funciones edge bloqueando logins`);

            // Limpiar usuario de prueba
            await adminClient.auth.admin.deleteUser(testUser.user.id);

            return NextResponse.json({ success: false, logs, diagnosis: "Supabase Auth está bloqueando todos los logins" });
        }

        log(`   ✅ Login exitoso con usuario de prueba!`);
        log(`   🎉 Supabase Auth funciona correctamente`);
        log(`   🔍 El problema es específico del usuario gsanchez@alfapack.cl`);

        // Limpiar usuario de prueba
        await adminClient.auth.admin.deleteUser(testUser.user.id);
        log(`   ✅ Usuario de prueba eliminado`);

        // Ahora verificar gsanchez
        log("4️⃣ Verificando usuario gsanchez@alfapack.cl...");
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const gsanchez = users.find(u => u.email === "gsanchez@alfapack.cl");

        if (!gsanchez) {
            log(`   ❌ Usuario gsanchez no existe`);
        } else {
            log(`   ✅ Usuario encontrado:`);
            log(`      ID: ${gsanchez.id}`);
            log(`      Email: ${gsanchez.email}`);
            log(`      Email Confirmed At: ${gsanchez.email_confirmed_at}`);
            log(`      Confirmed At: ${gsanchez.confirmed_at}`);
            log(`      Last Sign In: ${gsanchez.last_sign_in_at}`);
            log(`      Banned: ${gsanchez.banned_until}`);
            log(`      Aud: ${gsanchez.aud}`);
            log(`      Recovery Sent At: ${gsanchez.recovery_sent_at}`);

            // Intentar actualizar contraseña
            log("5️⃣ Intentando actualizar contraseña...");
            const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(gsanchez.id, {
                password: "123456"
            });

            if (updateError) {
                log(`   ❌ Error actualizando: ${updateError.message}`);
                log(`   💡 Usuario en estado corrupto, necesita ser eliminado desde el dashboard de Supabase`);
            } else {
                log(`   ✅ Contraseña actualizada`);
            }
        }

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        log(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message });
    }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("🔍 === SIMULACIÓN EXACTA DEL FLUJO DE LOGIN ===");

        const identifier = "gsanchez@alfapack.cl";
        const password = "123456";

        // 1. Verificar variables de entorno
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        log(`1️⃣ Variables de entorno:`);
        log(`   URL: ${supabaseUrl}`);
        log(`   Anon Key: ${supabaseAnonKey?.substring(0, 20)}...`);
        log(`   Service Key: ${supabaseServiceKey?.substring(0, 20)}...`);

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Faltan variables de entorno");
        }

        // 2. Crear cliente con Anon Key (igual que el frontend)
        log(`2️⃣ Creando cliente con Anon Key...`);
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // 3. Intentar login (EXACTAMENTE como lo hace el endpoint)
        log(`3️⃣ Intentando signInWithPassword...`);
        log(`   Email: ${identifier}`);
        log(`   Password: ${password}`);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: identifier,
            password: password,
        });

        if (authError || !authData.user) {
            log(`❌ ERROR EN AUTENTICACIÓN:`);
            log(`   Mensaje: ${authError?.message}`);
            log(`   Status: ${authError?.status}`);
            log(`   Code: ${(authError as any)?.code}`);

            // Verificar si el usuario existe usando Service Role
            if (supabaseServiceKey) {
                log(`4️⃣ Verificando si usuario existe (Service Role)...`);
                const adminClient = createClient(supabaseUrl, supabaseServiceKey);
                const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

                if (listError) {
                    log(`   ❌ Error listando usuarios: ${listError.message}`);
                } else {
                    const user = users.find(u => u.email === identifier);
                    if (user) {
                        log(`   ✅ Usuario SÍ existe en auth.users:`);
                        log(`      ID: ${user.id}`);
                        log(`      Email: ${user.email}`);
                        log(`      Confirmed: ${user.confirmed_at}`);
                        log(`      Last Sign In: ${user.last_sign_in_at}`);
                        log(`      Created: ${user.created_at}`);
                        log(`   🔑 PROBLEMA: Usuario existe pero contraseña no coincide`);
                        log(`   💡 SOLUCIÓN: Forzar reset de contraseña...`);

                        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
                            password: password
                        });

                        if (updateError) {
                            log(`      ❌ Error actualizando contraseña: ${updateError.message}`);
                        } else {
                            log(`      ✅ Contraseña actualizada exitosamente`);
                            log(`   🔄 Reintentando login...`);

                            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                                email: identifier,
                                password: password,
                            });

                            if (retryError) {
                                log(`      ❌ Login falló nuevamente: ${retryError.message}`);
                            } else {
                                log(`      ✅ LOGIN EXITOSO después de actualizar contraseña!`);
                                return NextResponse.json({ success: true, logs, message: "Login exitoso después de actualizar contraseña" });
                            }
                        }
                    } else {
                        log(`   ❌ Usuario NO existe en auth.users`);
                        log(`   💡 SOLUCIÓN: Crear usuario...`);

                        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                            email: identifier,
                            password: password,
                            email_confirm: true,
                            user_metadata: { nombre_completo: 'Gonzalo Sánchez' }
                        });

                        if (createError) {
                            log(`      ❌ Error creando usuario: ${createError.message}`);
                        } else {
                            log(`      ✅ Usuario creado: ${newUser.user.id}`);
                            log(`   🔄 Reintentando login...`);

                            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                                email: identifier,
                                password: password,
                            });

                            if (retryError) {
                                log(`      ❌ Login falló después de crear: ${retryError.message}`);
                            } else {
                                log(`      ✅ LOGIN EXITOSO después de crear usuario!`);
                                return NextResponse.json({ success: true, logs, message: "Login exitoso después de crear usuario" });
                            }
                        }
                    }
                }
            }

            return NextResponse.json({ success: false, logs, error: authError?.message }, { status: 401 });
        }

        log(`✅ LOGIN EXITOSO!`);
        log(`   User ID: ${authData.user.id}`);
        log(`   Email: ${authData.user.email}`);
        log(`   Session: ${authData.session ? 'OK' : 'MISSING'}`);

        // 4. Verificar perfil
        log(`4️⃣ Verificando perfil...`);
        const supabaseWithSession = createClient(supabaseUrl, supabaseAnonKey);
        await supabaseWithSession.auth.setSession({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
        });

        const { data: perfil, error: perfilError } = await supabaseWithSession
            .from("perfiles")
            .select("rol, nombre_completo")
            .eq("id", authData.user.id)
            .maybeSingle();

        if (perfilError) {
            log(`   ❌ Error obteniendo perfil: ${perfilError.message}`);
        } else if (!perfil) {
            log(`   ⚠️ Perfil no existe`);
        } else {
            log(`   ✅ Perfil encontrado:`);
            log(`      Nombre: ${perfil.nombre_completo}`);
            log(`      Rol: ${perfil.rol}`);
        }

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        log(`❌ EXCEPCIÓN: ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    }
}

/**
 * Script para eliminar usuarios corruptos y recrearlos correctamente
 * Ejecutar con: node scripts/recrear-usuarios.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function recrearUsuarios() {
    console.log('\n🔄 === RECREANDO USUARIOS ===\n');

    try {
        // 1. LIMPIAR PERFILES PRIMERO (importante para evitar constraints)
        console.log('1️⃣ Limpiando tabla perfiles...');

        const { error: deletePerfilesError } = await supabase
            .from('perfiles')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

        if (deletePerfilesError) {
            console.log(`   ⚠️ Advertencia limpiando perfiles: ${deletePerfilesError.message}`);
        } else {
            console.log('   ✅ Tabla perfiles limpiada');
        }

        // 2. ELIMINAR USUARIOS EXISTENTES
        console.log('\n2️⃣ Eliminando usuarios de auth...');

        const { data: { users } } = await supabase.auth.admin.listUsers();
        console.log(`   Usuarios encontrados: ${users.length}`);

        for (const user of users) {
            console.log(`   🗑️  Eliminando: ${user.email} (${user.id})`);

            // Eliminar perfil primero
            await supabase.from('perfiles').delete().eq('id', user.id);

            // Eliminar usuario de auth
            await supabase.auth.admin.deleteUser(user.id);
        }

        console.log('   ✅ Todos los usuarios eliminados\n');

        // 3. CREAR SUPERADMIN
        console.log('3️⃣ Creando Superadmin...');

        const { data: superadmin, error: errorSuperadmin } = await supabase.auth.admin.createUser({
            email: 'gsanchez@alfapack.cl',
            password: '123456',
            email_confirm: true,
            user_metadata: {
                nombre_completo: 'Gonzalo Sánchez'
            }
        });

        if (errorSuperadmin) {
            throw new Error(`Error creando superadmin: ${errorSuperadmin.message}`);
        }

        console.log(`   ✅ Usuario creado: ${superadmin.user.id}`);

        // Crear perfil superadmin
        const { error: errorPerfilSuper } = await supabase.from('perfiles').insert({
            id: superadmin.user.id,
            email: 'gsanchez@alfapack.cl',
            nombre_completo: 'Gonzalo Sánchez',
            rol: 'super_admin',
            activo: true
        });

        if (errorPerfilSuper) {
            throw new Error(`Error creando perfil superadmin: ${errorPerfilSuper.message}`);
        }

        console.log('   ✅ Perfil super_admin creado\n');

        // 4. CREAR TÉCNICO
        console.log('4️⃣ Creando Técnico...');

        const { data: tecnico, error: errorTecnico } = await supabase.auth.admin.createUser({
            email: 'tecnico.80371039@alfatechflow.com',
            password: 'Alfa2024!',
            email_confirm: true,
            user_metadata: {
                nombre_completo: 'Técnico 80371039',
                run: '80371039'
            }
        });

        if (errorTecnico) {
            throw new Error(`Error creando técnico: ${errorTecnico.message}`);
        }

        console.log(`   ✅ Usuario creado: ${tecnico.user.id}`);

        // Crear perfil técnico CON EMAIL y RUN
        const { error: errorPerfilTecnico } = await supabase.from('perfiles').insert({
            id: tecnico.user.id,
            email: 'tecnico.80371039@alfatechflow.com',
            nombre_completo: 'Técnico 80371039',
            rol: 'tecnico',
            run: '80371039',
            activo: true
        });

        if (errorPerfilTecnico) {
            throw new Error(`Error creando perfil técnico: ${errorPerfilTecnico.message}`);
        }

        console.log('   ✅ Perfil técnico creado con RUN y email\n');

        // 5. VERIFICAR
        console.log('5️⃣ Verificando usuarios creados...\n');

        const { data: perfiles } = await supabase.from('perfiles').select('*');

        console.log('📋 USUARIOS CREADOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const perfil of perfiles) {
            console.log(`\n👤 ${perfil.nombre_completo}`);
            console.log(`   Email: ${perfil.email}`);
            if (perfil.run) console.log(`   RUN: ${perfil.run}`);
            console.log(`   Rol: ${perfil.rol}`);
            console.log(`   Activo: ${perfil.activo ? '✅' : '❌'}`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ CREDENCIALES PARA INICIAR SESIÓN:\n');
        console.log('🔐 SUPERADMIN:');
        console.log('   Email: gsanchez@alfapack.cl');
        console.log('   Password: 123456\n');
        console.log('🔧 TÉCNICO:');
        console.log('   Email: tecnico.80371039@alfatechflow.com');
        console.log('   RUN: 80371039');
        console.log('   Password: Alfa2024!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

recrearUsuarios();

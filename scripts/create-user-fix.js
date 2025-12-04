
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno (SUPABASE_URL o SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTechUser() {
    const email = 'tecnico.80371039@alfatechflow.com';
    const password = 'Alfa2024!';
    const run = '80371039';
    const nombre = 'Técnico 80371039';

    console.log(`🔨 Intentando crear/verificar usuario: ${email}`);

    // 1. Verificar si existe en auth.users
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();

    if (searchError) {
        console.error('❌ Error buscando usuarios:', searchError);
        return;
    }

    let user = users.find(u => u.email === email);
    let userId;

    if (user) {
        console.log(`✅ Usuario auth ya existe (ID: ${user.id})`);
        userId = user.id;
    } else {
        console.log('👤 Creando usuario en auth...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre_completo: nombre, run }
        });

        if (createError) {
            console.error('❌ Error creando usuario auth:', createError);
            return;
        }

        user = newUser.user;
        userId = user.id;
        console.log(`✅ Usuario auth creado exitosamente (ID: ${userId})`);
    }

    // 2. Verificar/Crear perfil
    console.log('👤 Verificando perfil...');
    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (perfil) {
        console.log('✅ Perfil ya existe. Actualizando datos...');
        const { error: updateError } = await supabase
            .from('perfiles')
            .update({
                run,
                rol: 'tecnico',
                nombre_completo: nombre,
                activo: true
            })
            .eq('id', userId);

        if (updateError) console.error('❌ Error actualizando perfil:', updateError);
        else console.log('✅ Perfil actualizado');
    } else {
        console.log('👤 Creando perfil...');
        const { error: insertError } = await supabase
            .from('perfiles')
            .insert({
                id: userId,
                email,
                nombre_completo: nombre,
                rol: 'tecnico',
                run,
                activo: true
            });

        if (insertError) console.error('❌ Error creando perfil:', insertError);
        else console.log('✅ Perfil creado exitosamente');
    }
}

createTechUser();


const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
    console.log('🔍 Buscando usuarios que contengan "gsanchez"...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error listando usuarios:', error);
        return;
    }

    const matches = users.filter(u => u.email && u.email.includes('gsanchez'));

    if (matches.length === 0) {
        console.log('❌ No se encontraron usuarios con "gsanchez"');
        console.log('📋 Listando todos los usuarios para verificar:');
        users.forEach(u => console.log(` - ${u.email} (${u.id})`));
    } else {
        console.log('✅ Usuarios encontrados:');
        matches.forEach(u => console.log(` - ${u.email} (${u.id})`));
    }
}

findUser();

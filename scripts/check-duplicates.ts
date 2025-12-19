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

async function checkDuplicateUsers() {
    console.log("🔍 Consultando usuarios en la base de datos...\n");

    // Obtener todos los perfiles
    const { data: perfiles, error } = await adminClient
        .from("perfiles")
        .select(`
            id, email, nombre_completo, rol, run, created_at,
            tickets_creados:tickets!tickets_creado_por_fkey(count),
            tickets_asignados:tickets!tickets_asignado_a_fkey(count),
            reportes:reportes!reportes_tecnico_id_fkey(count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    console.log(`📊 Total de usuarios: ${perfiles?.length}\n`);

    // Agrupar por email
    const emailGroups = new Map<string, any[]>();

    perfiles?.forEach(perfil => {
        const email = perfil.email || "sin-email";
        if (!emailGroups.has(email)) {
            emailGroups.set(email, []);
        }
        emailGroups.get(email)?.push(perfil);
    });

    // Mostrar duplicados
    console.log("🔴 USUARIOS DUPLICADOS:\n");
    emailGroups.forEach((usuarios, email) => {
        if (usuarios.length > 1) {
            console.log(`\n📧 Email: ${email} (${usuarios.length} duplicados)`);
            usuarios.forEach((u, i) => {
                console.log(`  ${i + 1}. ID: ${u.id}`);
                console.log(`     Nombre: ${u.nombre_completo}`);
                console.log(`     Rol: ${u.rol}`);
                console.log(`     RUN: ${u.run || "N/A"}`);
                console.log(`     Creado: ${new Date(u.created_at).toLocaleString()}`);
            });
        }
    });

    // Mostrar todos los usuarios
    console.log("\n\n📋 TODOS LOS USUARIOS:\n");
    perfiles?.forEach((p, i) => {
        console.log(`${i + 1}. ${p.nombre_completo} (${p.email})`);
        console.log(`   Rol: ${p.rol} | ID: ${p.id.substring(0, 8)}...`);
        console.log(`   Creado: ${new Date(p.created_at).toLocaleString()}\n`);
    });

    // Buscar específicamente gsanchez@alfapack.cl
    const gsanchezUsers = perfiles?.filter(p => p.email === "gsanchez@alfapack.cl");
    console.log(`\n\n🎯 Usuarios con email gsanchez@alfapack.cl: ${gsanchezUsers?.length}`);
    gsanchezUsers?.forEach((u, i) => {
        console.log(`\n${i + 1}. ${u.nombre_completo}`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Rol: ${u.rol}`);
        console.log(`   RUN: ${u.run || "N/A"}`);
        console.log(`   Creado: ${new Date(u.created_at).toLocaleString()}`);
        console.log(`   📊 Actividad:`);
        console.log(`      - Tickets Creados: ${(u.tickets_creados as any)?.[0]?.count || 0}`);
        console.log(`      - Tickets Asignados: ${(u.tickets_asignados as any)?.[0]?.count || 0}`);
        console.log(`      - Reportes: ${(u.reportes as any)?.[0]?.count || 0}`);
    });
}

checkDuplicateUsers().then(() => {
    console.log("\n✅ Consulta completada");
    process.exit(0);
}).catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
});

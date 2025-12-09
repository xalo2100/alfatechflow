
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error("Could not read .env.local", e.message);
    // Fallback to example if local not found (unlikely)
    try {
        envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local.example'), 'utf-8');
        console.log("Using .env.local.example instead");
    } catch (e2) {
        console.error("Could not read .env.local.example", e2.message);
        process.exit(1);
    }
}

const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars in file');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email: string) {
    console.log(`Checking user: ${email}...`);
    console.log(`URL: ${supabaseUrl}`);

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const user = data.users.find(u => u.email === email);

    if (user) {
        console.log("✅ User found:");
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`- Last Sign In: ${user.last_sign_in_at}`);
        console.log(`- App Metadata:`, user.app_metadata);

        // Check public.perfiles
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error("❌ Error fetching profile:", profileError);
        } else if (profile) {
            console.log("✅ Profile found in public.perfiles:");
            console.log(`- Role: ${profile.rol}`);
            console.log(`- Name: ${profile.nombre_completo}`);
        } else {
            console.error("❌ Profile NOT found in public.perfiles (This is likely the issue!)");
        }

        // Reset password
        console.log("🔄 Resetting password to '123456'...");
        const { error: resetError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: '123456' }
        );

        if (resetError) {
            console.error("❌ Error resetting password:", resetError);
        } else {
            console.log("✅ Password successfully reset to '123456'");
        }

    } else {
        console.error("❌ User NOT found in this database.");
        // List some users to see if we are in the right DB
        console.log(`Total users in DB: ${data.users.length}`);
        if (data.users.length > 0) {
            console.log("First 3 users:");
            data.users.slice(0, 3).forEach(u => console.log(`- ${u.email}`));
        }
    }
}

checkUser('gsanchez@alfapack.cl');

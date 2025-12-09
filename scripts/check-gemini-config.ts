
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch (e) { }

const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing env vars'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
    console.log("Checking 'configuraciones' table...");

    const { data, error } = await supabase
        .from('configuraciones')
        .select('*')
        .eq('clave', 'gemini_api_key');

    if (error) {
        console.error("❌ Error fetching config:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ Config row FOUND:");
        data.forEach(row => {
            console.log(`- Key: ${row.clave}`);
            console.log(`- Encrypted Value Length: ${row.valor_encriptado ? row.valor_encriptado.length : 0}`);
            console.log(`- Created By: ${row.creado_por}`);
            console.log(`- Updated At: ${row.updated_at}`);
        });
    } else {
        console.error("❌ Config row NOT found. The save operation is failing silently or RLS is blocking inserts.");
    }
}

checkConfig();

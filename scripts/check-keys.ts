
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch (e) { console.error("No .env.local found"); process.exit(1); }

const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
});

const anon = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const service = envVars.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("--- Integrity Check ---");
console.log(`Anon Key Length: ${anon.length}`);
console.log(`Service Key Length: ${service.length}`);

if (anon === service) {
    console.error("❌ CRITICAL: SERVICE_ROLE_KEY is identical to ANON_KEY. This is wrong.");
} else {
    console.log("✅ Keys are different.");
}

if (service.startsWith("ey")) {
    console.log("✅ Service key format looks like a JWT.");
    console.log(`🔑 Service Key starts with: ${service.substring(0, 10)}... (Check this matches Vercel)`);
} else {
    console.error("❌ Service key does not look like a JWT.");
}

if (envVars.GEMINI_API_KEY) {
    console.log(`⚠️ Local GEMINI_API_KEY present: ${envVars.GEMINI_API_KEY.substring(0, 5)}... (Should be removed locally if testing DB only)`);
}

import { AIRequest, AIResponse, AIProviderImplementation, AIProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { LocalVPSProvider } from "./providers/local-vps";
import { createAdminClient } from "@/lib/supabase/admin";

const providers: Record<string, AIProviderImplementation> = {
    gemini: new GeminiProvider(),
    local: new LocalVPSProvider(),
};

/**
 * Obtiene la configuración de IA desde la base de datos
 */
async function getAIConfig() {
    try {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("configuraciones")
            .select("clave, valor")
            .in("clave", ["local_ai_url", "preferred_ai_provider"]);

        const config: Record<string, string> = {};
        data?.forEach(item => {
            config[item.clave] = item.valor || "";
        });

        return {
            localAiUrl: config.local_ai_url || process.env.LOCAL_AI_URL || "http://184.174.36.189:3000/v1/chat",
            preferredProvider: (config.preferred_ai_provider as AIProvider) || "local"
        };
    } catch (error) {
        console.error("[AI CONFIG] Error fetching config from DB:", error);
        return {
            localAiUrl: process.env.LOCAL_AI_URL || "http://184.174.36.189:3000/v1/chat",
            preferredProvider: "local" as AIProvider
        };
    }
}

/**
 * Resolver de modelo dinámico (Routing)
 */
export async function resolverModelo(tarea: string) {
    const config = await getAIConfig();

    if (tarea === 'informeTecnico') {
        return {
            provider: config.preferredProvider,
            model: config.preferredProvider === 'local' ? 'phi3' : 'gemini-2.0-flash'
        };
    }

    // Default: Usar el preferido
    return {
        provider: config.preferredProvider,
        model: config.preferredProvider === 'local' ? 'phi3' : 'gemini-2.0-flash'
    };
}

/**
 * Función central para llamadas a IA con Fallback y Configuración Dinámica
 */
export async function callAI(req: AIRequest): Promise<AIResponse> {
    const config = await getAIConfig();

    // Si el request no especifica proveedor, usar el preferido de la DB
    const providerKey = req.provider || config.preferredProvider;
    const provider = providers[providerKey];

    if (!provider) {
        throw new Error(`Provider ${providerKey} not supported`);
    }

    // Si es local, inyectar la URL configurada en el proceso (hack temporal o pasar por req)
    if (providerKey === 'local') {
        process.env.DYNAMIC_LOCAL_AI_URL = config.localAiUrl;
    }

    console.log(`[AI CORE] Routing request to: ${providerKey}${req.model ? ` (${req.model})` : ''}`);

    try {
        return await provider.call({
            ...req,
            provider: providerKey
        });
    } catch (error) {
        console.error(`[AI ERROR] Failed to call ${providerKey}:`, error);

        // Fallback inteligente: Si el preferido falló, intentar con el otro
        const fallbackProvider = providerKey === 'local' ? 'gemini' : 'local';
        console.log(`[AI CORE] Attempting fallback to ${fallbackProvider}...`);

        try {
            return await providers[fallbackProvider].call({
                ...req,
                provider: fallbackProvider,
                model: fallbackProvider === 'gemini' ? 'gemini-2.0-flash' : 'phi3'
            });
        } catch (fallbackError) {
            console.error(`[AI ERROR] Fallback also failed:`, fallbackError);
            throw error; // Lanzar el error original
        }
    }
}

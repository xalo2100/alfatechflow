import { AIRequest, AIResponse, AIProviderImplementation } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";
import { ZaiProvider } from "./providers/zai";
import { LocalVPSProvider } from "./providers/local-vps";

const providers: Record<string, AIProviderImplementation> = {
    gemini: new GeminiProvider(),
    xiaomi: new OpenRouterProvider(),
    qwen: new OpenRouterProvider(),
    zai: new ZaiProvider(),
    local: new LocalVPSProvider(),
};

/**
 * Resolver de modelo dinámico (Routing)
 */
export function resolverModelo(tarea: string) {
    // Si la tarea es un informe técnico, el usuario prefiere su VPS local por defecto
    if (tarea === 'informeTecnico') {
        return {
            provider: ('local' as const),
            model: 'phi3'
        };
    }

    // Default: Gemini (más estable)
    return {
        provider: ('gemini' as const),
        model: 'gemini-2.0-flash'
    };
}

/**
 * Función central para llamadas a IA
 */
export async function callAI(req: AIRequest): Promise<AIResponse> {
    const providerKey = req.provider || 'gemini';
    const provider = providers[providerKey];

    if (!provider) {
        throw new Error(`Provider ${req.provider} not supported`);
    }

    console.log(`[AI CORE] Routing request to: ${req.provider}${req.model ? ` (${req.model})` : ''}`);

    try {
        return await provider.call(req);
    } catch (error) {
        console.error(`[AI ERROR] Failed to call ${req.provider}:`, error);

        // Fallback inteligente: Si falla cualquier otro, ir a Gemini
        if (req.provider !== 'gemini') {
            console.log(`[AI CORE] Attempting fallback to Gemini...`);
            return await providers.gemini.call({
                ...req,
                provider: 'gemini',
                model: 'gemini-2.0-flash'
            });
        }

        throw error;
    }
}

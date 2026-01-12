import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabaseAdmin = await createAdminClient();

        // 1. Obtener la URL de configuración
        const { data: config } = await supabaseAdmin
            .from("configuraciones")
            .select("valor")
            .eq("clave", "local_ai_url")
            .single();

        const url = config?.valor || process.env.LOCAL_AI_URL || "http://184.174.36.189:3000/v1/chat";

        console.log(`[TEST LOCAL AI] Verificando conexión con: ${url}`);

        // 2. Intentar una petición mínima (un ping o lista de modelos)
        // Como es usualmente un servidor tipo OpenAI/Ollama, intentamos /v1/models o similar
        // Si no, simplemente un fetch al endpoint principal con un timeout corto

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

        try {
            // Intentamos obtener modelos si existe /v1/models
            const baseUrl = url.replace(/\/v1\/chat$/, "");
            const testUrl = `${baseUrl}/v1/models`;

            const response = await fetch(testUrl, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({
                    success: true,
                    connected: true,
                    url: url,
                    details: {
                        models: data.data?.map((m: any) => m.id) || ["phi3"]
                    }
                });
            } else {
                // Si /v1/models falla, probamos el endpoint principal
                const mainRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }], max_tokens: 1 }),
                    signal: controller.signal
                });

                if (mainRes.ok) {
                    return NextResponse.json({
                        success: true,
                        connected: true,
                        url: url,
                        details: {
                            message: "Endpoint responde correctamente a peticiones"
                        }
                    });
                }

                throw new Error(`Servidor respondió con status: ${mainRes.status}`);
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error("[TEST LOCAL AI] Error en fetch:", fetchError.message);
            return NextResponse.json({
                success: false,
                connected: false,
                error: fetchError.message || "No se pudo conectar al servidor VPS"
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Error en test-local-ai:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}

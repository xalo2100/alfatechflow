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
            // Prueba exacta con el modelo y mensaje solicitado por el usuario
            console.log(`[TEST LOCAL AI] Enviando mensaje de prueba a ${url}`);

            let targetUrl = url;
            let mainRes = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "gemma2:2b",
                    messages: [
                        { role: "user", content: "Hola, respóndeme solo: OK" }
                    ]
                }),
                signal: controller.signal
            });

            // Si falla con 404, intentamos añadir /completions (común en APIs compatibles con OpenAI)
            if (mainRes.status === 404 && !url.endsWith('/completions')) {
                const altUrl = url.endsWith('/') ? `${url}completions` : `${url}/completions`;
                console.log(`[TEST LOCAL AI] 404 detectado, reintentando con: ${altUrl}`);
                targetUrl = altUrl;
                mainRes = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "gemma2:2b",
                        messages: [
                            { role: "user", content: "Hola, respóndeme solo: OK" }
                        ]
                    }),
                    signal: controller.signal
                });
            }

            clearTimeout(timeoutId);

            if (mainRes.ok) {
                const resultData = await mainRes.json();

                if (resultData.choices?.[0]?.message?.content) {
                    return NextResponse.json({
                        success: true,
                        connected: true,
                        url: targetUrl,
                        details: {
                            model: "gemma2:2b",
                            response: resultData.choices[0].message.content,
                            message: `Servidor responde correctamente${targetUrl !== url ? ' (usando /completions)' : ''}.`
                        }
                    });
                }

                throw new Error("El servidor respondió pero el formato JSON no es el esperado (choices[0].message.content)");
            }

            throw new Error(`Servidor respondió con status: ${mainRes.status} en la URL: ${targetUrl}`);
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

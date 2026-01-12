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

        // 2. Definir candidatos de URL para probar
        const baseIpPort = url.replace(/^(https?:\/\/[^\/]+).*$/, "$1"); // Extraer http://IP:PORT

        const candidates = [
            url, // 1. URL exacta configurada
            url.endsWith("/v1/chat") ? url : (url.endsWith("/") ? `${url}v1/chat` : `${url}/v1/chat`), // 2. Garantizar /v1/chat
            url.endsWith("/") ? `${url}completions` : `${url}/completions`, // 3. /completions
            url.endsWith("/") ? `${url}chat/completions` : `${url}/chat/completions`, // 4. /chat/completions
            `${baseIpPort}/v1/chat`, // 5. Forzar V1 chat
            `${baseIpPort}/v1/chat/completions`, // 6. Estándar V1
            `${baseIpPort}/chat/completions`, // 7. Variante sin v1
            baseIpPort, // 8. Solo base
        ];

        // Eliminar duplicados y nulos
        const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

        console.log(`[TEST LOCAL AI] Iniciando descubrimiento en ${uniqueCandidates.length} rutas...`);

        let lastError = "";
        let successfulUrl = "";
        let responseData: any = null;

        for (const targetUrl of uniqueCandidates) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s por intento

            try {
                console.log(`[TEST LOCAL AI] Probando: ${targetUrl}`);
                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "gemma2:2b",
                        messages: [{ role: "user", content: "Hola, responde: OK" }],
                        max_tokens: 5
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    // Relajamos la condición: basta con que exista choices[0].message
                    if (data.choices?.[0]?.message) {
                        const content = data.choices[0].message.content;
                        console.log(`[TEST LOCAL AI] ¡ÉXITO en ${targetUrl}! (Content: "${content}")`);
                        successfulUrl = targetUrl;
                        responseData = data;
                        break; // Encontramos uno que funciona
                    }
                } else {
                    console.log(`[TEST LOCAL AI] Falló ${targetUrl} con status ${res.status}`);
                    lastError = `Status ${res.status} en ${targetUrl}`;
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.log(`[TEST LOCAL AI] Error en ${targetUrl}: ${err.message}`);
                lastError = err.message;
            }
        }

        if (successfulUrl) {
            return NextResponse.json({
                success: true,
                connected: true,
                url: successfulUrl,
                details: {
                    model: "gemma2:2b",
                    response: responseData.choices[0].message.content || "(Respuesta vacía)",
                    message: successfulUrl === url
                        ? "Conexión exitosa con la URL configurada."
                        : `Conectado exitosamente usando ruta alternativa: ${successfulUrl}. Sugerencia: Actualiza la configuración.`
                }
            });
        }

        return NextResponse.json({
            success: false,
            connected: false,
            error: `No se encontró ninguna ruta válida. Último error: ${lastError}`,
            attempted: uniqueCandidates
        }, { status: 500 });

    } catch (error: any) {
        console.error("Error crítico en test-local-ai:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}

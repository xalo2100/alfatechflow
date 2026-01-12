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
            url.endsWith("/") ? `${url}completions` : `${url}/completions`, // 2. /completions
            url.endsWith("/") ? `${url}chat/completions` : `${url}/chat/completions`, // 3. /chat/completions
            `${baseIpPort}/v1/chat/completions`, // 4. Estándar V1
            `${baseIpPort}/v1/chat`, // 5. Otra variante V1
            `${baseIpPort}/chat/completions`, // 6. Variante sin v1
            baseIpPort, // 7. Solo base
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
                    if (data.choices?.[0]?.message?.content) {
                        console.log(`[TEST LOCAL AI] ¡ÉXITO en ${targetUrl}!`);
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
                    response: responseData.choices[0].message.content,
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

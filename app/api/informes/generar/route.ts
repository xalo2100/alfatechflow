import { NextRequest, NextResponse } from "next/server";
import { callAI, resolverModelo } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { notaTecnico, equipo, cliente } = await req.json();

        if (!notaTecnico) {
            return NextResponse.json({ error: "Faltan las notas del técnico" }, { status: 400 });
        }

        // Usar el router para elegir el mejor modelo para esta tarea
        const config = resolverModelo('informeTecnico');

        const prompt = `
Eres un editor técnico de informes de servicio al cliente de alto nivel.
TU TAREA: Reescribe la nota del técnico en un informe profesional, claro y empático en español.

REGLAS:
- Corrige ortografía y gramática.
- No inventes piezas o fallas que no estén en la nota.
- El tono debe ser formal y profesional.
- Determina el estado final del equipo basado estrictamente en la nota: "Operativo" o "Requiere repuesto".

FORMATO DE SALIDA OBLIGATORIO (JSON):
{
  "informe": "...texto profesional...",
  "estado": "Operativo" | "Requiere repuesto"
}

DATOS:
Cliente: ${cliente || 'N/A'}
Equipo: ${equipo || 'Envasadora'}
Nota del Técnico: "${notaTecnico}"

Devuelve SOLAMENTE el objeto JSON.
    `;

        const aiRes = await callAI({
            provider: config.provider,
            model: config.model,
            messages: [
                { role: 'system', content: 'Eres un experto en reportes técnicos industriales.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3, // Menos creativo para informes técnicos
            jsonMode: true
        });

        try {
            // Intentar parsear el JSON de la respuesta de la IA
            const text = aiRes.content;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return NextResponse.json(result);
            }

            // Fallback si no viene en JSON
            return NextResponse.json({
                informe: text,
                estado: text.toLowerCase().includes("repuesto") ? "Requiere repuesto" : "Operativo"
            });

        } catch (parseError) {
            console.error("[REPORT API] Error parsing AI JSON:", parseError);
            return NextResponse.json({
                informe: aiRes.content,
                estado: "Operativo" // Fallback seguro
            });
        }

    } catch (error: any) {
        console.error("[REPORT API ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

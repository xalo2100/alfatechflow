import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { localAiUrl, preferredProvider } = await request.json();

        if (preferredProvider && !['local', 'gemini'].includes(preferredProvider)) {
            return NextResponse.json(
                { error: "Proveedor no válido" },
                { status: 400 }
            );
        }

        const supabaseAdmin = await createAdminClient();

        const updates = [];

        if (localAiUrl !== undefined) {
            updates.push({
                clave: "local_ai_url",
                valor: localAiUrl,
                descripcion: "URL del servidor de IA local (VPS)"
            });
        }

        if (preferredProvider !== undefined) {
            updates.push({
                clave: "preferred_ai_provider",
                valor: preferredProvider,
                descripcion: "Proveedor de IA preferido (local o gemini)"
            });
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: true, message: "Nada que actualizar" });
        }

        const { error: upsertError } = await supabaseAdmin
            .from("configuraciones")
            .upsert(updates, { onConflict: "clave" });

        if (upsertError) {
            console.error("Error guardando configuración de IA:", upsertError);
            return NextResponse.json(
                { error: "Error al guardar en base de datos: " + upsertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error en save-ai-config:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}

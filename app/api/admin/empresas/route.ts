import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: empresas, error } = await supabase
            .from("empresas")
            .select("*")
            .order("es_principal", { ascending: false })
            .order("nombre", { ascending: true });

        if (error) {
            console.error("Error fetching empresas:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(empresas);
    } catch (error) {
        console.error("Error in GET /api/admin/empresas:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role (optional, but good practice if RLS isn't enough or for early return)
        // RLS policies should handle the actual permission check

        const body = await request.json();
        const { nombre, rut, direccion, telefono, email, web, logo_url, es_principal } = body;

        if (!nombre) {
            return NextResponse.json({ error: "Nombre is required" }, { status: 400 });
        }

        // If setting as principal, unset others
        if (es_principal) {
            const adminClient = await createAdminClient();
            await adminClient
                .from("empresas")
                .update({ es_principal: false })
                .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all
        }

        const { data, error } = await supabase
            .from("empresas")
            .insert([
                { nombre, rut, direccion, telefono, email, web, logo_url, es_principal }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating empresa:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/admin/empresas:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

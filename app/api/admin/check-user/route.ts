
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = await createAdminClient();
        const email = 'gsanchez@alfapack.cl';

        console.log(`🔍 Inspeccionando usuario: ${email}`);

        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const user = users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            confirmed_at: user.confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
            created_at: user.created_at,
            updated_at: user.updated_at
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

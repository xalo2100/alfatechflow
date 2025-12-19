import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const ticketId = parseInt(params.id);

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { error: 'ID de ticket inválido' },
                { status: 400 }
            );
        }

        // Verificar autenticación y rol de superadmin
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Verificar que el usuario es superadmin
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (perfilError || !perfil) {
            return NextResponse.json(
                { error: 'No se pudo verificar el perfil del usuario' },
                { status: 403 }
            );
        }

        if (perfil.rol !== 'super_admin') {
            return NextResponse.json(
                { error: 'Solo los superadministradores pueden eliminar tickets' },
                { status: 403 }
            );
        }

        // Usar admin client para operaciones de eliminación (bypassing RLS)
        const adminClient = await createAdminClient();

        // Eliminar el ticket directamente
        // La base de datos tiene ON DELETE CASCADE, así que los reportes se borrarán automáticamente
        const { error: deleteError, count } = await adminClient
            .from('tickets')
            .delete({ count: 'exact' })
            .eq('id', ticketId);

        if (deleteError) {
            console.error('Error eliminando ticket:', deleteError);
            return NextResponse.json(
                {
                    error: 'Error al eliminar el ticket',
                    details: deleteError.message,
                    code: deleteError.code
                },
                { status: 500 }
            );
        }

        if (count === 0) {
            return NextResponse.json({
                success: false,
                message: 'El ticket no existe o ya fue eliminado',
                deletedTicketId: ticketId,
                deletedCount: 0
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket eliminado exitosamente',
            deletedTicketId: ticketId,
            deletedCount: count
        });

    } catch (error: any) {
        console.error('Error en DELETE /api/admin/tickets/[id]:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

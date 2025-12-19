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

        // Usar admin client para operaciones de eliminación
        const adminClient = await createAdminClient();

        // Obtener información del ticket antes de eliminar
        const { data: ticket, error: ticketError } = await adminClient
            .from('tickets')
            .select(`
        id,
        estado,
        tecnico_asignado_id,
        reportes (id)
      `)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return NextResponse.json(
                { error: 'Ticket no encontrado' },
                { status: 404 }
            );
        }

        // Eliminar reportes asociados primero (si existen)
        if (ticket.reportes && Array.isArray(ticket.reportes) && ticket.reportes.length > 0) {
            const { error: reportesError } = await adminClient
                .from('reportes')
                .delete()
                .eq('ticket_id', ticketId);

            if (reportesError) {
                console.error('Error eliminando reportes:', reportesError);
                return NextResponse.json(
                    { error: 'Error al eliminar reportes asociados: ' + reportesError.message },
                    { status: 500 }
                );
            }
        }

        // Eliminar el ticket
        const { error: deleteError, count } = await adminClient
            .from('tickets')
            .delete({ count: 'exact' })
            .eq('id', ticketId);

        if (deleteError) {
            console.error('Error eliminando ticket:', deleteError);
            return NextResponse.json(
                { error: 'Error al eliminar el ticket: ' + deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket eliminado exitosamente',
            deletedTicketId: ticketId,
            deletedReports: ticket.reportes?.length || 0,
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

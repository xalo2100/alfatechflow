"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotifications } from '@/lib/hooks/use-notifications';
import type { Database } from '@/types/supabase';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type Reporte = Database['public']['Tables']['reportes']['Row'];

interface RealtimeNotificationsProps {
    userId: string;
    userRole: string;
}

export function useRealtimeNotifications({ userId, userRole }: RealtimeNotificationsProps) {
    const { notify } = useNotifications();
    const supabase = createClient();

    useEffect(() => {
        // Suscribirse a cambios en tickets
        const ticketsChannel = supabase
            .channel('tickets-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tickets',
                    filter: userRole === 'tecnico' ? `tecnico_id=eq.${userId}` : undefined,
                },
                (payload) => {
                    const newTicket = payload.new as Ticket;

                    if (userRole === 'tecnico' && newTicket.tecnico_id === userId) {
                        notify({
                            title: '🎫 Nuevo Ticket Asignado',
                            body: `Ticket #${newTicket.id} - ${newTicket.cliente_nombre}`,
                            sound: 'new-ticket',
                        });
                    } else if (userRole === 'ventas' || userRole === 'admin') {
                        notify({
                            title: '🎫 Nuevo Ticket Creado',
                            body: `Ticket #${newTicket.id} - ${newTicket.cliente_nombre}`,
                            sound: 'new-ticket',
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tickets',
                },
                (payload) => {
                    const oldTicket = payload.old as Ticket;
                    const newTicket = payload.new as Ticket;

                    // Notificar cambios de estado
                    if (oldTicket.estado !== newTicket.estado) {
                        const estadoLabels: Record<string, string> = {
                            abierto: 'Abierto',
                            asignado: 'Asignado',
                            en_proceso: 'En Proceso',
                            espera_repuesto: 'Espera Repuesto',
                            finalizado: 'Finalizado',
                            entregado: 'Entregado',
                        };

                        // Notificar a ventas/admin cuando un ticket se finaliza
                        if (newTicket.estado === 'finalizado' && (userRole === 'ventas' || userRole === 'admin')) {
                            notify({
                                title: '✅ Ticket Finalizado',
                                body: `Ticket #${newTicket.id} ha sido finalizado`,
                                sound: 'success',
                            });
                        }

                        // Notificar a técnico cuando su ticket cambia de estado
                        if (userRole === 'tecnico' && newTicket.tecnico_id === userId) {
                            notify({
                                title: '🔄 Cambio de Estado',
                                body: `Ticket #${newTicket.id}: ${estadoLabels[oldTicket.estado]} → ${estadoLabels[newTicket.estado]}`,
                                sound: 'status-change',
                            });
                        }
                    }
                }
            )
            .subscribe();

        // Suscribirse a nuevos reportes
        const reportesChannel = supabase
            .channel('reportes-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reportes',
                },
                (payload) => {
                    const newReporte = payload.new as Reporte;

                    if (userRole === 'ventas' || userRole === 'admin') {
                        notify({
                            title: '📄 Nuevo Reporte Generado',
                            body: `Reporte para Ticket #${newReporte.ticket_id}`,
                            sound: 'success',
                        });
                    }
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            supabase.removeChannel(ticketsChannel);
            supabase.removeChannel(reportesChannel);
        };
    }, [userId, userRole, notify, supabase]);
}

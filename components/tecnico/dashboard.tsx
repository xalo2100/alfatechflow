"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { TicketList } from "@/components/tecnico/ticket-list";
import { TicketDetail } from "@/components/tecnico/ticket-detail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketViewToggle } from "@/components/ventas/ticket-view-toggle";
import { TicketListView } from "@/components/ventas/ticket-list-view";
import { TecnicosActivos } from "@/components/tecnico/tecnicos-activos";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

export function TecnicoDashboard({ perfil }: { perfil: any }) {
  const [ticketsAbiertos, setTicketsAbiertos] = useState<Ticket[]>([]);
  const [misTickets, setMisTickets] = useState<Ticket[]>([]);
  const [ticketsFinalizados, setTicketsFinalizados] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const supabase = createClient();

  const fetchTickets = async () => {
    // Tickets abiertos (sin asignar)
    const { data: abiertos } = await supabase
      .from("tickets")
      .select(`
        *,
        tecnico:perfiles!tickets_asignado_a_fkey(nombre_completo, id)
      `)
      .eq("estado", "abierto")
      .order("created_at", { ascending: false });

    // Mis tickets (asignados a mí) - estados activos
    const { data: asignados } = await supabase
      .from("tickets")
      .select(`
        *,
        tecnico:perfiles!tickets_asignado_a_fkey(nombre_completo, id)
      `)
      .eq("asignado_a", perfil.id)
      .in("estado", ["asignado", "en_proceso", "espera_repuesto"])
      .order("created_at", { ascending: false });

    // Mis tickets finalizados (con reportes)
    const { data: finalizados } = await supabase
      .from("tickets")
      .select(`
        *,
        reportes:reportes(id, created_at),
        tecnico:perfiles!tickets_asignado_a_fkey(nombre_completo, id)
      `)
      .eq("asignado_a", perfil.id)
      .in("estado", ["finalizado", "entregado"])
      .order("created_at", { ascending: false });

    setTicketsAbiertos(abiertos || []);
    setMisTickets(asignados || []);
    setTicketsFinalizados((finalizados || []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel("tecnico-tickets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, perfil.id]);

  const handleAsignarTicket = async (ticketId: number) => {
    const { error } = await supabase
      .from("tickets")
      .update({
        asignado_a: perfil.id,
        estado: "asignado",
      })
      .eq("id", ticketId);

    if (!error) {
      fetchTickets();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar rol="tecnico" nombre={perfil.nombre_completo} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Taller Técnico</h2>
          {!selectedTicket && (
            <TicketViewToggle 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
            />
          )}
        </div>

        {selectedTicket ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                📋 Trabajando en Ticket #{selectedTicket.id}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Cliente: {selectedTicket.cliente_nombre}
              </p>
            </div>
            <TicketDetail
              ticket={selectedTicket}
              tecnicoId={perfil.id}
              onBack={() => {
                console.log("🔙 Volviendo a la lista de tickets");
                setSelectedTicket(null);
              }}
              onUpdate={fetchTickets}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Tabs defaultValue="abiertos" className="w-full">
                <TabsList>
                  <TabsTrigger value="abiertos">
                    Tickets Abiertos ({ticketsAbiertos.length})
                  </TabsTrigger>
                  <TabsTrigger value="mios">
                    Mis Tickets ({misTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="finalizados">
                    Reportes ({ticketsFinalizados.length})
                  </TabsTrigger>
                </TabsList>
            <TabsContent value="abiertos">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando tickets...</p>
                </div>
              ) : viewMode === "grid" ? (
                <TicketList
                  tickets={ticketsAbiertos}
                  loading={false}
                  onSelectTicket={(ticket) => {
                    console.log("✅ Seleccionando ticket abierto:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                  onAsignar={handleAsignarTicket}
                  showAsignar={true}
                />
              ) : (
                <TicketListView
                  tickets={ticketsAbiertos}
                  onViewDetail={(ticket) => {
                    console.log("✅ Seleccionando ticket desde lista:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                />
              )}
            </TabsContent>
            <TabsContent value="mios">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando tickets...</p>
                </div>
              ) : viewMode === "grid" ? (
                <TicketList
                  tickets={misTickets}
                  loading={false}
                  onSelectTicket={(ticket) => {
                    console.log("✅ Seleccionando mi ticket:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                  showAsignar={false}
                />
              ) : (
                <TicketListView
                  tickets={misTickets}
                  onViewDetail={(ticket) => {
                    console.log("✅ Seleccionando mi ticket desde lista:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                />
              )}
            </TabsContent>
            <TabsContent value="finalizados">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando reportes...</p>
                </div>
              ) : ticketsFinalizados.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay reportes guardados aún
                </div>
              ) : viewMode === "grid" ? (
                <TicketList
                  tickets={ticketsFinalizados}
                  loading={false}
                  onSelectTicket={(ticket) => {
                    console.log("✅ Seleccionando ticket finalizado:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                  showAsignar={false}
                />
              ) : (
                <TicketListView
                  tickets={ticketsFinalizados}
                  onViewDetail={(ticket) => {
                    console.log("✅ Seleccionando ticket finalizado desde lista:", ticket.id);
                    setSelectedTicket(ticket);
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
            </div>
            <div className="lg:col-span-1">
              <TecnicosActivos perfilActual={perfil} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}













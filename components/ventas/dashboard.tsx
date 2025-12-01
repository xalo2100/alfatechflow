"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { TicketCard } from "@/components/ventas/ticket-card";
import { TicketDetailVentas } from "@/components/ventas/ticket-detail-ventas";
import { CreateTicketDialog } from "@/components/ventas/create-ticket-dialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Radio } from "lucide-react";
import { TicketViewToggle } from "@/components/ventas/ticket-view-toggle";
import { TicketListView } from "@/components/ventas/ticket-list-view";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

export function VentasDashboard({ perfil }: { perfil: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connected" | "disconnected">("connected");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const supabase = createClient();

  // Debug: Log cuando selectedTicket cambia
  useEffect(() => {
    console.log("🔄 selectedTicket cambió:", selectedTicket ? `Ticket #${selectedTicket.id}` : "null");
  }, [selectedTicket]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          console.log("🔄 Cambio detectado en tiempo real:", payload);
          setRealtimeStatus("connected");
          fetchTickets(); // Refrescar lista
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleRequestUrgent = async (ticketId: number) => {
    if (!confirm("¿Marcar este ticket como URGENTE? Esto notificará al técnico asignado.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          prioridad: "urgente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;

      alert("✅ Ticket marcado como URGENTE. El técnico será notificado.");
      fetchTickets();
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al marcar como urgente: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol="ventas" nombre={perfil.nombre_completo} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Dashboard de Ventas</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                Gestión de tickets en tiempo real
              </p>
              <div className="flex items-center gap-1 text-xs">
                <Radio
                  className={`h-3 w-3 ${
                    realtimeStatus === "connected" ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={
                    realtimeStatus === "connected" ? "text-green-600" : "text-red-600"
                  }
                >
                  {realtimeStatus === "connected" ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <TicketViewToggle 
              viewMode={viewMode} 
              onViewModeChange={(mode) => {
                console.log("Cambiando vista a:", mode);
                setViewMode(mode);
              }} 
            />
            <Button
              variant="outline"
              onClick={fetchTickets}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </div>
        </div>

        {selectedTicket ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ✅ Vista detallada activa - Ticket #{selectedTicket.id}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Cliente: {selectedTicket.cliente_nombre}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔙 Botón Volver clickeado");
                  setSelectedTicket(null);
                }}
                className="mt-2"
              >
                ← Volver a la lista
              </Button>
            </div>
            {(() => {
              try {
                return (
                  <TicketDetailVentas
                    ticket={selectedTicket}
                    onBack={() => {
                      console.log("🔙 onBack llamado desde TicketDetailVentas");
                      setSelectedTicket(null);
                    }}
                    onUpdate={fetchTickets}
                    perfilId={perfil.id}
                  />
                );
              } catch (error: any) {
                console.error("❌ Error renderizando TicketDetailVentas:", error);
                return (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 font-semibold">Error al cargar el detalle del ticket</p>
                    <p className="text-red-600 text-sm mt-2">{error.message}</p>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTicket(null)}
                      className="mt-4"
                    >
                      Volver
                    </Button>
                  </div>
                );
              }
            })()}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Cargando tickets...</p>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onViewDetail={(ticket) => {
                          console.log("✅ onViewDetail llamado con ticket:", ticket);
                          console.log("✅ Ticket ID:", ticket.id);
                          console.log("✅ Estado actual de selectedTicket:", selectedTicket);
                          setSelectedTicket(ticket);
                          console.log("✅ setSelectedTicket llamado");
                          // Verificar después de un momento
                          setTimeout(() => {
                            console.log("✅ Estado después de setSelectedTicket:", selectedTicket);
                          }, 100);
                        }}
                        onRequestUrgent={handleRequestUrgent}
                      />
                    ))}
                    {tickets.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay tickets aún. Crea uno para comenzar.
                      </div>
                    )}
                  </div>
                ) : (
                  <TicketListView
                    tickets={tickets}
                    onViewDetail={(ticket) => {
                      console.log("✅ Seleccionando ticket desde lista:", ticket.id);
                      setSelectedTicket(ticket);
                    }}
                    onRequestUrgent={handleRequestUrgent}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchTickets}
        creadoPor={perfil.id}
      />
    </div>
  );
}









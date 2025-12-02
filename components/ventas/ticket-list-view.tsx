"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, AlertTriangle, Clock } from "lucide-react";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

const estadoColors: Record<string, string> = {
  abierto: "bg-gray-200 text-gray-900 font-semibold",
  asignado: "bg-blue-500 text-white font-semibold",
  en_proceso: "bg-yellow-500 text-white font-semibold",
  espera_repuesto: "bg-orange-500 text-white font-semibold",
  finalizado: "bg-green-500 text-white font-semibold",
  entregado: "bg-purple-500 text-white font-semibold",
};

const prioridadColors: Record<string, string> = {
  baja: "bg-gray-400 text-white font-semibold",
  normal: "bg-blue-500 text-white font-semibold",
  alta: "bg-orange-500 text-white font-semibold",
  urgente: "bg-red-600 text-white font-semibold animate-pulse",
};

interface TicketListViewProps {
  tickets: Ticket[];
  onViewDetail?: (ticket: Ticket) => void;
  onRequestUrgent?: (ticketId: number) => void;
}

export function TicketListView({ tickets, onViewDetail, onRequestUrgent }: TicketListViewProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (minutes > 0) return `hace ${minutes}m`;
    return "ahora";
  };

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="hover:shadow-md transition-all cursor-pointer"
          onClick={(e) => {
            // No hacer nada si se hizo click en un botón
            const target = e.target as HTMLElement;
            if (target.closest("button")) {
              return;
            }
            if (onViewDetail) {
              console.log("Abriendo detalle del ticket desde lista:", ticket.id);
              onViewDetail(ticket);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">#{ticket.id}</span>
                    <Badge className={estadoColors[ticket.estado] || ""}>
                      {ticket.estado.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className={prioridadColors[ticket.prioridad] || ""}>
                      {ticket.prioridad}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(ticket.created_at), "PPp", { locale: es })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{ticket.cliente_nombre}</p>
                  {ticket.cliente_contacto && (
                    <p className="text-sm text-muted-foreground">{ticket.cliente_contacto}</p>
                  )}
                </div>
                <div className="space-y-1">
                  {(ticket as any).tecnico && (
                    <>
                      <p className="font-semibold text-sm text-muted-foreground">Técnico Asignado</p>
                      <p className="text-sm font-medium" style={{ color: "#f97316" }}>{(ticket as any).tecnico.nombre_completo}</p>
                    </>
                  )}
                  {ticket.dispositivo_modelo && (
                    <>
                      <p className="font-semibold text-sm text-muted-foreground">Equipo/Producto</p>
                      <p className="text-sm">{ticket.dispositivo_modelo}</p>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-muted-foreground">Problema/Solicitud</p>
                  <p className="text-sm line-clamp-2">{ticket.falla_declarada}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(new Date(ticket.updated_at || ticket.created_at))}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onViewDetail && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(ticket);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
                {ticket.prioridad !== "urgente" && onRequestUrgent && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestUrgent(ticket.id);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


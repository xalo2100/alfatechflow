"use client";

import { useState, useEffect } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Eye, Clock } from "lucide-react";
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

interface TicketCardProps {
  ticket: Ticket;
  onViewDetail?: (ticket: Ticket) => void;
  onRequestUrgent?: (ticketId: number) => void;
}

export function TicketCard({ ticket, onViewDetail, onRequestUrgent }: TicketCardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date(ticket.updated_at || ticket.created_at));
  const [isNewUpdate, setIsNewUpdate] = useState(false);

  useEffect(() => {
    const checkUpdate = () => {
      const currentUpdate = new Date(ticket.updated_at || ticket.created_at);
      if (currentUpdate.getTime() > lastUpdate.getTime()) {
        setIsNewUpdate(true);
        setLastUpdate(currentUpdate);
        // Quitar el indicador después de 3 segundos
        setTimeout(() => setIsNewUpdate(false), 3000);
      }
    };

    checkUpdate();
  }, [ticket.updated_at, lastUpdate]);

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

  const handleCardClick = () => {
    if (onViewDetail) {
      console.log("🖱️ Click en ticket:", ticket.id);
      onViewDetail(ticket);
    } else {
      console.warn("⚠️ onViewDetail no está definido");
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`border rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-lg hover:border-primary transition-all cursor-pointer ${
        isNewUpdate ? "ring-2 ring-blue-500" : ""
      } ${ticket.prioridad === "urgente" ? "border-2 border-red-500" : ""}`}
      onClick={handleCardClick}
      title="Haz clic para ver detalles"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">#{ticket.id}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge className={estadoColors[ticket.estado] || ""}>
              {ticket.estado.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className={prioridadColors[ticket.prioridad] || ""}>
              {ticket.prioridad}
            </Badge>
            {isNewUpdate && (
              <Badge variant="outline" className="bg-blue-500 text-white font-semibold animate-pulse">
                Nuevo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
          <p className="font-medium">{ticket.cliente_nombre}</p>
        </div>
        {ticket.cliente_contacto && (
          <div>
            <p className="font-semibold text-sm text-muted-foreground">Contacto</p>
            <p className="text-sm">{ticket.cliente_contacto}</p>
          </div>
        )}
                  {ticket.dispositivo_modelo && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Equipo/Producto</p>
                      <p className="text-sm">{ticket.dispositivo_modelo}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Problema/Solicitud</p>
                    <p className="text-sm line-clamp-2">{ticket.falla_declarada}</p>
                  </div>
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(new Date(ticket.updated_at || ticket.created_at))}</span>
            </div>
            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                <span>Actualizado</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔵 Botón Ver Detalle clickeado para ticket:", ticket.id);
                console.log("🔵 onViewDetail existe?", !!onViewDetail);
                if (onViewDetail) {
                  console.log("🔵 Llamando a onViewDetail con ticket:", ticket);
                  onViewDetail(ticket);
                } else {
                  console.error("❌ onViewDetail no está definido");
                  alert("Error: onViewDetail no está definido. Por favor, recarga la página.");
                }
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalle
            </Button>
            {ticket.prioridad !== "urgente" && onRequestUrgent && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  handleButtonClick(e);
                  onRequestUrgent(ticket.id);
                }}
                className="flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
}









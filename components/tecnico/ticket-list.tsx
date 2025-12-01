"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  onAsignar?: (ticketId: number) => void;
  showAsignar?: boolean;
}

export function TicketList({
  tickets,
  loading,
  onSelectTicket,
  onAsignar,
  showAsignar = false,
}: TicketListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cargando tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay tickets disponibles
      </div>
    );
  }

  const handleCardClick = (ticket: Ticket) => {
    console.log("🖱️ Click en ticket técnico:", ticket.id);
    onSelectTicket(ticket);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="hover:shadow-lg hover:border-primary transition-all cursor-pointer"
          onClick={() => handleCardClick(ticket)}
          title="Haz clic para ver detalles"
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">#{ticket.id}</CardTitle>
              <Badge variant="outline">{ticket.prioridad}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{ticket.cliente_nombre}</p>
            </div>
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
            <div className="flex justify-between items-center pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {format(new Date(ticket.created_at), "PPp", { locale: es })}
              </p>
              {showAsignar && onAsignar && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAsignar(ticket.id);
                  }}
                >
                  Asignar
                </Button>
              )}
              {!showAsignar && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTicket(ticket);
                  }}
                >
                  Ver <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}













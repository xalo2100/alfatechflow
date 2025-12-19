"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getTimezone } from "@/lib/timezone";

interface TecnicoActivo {
  tecnico_id: string;
  nombre_completo: string;
  ticket_id: number;
  cliente_nombre: string;
  estado: string;
  ultima_actividad: string;
}

export function TecnicosActivos({ perfilActual }: { perfilActual: any }) {
  const [tecnicosActivos, setTecnicosActivos] = useState<TecnicoActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  const fetchTecnicosActivos = async () => {
    try {
      // Obtener todos los tickets activos con sus técnicos asignados
      const { data: ticketsActivos, error } = await supabase
        .from("tickets")
        .select(`
          id,
          cliente_nombre,
          estado,
          asignado_a,
          updated_at,
          tecnico:perfiles!tickets_asignado_a_fkey(nombre_completo, id)
        `)
        .in("estado", ["asignado", "en_proceso", "espera_repuesto"])
        .not("asignado_a", "is", null);

      if (error) {
        console.error("Error fetching técnicos activos:", error);
        return;
      }

      // Filtrar y formatear los datos
      const activos: TecnicoActivo[] = (ticketsActivos || [])
        .filter((ticket: any) => ticket.tecnico && ticket.tecnico.id !== perfilActual.id)
        .map((ticket: any) => ({
          tecnico_id: ticket.tecnico.id,
          nombre_completo: ticket.tecnico.nombre_completo,
          ticket_id: ticket.id,
          cliente_nombre: ticket.cliente_nombre,
          estado: ticket.estado,
          ultima_actividad: ticket.updated_at,
        }));

      setTecnicosActivos(activos);
    } catch (error) {
      console.error("Error en fetchTecnicosActivos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTecnicosActivos();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel("tecnicos-activos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTecnicosActivos();
        }
      )
      .subscribe();

    // Actualizar cada 30 segundos para mantener la información fresca
    const interval = setInterval(fetchTecnicosActivos, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, perfilActual.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compañeros Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (tecnicosActivos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compañeros Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay otros técnicos trabajando en este momento
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por técnico
  const tecnicosAgrupados = tecnicosActivos.reduce((acc, activo) => {
    if (!acc[activo.tecnico_id]) {
      acc[activo.tecnico_id] = {
        tecnico: activo,
        tickets: [],
      };
    }
    acc[activo.tecnico_id].tickets.push(activo);
    return acc;
  }, {} as Record<string, { tecnico: TecnicoActivo; tickets: TecnicoActivo[] }>);

  const timezone = getTimezone();

  return (

    <Card>
      <CardHeader className="py-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full hover:bg-muted/50 -m-2 p-2 rounded-md transition-colors"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Compañeros Activos ({Object.keys(tecnicosAgrupados).length})
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {isOpen ? "Ocultar" : "Ver Actividad"}
          </Badge>
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {Object.values(tecnicosAgrupados).map((grupo) => {
            const tecnico = grupo.tecnico;
            const ultimaActividad = new Date(
              Math.max(...grupo.tickets.map((t) => new Date(t.ultima_actividad).getTime()))
            );

            return (
              <div
                key={tecnico.tecnico_id}
                className="border rounded-lg p-3 space-y-2 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold">{tecnico.nombre_completo}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {grupo.tickets.length} {grupo.tickets.length === 1 ? "ticket" : "tickets"}
                  </Badge>
                </div>
                <div className="space-y-1 pl-4">
                  {grupo.tickets.map((ticket) => (
                    <div
                      key={ticket.ticket_id}
                      className="text-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Ticket #{ticket.ticket_id}:</span>
                        <span className="font-medium">{ticket.cliente_nombre}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          ticket.estado === "en_proceso"
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : ticket.estado === "espera_repuesto"
                              ? "bg-orange-500 text-white border-orange-600"
                              : "bg-blue-500 text-white border-blue-600"
                        }
                      >
                        {ticket.estado.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-4">
                  <Clock className="h-3 w-3" />
                  <span>
                    Última actividad: {formatInTimeZone(ultimaActividad, timezone, "PPp", { locale: es })}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}


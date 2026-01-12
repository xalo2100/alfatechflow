"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { format, subMinutes, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { getTimezone } from "@/lib/timezone";

interface PerfilConActividad {
  id: string;
  nombre_completo: string;
  email: string;
  last_seen: string | null;
  tickets: {
    id: number;
    cliente_nombre: string;
    estado: string;
    updated_at: string;
  }[];
}

export function TecnicosActivos({ perfilActual }: { perfilActual: any }) {
  const [compañeros, setCompañeros] = useState<PerfilConActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  const fetchActividad = async (forceFull = false) => {
    try {
      if (!isOpen && !forceFull) {
        // Carga ligera: solo perfiles para el contador
        const { data: perfiles } = await supabase
          .from("perfiles")
          .select("id")
          .neq("id", perfilActual.id);

        if (perfiles) {
          setCompañeros(perfiles.map(p => ({ ...p, nombre_completo: "", email: "", last_seen: null, tickets: [] })) as any);
        }
        return;
      }

      // Carga completa: cuando está abierto
      const { data: perfiles, error: errorPerfiles } = await supabase
        .from("perfiles")
        .select("id, nombre_completo, email, last_seen")
        .neq("id", perfilActual.id)
        .order("nombre_completo");

      if (errorPerfiles) throw errorPerfiles;

      const { data: ticketsActivos, error: errorTickets } = await supabase
        .from("tickets")
        .select("id, cliente_nombre, estado, asignado_a, updated_at")
        .in("estado", ["asignado", "en_proceso", "espera_repuesto"])
        .not("asignado_a", "is", null);

      if (errorTickets) throw errorTickets;

      const data: PerfilConActividad[] = (perfiles || []).map(p => ({
        ...p,
        tickets: (ticketsActivos || []).filter(t => t.asignado_a === p.id)
      }));

      setCompañeros(data);
    } catch (error) {
      console.error("Error en fetchActividad:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActividad();

    // Suscripción en tiempo real a perfiles (para presencia) y tickets (para actividad)
    const channel = supabase
      .channel("presencia-y-actividad")
      .on("postgres_changes", { event: "*", schema: "public", table: "perfiles" }, () => fetchActividad())
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => fetchActividad())
      .subscribe();

    const interval = setInterval(fetchActividad, 1 * 60 * 1000); // Cada minuto

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, perfilActual.id]);

  const timezone = getTimezone();
  const now = new Date();
  const fiveMinutesAgo = subMinutes(now, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Compañeros Activos
            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <button
          onClick={() => {
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            if (nextOpen) {
              setLoading(true);
              fetchActividad(true);
            }
          }}
          className="flex items-center justify-between w-full hover:bg-muted/50 -m-2 p-2 rounded-md transition-colors"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Compañeros Activos ({compañeros.length})
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {isOpen ? "Ocultar" : "Ver Lista"}
          </Badge>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {compañeros.map((colega) => {
            const isOnline = colega.last_seen && isAfter(new Date(colega.last_seen), fiveMinutesAgo);
            const ultimaActividad = colega.last_seen ? new Date(colega.last_seen) : null;

            return (
              <div key={colega.id} className="border rounded-lg p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-semibold">{colega.nombre_completo}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                      {isOnline ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {colega.tickets.length} {colega.tickets.length === 1 ? "ticket" : "tickets"}
                  </Badge>
                </div>

                {colega.tickets.length > 0 && (
                  <div className="space-y-1 pl-5">
                    {colega.tickets.map((ticket) => (
                      <div key={ticket.id} className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">#{ticket.id}:</span>
                          <span className="font-medium text-xs truncate max-w-[150px]">{ticket.cliente_nombre}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 px-1 bg-primary/5">
                          {ticket.estado.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {ultimaActividad && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-5 pt-1 border-t border-dashed mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Visto por última vez: {formatInTimeZone(ultimaActividad, timezone, "p", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

import { Loader2 } from "lucide-react";

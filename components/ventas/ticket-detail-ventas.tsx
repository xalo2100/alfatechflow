"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Reporte = Database["public"]["Tables"]["reportes"]["Row"];

interface TicketDetailVentasProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: () => void;
  perfilId: string;
}

export function TicketDetailVentas({
  ticket,
  onBack,
  onUpdate,
  perfilId,
}: TicketDetailVentasProps) {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [solicitandoUrgente, setSolicitandoUrgente] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Cargar reporte si existe
    const cargarReporte = async () => {
      const { data } = await supabase
        .from("reportes")
        .select("*")
        .eq("ticket_id", ticket.id)
        .single();

      if (data) {
        setReporte(data);
      }
    };

    cargarReporte();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        () => {
          onUpdate(); // Refrescar ticket
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reportes",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => {
          cargarReporte(); // Refrescar reporte
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, supabase, onUpdate]);

  const solicitarAtencionUrgente = async () => {
    if (!confirm("¿Marcar este ticket como URGENTE? Esto notificará al técnico asignado.")) {
      return;
    }

    setSolicitandoUrgente(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          prioridad: "urgente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (error) throw error;

      alert("✅ Ticket marcado como URGENTE. El técnico será notificado.");
      onUpdate();
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al marcar como urgente: " + error.message);
    } finally {
      setSolicitandoUrgente(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Ticket #{ticket.id}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={estadoColors[ticket.estado] || ""}>
                  {ticket.estado.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline" className={prioridadColors[ticket.prioridad] || ""}>
                  {ticket.prioridad.toUpperCase()}
                </Badge>
              </div>
            </div>
            {ticket.prioridad !== "urgente" && (
              <Button
                onClick={solicitarAtencionUrgente}
                disabled={solicitandoUrgente}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {solicitandoUrgente ? "Marcando..." : "Solicitar Urgente"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </p>
              <p className="font-medium">{ticket.cliente_nombre}</p>
            </div>
            {ticket.cliente_contacto && (
              <div>
                <p className="font-semibold text-sm text-muted-foreground">Contacto</p>
                <p>{ticket.cliente_contacto}</p>
              </div>
            )}
            {ticket.dispositivo_modelo && (
              <div>
                <p className="font-semibold text-sm text-muted-foreground">Equipo/Producto</p>
                <p>{ticket.dispositivo_modelo}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Creado
              </p>
              <p className="text-sm">
                {format(new Date(ticket.created_at), "PPp", { locale: es })}
              </p>
            </div>
          </div>

          {/* Problema/Solicitud */}
          <div>
            <p className="font-semibold text-sm text-muted-foreground mb-2">Problema/Solicitud Reportada</p>
            <p className="bg-muted p-4 rounded-md">{ticket.falla_declarada}</p>
          </div>

          {/* Foto si existe */}
          {ticket.foto_url && (
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-2">Foto del Equipo/Producto</p>
              <img
                src={ticket.foto_url}
                alt="Dispositivo"
                className="max-w-md rounded-md border"
              />
            </div>
          )}

          {/* Reporte si existe */}
          {reporte && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5" />
                <p className="font-semibold text-lg">Reporte Técnico</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                {reporte.reporte_ia && (
                  <div className="space-y-3">
                    {(() => {
                      try {
                        const reporteData = JSON.parse(reporte.reporte_ia as string);
                        return (
                          <>
                            {reporteData.diagnostico && (
                              <div>
                                <p className="font-semibold text-sm text-green-900 mb-1">Diagnóstico:</p>
                                <p className="text-sm text-green-800">{reporteData.diagnostico}</p>
                              </div>
                            )}
                            {reporteData.trabajo_realizado && (
                              <div>
                                <p className="font-semibold text-sm text-green-900 mb-1">Trabajo Realizado:</p>
                                <p className="text-sm text-green-800 whitespace-pre-wrap">
                                  {reporteData.trabajo_realizado}
                                </p>
                              </div>
                            )}
                            {reporteData.observacion && (
                              <div>
                                <p className="font-semibold text-sm text-green-900 mb-1">Observación:</p>
                                <p className="text-sm text-green-800">{reporteData.observacion}</p>
                              </div>
                            )}
                          </>
                        );
                      } catch {
                        return (
                          <p className="text-sm text-green-800">
                            {typeof reporte.reporte_ia === "string"
                              ? reporte.reporte_ia
                              : "Reporte disponible"}
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}
                {reporte.repuestos_lista && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="font-semibold text-sm text-green-900 mb-1">Repuestos:</p>
                    <p className="text-sm text-green-800">{reporte.repuestos_lista}</p>
                  </div>
                )}
                <p className="text-xs text-green-700 mt-3">
                  Generado: {format(new Date(reporte.created_at), "PPp", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {/* Indicador de actualización en tiempo real */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Actualizaciones en tiempo real activas</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






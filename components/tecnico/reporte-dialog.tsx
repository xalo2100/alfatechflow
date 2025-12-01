"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";

interface ReporteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  tecnicoId: string;
  onSuccess: () => void;
}

export function ReporteDialog({
  open,
  onOpenChange,
  ticketId,
  tecnicoId,
  onSuccess,
}: ReporteDialogProps) {
  const [notasBrutas, setNotasBrutas] = useState("");
  const [repuestosLista, setRepuestosLista] = useState("");
  const [costoReparacion, setCostoReparacion] = useState("");
  const [generando, setGenerando] = useState(false);
  const [reporteGenerado, setReporteGenerado] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const supabase = createClient();

  const generarInforme = async () => {
    if (!notasBrutas.trim()) {
      alert("Por favor, escribe las notas del trabajo realizado");
      return;
    }

    setGenerando(true);
    try {
      const response = await fetch("/api/gemini/generar-informe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: notasBrutas }),
      });

      if (!response.ok) throw new Error("Error al generar informe");

      const data = await response.json();
      setReporteGenerado(data);
    } catch (error: any) {
      console.error("Error generando informe:", error);
      alert("Error al generar el informe: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  const guardarReporte = async () => {
    if (!reporteGenerado) return;

    setGuardando(true);
    try {
      const { error } = await supabase.from("reportes").insert({
        ticket_id: ticketId,
        tecnico_id: tecnicoId,
        notas_brutas: notasBrutas,
        reporte_ia: JSON.stringify(reporteGenerado),
        repuestos_lista: repuestosLista || null,
        costo_reparacion: costoReparacion ? parseFloat(costoReparacion) : null,
      });

      if (error) throw error;

      // Actualizar ticket a entregado (o mantener finalizado según lógica de negocio)
      await supabase
        .from("tickets")
        .update({ estado: "finalizado" })
        .eq("id", ticketId);

      onSuccess();
      // Reset form
      setNotasBrutas("");
      setRepuestosLista("");
      setCostoReparacion("");
      setReporteGenerado(null);
    } catch (error: any) {
      console.error("Error guardando reporte:", error);
      alert("Error al guardar el reporte: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Informe de Reparación</DialogTitle>
          <DialogDescription>
            Escribe tus notas y deja que la IA genere un informe profesional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notas">Notas del Trabajo Realizado *</Label>
            <Textarea
              id="notas"
              value={notasBrutas}
              onChange={(e) => setNotasBrutas(e.target.value)}
              placeholder='Ej: "cambie el flex y limpie ventilador, quedo joya"'
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Escribe de forma informal, la IA lo convertirá en un informe profesional
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repuestos">Repuestos Utilizados</Label>
              <Input
                id="repuestos"
                value={repuestosLista}
                onChange={(e) => setRepuestosLista(e.target.value)}
                placeholder="Ej: Flex de pantalla, pasta térmica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo">Costo de Reparación</Label>
              <Input
                id="costo"
                type="number"
                step="0.01"
                value={costoReparacion}
                onChange={(e) => setCostoReparacion(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {!reporteGenerado && (
            <Button
              onClick={generarInforme}
              disabled={generando || !notasBrutas.trim()}
              className="w-full"
            >
              {generando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando informe...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Informe con IA
                </>
              )}
            </Button>
          )}

          {reporteGenerado && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="font-semibold mb-2 text-green-900">Resumen para el Cliente</h4>
                <p className="text-sm text-green-800">{reporteGenerado.resumen_cliente}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-semibold mb-2 text-blue-900">Detalle Técnico</h4>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {reporteGenerado.detalle_tecnico}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                <h4 className="font-semibold mb-2 text-purple-900">Estado del Equipo</h4>
                <p className="text-sm text-purple-800">{reporteGenerado.estado_equipo}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          {reporteGenerado && (
            <Button onClick={guardarReporte} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Reporte"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


















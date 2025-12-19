"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface AsignarTecnicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onSuccess: () => void;
}

export function AsignarTecnicoDialog({
  open,
  onOpenChange,
  ticket,
  onSuccess,
}: AsignarTecnicoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [error, setError] = useState("");
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>("");
  const [tecnicos, setTecnicos] = useState<Array<{ id: string; nombre_completo: string; run: string | null }>>([]);
  const supabase = createClient();

  useEffect(() => {
    if (open && ticket) {
      // Cargar técnicos disponibles
      fetchTecnicos();
      // Cargar técnico actual si existe
      setTecnicoSeleccionado(ticket.asignado_a || "");
    }
  }, [open, ticket]);

  const fetchTecnicos = async () => {
    setLoadingTecnicos(true);
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, run")
      .in("rol", ["tecnico", "admin", "super_admin"])
      .eq("activo", true)
      .order("nombre_completo");

    if (!error && data) {
      setTecnicos(data);
    }
    setLoadingTecnicos(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setLoading(true);
    setError("");

    try {
      const updateData: any = {
        asignado_a: tecnicoSeleccionado || null,
      };

      // Logica modificada: Si el ticket ya está finalizado/entregado, SOLO cambiar el técnico
      // Si está en curso (abierto/asignado/etc), actualizar el estado normalmente
      const isFinalState = ["finalizado", "entregado"].includes(ticket.estado);

      if (tecnicoSeleccionado) {
        // Si hay técnico seleccionado
        if (!isFinalState) {
          // Si NO está finalizado, pasarlo a asignado (flujo normal)
          updateData.estado = "asignado";
        }
        // Si ESTÁ finalizado, no tocamos el estado, solo cambiamos el técnico (updateData ya tiene asignado_a)
      } else {
        // Si se quita el técnico
        if (!isFinalState) {
          updateData.estado = "abierto";
        }
        // Si está finalizado y le quitan el técnico... es un caso raro, mejor lo dejamos como está o advertimos.
        // Por ahora, asumimos que si es finalizado no deberían quitar el técnico, pero si lo hacen, mantenemos el estado.
      }

      const { error: updateError } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", ticket.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      onOpenChange(false);
      onSuccess();

      const tecnicoNombre = tecnicoSeleccionado
        ? tecnicos.find(t => t.id === tecnicoSeleccionado)?.nombre_completo || "Técnico"
        : "Ninguno";

      alert(`✅ Técnico ${tecnicoSeleccionado ? "asignado" : "removido"} exitosamente.\n\nTicket #${ticket.id}\nTécnico: ${tecnicoNombre}`);
    } catch (error: any) {
      console.error("Error asignando técnico:", error);
      setError(error.message || "Error al asignar técnico");
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Técnico</DialogTitle>
          <DialogDescription>
            Asignar o cambiar el técnico responsable del ticket #{ticket.id}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-info">Información del Ticket</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p><strong>Cliente:</strong> {ticket.cliente_nombre}</p>
              {ticket.dispositivo_modelo && (
                <p><strong>Equipo:</strong> {ticket.dispositivo_modelo}</p>
              )}
              <p><strong>Estado actual:</strong> {ticket.estado}</p>
              {ticket.asignado_a && (
                <p className="text-muted-foreground">
                  <strong>Técnico actual:</strong> {
                    tecnicos.find(t => t.id === ticket.asignado_a)?.nombre_completo || "Cargando..."
                  }
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tecnico">Seleccionar Técnico *</Label>
            <Select
              value={tecnicoSeleccionado || "none"}
              onValueChange={(value) =>
                setTecnicoSeleccionado(value === "none" ? "" : value)
              }
              disabled={loadingTecnicos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTecnicos ? "Cargando..." : "Sin asignar"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar (Quitar técnico actual)</SelectItem>
                {tecnicos.map((tecnico) => (
                  <SelectItem key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre_completo || tecnico.id}
                    {tecnico.run && ` (RUN: ${tecnico.run})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tecnicos.length === 0 && !loadingTecnicos && (
              <p className="text-xs text-muted-foreground">
                No hay técnicos disponibles. Crea técnicos primero.
              </p>
            )}
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingTecnicos}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar Técnico"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





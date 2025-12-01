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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BuscarClientePipedrive } from "@/components/pipedrive/buscar-cliente";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  creadoPor: string;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSuccess,
  creadoPor,
}: CreateTicketDialogProps) {
  const [loading, setLoading] = useState(false);
  const [datosPipedrive, setDatosPipedrive] = useState<any>(null); // Guardar todos los datos de Pipedrive
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_contacto: "",
    empresa: "",
    dispositivo_modelo: "",
    falla_declarada: "",
    prioridad: "normal" as "baja" | "normal" | "alta" | "urgente",
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ticketData: any = {
        cliente_nombre: formData.cliente_nombre,
        cliente_contacto: formData.cliente_contacto,
        dispositivo_modelo: formData.dispositivo_modelo,
        falla_declarada: formData.falla_declarada,
        prioridad: formData.prioridad,
        creado_por: creadoPor,
        estado: "abierto", // Siempre se crea como abierto, el admin lo asignará
      };
      
      // Si hay empresa, combinarla con cliente_nombre para guardar en la BD
      // (La tabla tickets no tiene campo empresa separado, así que lo combinamos)
      if (formData.empresa && formData.cliente_nombre) {
        ticketData.cliente_nombre = `${formData.empresa} - ${formData.cliente_nombre}`.trim();
      } else if (formData.empresa) {
        ticketData.cliente_nombre = formData.empresa;
      }

      // Guardar TODOS los datos de Pipedrive en el campo JSON datos_cliente
      // Solo si la columna existe (para evitar errores si la migración no se ha ejecutado)
      if (datosPipedrive) {
        try {
          ticketData.datos_cliente = datosPipedrive;
          console.log(`[CREATE-TICKET] 💾 Guardando datos completos de Pipedrive:`, datosPipedrive);
        } catch (e) {
          console.warn(`[CREATE-TICKET] ⚠️ No se pudo guardar datos_cliente (columna puede no existir aún):`, e);
        }
      }

      // Ventas NO puede asignar técnicos directamente, solo admin puede
      // Si se selecciona un técnico, se ignora (solo para mostrar en el formulario)
      // ticketData.asignado_a = undefined; // Siempre sin asignar cuando lo crea ventas

      const { error } = await supabase.from("tickets").insert(ticketData);
      
      // Si el error es por la columna datos_cliente no existente, intentar sin ese campo
      if (error && error.message?.includes("datos_cliente")) {
        console.warn(`[CREATE-TICKET] ⚠️ Columna datos_cliente no existe, guardando sin datos de Pipedrive`);
        delete ticketData.datos_cliente;
        const { error: errorRetry } = await supabase.from("tickets").insert(ticketData);
        if (errorRetry) throw errorRetry;
      } else if (error) {
        throw error;
      }

      if (error) throw error;

      // Reset form
      setFormData({
        cliente_nombre: "",
        cliente_contacto: "",
        empresa: "",
        dispositivo_modelo: "",
        falla_declarada: "",
        prioridad: "normal",
      });
      setDatosPipedrive(null); // Limpiar datos de Pipedrive

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      alert("Error al crear el ticket: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Completa los datos del cliente y la solicitud o problema reportado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <BuscarClientePipedrive
                valorInicial={formData.empresa}
                onSeleccionar={(datos) => {
                  console.log(`[CREATE-TICKET] 📋 Datos completos de Pipedrive:`, datos);
                  // Guardar TODOS los datos de Pipedrive para guardarlos en el ticket
                  setDatosPipedrive(datos);
                  setFormData((prev) => ({
                    ...prev,
                    empresa: datos.razon_social || prev.empresa,
                    cliente_nombre: datos.responsable || datos.razon_social || prev.cliente_nombre || "",
                    cliente_contacto: datos.email_cliente || datos.telefono_fijo || datos.celular || prev.cliente_contacto || "",
                  }));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Escribe el nombre de la empresa para buscar en Pipedrive y autocompletar los datos
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente_nombre">Cliente/Contacto *</Label>
              <Input
                id="cliente_nombre"
                value={formData.cliente_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, cliente_nombre: e.target.value })
                }
                required
                placeholder="Nombre del contacto o cliente"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente_contacto">Teléfono/Email</Label>
            <Input
              id="cliente_contacto"
              value={formData.cliente_contacto}
              onChange={(e) =>
                setFormData({ ...formData, cliente_contacto: e.target.value })
              }
              placeholder="Teléfono o email"
            />
          </div>
            <div className="space-y-2">
              <Label htmlFor="dispositivo_modelo">Equipo/Producto/Servicio</Label>
              <Input
                id="dispositivo_modelo"
                value={formData.dispositivo_modelo}
                onChange={(e) =>
                  setFormData({ ...formData, dispositivo_modelo: e.target.value })
                }
                placeholder="Ej: Equipo industrial, Software, Maquinaria, Sistema, etc."
              />
              <p className="text-xs text-muted-foreground">
                Especifica el equipo, producto o servicio que requiere atención
              </p>
            </div>
          <div className="space-y-2">
            <Label htmlFor="falla_declarada">Descripción del Problema/Solicitud *</Label>
            <Textarea
              id="falla_declarada"
              value={formData.falla_declarada}
              onChange={(e) =>
                setFormData({ ...formData, falla_declarada: e.target.value })
              }
              required
              placeholder="Describe el problema, solicitud o necesidad reportada..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Select
              value={formData.prioridad}
              onValueChange={(value: any) =>
                setFormData({ ...formData, prioridad: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              El administrador asignará el técnico correspondiente
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}







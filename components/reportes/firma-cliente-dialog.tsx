"use client";

import { useState, useRef, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Loader2, X, RotateCcw } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface FirmaClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporteId: number;
  clienteNombre: string;
  onSuccess: (firmaData?: { imagen: string; nombre: string; fecha: string }) => void;
  capturaLocal?: boolean; // Si es true, no guarda en BD, solo retorna los datos
}

export function FirmaClienteDialog({
  open,
  onOpenChange,
  reporteId,
  clienteNombre,
  onSuccess,
  capturaLocal = false,
}: FirmaClienteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nombreFirmante, setNombreFirmante] = useState(clienteNombre);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (open) {
      setNombreFirmante(clienteNombre);
      setIsEmpty(true);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    }
  }, [open, clienteNombre]);

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError("Por favor, dibuja tu firma en el área de firma");
      setLoading(false);
      return;
    }

    if (!nombreFirmante.trim()) {
      setError("Por favor, ingresa el nombre del firmante");
      setLoading(false);
      return;
    }

    try {
      // Obtener la firma como imagen base64
      const firmaDataURL = signatureRef.current.toDataURL("image/png");

      const firmaData = {
        imagen: firmaDataURL,
        nombre: nombreFirmante.trim(),
        fecha: new Date().toISOString(),
      };

      // Si es captura local, solo retornar los datos sin guardar en BD
      if (capturaLocal) {
        onSuccess(firmaData);
        onOpenChange(false);
        setLoading(false);
        return;
      }

      // Guardar la firma en el reporte
      const response = await fetch("/api/reportes/guardar-firma-cliente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reporteId,
          firmaDataURL,
          nombreFirmante: nombreFirmante.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la firma");
      }

      onOpenChange(false);
      onSuccess(firmaData);
      alert("✅ Firma del cliente guardada exitosamente");
    } catch (error: any) {
      console.error("Error guardando firma:", error);
      setError(error.message || "Error al guardar la firma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Firma Virtual del Cliente</DialogTitle>
          <DialogDescription>
            Firma el reporte técnico #{reporteId} como cliente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreFirmante">Nombre del Firmante *</Label>
            <Input
              id="nombreFirmante"
              value={nombreFirmante}
              onChange={(e) => setNombreFirmante(e.target.value)}
              required
              placeholder="Nombre completo del cliente"
            />
          </div>

          <div className="space-y-2">
            <Label>Firma Digital *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <div className="w-full overflow-hidden border rounded bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 600,
                    height: 200,
                    className: "signature-canvas",
                  }}
                  onBegin={handleBegin}
                  backgroundColor="rgb(255, 255, 255)"
                  penColor="rgb(0, 0, 0)"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Dibuja tu firma en el área de arriba</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isEmpty}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            </div>
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
            <Button type="submit" disabled={loading || isEmpty}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Firma"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


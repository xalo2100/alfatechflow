"use client";

import { useState } from "react";
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
import { Loader2, Eye, EyeOff } from "lucide-react";

interface CambiarContraseñaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioId: string;
  usuarioNombre: string;
  onSuccess: () => void;
}

export function CambiarContraseñaDialog({
  open,
  onOpenChange,
  usuarioId,
  usuarioNombre,
  onSuccess,
}: CambiarContraseñaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones
    if (!contraseña || !confirmarContraseña) {
      setError("Ambos campos son requeridos");
      setLoading(false);
      return;
    }

    if (contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/cambiar-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuarioId,
          nuevaContraseña: contraseña,
        }),
      });

      // Primero obtener el texto de la respuesta para verificar el tipo
      const responseText = await response.text();
      
      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Error: La respuesta no es JSON. Status:", response.status);
        console.error("Content-Type:", contentType);
        console.error("Respuesta recibida:", responseText.substring(0, 500));
        
        // Si es HTML, probablemente es una página de error 404/500
        if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<!doctype")) {
          throw new Error("La ruta de la API no fue encontrada. Por favor, contacta al administrador o verifica que el servidor esté funcionando correctamente.");
        }
        
        throw new Error("Error en la respuesta del servidor. Por favor, intenta de nuevo.");
      }

      // Parsear el JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        console.error("Respuesta recibida:", responseText);
        throw new Error("Error en la respuesta del servidor. La respuesta no es un JSON válido.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Error al cambiar la contraseña");
      }

      // Reset form
      setContraseña("");
      setConfirmarContraseña("");
      onOpenChange(false);
      onSuccess();
      alert(`✅ Contraseña actualizada exitosamente para ${usuarioNombre}`);
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error);
      setError(error.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Cambiar la contraseña de: <strong>{usuarioNombre}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contraseña">Nueva Contraseña *</Label>
            <div className="relative">
              <Input
                id="contraseña"
                type={mostrarContraseña ? "text" : "password"}
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarContraseña(!mostrarContraseña)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarContraseña ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmarContraseña">Confirmar Contraseña *</Label>
            <div className="relative">
              <Input
                id="confirmarContraseña"
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                required
                placeholder="Repite la contraseña"
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmar ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar Contraseña"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





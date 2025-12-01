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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AgregarTecnicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgregarTecnicoDialog({
  open,
  onOpenChange,
  onSuccess,
}: AgregarTecnicoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    run: "",
    email: "",
    password: "",
    nombre_completo: "",
  });
  const supabase = createClient();

  // Validar formato de RUN/RUT chileno sin guion (ej: 164121489 o 16412148K)
  const validarRUN = (run: string): boolean => {
    if (!run) return false;
    // Formato: 8-9 caracteres (7-8 dígitos + 1 dígito verificador o K)
    const runRegex = /^\d{7,8}[\dkK]$/i;
    return runRegex.test(run);
  };

  // Formatear RUN automáticamente (sin guion)
  const formatearRUN = (value: string): string => {
    // Eliminar todo excepto números y K, convertir a mayúscula
    const cleaned = value.replace(/[^\dkK]/gi, "").toUpperCase();
    
    // Limitar a 9 caracteres máximo (8 dígitos + 1 dígito/K)
    return cleaned.slice(0, 9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar y formatear RUN (sin guion)
      let runFormateado = formData.run.trim().toUpperCase();
      
      // Eliminar guiones si los tiene
      runFormateado = runFormateado.replace(/-/g, "");
      
      // Limpiar y normalizar (solo números y K)
      runFormateado = runFormateado.replace(/[^\dkK]/gi, "").toUpperCase();
      
      if (!validarRUN(runFormateado)) {
        setError("El RUN/RUT no tiene un formato válido. Debe ser: 164121489 o 16412148K (7-8 dígitos + dígito verificador, sin guion)");
        setLoading(false);
        return;
      }

      // Verificar que el RUN no esté en uso
      const { data: runExistente } = await supabase
        .from("perfiles")
        .select("id")
        .eq("run", runFormateado)
        .eq("rol", "tecnico")
        .single();

      if (runExistente) {
        setError("Este RUN ya está registrado en el sistema");
        setLoading(false);
        return;
      }

      // Llamar a la API para crear el técnico
      const response = await fetch("/api/admin/crear-tecnico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies en la petición
        body: JSON.stringify({
          run: runFormateado,
          email: formData.email.trim() || null,
          password: formData.password,
          nombre_completo: formData.nombre_completo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el técnico");
      }

      // Reset form
      setFormData({
        run: "",
        email: "",
        password: "",
        nombre_completo: "",
      });

      onOpenChange(false);
      onSuccess();
      
      const emailInfo = result.data.email || `${formData.nombre_completo.toLowerCase().replace(/\s+/g, "")}@tecnico.local`;
      alert(`✅ Técnico creado exitosamente!\n\nRUN: ${runFormateado}\nNombre: ${formData.nombre_completo}\nEmail: ${emailInfo}\n\nEl técnico puede iniciar sesión inmediatamente.`);
    } catch (error: any) {
      console.error("Error creando técnico:", error);
      setError(error.message || "Error al crear el técnico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Técnico</DialogTitle>
          <DialogDescription>
            Crea un nuevo técnico en el sistema. El usuario podrá iniciar sesión inmediatamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="run">RUN (Rol Único Nacional) *</Label>
            <Input
              id="run"
              type="text"
              value={formData.run}
              onChange={(e) => {
                const formatted = formatearRUN(e.target.value);
                setFormData({ ...formData, run: formatted });
              }}
              required
              placeholder="164121489"
              maxLength={9}
              pattern="\d{7,8}[\dkK]"
            />
            <p className="text-xs text-muted-foreground">
              Formato: 164121489 o 16412148K (7-8 dígitos + dígito verificador, sin guion)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo *</Label>
            <Input
              id="nombre_completo"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              required
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Opcional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tecnico@empresa.com"
            />
            <p className="text-xs text-muted-foreground">
              Si no se proporciona, se generará un email automático basado en el nombre. 
              <span className="text-amber-600 font-medium"> ⚠️ Sin email real, el técnico no podrá recuperar su contraseña ni recibir notificaciones.</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
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
                  Creando...
                </>
              ) : (
                "Crear Técnico"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






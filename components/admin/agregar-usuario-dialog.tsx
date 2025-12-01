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
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgregarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgregarUsuarioDialog({
  open,
  onOpenChange,
  onSuccess,
}: AgregarUsuarioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre_completo: "",
    rol: "ventas" as "ventas" | "admin",
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar email
      if (!formData.email.trim()) {
        setError("El email es requerido");
        setLoading(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError("El email no tiene un formato válido");
        setLoading(false);
        return;
      }

      // Verificar que el email no esté en uso
      const { data: emailExistente } = await supabase
        .from("perfiles")
        .select("id")
        .eq("email", formData.email.trim())
        .single();

      if (emailExistente) {
        setError("Este email ya está registrado en el sistema");
        setLoading(false);
        return;
      }

      // Llamar a la API para crear el usuario
      const response = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          nombre_completo: formData.nombre_completo,
          rol: formData.rol,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el usuario");
      }

      // Reset form
      setFormData({
        email: "",
        password: "",
        nombre_completo: "",
        rol: "ventas",
      });

      onOpenChange(false);
      onSuccess();
      
      const rolNombre = formData.rol === "admin" ? "Administrador" : "Ventas";
      alert(`✅ Usuario ${rolNombre} creado exitosamente!\n\nEmail: ${formData.email}\nNombre: ${formData.nombre_completo}\nRol: ${rolNombre}\n\nEl usuario puede iniciar sesión inmediatamente.`);
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      setError(error.message || "Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario de ventas o administrador en el sistema. El usuario podrá iniciar sesión inmediatamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rol">Rol *</Label>
            <Select
              value={formData.rol}
              onValueChange={(value: "ventas" | "admin") =>
                setFormData({ ...formData, rol: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ventas">Ventas</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="usuario@empresa.com"
            />
            <p className="text-xs text-muted-foreground">
              El email será usado para iniciar sesión en el sistema.
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
                `Crear ${formData.rol === "admin" ? "Administrador" : "Usuario de Ventas"}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface Usuario {
    id: string;
    email: string | null;
    nombre_completo: string | null;
    rol: string;
    run: string | null;
    activo: boolean;
}

interface EditarUsuarioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuario: Usuario | null;
    onSuccess: () => void;
    perfilActual?: any; // Perfil del usuario actual para verificar si es superadmin
}

export function EditarUsuarioDialog({
    open,
    onOpenChange,
    usuario,
    onSuccess,
    perfilActual,
}: EditarUsuarioDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: "",
        email: "",
        run: "",
        rol: "tecnico",
        activo: true,
    });

    useEffect(() => {
        if (usuario) {
            setFormData({
                nombre_completo: usuario.nombre_completo || "",
                email: usuario.email || "",
                run: usuario.run || "",
                rol: usuario.rol || "tecnico",
                activo: usuario.activo,
            });
        }
    }, [usuario]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario) return;

        setLoading(true);

        try {
            const response = await fetch("/api/admin/editar-usuario", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: usuario.id,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar usuario");
            }

            alert("✅ Usuario actualizado exitosamente");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los datos del usuario. Haz clic en guardar cuando termines.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="run">RUN</Label>
                        <Input
                            id="run"
                            value={formData.run}
                            onChange={(e) => setFormData({ ...formData, run: e.target.value })}
                            placeholder="12.345.678-9"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rol">Rol</Label>
                        <Select
                            value={formData.rol}
                            onValueChange={(value) => setFormData({ ...formData, rol: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tecnico">Técnico</SelectItem>
                                <SelectItem value="ventas">Ventas</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                {perfilActual?.rol === "super_admin" && (
                                    <SelectItem value="super_admin">Superadmin</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between space-x-2 pt-2">
                        <Label htmlFor="activo" className="flex flex-col space-y-1">
                            <span>Usuario Activo</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Desactivar para impedir el acceso
                            </span>
                        </Label>
                        <Switch
                            id="activo"
                            checked={formData.activo}
                            onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

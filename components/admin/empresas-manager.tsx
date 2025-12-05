"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Building2, Star, StarOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Empresa {
    id: string;
    nombre: string;
    rut: string;
    direccion: string;
    telefono: string;
    email: string;
    web: string;
    logo_url: string;
    es_principal: boolean;
}

export function EmpresasManager() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
    const [formData, setFormData] = useState<Partial<Empresa>>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/empresas");
            if (response.ok) {
                const data = await response.json();
                setEmpresas(data);
            }
        } catch (error) {
            console.error("Error fetching empresas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const handleOpenDialog = (empresa?: Empresa) => {
        if (empresa) {
            setEditingEmpresa(empresa);
            setFormData(empresa);
            setLogoPreview(empresa.logo_url);
        } else {
            setEditingEmpresa(null);
            setFormData({ es_principal: false });
            setLogoPreview(null);
        }
        setIsDialogOpen(true);
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Por favor, selecciona un archivo de imagen");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("El archivo es demasiado grande. Máximo 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase Storage
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `logo-empresa-${Date.now()}.${fileExt}`;
                const filePath = `logos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('fotos-tickets')
                    .upload(filePath, file, { upsert: false });

                if (uploadError) {
                    console.warn("Error uploading logo, using base64 fallback:", uploadError);
                    // Fallback to base64 handled by reader.onloadend setting preview
                    // We will save the base64 string in formData.logo_url
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setLogoPreview(base64);
                        setFormData({ ...formData, logo_url: base64 });
                    };
                    reader.readAsDataURL(file);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('fotos-tickets')
                        .getPublicUrl(filePath);

                    setLogoPreview(publicUrl);
                    setFormData({ ...formData, logo_url: publicUrl });
                }
            } catch (error) {
                console.error("Error handling logo upload:", error);
            }
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const url = editingEmpresa
                ? `/api/admin/empresas/${editingEmpresa.id}`
                : "/api/admin/empresas";

            const method = editingEmpresa ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsDialogOpen(false);
                fetchEmpresas();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error("Error saving empresa:", error);
            alert("Error al guardar la empresa");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta empresa?")) return;

        try {
            const response = await fetch(`/api/admin/empresas/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchEmpresas();
            } else {
                alert("Error al eliminar la empresa");
            }
        } catch (error) {
            console.error("Error deleting empresa:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Empresas Emisoras (Holdings)
                </h2>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Empresa
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Logo</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>RUT</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {empresas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay empresas registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                empresas.map((empresa) => (
                                    <TableRow key={empresa.id}>
                                        <TableCell>
                                            {empresa.logo_url ? (
                                                <img
                                                    src={empresa.logo_url}
                                                    alt={empresa.nombre}
                                                    className="h-8 w-auto object-contain max-w-[100px]"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-xs">
                                                    N/A
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{empresa.nombre}</TableCell>
                                        <TableCell>{empresa.rut || "-"}</TableCell>
                                        <TableCell>
                                            <div className="text-xs space-y-1">
                                                {empresa.email && <div>{empresa.email}</div>}
                                                {empresa.telefono && <div>{empresa.telefono}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {empresa.es_principal && (
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                    Principal
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(empresa)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(empresa.id)}
                                                    disabled={empresa.es_principal} // Prevent deleting the main company
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}
                        </DialogTitle>
                        <DialogDescription>
                            Configura los datos de la empresa emisora para los reportes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Logo de la Empresa</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="cursor-pointer"
                                />
                                {logoPreview && (
                                    <div className="border p-2 rounded bg-white">
                                        <img src={logoPreview} alt="Preview" className="h-10 w-auto object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre / Razón Social *</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre || ""}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Alfapack SpA"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT</Label>
                            <Input
                                id="rut"
                                value={formData.rut || ""}
                                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                placeholder="Ej: 76.802.874-5"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                value={formData.direccion || ""}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                placeholder="Ej: Av. Presidente Jorge Alessandri R. N°24429"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email de Contacto</Label>
                            <Input
                                id="email"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Ej: contacto@empresa.cl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                value={formData.telefono || ""}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                placeholder="Ej: +56 2 2345 6789"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="web">Sitio Web</Label>
                            <Input
                                id="web"
                                value={formData.web || ""}
                                onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                                placeholder="Ej: www.empresa.cl"
                            />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="es_principal"
                                checked={formData.es_principal || false}
                                onChange={(e) => setFormData({ ...formData, es_principal: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="es_principal" className="cursor-pointer">
                                Establecer como empresa principal (por defecto)
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !formData.nombre}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

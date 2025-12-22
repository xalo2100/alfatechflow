"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { HardDrive, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ConfigDriveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConfigDriveDialog({ open, onOpenChange }: ConfigDriveDialogProps) {
    const [jsonKey, setJsonKey] = useState("");
    const [folderId, setFolderId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            loadConfig();
        }
    }, [open]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("configuraciones")
                .select("clave, valor")
                .in("clave", ["google_service_account_json", "google_drive_folder_id"]);

            if (error) throw error;

            if (data) {
                data.forEach((item) => {
                    if (item.clave === "google_service_account_json") {
                        // Don't show the full key for security, just a placeholder if it exists
                        setJsonKey(item.valor ? "EXISTING_KEY_HIDDEN" : "");
                    } else if (item.clave === "google_drive_folder_id") {
                        setFolderId(item.valor || "");
                    }
                });
            }
        } catch (error) {
            console.error("Error loading config:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validate JSON if it's being changed (not the placeholder)
            if (jsonKey && jsonKey !== "EXISTING_KEY_HIDDEN") {
                try {
                    JSON.parse(jsonKey);
                } catch (e) {
                    toast.error("El formato del JSON de credenciales no es válido");
                    setSaving(false);
                    return;
                }
            }

            const updates = [];

            // Update folder ID
            updates.push(
                supabase.from("configuraciones").upsert({
                    clave: "google_drive_folder_id",
                    valor: folderId,
                    descripcion: "ID de la carpeta de destino en Google Drive"
                }, { onConflict: "clave" })
            );

            // Update JSON key only if changed
            if (jsonKey && jsonKey !== "EXISTING_KEY_HIDDEN") {
                updates.push(
                    supabase.from("configuraciones").upsert({
                        clave: "google_service_account_json",
                        valor: jsonKey,
                        descripcion: "Contenido del archivo JSON de credenciales de Google Service Account"
                    }, { onConflict: "clave" })
                );
            }

            await Promise.all(updates);
            toast.success("Configuración de Drive guardada");
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Configuración de Respaldo Google Drive
                    </DialogTitle>
                    <DialogDescription>
                        Configura las credenciales para el respaldo automático de chats.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="folderId">ID de Carpeta Google Drive</Label>
                        <Input
                            id="folderId"
                            placeholder="Ej: 1ABC... (el ID en la URL de la carpeta)"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            El ID que aparece en la URL al abrir la carpeta en Drive.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="jsonKey">Service Account JSON</Label>
                        <Textarea
                            id="jsonKey"
                            placeholder={loading ? "Cargando..." : "Pega aquí el contenido del archivo JSON..."}
                            value={jsonKey}
                            onChange={(e) => setJsonKey(e.target.value)}
                            className="h-[200px] font-mono text-xs"
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            {jsonKey === "EXISTING_KEY_HIDDEN"
                                ? "Hay una llave guardada. Pega una nueva para reemplazarla."
                                : "Crea una Service Account en Google Cloud, descarga la llave JSON y pega su contenido aquí."}
                        </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                            Recuerda compartir la carpeta de Drive con el email que aparece en el JSON ("client_email").
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

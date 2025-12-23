"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { HardDrive, CheckCircle2, AlertCircle, LogOut, ArrowRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface ConfigDriveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConfigDriveDialog({ open, onOpenChange }: ConfigDriveDialogProps) {
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (open) {
            loadConfig();
        }
    }, [open]);

    // Handle callback alerts
    useEffect(() => {
        const success = searchParams.get("config_success");
        const error = searchParams.get("config_error");

        if (success === "drive_connected") {
            toast.success("Google Drive conectado y carpeta configurada");
            // Clean URL
            router.replace("/admin");
            // Reload to show connected state immediately
            loadConfig();
        } else if (error) {
            toast.error(`Error de conexión: ${error}`);
            router.replace("/admin");
        }
    }, [searchParams, router]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("configuraciones")
                .select("clave, valor")
                .in("clave", ["google_drive_email"]);

            if (error) throw error;

            if (data) {
                const emailConfig = data.find(item => item.clave === "google_drive_email");
                setConnectedEmail(emailConfig?.valor || null);
            }
        } catch (error) {
            console.error("Error loading config:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        // Redirect to our signin route
        window.location.href = "/api/auth/google/signin";
    };

    const handleDisconnect = async () => {
        if (!confirm("¿Estás seguro de desconectar Google Drive? Se detendrán los respaldos.")) return;

        setLoading(true);
        try {
            await supabase
                .from("configuraciones")
                .delete()
                .in("clave", ["google_drive_refresh_token", "google_drive_email", "google_drive_folder_id"]);

            setConnectedEmail(null);
            toast.success("Google Drive desconectado");
        } catch (e) {
            console.error(e);
            toast.error("Error al desconectar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Configuración de Respaldo Google Drive
                    </DialogTitle>
                    <DialogDescription>
                        Conecta una cuenta de Google para guardar los respaldos automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* Connection Status Area */}
                    <div className={`p-4 rounded-lg border flex flex-col gap-3 ${connectedEmail ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Estado de Conexión</span>
                            {connectedEmail ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" /> CONECTADO
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                    DESCONECTADO
                                </span>
                            )}
                        </div>

                        {connectedEmail ? (
                            <div className="flex flex-col gap-4">
                                <div className="text-sm text-gray-600">
                                    Conectado como: <span className="font-semibold text-gray-900">{connectedEmail}</span>
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-white/50 rounded border border-green-100">
                                    <FolderOpen className="h-4 w-4 text-green-600 mt-0.5" />
                                    <div className="text-xs text-gray-600">
                                        <p className="font-semibold text-green-700">Carpeta Automática Configurada</p>
                                        <p>TechFlow Backup / Conversaciones Guardadas</p>
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" onClick={handleDisconnect} className="self-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Desconectar Cuenta
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-muted-foreground">
                                    El sistema creará automáticamente la carpeta "TechFlow Backup" en tu Drive.
                                </p>
                                <Button onClick={handleConnect} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <span className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4" />
                                        Conectar Google Drive
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

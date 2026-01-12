"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Server, RefreshCw } from "lucide-react";

interface ConnectionStatus {
    connected: boolean;
    message: string;
    details?: {
        models?: string[];
        error?: string;
    };
}

export function LocalAIStatus() {
    const [status, setStatus] = useState<ConnectionStatus>({
        connected: false,
        message: "Verificando conexión VPS...",
    });
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    const checkConnection = async () => {
        setChecking(true);
        setStatus({
            connected: false,
            message: "Verificando conexión VPS...",
        });

        try {
            const response = await fetch("/api/admin/test-local-ai", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();

            if (!response.ok || !data.connected) {
                setStatus({
                    connected: false,
                    message: data.error || "VPS Fuera de línea",
                    details: {
                        error: data.error || "No se pudo conectar al servidor VPS local",
                    },
                });
            } else {
                setStatus({
                    connected: true,
                    message: "VPS Conectado y listo",
                    details: {
                        models: data.details?.models || [],
                    },
                });
            }
        } catch (error: any) {
            console.error("Error verificando conexión VPS:", error);
            setStatus({
                connected: false,
                message: "Error de red",
                details: {
                    error: error.message || "Error al intentar contactar con el endpoint de prueba.",
                },
            });
        } finally {
            setChecking(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">IA Local (VPS)</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkConnection}
                        disabled={checking || loading}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
                {loading || checking ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{status.message}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            {status.connected ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Conectado
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Desconectado
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2 text-sm flex-1">
                            <p className="text-xs text-muted-foreground line-clamp-2">{status.message}</p>

                            {status.connected && status.details?.models && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Modelos Operativos</p>
                                    <div className="flex flex-wrap gap-1">
                                        {status.details.models.map(model => (
                                            <Badge key={model} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                {model}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!status.connected && status.details?.error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 text-destructive text-[10px] mt-2 break-words">
                                    <strong>Error:</strong> {status.details.error}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

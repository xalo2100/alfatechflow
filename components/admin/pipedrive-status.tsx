"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Building2, RefreshCw } from "lucide-react";

interface ConnectionStatus {
  connected: boolean;
  message: string;
  details?: {
    domain?: string;
    user?: string;
    email?: string;
    error?: string;
  };
}

export function PipedriveStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    message: "Verificando conexión...",
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    setStatus({
      connected: false,
      message: "Verificando conexión...",
    });

    try {
      const response = await fetch("/api/pipedrive/test-connection", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus({
          connected: false,
          message: data.error || "Error de conexión",
          details: {
            error: data.error || "No se pudo conectar a Pipedrive",
          },
        });
      } else {
        setStatus({
          connected: true,
          message: "Conexión exitosa",
          details: {
            domain: data.domain || "N/A",
            user: data.user || "N/A",
            email: data.email || "N/A",
          },
        });
      }
    } catch (error: any) {
      console.error("Error verificando conexión:", error);
      setStatus({
        connected: false,
        message: "Error de conexión",
        details: {
          error: error.message || "No se pudo verificar la conexión con Pipedrive. Verifica que la API key y el dominio estén configurados.",
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
            <Building2 className="h-5 w-5" />
            <CardTitle className="text-lg">Pipedrive</CardTitle>
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

              {status.details?.domain && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Dominio</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{status.details.domain}</code>
                </div>
              )}

              {status.details?.user && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Usuario</p>
                  <p className="text-xs font-medium">{status.details.user}</p>
                </div>
              )}

              {status.details?.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 text-destructive text-xs mt-2 line-clamp-3">
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


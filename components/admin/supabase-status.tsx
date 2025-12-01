"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Database, RefreshCw } from "lucide-react";

interface ConnectionStatus {
  connected: boolean;
  message: string;
  details?: {
    url?: string;
    tables?: string[];
    error?: string;
  };
}

export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    message: "Verificando conexión...",
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const supabase = createClient();

  const checkConnection = async () => {
    setChecking(true);
    setStatus({
      connected: false,
      message: "Verificando conexión...",
    });

    try {
      // 1. Verificar que las variables de entorno estén configuradas
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
        setStatus({
          connected: false,
          message: "Variables de entorno no configuradas",
          details: {
            error: "Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas correctamente.",
          },
        });
        setChecking(false);
        setLoading(false);
        return;
      }

      // 2. Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError && authError.message !== "Invalid JWT") {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      // 3. Verificar acceso a tablas principales
      const tablesToCheck = ["perfiles", "tickets", "reportes", "configuraciones"];
      const tableStatus: string[] = [];
      const errors: string[] = [];

      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase.from(table).select("id").limit(1);
          if (error) {
            errors.push(`${table}: ${error.message}`);
          } else {
            tableStatus.push(table);
          }
        } catch (err: any) {
          errors.push(`${table}: ${err.message}`);
        }
      }

      // 4. Verificar Realtime
      let realtimeWorking = false;
      try {
        const channel = supabase.channel("test-connection");
        await channel.subscribe();
        realtimeWorking = true;
        await supabase.removeChannel(channel);
      } catch (err) {
        console.warn("Realtime no disponible:", err);
      }

      if (errors.length > 0 && tableStatus.length === 0) {
        setStatus({
          connected: false,
          message: "Error de conexión a la base de datos",
          details: {
            url: url.replace(/\/\/.*@/, "//***@"), // Ocultar credenciales
            error: errors.join("; "),
          },
        });
      } else if (tableStatus.length < tablesToCheck.length) {
        setStatus({
          connected: true,
          message: "Conexión parcial",
          details: {
            url: url.replace(/\/\/.*@/, "//***@"),
            tables: tableStatus,
            error: errors.length > 0 ? `Algunas tablas no accesibles: ${errors.join("; ")}` : undefined,
          },
        });
      } else {
        setStatus({
          connected: true,
          message: "Conexión exitosa",
          details: {
            url: url.replace(/\/\/.*@/, "//***@"),
            tables: tableStatus,
          },
        });
      }
    } catch (error: any) {
      console.error("Error verificando conexión:", error);
      setStatus({
        connected: false,
        message: "Error de conexión",
        details: {
          error: error.message || "No se pudo conectar a Supabase",
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Estado de Conexión a Supabase</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={checking || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading || checking ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{status.message}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Conectado
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Desconectado
                  </Badge>
                </>
              )}
              <span className="text-sm font-medium">{status.message}</span>
            </div>

            {status.details && (
              <div className="space-y-2 text-sm">
                {status.details.url && (
                  <div>
                    <span className="text-muted-foreground">URL: </span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{status.details.url}</code>
                  </div>
                )}

                {status.details.tables && status.details.tables.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Tablas accesibles: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {status.details.tables.map((table) => (
                        <Badge key={table} variant="secondary" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {status.details.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-xs">
                    <strong>Error:</strong> {status.details.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}







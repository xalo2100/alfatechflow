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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">Supabase</CardTitle>
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

              {status.details?.tables && status.details.tables.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Tablas accesibles</p>
                  <div className="flex flex-wrap gap-1">
                    {status.details.tables.slice(0, 4).map((table) => (
                      <Badge key={table} variant="secondary" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                    {status.details.tables.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{status.details.tables.length - 4}
                      </Badge>
                    )}
                  </div>
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







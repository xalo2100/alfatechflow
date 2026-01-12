"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Eye, EyeOff, Key, Server, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ConfigAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfigAIDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConfigAIDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);

  // States for configuration
  const [apiKey, setApiKey] = useState("");
  const [localAiUrl, setLocalAiUrl] = useState("http://184.174.36.189:3000/v1/chat");
  const [preferredProvider, setPreferredProvider] = useState<"local" | "gemini">("local");

  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadCurrentConfig();
    }
  }, [open]);

  const loadCurrentConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from("configuraciones")
        .select("clave, valor, valor_encriptado")
        .in("clave", ["gemini_api_key", "local_ai_url", "preferred_ai_provider"]);

      if (!error && data) {
        data.forEach(config => {
          if (config.clave === "gemini_api_key") {
            setHasGeminiKey(!!config.valor_encriptado);
          } else if (config.clave === "local_ai_url") {
            setLocalAiUrl(config.valor || "http://184.174.36.189:3000/v1/chat");
          } else if (config.clave === "preferred_ai_provider") {
            setPreferredProvider((config.valor as "local" | "gemini") || "local");
          }
        });
      }
    } catch (error) {
      console.error("Error cargando configuración de IA:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Si hay una nueva API Key de Gemini, validarla y guardarla
      if (apiKey.trim()) {
        const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

        setError("Validando API Key de Gemini...");
        const testResponse = await fetch("/api/gemini/test-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: cleanedKey }),
        });

        if (!testResponse.ok) {
          const testData = await testResponse.json();
          throw new Error(testData.error || "La API Key de Gemini no es válida.");
        }

        setError("Guardando API Key de Gemini...");
        const saveGeminiResponse = await fetch("/api/admin/save-gemini-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: cleanedKey }),
        });

        if (!saveGeminiResponse.ok) {
          throw new Error("Error al guardar la API Key de Gemini");
        }
      }

      // 2. Guardar el resto de la configuración de IA
      setError("Guardando configuración general...");
      const saveConfigResponse = await fetch("/api/admin/save-ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localAiUrl: localAiUrl.trim(),
          preferredProvider
        }),
      });

      if (!saveConfigResponse.ok) {
        const configData = await saveConfigResponse.json();
        throw new Error(configData.error || "Error al guardar la configuración de IA");
      }

      toast.success("✅ Configuración de IA actualizada!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error guardando configuración de IA:", error);
      setError(error.message || "Error desconocido al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Cpu className="h-6 w-6 text-primary" />
            Configuración de IA Híbrida
          </DialogTitle>
          <DialogDescription>
            Configura los motores de inteligencia artificial. El sistema cuenta con respaldo automático y recuperación de conexión.
          </DialogDescription>
        </DialogHeader>

        {loadingConfig ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground font-medium">Cargando configuración actual...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">

            {/* Sección Local VPS */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-muted">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Server className="h-4 w-4" />
                Inteligencia Local (VPS phi3)
              </div>
              <div className="space-y-2">
                <Label htmlFor="localAiUrl" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  URL del Endpoint (Ollama/phi3)
                </Label>
                <Input
                  id="localAiUrl"
                  value={localAiUrl}
                  onChange={(e) => setLocalAiUrl(e.target.value)}
                  placeholder="http://tu-vps-ip:3000/v1/chat"
                  className="font-mono text-xs bg-white"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Este es el motor principal. Se recomienda usar la IP del VPS para mayor velocidad.
                </p>
              </div>
            </div>

            {/* Sección Gemini */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-muted">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Key className="h-4 w-4" />
                Google Gemini (Nube / Respaldo)
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  API Key de Google Gemini
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasGeminiKey ? "••••••••••••••••" : "Pega tu API key aquí (AIza...)"}
                    className="font-mono text-xs bg-white pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {hasGeminiKey && !apiKey && (
                  <p className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> API Key ya configurada. Solo escribe aquí si quieres cambiarla.
                  </p>
                )}
              </div>
            </div>

            {/* Estrategia de IA */}
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Cpu className="h-4 w-4" />
                Estrategia de Operación
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-blue-800">Cerebro Preferido</Label>
                  <Select value={preferredProvider} onValueChange={(v: any) => setPreferredProvider(v)}>
                    <SelectTrigger className="bg-white border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Nube Local (VPS phi3) - Prioridad 1</SelectItem>
                      <SelectItem value="gemini">Google Gemini (Nube) - Prioridad 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 p-2 bg-blue-100/50 rounded text-[10px] text-blue-800 leading-tight">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>
                    <strong>Failover Inteligente:</strong> Si el motor seleccionado falla, el sistema usará automáticamente el otro como respaldo.
                    <strong> Recuperación:</strong> En cuanto el motor preferido esté online de nuevo, el sistema volverá a usarlo automáticamente.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="text-xs bg-primary hover:bg-primary/90">
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Configuración IA"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

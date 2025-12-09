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
import { Loader2, Eye, EyeOff, Key } from "lucide-react";
import { encrypt } from "@/lib/encryption";

interface ConfigApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfigApiDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConfigApiDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [currentKeyStatus, setCurrentKeyStatus] = useState<"none" | "exists" | "checking">("checking");
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      checkCurrentKey();
    }
  }, [open]);

  const checkCurrentKey = async () => {
    setLoadingKey(true);
    try {
      const { data, error } = await supabase
        .from("configuraciones")
        .select("clave, valor_encriptado")
        .eq("clave", "gemini_api_key")
        .maybeSingle(); // Usar maybeSingle para evitar error si no existe

      if (error) {
        console.error("Error verificando API key:", error);
        setCurrentKeyStatus("none");
      } else if (data && data.valor_encriptado) {
        setCurrentKeyStatus("exists");
      } else {
        setCurrentKeyStatus("none");
      }
    } catch (error) {
      console.error("Error en checkCurrentKey:", error);
      setCurrentKeyStatus("none");
    } finally {
      setLoadingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar la API key: eliminar espacios, saltos de línea, etc.
    const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

    if (!cleanedKey) {
      setError("La API key es requerida");
      return;
    }

    // Validación básica de formato (las API keys de Gemini suelen empezar con "AIza")
    if (!cleanedKey.startsWith("AIza") && cleanedKey.length < 20) {
      setError("El formato de la API key no parece válido. Las API keys de Gemini suelen empezar con 'AIza'");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // PRIMERO: Validar la API key ANTES de guardarla
      setError("Validando API key...");
      const testResponse = await fetch("/api/gemini/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cleanedKey }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testData.error || "La API key no es válida. Verifica que sea correcta y tenga créditos disponibles.");
      }

      // Si la validación es exitosa, guardar usando la API SERVER-SIDE
      // Esto es crucial para que la encriptación use la clave correcta del servidor
      setError("Guardando API key encriptada (Server-side)...");

      const saveResponse = await fetch("/api/admin/save-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cleanedKey }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.error || "Error al guardar la configuración en el servidor");
      }

      // Actualizar el estado para reflejar que ahora existe una API key
      setCurrentKeyStatus("exists");
      setApiKey("");
      setError("");
      onOpenChange(false);
      onSuccess();
      alert("✅ API key configurada y validada exitosamente!");
    } catch (error: any) {
      console.error("Error guardando API key:", error);
      setError(error.message || "Error al guardar la API key. Verifica tu conexión a internet y que la API key sea correcta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurar API Key de Gemini
          </DialogTitle>
          <DialogDescription>
            La API key se guardará encriptada de forma segura. Solo los administradores pueden ver y modificar esta configuración.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingKey ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Verificando configuración actual...</p>
            </div>
          ) : (
            <>
              {currentKeyStatus === "exists" && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  ⚠️ Ya existe una API key configurada. Al guardar una nueva, se reemplazará la anterior.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key de Google Gemini *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setError(""); // Limpiar error al escribir
                    }}
                    onPaste={(e) => {
                      // Limpiar automáticamente al pegar
                      const pasted = e.clipboardData.getData("text");
                      const cleaned = pasted.trim().replace(/\s+/g, "").replace(/\n/g, "");
                      e.preventDefault();
                      setApiKey(cleaned);
                      setError("");
                    }}
                    required
                    placeholder="Pega tu API key aquí (se limpiará automáticamente)"
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu API key en:{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google AI Studio
                  </a>
                </p>
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
                      Guardando y validando...
                    </>
                  ) : (
                    "Guardar API Key"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}






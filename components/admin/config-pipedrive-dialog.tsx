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
import { Loader2, Eye, EyeOff, Key, Building2 } from "lucide-react";
import { encrypt } from "@/lib/encryption";

interface ConfigPipedriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfigPipedriveDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConfigPipedriveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [domain, setDomain] = useState("");
  const [currentKeyStatus, setCurrentKeyStatus] = useState<"none" | "exists" | "checking">("checking");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ success: boolean; message: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      checkCurrentConfig();
    }
  }, [open]);

  const checkCurrentConfig = async () => {
    setLoadingConfig(true);
    try {
      const [keyResult, domainResult] = await Promise.all([
        supabase
          .from("configuraciones")
          .select("clave, valor_encriptado")
          .eq("clave", "pipedrive_api_key")
          .maybeSingle(),
        supabase
          .from("configuraciones")
          .select("clave, valor_encriptado")
          .eq("clave", "pipedrive_domain")
          .maybeSingle(),
      ]);

      if (keyResult.data && keyResult.data.valor_encriptado) {
        setCurrentKeyStatus("exists");
      } else {
        setCurrentKeyStatus("none");
      }

      if (domainResult.data && domainResult.data.valor_encriptado) {
        // No desencriptamos, solo verificamos que existe
        // El dominio se puede mostrar en texto plano si es necesario
      }
    } catch (error) {
      console.error("Error verificando configuración:", error);
      setCurrentKeyStatus("none");
    } finally {
      setLoadingConfig(false);
    }
  };

  const probarConexion = async () => {
    const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");
    let cleanedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.pipedrive\.com$/, "");
    
    if (!cleanedKey) {
      setResultadoPrueba({ success: false, message: "Por favor, ingresa la API key primero" });
      return;
    }

    if (!cleanedDomain) {
      setResultadoPrueba({ success: false, message: "Por favor, ingresa el dominio primero" });
      return;
    }

    // Validar que no sea un email
    if (cleanedDomain.includes("@")) {
      setResultadoPrueba({ 
        success: false, 
        message: "❌ Error: Has ingresado un email. El dominio debe ser solo el nombre (ej: 'alfapack' si tu URL es 'https://alfapack.pipedrive.com')" 
      });
      return;
    }

    // Extraer solo el nombre del dominio si tiene puntos (ej: "alfapack.cl" -> "alfapack")
    // Pero solo si parece ser un dominio completo, no un subdominio válido
    if (cleanedDomain.includes(".") && !cleanedDomain.startsWith("www.")) {
      // Si tiene punto y no es www, podría ser un dominio completo
      // Intentar extraer la primera parte antes del punto
      const parts = cleanedDomain.split(".");
      if (parts.length > 1) {
        // Si la primera parte parece un nombre de empresa, usarla
        cleanedDomain = parts[0];
      }
    }

    setProbando(true);
    setResultadoPrueba(null);
    setError("");

    try {
      const response = await fetch("/api/pipedrive/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cleanedKey, domain: cleanedDomain }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResultadoPrueba({
          success: false,
          message: data.error || "Error al probar la conexión",
        });
      } else {
        setResultadoPrueba({
          success: true,
          message: `✅ ${data.message} - Usuario: ${data.user} (${data.email})`,
        });
      }
    } catch (error: any) {
      setResultadoPrueba({
        success: false,
        message: error.message || "Error al probar la conexión",
      });
    } finally {
      setProbando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");
    let cleanedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.pipedrive\.com$/, "");
    
    if (!cleanedKey) {
      setError("La API key es requerida");
      return;
    }

    if (!cleanedDomain) {
      setError("El dominio de Pipedrive es requerido (ej: alfapack)");
      return;
    }

    // Validar que no sea un email
    if (cleanedDomain.includes("@")) {
      setError("❌ Has ingresado un email. El dominio debe ser solo el nombre de tu cuenta de Pipedrive (ej: 'alfapack' si tu URL es 'https://alfapack.pipedrive.com')");
      return;
    }

    // Extraer solo el nombre del dominio si tiene puntos
    if (cleanedDomain.includes(".") && !cleanedDomain.startsWith("www.")) {
      const parts = cleanedDomain.split(".");
      if (parts.length > 1) {
        cleanedDomain = parts[0];
      }
    }

    setLoading(true);
    setError("");
    setResultadoPrueba(null);

    try {
      // PRIMERO: Validar la conexión ANTES de guardar
      setError("Probando conexión con Pipedrive...");
      const testResponse = await fetch("/api/pipedrive/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cleanedKey, domain: cleanedDomain }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testData.error || "La conexión con Pipedrive falló. Verifica que el dominio y la API key sean correctos.");
      }

      // Si la validación es exitosa, guardar
      setError("Guardando configuración encriptada...");
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Encriptar la API key antes de guardarla
      const encryptedKey = await encrypt(cleanedKey);
      const encryptedDomain = await encrypt(cleanedDomain);

      // Guardar o actualizar ambas configuraciones
      const [keyError, domainError] = await Promise.all([
        supabase
          .from("configuraciones")
          .upsert(
            {
              clave: "pipedrive_api_key",
              valor_encriptado: encryptedKey,
              descripcion: "API Key de Pipedrive para búsqueda de clientes",
              creado_por: user.id,
            },
            {
              onConflict: "clave",
            }
          ),
        supabase
          .from("configuraciones")
          .upsert(
            {
              clave: "pipedrive_domain",
              valor_encriptado: encryptedDomain,
              descripcion: "Dominio de Pipedrive (ej: tu-empresa)",
              creado_por: user.id,
            },
            {
              onConflict: "clave",
            }
          ),
      ]);

      if (keyError.error) throw keyError.error;
      if (domainError.error) throw domainError.error;

      // Actualizar el estado
      setCurrentKeyStatus("exists");
      setApiKey("");
      setDomain("");
      setError("");
      onOpenChange(false);
      onSuccess();
      alert("✅ Configuración de Pipedrive guardada exitosamente!");
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      setError(error.message || "Error al guardar la configuración. Verifica tu conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configurar Pipedrive
          </DialogTitle>
          <DialogDescription>
            Configura tu API key y dominio de Pipedrive para buscar y autocompletar datos de clientes. La información se guardará encriptada de forma segura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingConfig ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Verificando configuración actual...</p>
            </div>
          ) : (
            <>
              {currentKeyStatus === "exists" && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  ⚠️ Ya existe una configuración de Pipedrive. Al guardar, se reemplazará la anterior.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="domain">Dominio de Pipedrive *</Label>
                <Input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setError("");
                    setResultadoPrueba(null);
                  }}
                  required
                  placeholder="alfapack"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  <strong>⚠️ IMPORTANTE:</strong> Solo el nombre de tu cuenta de Pipedrive, NO un email.
                  <br />
                  Ejemplo: Si tu URL es <code className="bg-muted px-1 rounded">https://alfapack.pipedrive.com</code>, escribe solo <code className="bg-muted px-1 rounded">alfapack</code>
                  <br />
                  <span className="text-red-600 font-semibold">❌ NO escribas: gsanchez@alfapack.cl</span>
                  <br />
                  <span className="text-green-600 font-semibold">✅ Escribe: alfapack</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key de Pipedrive *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setError("");
                      setResultadoPrueba(null);
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      const cleaned = pasted.trim().replace(/\s+/g, "").replace(/\n/g, "");
                      e.preventDefault();
                      setApiKey(cleaned);
                      setError("");
                      setResultadoPrueba(null);
                    }}
                    required
                    placeholder="Pega tu API key aquí"
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
                    href="https://app.pipedrive.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Configuración de API de Pipedrive
                  </a>
                </p>
              </div>

              {/* Botón para probar conexión */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={probarConexion}
                  disabled={probando || !apiKey || !domain}
                  className="flex-1"
                >
                  {probando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    "Probar Conexión"
                  )}
                </Button>
              </div>

              {/* Mostrar resultado de la prueba */}
              {resultadoPrueba && (
                <div
                  className={`text-sm p-3 rounded-md ${
                    resultadoPrueba.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {resultadoPrueba.message}
                </div>
              )}

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
                      Guardando...
                    </>
                  ) : (
                    "Guardar Configuración"
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


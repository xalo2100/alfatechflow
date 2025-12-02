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
import { Loader2, Eye, EyeOff, Database, AlertTriangle } from "lucide-react";
import { encrypt } from "@/lib/encryption";

interface ConfigSupabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfigSupabaseDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConfigSupabaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseServiceKey, setSupabaseServiceKey] = useState("");
  const [currentConfigStatus, setCurrentConfigStatus] = useState<"none" | "exists" | "checking">("checking");
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      checkCurrentConfig();
      // Cargar valores actuales de variables de entorno para referencia
      const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      if (currentUrl && !supabaseUrl) {
        setSupabaseUrl(currentUrl);
      }
    }
  }, [open]);

  const checkCurrentConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data: urlConfig, error: urlError } = await supabase
        .from("configuraciones")
        .select("clave")
        .eq("clave", "supabase_url")
        .maybeSingle();

      const { data: anonKeyConfig, error: anonKeyError } = await supabase
        .from("configuraciones")
        .select("clave")
        .eq("clave", "supabase_anon_key")
        .maybeSingle();

      if (urlConfig || anonKeyConfig) {
        setCurrentConfigStatus("exists");
      } else {
        setCurrentConfigStatus("none");
      }
    } catch (error) {
      console.error("Error verificando configuración:", error);
      setCurrentConfigStatus("none");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedUrl = supabaseUrl.trim();
    const cleanedAnonKey = supabaseAnonKey.trim().replace(/\s+/g, "").replace(/\n/g, "");
    const cleanedServiceKey = supabaseServiceKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

    if (!cleanedUrl || !cleanedAnonKey) {
      setError("La URL y la API Key Anon de Supabase son requeridas");
      return;
    }

    // Validar formato de URL
    try {
      new URL(cleanedUrl);
    } catch {
      setError("La URL de Supabase no tiene un formato válido");
      return;
    }

    // Validación básica de formato de API keys
    if (cleanedAnonKey.length < 20) {
      setError("La API Key Anon parece inválida (muy corta)");
      return;
    }

    if (cleanedServiceKey && cleanedServiceKey.length < 20) {
      setError("La Service Role Key parece inválida (muy corta)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // PRIMERO: Validar la conexión ANTES de guardar
      setError("Validando conexión con Supabase...");
      
      // Crear un cliente temporal con las nuevas credenciales para probar
      const testResponse = await fetch("/api/admin/test-supabase-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cleanedUrl,
          anonKey: cleanedAnonKey,
          serviceKey: cleanedServiceKey || null,
        }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok) {
        throw new Error(testData.error || "La conexión con Supabase falló. Verifica que la URL y las API keys sean correctas.");
      }

      // Si la validación es exitosa, guardar
      setError("Guardando configuración encriptada...");
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Encriptar los valores antes de guardarlos
      const encryptedUrl = await encrypt(cleanedUrl);
      const encryptedAnonKey = await encrypt(cleanedAnonKey);
      const encryptedServiceKey = cleanedServiceKey ? await encrypt(cleanedServiceKey) : null;

      // Guardar o actualizar las configuraciones
      const configs = [
        {
          clave: "supabase_url",
          valor_encriptado: encryptedUrl,
          descripcion: "URL del proyecto de Supabase",
          creado_por: user.id,
        },
        {
          clave: "supabase_anon_key",
          valor_encriptado: encryptedAnonKey,
          descripcion: "API Key Anónima (anon/public) de Supabase",
          creado_por: user.id,
        },
      ];

      if (encryptedServiceKey) {
        configs.push({
          clave: "supabase_service_role_key",
          valor_encriptado: encryptedServiceKey,
          descripcion: "API Key de Service Role de Supabase (opcional)",
          creado_por: user.id,
        });
      }

      const upsertPromises = configs.map(config =>
        supabase
          .from("configuraciones")
          .upsert(config, { onConflict: "clave" })
      );

      const results = await Promise.all(upsertPromises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Actualizar el estado
      setCurrentConfigStatus("exists");
      setError("");
      onOpenChange(false);
      onSuccess();
      alert("✅ Configuración de Supabase guardada exitosamente!\n\n⚠️ IMPORTANTE: Necesitas reiniciar el servidor para que los cambios surtan efecto.");
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      setError(error.message || "Error al guardar la configuración. Verifica tu conexión a internet y que las credenciales sean correctas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurar Conexión a Supabase
          </DialogTitle>
          <DialogDescription>
            Configura la URL y las API keys de tu proyecto de Supabase. Las credenciales se guardarán encriptadas de forma segura.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 mb-1">⚠️ Advertencia Importante</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Al cambiar la configuración de Supabase, cambiarás la base de datos a la que se conecta la aplicación.</li>
                <li>La nueva base de datos debe tener la misma estructura de tablas y políticas RLS configuradas.</li>
                <li>Después de guardar, necesitarás reiniciar el servidor para que los cambios surtan efecto.</li>
                <li><strong>⚠️ IMPORTANTE:</strong> Si cambias a un proyecto diferente, perderás acceso a todos los datos del proyecto anterior (usuarios, tickets, reportes, etc.) hasta que reviertas el cambio.</li>
                <li><strong>⚠️ CRÍTICO:</strong> Los usuarios NO existirán en el nuevo proyecto. Necesitarás crear todos los usuarios nuevamente. Los RUNs y emails anteriores no funcionarán hasta que los recrees.</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingConfig ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Verificando configuración actual...</p>
            </div>
          ) : (
            <>
              {currentConfigStatus === "exists" && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  ⚠️ Ya existe una configuración de Supabase guardada. Al guardar una nueva, se reemplazará la anterior.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">URL del Proyecto Supabase *</Label>
                <Input
                  id="supabaseUrl"
                  type={showUrl ? "text" : "password"}
                  value={supabaseUrl}
                  onChange={(e) => {
                    setSupabaseUrl(e.target.value);
                    setError("");
                  }}
                  required
                  placeholder="https://tu-proyecto.supabase.co"
                  className={showUrl ? "" : "font-mono text-sm"}
                />
                <p className="text-xs text-muted-foreground">
                  Encuentra esta URL en: Supabase Dashboard → Settings → API → Project URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabaseAnonKey">API Key Anónima (anon/public) *</Label>
                <div className="relative">
                  <Input
                    id="supabaseAnonKey"
                    type={showAnonKey ? "text" : "password"}
                    value={supabaseAnonKey}
                    onChange={(e) => {
                      setSupabaseAnonKey(e.target.value);
                      setError("");
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      const cleaned = pasted.trim().replace(/\s+/g, "").replace(/\n/g, "");
                      e.preventDefault();
                      setSupabaseAnonKey(cleaned);
                      setError("");
                    }}
                    required
                    placeholder="Pega tu API key anon aquí"
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                  >
                    {showAnonKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta es la key pública (anon). Se encuentra en: Supabase Dashboard → Settings → API → Project API keys
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabaseServiceKey">Service Role Key (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="supabaseServiceKey"
                    type={showServiceKey ? "text" : "password"}
                    value={supabaseServiceKey}
                    onChange={(e) => {
                      setSupabaseServiceKey(e.target.value);
                      setError("");
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      const cleaned = pasted.trim().replace(/\s+/g, "").replace(/\n/g, "");
                      e.preventDefault();
                      setSupabaseServiceKey(cleaned);
                      setError("");
                    }}
                    placeholder="Pega tu Service Role key aquí (opcional)"
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowServiceKey(!showServiceKey)}
                  >
                    {showServiceKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  La Service Role Key es opcional pero recomendada para operaciones administrativas. ⚠️ NUNCA la compartas públicamente.
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


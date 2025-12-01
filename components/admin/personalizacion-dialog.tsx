"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Palette, Upload, Clock } from "lucide-react";
import { getAppConfig, saveAppConfig, type AppConfig } from "@/lib/app-config";
import { TIMEZONES, setTimezone, getTimezone } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalizacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalizacionDialog({
  open,
  onOpenChange,
}: PersonalizacionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logo || null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      const currentConfig = getAppConfig();
      const currentTimezone = getTimezone();
      setConfig({ ...currentConfig, timezone: currentTimezone });
      setLogoPreview(currentConfig.logo || null);
    }
  }, [open]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecciona un archivo de imagen");
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 2MB");
        return;
      }

      // Crear preview local inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Supabase Storage
      try {
        setLoading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-tickets') // Usar el bucket existente o crear uno nuevo
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // Si falla, intentar crear el bucket o usar base64 como fallback
          console.warn("Error subiendo logo a Storage, usando base64:", uploadError);
          reader.onloadend = () => {
            setLogoPreview(reader.result as string);
            setConfig({ ...config, logo: reader.result as string });
          };
          reader.readAsDataURL(file);
          setLoading(false);
          return;
        }

        // Obtener URL pública del archivo
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-tickets')
          .getPublicUrl(filePath);

        setLogoPreview(publicUrl);
        setConfig({ ...config, logo: publicUrl });
        alert("✅ Logo subido correctamente");
      } catch (error: any) {
        console.error("Error subiendo logo:", error);
        // Fallback a base64 si falla la subida
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
          setConfig({ ...config, logo: reader.result as string });
        };
        reader.readAsDataURL(file);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      saveAppConfig(config);
      // Guardar también la zona horaria
      if (config.timezone) {
        setTimezone(config.timezone);
      }
      
      // Guardar nombre y logo en la base de datos para uso en servidor
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Guardar nombre de la app
        await supabase
          .from("configuraciones")
          .upsert({
            clave: "app_nombre",
            valor_encriptado: config.nombre, // No necesita encriptación, pero usamos el mismo campo
            descripcion: "Nombre de la aplicación",
            creado_por: user.id,
          });
        
        // Guardar logo si existe
        if (config.logo) {
          await supabase
            .from("configuraciones")
            .upsert({
              clave: "app_logo",
              valor_encriptado: config.logo, // Base64 o URL
              descripcion: "Logo de la aplicación",
              creado_por: user.id,
            });
        }
        
        // Guardar color primario
        await supabase
          .from("configuraciones")
          .upsert({
            clave: "app_color_primary",
            valor_encriptado: config.colores.primary,
            descripcion: "Color primario de la aplicación",
            creado_por: user.id,
          });
      }
      // Aplicar color primario como variable CSS (convertir hex a HSL)
      if (typeof document !== "undefined") {
        const hex = config.colores.primary.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        
        const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        document.documentElement.style.setProperty("--primary", hsl);
      }
      alert("✅ Configuración guardada exitosamente. Recarga la página para ver los cambios.");
      onOpenChange(false);
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalizar Aplicación
          </DialogTitle>
          <DialogDescription>
            Personaliza el nombre, logo, colores y zona horaria de la aplicación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Aplicación *</Label>
            <Input
              id="nombre"
              value={config.nombre}
              onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
              placeholder="AlfaTechFlow"
              required
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo (Opcional)</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sube una imagen para el logo. Se mostrará en lugar del nombre.
                </p>
              </div>
              {logoPreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-12 w-auto max-w-32 object-contain border rounded p-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogoPreview(null);
                      setConfig({ ...config, logo: undefined });
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Color Primario */}
          <div className="space-y-2">
            <Label htmlFor="colorPrimary">Color Primario *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="colorPrimary"
                type="color"
                value={config.colores.primary}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    colores: { ...config.colores, primary: e.target.value },
                  })
                }
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.colores.primary}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    colores: { ...config.colores, primary: e.target.value },
                  })
                }
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <div
                className="w-12 h-12 rounded border"
                style={{ backgroundColor: config.colores.primary }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El color primario se usa en botones, enlaces y elementos destacados
            </p>
          </div>

          {/* Zona Horaria */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Zona Horaria *
            </Label>
            <Select
              value={config.timezone || getTimezone()}
              onValueChange={(value) => {
                setConfig({ ...config, timezone: value });
                setTimezone(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una zona horaria" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Todas las fechas y horas se mostrarán en esta zona horaria
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !config.nombre.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useEffect, useState } from "react";
import { getAppConfig, saveAppConfig, type AppConfig } from "@/lib/app-config";
import { createClient } from "@/lib/supabase/client";

/**
 * Componente que carga y aplica la configuración personalizada de la app
 * Carga desde la base de datos y aplica los cambios
 */
export function AppConfigLoader() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const loadConfigFromDB = async () => {
      try {
        const supabase = createClient();
        
        // Cargar nombre, logo y favicon desde la base de datos
        const [nombreResult, logoResult, faviconResult, colorResult] = await Promise.all([
          supabase
            .from("configuraciones")
            .select("valor_encriptado")
            .eq("clave", "app_nombre")
            .maybeSingle(),
          supabase
            .from("configuraciones")
            .select("valor_encriptado")
            .eq("clave", "app_logo")
            .maybeSingle(),
          supabase
            .from("configuraciones")
            .select("valor_encriptado")
            .eq("clave", "app_favicon")
            .maybeSingle(),
          supabase
            .from("configuraciones")
            .select("valor_encriptado")
            .eq("clave", "app_color_primary")
            .maybeSingle(),
        ]);

        // Obtener configuración actual (localStorage o default)
        let config = getAppConfig();

        // Actualizar con valores de la BD si existen
        if (nombreResult.data?.valor_encriptado) {
          config.nombre = nombreResult.data.valor_encriptado;
        }
        if (logoResult.data?.valor_encriptado) {
          config.logo = logoResult.data.valor_encriptado;
        }
        if (faviconResult.data?.valor_encriptado) {
          config.favicon = faviconResult.data.valor_encriptado;
        }
        if (colorResult.data?.valor_encriptado) {
          config.colores.primary = colorResult.data.valor_encriptado;
        }

        // Guardar en localStorage para uso inmediato
        saveAppConfig(config);
        setConfigLoaded(true);

        // Aplicar color primario personalizado
        if (config.colores.primary && typeof document !== "undefined") {
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
      } catch (error) {
        console.error("Error cargando configuración:", error);
        // Usar configuración local si falla
        const config = getAppConfig();
        setConfigLoaded(true);
      }
    };

    loadConfigFromDB();
  }, []);

  return null;
}






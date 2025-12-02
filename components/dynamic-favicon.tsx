"use client";

import { useEffect, useState } from "react";
import { getAppConfig, type AppConfig } from "@/lib/app-config";

/**
 * Componente que actualiza el favicon dinámicamente según la configuración de la app
 */
export function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const config = getAppConfig();
    if (config.favicon) {
      setFaviconUrl(config.favicon);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Obtener o crear el elemento link del favicon
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      // Si no existe, crear uno nuevo
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // Actualizar la URL del favicon
    if (faviconUrl) {
      link.href = faviconUrl;
    } else {
      // Si no hay favicon personalizado, usar el default o eliminarlo
      link.href = "/favicon.ico";
    }

    // Escuchar cambios en localStorage para actualizar en tiempo real
    const handleStorageChange = () => {
      const config = getAppConfig();
      if (config.favicon && config.favicon !== faviconUrl) {
        setFaviconUrl(config.favicon);
      } else if (!config.favicon && faviconUrl) {
        setFaviconUrl(null);
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener("storage", handleStorageChange);

    // También escuchar cambios locales (mismo tab)
    const interval = setInterval(() => {
      const config = getAppConfig();
      if (config.favicon !== faviconUrl) {
        setFaviconUrl(config.favicon || null);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [faviconUrl, mounted]);

  return null;
}




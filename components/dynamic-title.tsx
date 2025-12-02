"use client";

import { useEffect, useState } from "react";
import { getAppConfig } from "@/lib/app-config";

/**
 * Componente que actualiza el título de la página dinámicamente según la configuración de la app
 */
export function DynamicTitle() {
  const [appName, setAppName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const config = getAppConfig();
    if (config.nombre) {
      setAppName(config.nombre);
      document.title = `${config.nombre} - Sistema de Gestión de Soporte Técnico`;
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Actualizar el título cuando cambie el nombre de la app
    if (appName) {
      document.title = `${appName} - Sistema de Gestión de Soporte Técnico`;
    }

    // Escuchar cambios en localStorage para actualizar en tiempo real
    const handleStorageChange = () => {
      const config = getAppConfig();
      if (config.nombre && config.nombre !== appName) {
        setAppName(config.nombre);
        document.title = `${config.nombre} - Sistema de Gestión de Soporte Técnico`;
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener("storage", handleStorageChange);
    
    // También escuchar cambios locales (mismo tab)
    const interval = setInterval(() => {
      const config = getAppConfig();
      if (config.nombre !== appName) {
        setAppName(config.nombre);
        document.title = `${config.nombre} - Sistema de Gestión de Soporte Técnico`;
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [appName, mounted]);

  return null;
}






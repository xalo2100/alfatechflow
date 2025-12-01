/**
 * Configuración de la aplicación
 * Se puede personalizar desde el panel de administración
 */

export interface AppConfig {
  nombre: string;
  logo?: string; // URL de la imagen del logo
  colores: {
    primary: string; // Color primario en formato hex
    secondary?: string; // Color secundario opcional
  };
  timezone?: string; // Zona horaria (ej: "America/Santiago")
}

// Configuración por defecto
export const defaultConfig: AppConfig = {
  nombre: "AlfaTechFlow",
  colores: {
    primary: "#3b82f6", // Azul por defecto
  },
};

// Cargar configuración desde localStorage o usar la por defecto
export function getAppConfig(): AppConfig {
  if (typeof window === "undefined") return defaultConfig;
  
  const stored = localStorage.getItem("app-config");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultConfig;
    }
  }
  return defaultConfig;
}

// Guardar configuración
export function saveAppConfig(config: AppConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("app-config", JSON.stringify(config));
}




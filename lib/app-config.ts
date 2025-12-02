/**
 * Configuración de la aplicación
 * Se puede personalizar desde el panel de administración
 */

export interface AppConfig {
  nombre: string;
  logo?: string; // URL de la imagen del logo
  favicon?: string; // URL o base64 del favicon
  colores: {
    primary: string; // Color primario en formato hex
    secondary?: string; // Color secundario opcional
    texto?: string; // Color de texto principal
    fondo?: string; // Color de fondo de la aplicación
    tarjeta?: string; // Color de fondo de tarjetas
    textoNaranja?: string; // Color naranja para textos destacados (por defecto naranja)
  };
  timezone?: string; // Zona horaria (ej: "America/Santiago")
}

// Configuración por defecto
export const defaultConfig: AppConfig = {
  nombre: "AlfaTechFlow",
  colores: {
    primary: "#3b82f6", // Azul por defecto
    texto: "#1f2937", // Gris oscuro por defecto
    fondo: "#ffffff", // Blanco por defecto
    tarjeta: "#ffffff", // Blanco por defecto
    textoNaranja: "#f97316", // Naranja por defecto
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




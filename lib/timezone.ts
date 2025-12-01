/**
 * Utilidades para manejo de zona horaria
 */

// Zona horaria por defecto (Chile)
const DEFAULT_TIMEZONE = "America/Santiago";

/**
 * Obtiene la zona horaria configurada
 */
export function getTimezone(): string {
  if (typeof window === "undefined") return DEFAULT_TIMEZONE;
  
  // Intentar obtener desde localStorage
  const stored = localStorage.getItem("app-timezone");
  if (stored) {
    return stored;
  }
  
  // Intentar obtener desde la configuración de la app
  try {
    const appConfig = localStorage.getItem("app-config");
    if (appConfig) {
      const config = JSON.parse(appConfig);
      if (config.timezone) {
        return config.timezone;
      }
    }
  } catch {
    // Ignorar errores
  }
  
  return DEFAULT_TIMEZONE;
}

/**
 * Guarda la zona horaria configurada
 */
export function setTimezone(timezone: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("app-timezone", timezone);
  
  // También actualizar en app-config si existe
  try {
    const appConfig = localStorage.getItem("app-config");
    if (appConfig) {
      const config = JSON.parse(appConfig);
      config.timezone = timezone;
      localStorage.setItem("app-config", JSON.stringify(config));
    }
  } catch {
    // Ignorar errores
  }
}

/**
 * Formatea una fecha usando la zona horaria configurada
 */
export function formatWithTimezone(
  date: Date | string | number,
  formatStr: string,
  locale: any = undefined
): string {
  const { format } = require("date-fns");
  const { formatInTimeZone } = require("date-fns-tz");
  const timezone = getTimezone();
  
  try {
    return formatInTimeZone(date, timezone, formatStr, { locale });
  } catch {
    // Fallback a format normal si hay error
    return format(new Date(date), formatStr, { locale });
  }
}

/**
 * Lista de zonas horarias comunes
 */
export const TIMEZONES = [
  { value: "America/Santiago", label: "Chile (Santiago) - UTC-3" },
  { value: "America/Lima", label: "Perú (Lima) - UTC-5" },
  { value: "America/Bogota", label: "Colombia (Bogotá) - UTC-5" },
  { value: "America/Mexico_City", label: "México (Ciudad de México) - UTC-6" },
  { value: "America/Buenos_Aires", label: "Argentina (Buenos Aires) - UTC-3" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo) - UTC-3" },
  { value: "America/New_York", label: "EE.UU. (Nueva York) - UTC-5" },
  { value: "America/Los_Angeles", label: "EE.UU. (Los Ángeles) - UTC-8" },
  { value: "Europe/Madrid", label: "España (Madrid) - UTC+1" },
  { value: "UTC", label: "UTC - UTC+0" },
];





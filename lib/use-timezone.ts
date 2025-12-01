"use client";

import { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { getTimezone } from "./timezone";

/**
 * Hook para formatear fechas con la zona horaria configurada
 */
export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return getTimezone();
    }
    return "America/Santiago";
  });

  useEffect(() => {
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      setTimezoneState(getTimezone());
    };

    window.addEventListener("storage", handleStorageChange);
    // También verificar periódicamente (por si cambia en la misma ventana)
    const interval = setInterval(() => {
      const current = getTimezone();
      if (current !== timezone) {
        setTimezoneState(current);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [timezone]);

  const formatDate = (
    date: Date | string | number,
    formatStr: string,
    locale?: any
  ): string => {
    try {
      return formatInTimeZone(date, timezone, formatStr, { locale });
    } catch {
      return format(new Date(date), formatStr, { locale });
    }
  };

  return { timezone, formatDate };
}





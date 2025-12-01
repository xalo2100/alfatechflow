"use client";

import { useState, useEffect } from "react";

/**
 * Hook para detectar el estado de conexión a internet
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("🌐 Conexión restaurada");
      setIsOnline(true);
      if (wasOffline) {
        // Disparar evento personalizado para sincronización
        window.dispatchEvent(new CustomEvent("online-sync"));
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      console.log("📴 Sin conexión - Modo offline activado");
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verificar conexión periódicamente (cada 30 segundos)
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/health", { 
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch (error) {
        if (isOnline) {
          handleOffline();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
}


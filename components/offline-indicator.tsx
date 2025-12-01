"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/lib/use-online-status";
import { getPendingCount } from "@/lib/offline-queue";
import { WifiOff, Wifi, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Actualizar cada 5 segundos

    // Escuchar eventos de sincronización
    const handleSyncComplete = () => {
      setSyncing(false);
      updatePendingCount();
    };

    const handleOnlineSync = () => {
      setSyncing(true);
    };

    window.addEventListener("sync-complete", handleSyncComplete);
    window.addEventListener("online-sync", handleOnlineSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("sync-complete", handleSyncComplete);
      window.removeEventListener("online-sync", handleOnlineSync);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null; // No mostrar nada si está online y no hay pendientes
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[200px]">
        {!isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium">Modo Offline</p>
              <p className="text-xs text-muted-foreground">
                {pendingCount > 0
                  ? `${pendingCount} operación${pendingCount > 1 ? "es" : ""} pendiente${pendingCount > 1 ? "s" : ""}`
                  : "Sin conexión"}
              </p>
            </div>
          </>
        ) : syncing ? (
          <>
            <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium">Sincronizando...</p>
              <p className="text-xs text-muted-foreground">
                Subiendo {pendingCount} operación{pendingCount > 1 ? "es" : ""}
              </p>
            </div>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Wifi className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Conectado</p>
              <p className="text-xs text-muted-foreground">
                {pendingCount} pendiente{pendingCount > 1 ? "s" : ""} por sincronizar
              </p>
            </div>
            <Badge variant="outline">{pendingCount}</Badge>
          </>
        ) : null}
      </div>
    </div>
  );
}


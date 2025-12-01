"use client";

import { createClient } from "./client";
import { queueOperation, getPendingOperations, removeOperation, incrementRetries } from "../offline-queue";

/**
 * Cliente de Supabase con soporte offline
 * Intercepta operaciones y las guarda en cola si no hay conexión
 */

let isOnline = typeof window !== "undefined" ? navigator.onLine : true;

// Escuchar cambios de conexión globalmente
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline = true;
    syncPendingOperations();
  });
  window.addEventListener("offline", () => {
    isOnline = false;
  });
}

// Sincronizar operaciones pendientes
async function syncPendingOperations() {
  if (!isOnline || typeof window === "undefined") return;

  const supabase = createClient();
  const operations = await getPendingOperations();
  if (operations.length === 0) return;

  console.log(`🔄 Sincronizando ${operations.length} operaciones pendientes...`);

  for (const operation of operations) {
    try {
      if (operation.type === "insert") {
        const result = await supabase.from(operation.table).insert(operation.data);
        if (result.error) throw result.error;
        await removeOperation(operation.id);
      } else if (operation.type === "update") {
        let query = supabase.from(operation.table).update(operation.data);
        if (operation.filters) {
          Object.entries(operation.filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          });
        }
        const result = await query;
        if (result.error) throw result.error;
        await removeOperation(operation.id);
      }
    } catch (error: any) {
      console.error(`❌ Error sincronizando operación ${operation.id}:`, error);
      await incrementRetries(operation.id);
    }
  }

  const remaining = await getPendingOperations();
  if (remaining.length === 0) {
    console.log("✅ Todas las operaciones sincronizadas");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sync-complete"));
    }
  }
}

// Iniciar sincronización automática cuando se reconecte
if (typeof window !== "undefined") {
  window.addEventListener("online-sync", syncPendingOperations);
  
  // Intentar sincronizar al cargar si hay conexión
  if (isOnline) {
    setTimeout(syncPendingOperations, 2000);
  }
}

export function createOfflineClient() {
  // Por ahora, devolvemos el cliente normal
  // La funcionalidad offline se puede implementar después si es necesario
  // Los componentes pueden usar queueOperation directamente cuando detecten offline
  return createClient();
}

// Exportar función para usar directamente en componentes
export { queueOperation, getPendingOperations };

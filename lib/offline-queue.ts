/**
 * Sistema de Cola de Sincronización Offline
 * Guarda operaciones pendientes cuando no hay internet y las sincroniza al reconectar
 */

interface QueuedOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  filters?: any; // Para updates/deletes
  timestamp: number;
  retries: number;
}

const DB_NAME = 'alfatechflow-offline';
const STORE_NAME = 'operations';
const MAX_RETRIES = 3;

// Abrir base de datos IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('table', 'table', { unique: false });
      }
    };
  });
}

// Guardar operación en la cola
export async function queueOperation(
  type: 'insert' | 'update' | 'delete',
  table: string,
  data: any,
  filters?: any
): Promise<string> {
  const db = await openDB();
  const operation: QueuedOperation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    table,
    data,
    filters,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(operation);

    request.onsuccess = () => {
      console.log(`📦 Operación encolada (offline): ${type} en ${table}`, operation.id);
      resolve(operation.id);
    };
    request.onerror = () => reject(request.error);
  });
}

// Obtener todas las operaciones pendientes
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Eliminar operación de la cola (después de sincronizar exitosamente)
export async function removeOperation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`✅ Operación sincronizada y eliminada: ${id}`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Incrementar contador de reintentos
export async function incrementRetries(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const operation = request.result;
      if (operation) {
        operation.retries += 1;
        const updateRequest = store.put(operation);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Limpiar operaciones antiguas o con muchos reintentos
export async function cleanupOldOperations(): Promise<number> {
  const db = await openDB();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 días
  let cleaned = 0;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const operation = cursor.value;
        if (operation.timestamp < cutoff || operation.retries >= MAX_RETRIES) {
          cursor.delete();
          cleaned++;
        }
        cursor.continue();
      } else {
        resolve(cleaned);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Contar operaciones pendientes
export async function getPendingCount(): Promise<number> {
  const operations = await getPendingOperations();
  return operations.length;
}


/**
 * Encriptación simple usando Web Crypto API
 * En producción, considera usar una solución más robusta
 */

// Clave de encriptación derivada de variables de entorno usando SHA-256
async function getEncryptionKey(): Promise<CryptoKey> {
  // Usar ENCRYPTION_KEY si está disponible, sino derivar de SUPABASE_URL
  const keySource = process.env.ENCRYPTION_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    "default-encryption-key-change-in-production";
  
  // Crear hash SHA-256 de la clave para obtener 32 bytes seguros
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keySource);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  
  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // IV (Initialization Vector) aleatorio
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    // Combinar IV + datos encriptados y convertir a base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Error encriptando:", error);
    throw new Error("Error al encriptar los datos");
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Decodificar base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extraer IV y datos encriptados
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Error desencriptando:", error);
    throw new Error("Error al desencriptar los datos");
  }
}


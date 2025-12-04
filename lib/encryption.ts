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

    // Validar que el texto encriptado no esté vacío
    if (!encryptedText || encryptedText.trim() === "") {
      console.error("[ENCRYPTION] ❌ Texto encriptado está vacío");
      throw new Error("El texto encriptado está vacío");
    }

    console.log(`[ENCRYPTION] 🔓 Iniciando desencriptación... (longitud: ${encryptedText.length} caracteres)`);

    // Decodificar base64
    let combined: Uint8Array;
    try {
      combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      console.log(`[ENCRYPTION] ✅ Base64 decodificado correctamente (${combined.length} bytes)`);
    } catch (base64Error) {
      console.error("[ENCRYPTION] ❌ Error decodificando base64:", base64Error);
      throw new Error("El texto encriptado no es un base64 válido. Es posible que la clave haya sido guardada sin encriptar o esté corrupta.");
    }

    // Validar longitud mínima (IV de 12 bytes + al menos 1 byte de datos)
    if (combined.length < 13) {
      console.error(`[ENCRYPTION] ❌ Datos encriptados muy cortos (${combined.length} bytes, mínimo 13)`);
      throw new Error("Los datos encriptados están incompletos o corruptos");
    }

    // Extraer IV y datos encriptados
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    console.log(`[ENCRYPTION] 📊 IV: ${iv.length} bytes, Datos: ${encrypted.length} bytes`);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);

    console.log(`[ENCRYPTION] ✅ Desencriptación exitosa (${result.length} caracteres)`);

    return result;
  } catch (error: any) {
    console.error("[ENCRYPTION] ❌ Error desencriptando:", error);

    // Proporcionar mensajes de error más específicos
    if (error.message?.includes("base64")) {
      throw new Error("Error al desencriptar los datos: formato base64 inválido. La clave puede estar corrupta.");
    } else if (error.name === "OperationError" || error.message?.includes("decrypt")) {
      throw new Error("Error al desencriptar los datos: la clave de encriptación puede haber cambiado o los datos están corruptos. Por favor, vuelve a configurar la API key.");
    } else if (error.message?.includes("vacío") || error.message?.includes("incompletos")) {
      throw error; // Re-lanzar errores de validación tal cual
    } else {
      throw new Error(`Error al desencriptar los datos: ${error.message || "Error desconocido"}`);
    }
  }
}


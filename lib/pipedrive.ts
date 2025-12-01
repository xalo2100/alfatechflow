import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

/**
 * Obtiene la API key de Pipedrive desde la base de datos (encriptada)
 */
export async function getPipedriveApiKey(): Promise<string> {
  const supabase = await createClient();
  
  // Intentar obtener desde la base de datos
  const { data: config, error: configError } = await supabase
    .from("configuraciones")
    .select("valor_encriptado")
    .eq("clave", "pipedrive_api_key")
    .maybeSingle();

  if (configError) {
    console.error("❌ Error consultando configuración de Pipedrive:", configError);
    const envKey = process.env.PIPEDRIVE_API_KEY;
    if (envKey) {
      console.log("⚠️ Usando API key de Pipedrive de variable de entorno debido a error en base de datos");
      return envKey;
    }
    throw new Error("Error al acceder a la configuración de la API key de Pipedrive. Verifica tus permisos.");
  }

  if (config?.valor_encriptado) {
    try {
      const decrypted = await decrypt(config.valor_encriptado);
      if (!decrypted || decrypted.trim() === "") {
        throw new Error("API key de Pipedrive desencriptada está vacía");
      }
      return decrypted.trim();
    } catch (error: any) {
      console.error("❌ Error desencriptando API key de Pipedrive:", error);
      const envKey = process.env.PIPEDRIVE_API_KEY;
      if (envKey) {
        console.log("✅ Usando API key de Pipedrive de variable de entorno");
        return envKey;
      }
      throw new Error("Error al desencriptar la API key de Pipedrive guardada. Por favor, vuelve a configurar la API key en el panel de administración.");
    }
  }

  // Fallback a variable de entorno
  const envKey = process.env.PIPEDRIVE_API_KEY;
  if (envKey) {
    console.log("✅ Usando API key de Pipedrive de variable de entorno");
    return envKey;
  }

  throw new Error("API key de Pipedrive no configurada. Por favor, configúrala en el panel de administración.");
}

/**
 * Obtiene el dominio de Pipedrive desde la base de datos
 */
export async function getPipedriveDomain(): Promise<string> {
  const supabase = await createClient();
  
  const { data: config } = await supabase
    .from("configuraciones")
    .select("valor_encriptado")
    .eq("clave", "pipedrive_domain")
    .maybeSingle();

  if (config?.valor_encriptado) {
    try {
      const decrypted = await decrypt(config.valor_encriptado);
      return decrypted.trim();
    } catch (error) {
      console.error("Error desencriptando dominio de Pipedrive:", error);
    }
  }

  // Fallback a variable de entorno
  const envDomain = process.env.PIPEDRIVE_DOMAIN;
  if (envDomain) {
    return envDomain.trim();
  }

  throw new Error("Dominio de Pipedrive no configurado. Por favor, configúralo en el panel de administración.");
}

/**
 * Interfaz para los datos de una organización en Pipedrive
 */
export interface PipedriveOrganization {
  id: number;
  name: string;
  address?: string;
  address_street_number?: string;
  address_route?: string;
  address_sublocality?: string;
  address_locality?: string;
  address_admin_area_level_1?: string;
  address_country?: string;
  email?: Array<{ value: string; primary?: boolean }>;
  phone?: Array<{ value: string; primary?: boolean }>;
  [key: string]: any; // Para campos personalizados
}

/**
 * Función maestra: Busca en organizaciones Y personas, y normaliza los datos
 * Prioriza organizaciones sobre personas
 */
export async function buscarEnPipedriveCompleto(
  termino: string
): Promise<{
  razonSocial: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  responsable?: string;
  email?: string;
  telefono?: string;
  esOrganizacion: boolean;
} | null> {
  try {
    const apiKey = await getPipedriveApiKey();
    const domain = await getPipedriveDomain();
    const baseUrl = `https://${domain}.pipedrive.com/api/v1`;
    const term = encodeURIComponent(termino.trim());

    console.log(`[PIPEDRIVE] ==========================================`);
    console.log(`[PIPEDRIVE] 🔍 BÚSQUEDA INICIADA: "${termino}"`);
    console.log(`[PIPEDRIVE] 🌐 Dominio: ${domain}`);
    console.log(`[PIPEDRIVE] 🔗 Base URL: ${baseUrl}`);
    console.log(`[PIPEDRIVE] 🔑 API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NO CONFIGURADA'}`);

    // PASO 1: Búsqueda simultánea en ORGANIZACIONES y PERSONAS
    console.log(`[PIPEDRIVE] 🔍 Iniciando búsqueda en: organizations y persons...`);
    
    const urlOrgs = `${baseUrl}/organizations/search?term=${term}&fields=name&limit=10&api_token=${apiKey}`;
    const urlPersonas = `${baseUrl}/persons/search?term=${term}&fields=name&limit=10&api_token=${apiKey}`;
    
    console.log(`[PIPEDRIVE] 🔗 URL Orgs: ${urlOrgs.replace(apiKey, '***')}`);
    console.log(`[PIPEDRIVE] 🔗 URL Personas: ${urlPersonas.replace(apiKey, '***')}`);

    const [resOrgs, resPersonas] = await Promise.all([
      fetch(urlOrgs),
      fetch(urlPersonas)
    ]);

    console.log(`[PIPEDRIVE] 📡 Status Orgs: ${resOrgs.status}, Personas: ${resPersonas.status}`);

    if (!resOrgs.ok) {
      const errorText = await resOrgs.text();
      console.error(`[PIPEDRIVE] ❌ Error en búsqueda de organizaciones: ${resOrgs.status}`, errorText);
      throw new Error(`Error al buscar organizaciones: ${resOrgs.status} ${errorText}`);
    }
    if (!resPersonas.ok) {
      const errorText = await resPersonas.text();
      console.error(`[PIPEDRIVE] ❌ Error en búsqueda de personas: ${resPersonas.status}`, errorText);
      // No lanzar error aquí, solo loguear
    }

    const jsonOrgs = await resOrgs.json();
    const jsonPersonas = resPersonas.ok ? await resPersonas.json() : { success: false, data: { items: [] } };

    console.log(`[PIPEDRIVE] 📊 Respuesta organizaciones RAW:`, JSON.stringify(jsonOrgs, null, 2));
    console.log(`[PIPEDRIVE] 📊 Respuesta personas RAW:`, JSON.stringify(jsonPersonas, null, 2));

    // Manejar estructura anidada o directa
    let itemsOrgs: any[] = [];
    let itemsPersonas: any[] = [];

    if (jsonOrgs.success && jsonOrgs.data?.items) {
      // Procesar items - la estructura es items[].item según la respuesta real
      itemsOrgs = jsonOrgs.data.items.map((itemWrapper: any) => {
        // La estructura real es: items[0].item contiene la organización
        if (itemWrapper.item) {
          console.log(`[PIPEDRIVE] 📦 Item anidado encontrado:`, itemWrapper.item.name || itemWrapper.item.id);
          return itemWrapper.item;
        }
        // Si es directo (fallback)
        console.log(`[PIPEDRIVE] 📦 Item directo encontrado:`, itemWrapper.name || itemWrapper.id);
        return itemWrapper;
      });
      console.log(`[PIPEDRIVE] ✅ Organizaciones procesadas: ${itemsOrgs.length}`);
      if (itemsOrgs.length > 0) {
        console.log(`[PIPEDRIVE] 📋 Primera org procesada:`, {
          id: itemsOrgs[0].id,
          name: itemsOrgs[0].name,
          custom_fields: itemsOrgs[0].custom_fields
        });
      }
    } else {
      console.warn(`[PIPEDRIVE] ⚠️ Respuesta de organizaciones no exitosa o sin items`);
      console.warn(`[PIPEDRIVE] Success: ${jsonOrgs.success}, Items: ${jsonOrgs.data?.items?.length || 0}`);
    }

    if (jsonPersonas.success && jsonPersonas.data?.items) {
      itemsPersonas = jsonPersonas.data.items.map((itemWrapper: any) => {
        // Misma estructura anidada para personas
        if (itemWrapper.item) {
          return itemWrapper.item;
        }
        return itemWrapper;
      });
      console.log(`[PIPEDRIVE] ✅ Personas procesadas: ${itemsPersonas.length}`);
    }

    console.log(`[PIPEDRIVE] 📊 Items finales - Orgs: ${itemsOrgs.length}, Personas: ${itemsPersonas.length}`);

    const encontroOrg = itemsOrgs.length > 0;
    const encontroPersona = itemsPersonas.length > 0;

    if (!encontroOrg && !encontroPersona) {
      console.warn(`[PIPEDRIVE] ⚠️ No se encontraron resultados en Empresas ni Personas`);
      return null;
    }

    // --- ESCENARIO A: ENCONTRÓ EMPRESA (Prioridad) ---
    if (encontroOrg) {
      const orgItem = itemsOrgs[0];
      const orgId = orgItem.id;
      console.log(`[PIPEDRIVE] ✅ Organización encontrada: "${orgItem.name}", ID: ${orgId}`);

      // 1. Obtener detalles de la empresa (RUT, Dirección)
      const orgDetailsRes = await fetch(`${baseUrl}/organizations/${orgId}?api_token=${apiKey}`);
      const orgDetails = await orgDetailsRes.json();

      // 2. Obtener personas asociadas para llenar el "Responsable"
      const orgPeopleRes = await fetch(`${baseUrl}/organizations/${orgId}/persons?api_token=${apiKey}`);
      const orgPeople = await orgPeopleRes.json();
      const personaAsociada = (orgPeople.data && orgPeople.data.length > 0) ? orgPeople.data[0] : null;

      return formatearDatosPipedrive(orgDetails.data, personaAsociada, true);
    }

    // --- ESCENARIO B: ENCONTRÓ PERSONA ---
    if (encontroPersona) {
      const personItem = itemsPersonas[0];
      const personId = personItem.id;
      console.log(`[PIPEDRIVE] ✅ Persona encontrada: "${personItem.name}", ID: ${personId}`);

      // 1. Obtener detalles de la persona (Email, Teléfono y ID de Organización)
      const personDetailsRes = await fetch(`${baseUrl}/persons/${personId}?api_token=${apiKey}`);
      const personDetails = await personDetailsRes.json();
      const personaData = personDetails.data;
      const orgIdAsociado = personaData.org_id ? (personaData.org_id.value || personaData.org_id) : null;

      let orgDetailsData = null;

      // 2. Si la persona tiene empresa, buscamos la empresa para sacar el RUT
      if (orgIdAsociado) {
        console.log(`[PIPEDRIVE] 🔗 Persona tiene organización asociada, ID: ${orgIdAsociado}`);
        const orgDetailsRes = await fetch(`${baseUrl}/organizations/${orgIdAsociado}?api_token=${apiKey}`);
        const orgDetails = await orgDetailsRes.json();
        orgDetailsData = orgDetails.data;
      }

      return formatearDatosPipedrive(orgDetailsData, personaData, false);
    }

    console.log(`[PIPEDRIVE] ⚠️ No se encontraron resultados`);
    return null;
  } catch (error: any) {
    console.error(`[PIPEDRIVE] ==========================================`);
    console.error(`[PIPEDRIVE] ❌ ERROR EN BÚSQUEDA COMPLETA`);
    console.error(`[PIPEDRIVE] Mensaje: ${error.message}`);
    console.error(`[PIPEDRIVE] Stack: ${error.stack}`);
    console.error(`[PIPEDRIVE] ==========================================`);
    throw error;
  }
}

/**
 * Función de ayuda: Formatear y limpiar datos de Pipedrive
 */
function formatearDatosPipedrive(
  orgData: any,
  personData: any,
  esOrganizacion: boolean
): {
  razonSocial: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  responsable?: string;
  email?: string;
  telefono?: string;
  esOrganizacion: boolean;
} {
  // Lógica para detectar RUT en cualquier campo de la empresa
  let rutDetectado = "";
  if (orgData) {
    const regexRut = /(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/i;
    
    // PRIMERO: Buscar en custom_fields (array) - según la respuesta real de Pipedrive
    if (orgData.custom_fields && Array.isArray(orgData.custom_fields)) {
      for (const field of orgData.custom_fields) {
        if (typeof field === 'string' && regexRut.test(field)) {
          const match = field.match(regexRut);
          if (match) {
            rutDetectado = match[0];
            console.log(`[PIPEDRIVE] ✅ RUT encontrado en custom_fields: ${rutDetectado}`);
            break;
          }
        }
      }
    }
    
    // SEGUNDO: Buscar en todos los campos de la organización si no se encontró en custom_fields
    if (!rutDetectado) {
      Object.values(orgData).forEach((val: any) => {
        if (typeof val === 'string' && regexRut.test(val)) {
          const match = val.match(regexRut);
          if (match && !rutDetectado) {
            rutDetectado = match[0];
            console.log(`[PIPEDRIVE] ✅ RUT encontrado en campo: ${rutDetectado}`);
          }
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
          // Buscar en objetos anidados (pero no en arrays, ya los procesamos arriba)
          Object.values(val).forEach((subVal: any) => {
            if (typeof subVal === 'string' && regexRut.test(subVal)) {
              const match = subVal.match(regexRut);
              if (match && !rutDetectado) {
                rutDetectado = match[0];
                console.log(`[PIPEDRIVE] ✅ RUT encontrado en objeto anidado: ${rutDetectado}`);
              }
            }
          });
        }
      });
    }
  }

  // Extraer datos de contacto de la persona (si existe)
  let email = "";
  let telefono = "";

  if (personData) {
    // Pipedrive devuelve emails y telefonos como arrays
    if (personData.email && Array.isArray(personData.email) && personData.email.length > 0) {
      email = personData.email[0].value || personData.email[0];
    } else if (personData.email && typeof personData.email === 'string') {
      email = personData.email;
    }

    if (personData.phone && Array.isArray(personData.phone) && personData.phone.length > 0) {
      telefono = personData.phone[0].value || personData.phone[0];
    } else if (personData.phone && typeof personData.phone === 'string') {
      telefono = personData.phone;
    }
  }

  // Construir dirección
  let direccion = "";
  if (orgData) {
    direccion = orgData.address_formatted || orgData.address || 
                (orgData.address_street_number && orgData.address_route 
                  ? `${orgData.address_street_number} ${orgData.address_route}`.trim()
                  : "");
  }

  // RETORNO: Objeto listo para usar
  return {
    razonSocial: orgData ? orgData.name : (personData ? personData.name : ""),
    rut: rutDetectado || undefined,
    direccion: direccion || undefined,
    ciudad: orgData ? (orgData.city || orgData.address_locality || orgData.address_admin_area_level_1) : undefined,
    responsable: personData ? personData.name : undefined,
    email: email || undefined,
    telefono: telefono || undefined,
    esOrganizacion: esOrganizacion,
  };
}

/**
 * Busca organizaciones en Pipedrive (función original mantenida para compatibilidad)
 */
export async function buscarOrganizaciones(
  query: string,
  limit: number = 10
): Promise<PipedriveOrganization[]> {
  const apiKey = await getPipedriveApiKey();
  const domain = await getPipedriveDomain();

  // IMPORTANTE: Usar el endpoint correcto con fields=name
  // Formato correcto: GET /v1/organizations/search?term=nombre&fields=name
  // El parámetro fields=name es CRÍTICO para que busque solo en nombres
  const url = `https://${domain}.pipedrive.com/api/v1/organizations/search?term=${encodeURIComponent(query)}&fields=name&limit=${limit}&api_token=${apiKey}`;

  console.log(`[PIPEDRIVE] 🔍 Buscando ORGANIZACIONES con término: "${query}"`);
  console.log(`[PIPEDRIVE] 🌐 Dominio: ${domain}`);
  console.log(`[PIPEDRIVE] 🔗 Endpoint: /v1/organizations/search?term=${encodeURIComponent(query)}&fields=name&limit=${limit}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PIPEDRIVE] ❌ Error HTTP ${response.status}:`, errorText);
      throw new Error(`Error al buscar en Pipedrive: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`[PIPEDRIVE] ✅ Respuesta recibida. Success: ${data.success}`);
    console.log(`[PIPEDRIVE] 📊 Estructura RAW recibida:`, JSON.stringify(data, null, 2));
    
    if (!data.success) {
      console.error(`[PIPEDRIVE] ❌ Error en respuesta:`, data.error);
      throw new Error(data.error || "Error desconocido en la búsqueda");
    }

    // IMPORTANTE: La estructura puede ser data.data.items[] donde cada item tiene .item
    // O puede ser directamente data.data.items[] con los objetos
    let items: PipedriveOrganization[] = [];
    
    if (data.data?.items && Array.isArray(data.data.items)) {
      // Verificar si los items tienen estructura anidada (items[0].item)
      if (data.data.items.length > 0 && data.data.items[0].item) {
        // Estructura: items[0].item contiene la organización
        items = data.data.items.map((item: any) => item.item);
        console.log(`[PIPEDRIVE] 📦 Estructura anidada detectada: items[].item`);
      } else {
        // Estructura directa: items[] contiene las organizaciones directamente
        items = data.data.items;
        console.log(`[PIPEDRIVE] 📦 Estructura directa detectada: items[]`);
      }
    }
    
    console.log(`[PIPEDRIVE] 📊 Items procesados: ${items.length}`);
    
    if (items.length === 0) {
      console.warn(`[PIPEDRIVE] ⚠️ Pipedrive respondió "success" (200 OK) pero la lista "items" está vacía.`);
      console.info(`[PIPEDRIVE] Posibles causas:`);
      console.info(`[PIPEDRIVE] 1. El término de búsqueda no coincide con ningún registro visible.`);
      console.info(`[PIPEDRIVE] 2. Tu usuario NO tiene permisos para ver esos tratos/organizaciones (Visibility Settings).`);
      console.info(`[PIPEDRIVE] 3. El término tiene menos de 2 caracteres.`);
      console.info(`[PIPEDRIVE] 💡 Solución: Verifica que el usuario del Token tenga permisos de "Ver todos los datos de la empresa"`);
    } else {
      console.log(`[PIPEDRIVE] ✅ ${items.length} organización(es) encontrada(s):`, items.map((i: any) => i.name || i.id).join(', '));
      // Mostrar detalles del primer item para debug
      if (items.length > 0) {
        console.log(`[PIPEDRIVE] 📋 Primer item:`, JSON.stringify(items[0], null, 2));
      }
    }

    return items;
  } catch (error: any) {
    console.error("[PIPEDRIVE] Error buscando organizaciones:", error);
    throw error;
  }
}

/**
 * Obtiene los detalles completos de una organización por ID
 */
export async function obtenerOrganizacionPorId(
  orgId: number
): Promise<PipedriveOrganization | null> {
  const apiKey = await getPipedriveApiKey();
  const domain = await getPipedriveDomain();

  // Incluir campos personalizados en la respuesta
  const url = `https://${domain}.pipedrive.com/api/v1/organizations/${orgId}?api_token=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error al obtener organización: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }

    return data.data;
  } catch (error: any) {
    console.error("Error obteniendo organización de Pipedrive:", error);
    throw error;
  }
}

/**
 * Mapea los datos de una organización de Pipedrive al formato del formulario
 * (Mantiene compatibilidad con código existente)
 */
export function mapearOrganizacionAFormulario(
  org: PipedriveOrganization
): {
  razon_social: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  email_cliente?: string;
  telefono_fijo?: string;
  celular?: string;
  responsable?: string;
} {
  // Si tenemos datos formateados de la función maestra, usarlos
  // Sino, usar la lógica original
  // Construir dirección completa
  let direccion = "";
  if (org.address) {
    direccion = org.address;
  } else if (org.address_route) {
    const parts = [
      org.address_street_number,
      org.address_route,
      org.address_sublocality,
    ].filter(Boolean);
    direccion = parts.join(" ");
  }

  // Obtener email principal
  const emailPrincipal = org.email?.find((e) => e.primary) || org.email?.[0];
  const email = emailPrincipal?.value || "";

  // Obtener teléfono principal
  const telefonoPrincipal = org.phone?.find((p) => p.primary) || org.phone?.[0];
  const telefono = telefonoPrincipal?.value || "";

  // Buscar RUT en campos personalizados (común en Pipedrive chileno)
  let rut: string | undefined;
  // Los campos personalizados pueden venir con diferentes nombres
  // Buscamos en campos que puedan contener "rut", "RUT", "tax_id", etc.
  // También buscamos en el objeto de campos personalizados si existe
  for (const [key, value] of Object.entries(org)) {
    if (key === "custom_fields" && typeof value === "object" && value !== null) {
      // Buscar en campos personalizados
      const customFields = value as Record<string, any>;
      for (const [fieldKey, fieldValue] of Object.entries(customFields)) {
        if (
          typeof fieldValue === "string" &&
          (fieldKey.toLowerCase().includes("rut") ||
            fieldKey.toLowerCase().includes("tax_id") ||
            fieldKey.toLowerCase().includes("taxid") ||
            fieldKey.toLowerCase().includes("r.u.t"))
        ) {
          rut = fieldValue;
          break;
        }
      }
      if (rut) break;
    } else if (
      typeof value === "string" &&
      (key.toLowerCase().includes("rut") ||
        key.toLowerCase().includes("tax_id") ||
        key.toLowerCase().includes("taxid") ||
        key.toLowerCase().includes("r.u.t"))
    ) {
      rut = value;
      break;
    }
  }

  return {
    razon_social: org.name || "",
    rut,
    direccion: direccion || undefined,
    ciudad: org.address_locality || org.address_admin_area_level_1 || undefined,
    email_cliente: email || undefined,
    telefono_fijo: telefono || undefined,
    celular: telefono || undefined, // Si solo hay un teléfono, usarlo para ambos
    responsable: undefined, // Este campo generalmente no está en Pipedrive
  };
}


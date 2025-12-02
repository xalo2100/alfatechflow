import { NextRequest, NextResponse } from "next/server";
import { getResendApiKey } from "@/lib/resend";

export const dynamic = 'force-dynamic';

// Función auxiliar para probar una API key
async function testResendApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  const cleanedKey = apiKey.trim().replace(/\s+/g, "").replace(/\n/g, "");

  if (!cleanedKey || cleanedKey.length < 10) {
    return { success: false, error: "API key inválida. El formato no es correcto." };
  }

  // Validar formato básico (las API keys de Resend empiezan con "re_")
  if (!cleanedKey.startsWith("re_")) {
    return { success: false, error: "El formato de la API key no es válido. Las API keys de Resend deben empezar con 're_'." };
  }

  try {
    // Probar la conexión usando el endpoint de dominios (más simple y no requiere datos)
    const testUrl = `https://api.resend.com/domains`;
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cleanedKey}`,
        "Content-Type": "application/json",
      },
    });

    // Si es 401 o 403, la API key es inválida
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || "API key inválida. Verifica que la API key sea correcta y tenga permisos." 
      };
    }

    // Si es 200, la API key es válida
    if (response.status === 200) {
      return { success: true };
    }

    // Para otros códigos de estado, verificar el contenido de la respuesta
    const data = await response.json().catch(() => ({}));
    
    // Si hay un error explícito en la respuesta
    if (data.error || data.message) {
      // Si el error no es de autenticación, la API key es válida pero hay otro problema
      if (response.status !== 401 && response.status !== 403) {
        return { success: true };
      }
      return { 
        success: false, 
        error: data.message || data.error || "API key inválida" 
      };
    }

    // Si llegamos aquí, asumimos que la API key es válida
    return { success: true };
  } catch (error: any) {
    console.error("Error probando API key de Resend:", error);
    return { 
      success: false, 
      error: error.message || "Error al probar la conexión. Verifica que la API key sea correcta." 
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener la API key de la base de datos
    let apiKey: string;
    try {
      apiKey = await getResendApiKey();
    } catch (error: any) {
      // Si hay un error al obtener la key (permisos, etc.), retornar un mensaje más claro
      if (error.message?.includes("permisos") || error.message?.includes("acceder a la configuración")) {
        return NextResponse.json(
          {
            success: false,
            error: "No se puede acceder a la configuración de Resend. Esto puede deberse a:\n1. La SERVICE_ROLE_KEY de Supabase no está configurada correctamente\n2. La tabla 'configuraciones' no existe o no tienes permisos\n3. Necesitas configurar las API keys nuevamente después de cambiar la configuración de Supabase",
          },
          { status: 500 }
        );
      }
      throw error;
    }

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { 
          success: false,
          error: "API key de Resend no configurada. Por favor, configúrala en el panel de administración.",
        },
        { status: 400 }
      );
    }

    const result = await testResendApiKey(apiKey);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error al probar la conexión",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conexión con Resend exitosa",
    });
  } catch (error: any) {
    console.error("Error probando conexión con Resend:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al probar la conexión. Verifica que la API key sea correcta.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "API key es requerida",
        },
        { status: 400 }
      );
    }

    const result = await testResendApiKey(apiKey);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "API key inválida",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key válida",
    });
  } catch (error: any) {
    console.error("Error validando API key de Resend:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al validar la API key",
      },
      { status: 500 }
    );
  }
}


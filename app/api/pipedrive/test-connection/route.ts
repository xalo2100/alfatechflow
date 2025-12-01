import { NextRequest, NextResponse } from "next/server";
import { getPipedriveApiKey, getPipedriveDomain } from "@/lib/pipedrive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey: providedKey, domain: providedDomain } = body;

    // Usar las credenciales proporcionadas o las de la base de datos
    let apiKey: string;
    let domain: string;

    if (providedKey && providedDomain) {
      // Validar con las credenciales proporcionadas
      apiKey = providedKey.trim();
      domain = providedDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.pipedrive\.com$/, "");
    } else {
      // Usar las credenciales guardadas
      apiKey = await getPipedriveApiKey();
      domain = await getPipedriveDomain();
    }

    if (!apiKey || !domain) {
      return NextResponse.json(
        { error: "API key y dominio son requeridos" },
        { status: 400 }
      );
    }

    // Hacer una llamada de prueba a la API de Pipedrive
    // Usamos el endpoint de usuarios para verificar que la API key funciona
    const testUrl = `https://${domain}.pipedrive.com/api/v1/users/me?api_token=${apiKey}`;

    const response = await fetch(testUrl);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Error al conectar con Pipedrive";

      if (response.status === 401) {
        errorMessage = "API key inválida. Verifica que sea correcta.";
      } else if (response.status === 404) {
        errorMessage = "Dominio no encontrado. Verifica que el dominio sea correcto.";
      } else {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
      }

      return NextResponse.json(
        { error: errorMessage, status: response.status },
        { status: 400 }
      );
    }

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Error desconocido en la respuesta de Pipedrive" },
        { status: 400 }
      );
    }

    // Si llegamos aquí, la conexión es exitosa
    return NextResponse.json({
      success: true,
      message: "Conexión con Pipedrive exitosa",
      user: data.data?.name || "Usuario",
      email: data.data?.email || "N/A",
    });
  } catch (error: any) {
    console.error("Error probando conexión con Pipedrive:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Error al probar la conexión. Verifica que el dominio y la API key sean correctos.",
      },
      { status: 500 }
    );
  }
}




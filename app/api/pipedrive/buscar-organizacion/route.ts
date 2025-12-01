import { NextRequest, NextResponse } from "next/server";
import { buscarOrganizaciones, obtenerOrganizacionPorId, mapearOrganizacionAFormulario, buscarEnPipedriveCompleto } from "@/lib/pipedrive";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const orgId = searchParams.get("id");

    if (orgId) {
      // Obtener organización específica por ID
      const org = await obtenerOrganizacionPorId(parseInt(orgId));
      if (!org) {
        return NextResponse.json(
          { error: "Organización no encontrada" },
          { status: 404 }
        );
      }

      const mapeado = mapearOrganizacionAFormulario(org);
      return NextResponse.json({ organizacion: org, formulario: mapeado });
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "La búsqueda debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    console.log(`[API] ==========================================`);
    console.log(`[API] 🔍 BÚSQUEDA SOLICITADA: "${query}"`);
    console.log(`[API] ==========================================`);
    
    try {
      // Usar la función maestra que busca en organizaciones Y personas
      console.log(`[API] 📞 Llamando a buscarEnPipedriveCompleto...`);
      const datosCompletos = await buscarEnPipedriveCompleto(query.trim());
      
      console.log(`[API] 📊 Resultado de buscarEnPipedriveCompleto:`, datosCompletos ? "ENCONTRADO" : "NO ENCONTRADO");
      
      if (!datosCompletos) {
        console.log(`[API] ⚠️ No se encontraron resultados para: "${query}"`);
        console.log(`[API] ==========================================`);
        return NextResponse.json({ resultados: [] });
      }

      console.log(`[API] ✅ Datos encontrados:`, JSON.stringify(datosCompletos, null, 2));
      
      // Formatear para el componente de búsqueda
      const resultado = {
        id: datosCompletos.esOrganizacion ? 1 : 0, // ID temporal
        name: datosCompletos.razonSocial,
        formulario: {
          razon_social: datosCompletos.razonSocial,
          rut: datosCompletos.rut,
          direccion: datosCompletos.direccion,
          ciudad: datosCompletos.ciudad,
          email_cliente: datosCompletos.email,
          telefono_fijo: datosCompletos.telefono,
          celular: datosCompletos.telefono,
          responsable: datosCompletos.responsable,
        },
        esOrganizacion: datosCompletos.esOrganizacion,
      };

      console.log(`[API] ✅ Retornando resultado formateado:`, JSON.stringify(resultado, null, 2));
      console.log(`[API] ==========================================`);
      return NextResponse.json({ resultados: [resultado] });
    } catch (error: any) {
      console.error(`[API] ==========================================`);
      console.error(`[API] ❌ ERROR EN BÚSQUEDA`);
      console.error(`[API] Mensaje:`, error.message);
      console.error(`[API] Stack:`, error.stack);
      console.error(`[API] ==========================================`);
      return NextResponse.json(
        { 
          error: error.message || "Error al buscar en Pipedrive", 
          resultados: [],
          detalles: error.stack 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en búsqueda de Pipedrive:", error);
    return NextResponse.json(
      { error: error.message || "Error al buscar en Pipedrive" },
      { status: 500 }
    );
  }
}


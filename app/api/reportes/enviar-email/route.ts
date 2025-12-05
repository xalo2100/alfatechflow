import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { sendEmail } from "@/lib/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const { reporteId, emailDestino, empresaId } = await request.json();

    if (!reporteId || !emailDestino) {
      return NextResponse.json(
        { error: "reporteId y emailDestino son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener el reporte completo
    const { data: reporte, error: reporteError } = await supabase
      .from("reportes")
      .select(`
        *,
        ticket:tickets(*),
        tecnico:perfiles!reportes_tecnico_id_fkey(nombre_completo, email)
      `)
      .eq("id", reporteId)
      .single();

    if (reporteError || !reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    let reporteData: any = {};
    try {
      reporteData = JSON.parse(reporte.reporte_ia as string);
    } catch {
      reporteData = {};
    }

    const htmlEmail = await generarHTMLReporte(reporte, reporteData);

    // Obtener configuración para el PDF
    let appConfig: any = await obtenerConfiguracionApp();

    // Si hay empresaId, intentar obtener datos de la empresa específica
    if (empresaId) {
      try {
        const adminClient = await createAdminClient();
        const { data: empresa, error: empresaError } = await adminClient
          .from("empresas")
          .select("nombre, logo_url")
          .eq("id", empresaId)
          .single();

        if (!empresaError && empresa) {
          console.log(`Usando configuración de empresa: ${empresa.nombre}`);
          appConfig = {
            nombre: empresa.nombre,
            logo: empresa.logo_url || appConfig.logo
          };
        }
      } catch (e) {
        console.error("Error obteniendo datos de empresa:", e);
      }
    }

    // Pre-procesar logo si es URL para que jsPDF pueda usarlo (Server-side)
    if (appConfig?.logo && appConfig.logo.startsWith('http')) {
      try {
        console.log('Descargando logo para PDF:', appConfig.logo);
        const response = await fetch(appConfig.logo);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/png';
          appConfig.logo = `data:${mimeType};base64,${base64}`;
          console.log('Logo convertido a base64 exitosamente');
        } else {
          console.warn('Error descargando logo, status:', response.status);
        }
      } catch (e) {
        console.error('Error procesando logo para PDF:', e);
      }
    }

    // Generar PDF para adjuntar
    let pdfAttachment = null;
    try {
      console.log('Intentando generar PDF para adjuntar...');
      const { generarPDFDirecto } = await import('@/lib/pdf/generar-pdf-directo');
      // Ahora devuelve ArrayBuffer directamente
      const pdfArrayBuffer = generarPDFDirecto(reporte, appConfig);
      console.log('PDF generado, tamaño ArrayBuffer:', pdfArrayBuffer.byteLength);

      const buffer = Buffer.from(pdfArrayBuffer);

      if (buffer.length > 0) {
        pdfAttachment = {
          filename: `Reporte_Tecnico_${reporte.ticket_id}.pdf`,
          content: buffer,
        };
        console.log('Adjunto PDF preparado correctamente');
      }
    } catch (pdfError) {
      console.error('Error generando PDF para adjuntar:', pdfError);
    }

    // Generar cuerpo formal del email (Texto simple + HTML básico)
    const nombreCliente = reporteData.responsable || reporte.ticket?.cliente_nombre || "Cliente";
    const numeroReporte = reporte.ticket_id;

    const formalEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
        <p>Junto con saludar, adjuntamos el <strong>Reporte Técnico N° ${numeroReporte}</strong> con el detalle de los trabajos realizados.</p>
        <p>Quedamos atentos a cualquier duda o consulta.</p>
        <br>
        <p>Atentamente,</p>
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
          <p style="margin: 0; font-weight: bold; color: #ff6600;">Soporte Técnico Alfapack SpA</p>
          <p style="margin: 5px 0; font-size: 14px;">
            <a href="mailto:soportetecnico@alfapack.cl" style="color: #666; text-decoration: none;">soportetecnico@alfapack.cl</a><br>
            Tel: +56 2323 33 610
          </p>
        </div>
      </div>
    `;

    // Enviar email usando el servicio directamente
    const emailOptions: any = {
      to: emailDestino,
      subject: `Reporte Técnico N° ${reporte.ticket_id} - Alfapack SpA`,
      html: formalEmailHtml,
      from: "Soporte Técnico Alfapack <soportetecnico@alfapack.cl>",
    };

    // Agregar adjunto si se generó correctamente
    if (pdfAttachment) {
      emailOptions.attachments = [pdfAttachment];
      console.log('Enviando email con adjunto PDF');
    } else {
      console.log('Enviando email SIN adjunto PDF');
    }

    const result = await sendEmail(emailOptions);

    return NextResponse.json({ success: true, message: "Email enviado correctamente", id: result.id });
  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar el email" },
      { status: 500 }
    );
  }
}

async function obtenerConfiguracionApp() {
  try {
    const adminClient = await createAdminClient();
    const { data: configNombre } = await adminClient
      .from("configuraciones")
      .select("valor, valor_encriptado")
      .eq("clave", "app_nombre")
      .maybeSingle();

    const { data: configLogo } = await adminClient
      .from("configuraciones")
      .select("valor, valor_encriptado")
      .eq("clave", "app_logo")
      .maybeSingle();

    return {
      nombre: configNombre?.valor || configNombre?.valor_encriptado || "α pack - Alfapack SpA",
      logo: configLogo?.valor || configLogo?.valor_encriptado || null,
    };
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return {
      nombre: "α pack - Alfapack SpA",
      logo: null,
    };
  }
}

async function generarHTMLReporte(reporte: any, reporteData: any): Promise<string> {
  const appConfig = await obtenerConfiguracionApp();
  const fecha = new Date(reporte.created_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const logoHTML = appConfig.logo
    ? `<img src="${appConfig.logo}" alt="${appConfig.nombre}" style="max-height: 60px; margin-bottom: 10px; width: auto; object-fit: contain;" />`
    : `<div class="logo-text">${appConfig.nombre}</div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Técnico N° ${reporte.ticket_id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ff6600;
    }
    .logo-section {
      flex: 1;
    }
    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: #ff6600;
      margin-bottom: 8px;
    }
    .company-info {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .reporte-num {
      background-color: #ff6600;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      text-align: center;
      min-width: 140px;
    }
    .reporte-num-title {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .reporte-num-value {
      font-size: 24px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      background-color: #3C3C3C;
      color: white;
      padding: 10px 15px;
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 12px;
      border-radius: 0px;
      letter-spacing: 0.5px;
    }
    .section-content {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #ff6600;
      border-radius: 3px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .info-item {
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 3px;
      border: 1px solid #e0e0e0;
    }
    .info-label {
      font-size: 10px;
      color: #666;
      margin-bottom: 4px;
      font-weight: normal;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 12px;
      color: #000;
      font-weight: bold;
    }
    .text-area {
      min-height: 80px;
      padding: 10px;
      background-color: white;
      border-radius: 3px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .table th {
      background-color: #3C3C3C;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.3px;
    }
    .table td {
      padding: 8px;
      border: 1px solid #ddd;
      font-size: 12px;
      color: #333;
      background-color: white;
    }
    .table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .signature-box {
      border: 2px solid #333;
      padding: 20px;
      min-height: 80px;
      border-radius: 3px;
    }
    .signature-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
      font-weight: bold;
    }
  </style>
</head>
<body>
    <div class="container">
    <div class="header">
      <div class="logo-section">
        ${logoHTML}
        <div class="company-info">
          Rut: 76.802.874-5<br>
          Av. Presidente Jorge Alessandri R. N°24429, San Bernardo, Santiago.<br>
          Tel: +56 2323 33 610 - alfapack@alfapack.cl
        </div>
      </div>
      <div class="reporte-num">
        <div class="reporte-num-title">REPORTE TÉCNICO</div>
        <div class="reporte-num-value">N° ${reporte.ticket_id}</div>
      </div>
    </div>

    ${generarSeccionCliente(reporte, reporteData)}
    ${generarSeccionEquipo(reporteData)}
    ${generarSeccionTipoServicio(reporteData)}
    ${generarSeccionDiagnostico(reporteData)}
    ${generarSeccionTrabajoRealizado(reporteData)}
    ${generarSeccionObservacion(reporteData)}
    ${generarSeccionRepuestos(reporte, reporteData)}
    ${generarSeccionTiempos(reporteData)}
    ${generarSeccionFirmas(reporte, reporteData)}
    
    <!-- Pixel de seguimiento para detectar cuando el cliente lee el email -->
    <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reportes/track-lectura?reporteId=${reporte.id}" 
         width="1" 
         height="1" 
         style="display: none; position: absolute; visibility: hidden;" 
         alt="" />
  </div>
</body>
</html>
  `;
}

function generarSeccionCliente(reporte: any, reporteData: any): string {
  return `
    <div class="section">
      <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
      <div class="section-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">RAZÓN SOCIAL</div>
            <div class="info-value">${reporteData.razon_social || reporte.ticket?.cliente_nombre || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">FECHA</div>
            <div class="info-value">${reporteData.fecha || new Date(reporte.created_at).toLocaleDateString('es-CL')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">RUT</div>
            <div class="info-value">${reporteData.rut || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">PLANTA</div>
            <div class="info-value">${reporteData.planta || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">DIRECCIÓN</div>
            <div class="info-value">${reporteData.direccion || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CIUDAD</div>
            <div class="info-value">${reporteData.ciudad || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">RESPONSABLE</div>
            <div class="info-value">${reporteData.responsable || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">TELÉFONO FIJO</div>
            <div class="info-value">${reporteData.telefono_fijo || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">E-MAIL</div>
            <div class="info-value">${reporteData.email_cliente || reporte.ticket?.cliente_contacto || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CELULAR</div>
            <div class="info-value">${reporteData.celular || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">FACTURABLE</div>
            <div class="info-value">${reporteData.facturable ? "SÍ" : "NO"}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generarSeccionEquipo(reporteData: any): string {
  if (!reporteData.equipos || reporteData.equipos.length === 0) return "";

  const rows = reporteData.equipos.map((eq: any) => `
    <tr>
      <td>${eq.maquina || ""}</td>
      <td>${eq.modelo || ""}</td>
      <td>${eq.numero_serie || ""}</td>
      <td>${eq.ano || ""}</td>
    </tr>
  `).join("");

  return `
    <div class="section">
      <div class="section-title">EQUIPO</div>
      <div class="section-content">
        <table class="table">
          <thead>
            <tr>
              <th>MÁQUINA</th>
              <th>MODELO</th>
              <th>N° SERIE</th>
              <th>AÑO</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generarSeccionTipoServicio(reporteData: any): string {
  if (!reporteData.tipo_servicio || reporteData.tipo_servicio.length === 0) return "";

  const tipos = {
    garantia: "GARANTÍA",
    contrato: "CONTRATO",
    reparacion: "REPARACIÓN",
    demostracion: "DEMOSTRACIÓN",
    visita_cortesia: "VISITA DE CORTESÍA",
    retiro_entrega: "RETIRO / ENTREGA",
    puesta_marcha: "PUESTA EN MARCHA",
    cotizacion: "COTIZACIÓN",
    recuperacion: "RECUPERACIÓN"
  };

  const serviciosMarcados = Array.isArray(reporteData.tipo_servicio)
    ? reporteData.tipo_servicio.map((t: string) => tipos[t as keyof typeof tipos] || t).join(", ")
    : tipos[reporteData.tipo_servicio as keyof typeof tipos] || reporteData.tipo_servicio;

  return `
    <div class="section">
      <div class="section-title">TIPO DE SERVICIO</div>
      <div class="section-content">
        <div class="info-value">${serviciosMarcados}</div>
      </div>
    </div>
  `;
}

function generarSeccionDiagnostico(reporteData: any): string {
  if (!reporteData.diagnostico) return "";
  return `
    <div class="section">
      <div class="section-title">DIAGNÓSTICO</div>
      <div class="section-content">
        <div class="text-area">${reporteData.diagnostico}</div>
      </div>
    </div>
  `;
}

function generarSeccionTrabajoRealizado(reporteData: any): string {
  if (!reporteData.trabajo_realizado) return "";
  return `
    <div class="section">
      <div class="section-title">TRABAJO REALIZADO</div>
      <div class="section-content">
        <div class="text-area">${reporteData.trabajo_realizado}</div>
      </div>
    </div>
  `;
}

function generarSeccionObservacion(reporteData: any): string {
  if (!reporteData.observacion) return "";
  return `
    <div class="section">
      <div class="section-title">OBSERVACIÓN</div>
      <div class="section-content">
        <div class="text-area">${reporteData.observacion}</div>
      </div>
    </div>
  `;
}

function generarSeccionRepuestos(reporte: any, reporteData: any): string {
  if (!reporteData.repuestos || reporteData.repuestos.length === 0) return "";

  const rows = reporteData.repuestos.map((rep: any) => `
    <tr>
      <td>${rep.codigo || ""}</td>
      <td>${rep.cantidad || ""}</td>
      <td>${rep.descripcion || ""}</td>
      <td>${rep.garantia ? "SÍ" : "NO"}</td>
    </tr>
  `).join("");

  return `
    <div class="section">
      <div class="section-title">REPUESTOS Y/O MATERIALES UTILIZADOS</div>
      <div class="section-content">
        <table class="table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>CANTIDAD</th>
              <th>DESCRIPCIÓN DE MERCADERÍAS</th>
              <th>GARANTÍA</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generarSeccionTiempos(reporteData: any): string {
  if (!reporteData.hora_entrada && !reporteData.hora_salida && !reporteData.horas_trabajo) return "";

  const totalHoras = (
    (parseFloat(reporteData.horas_trabajo || 0) + parseFloat(reporteData.horas_espera || 0) +
      parseFloat(reporteData.tiempo_ida || 0) + parseFloat(reporteData.tiempo_regreso || 0))
  ).toFixed(2);

  return `
    <div class="section">
      <div class="section-title">TIEMPOS</div>
      <div class="section-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">HORA ENTRADA</div>
            <div class="info-value">${reporteData.hora_entrada || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">HORA SALIDA</div>
            <div class="info-value">${reporteData.hora_salida || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">HORAS ESPERA</div>
            <div class="info-value">${reporteData.horas_espera || "0"}h</div>
          </div>
          <div class="info-item">
            <div class="info-label">HORAS TRABAJO</div>
            <div class="info-value">${reporteData.horas_trabajo || "0"}h</div>
          </div>
          <div class="info-item">
            <div class="info-label">TIEMPO IDA</div>
            <div class="info-value">${reporteData.tiempo_ida || "0"}h</div>
          </div>
          <div class="info-item">
            <div class="info-label">TIEMPO REGRESO</div>
            <div class="info-value">${reporteData.tiempo_regreso || "0"}h</div>
          </div>
          <div class="info-item">
            <div class="info-label">TOTAL HORAS</div>
            <div class="info-value">${totalHoras}h</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generarSeccionFirmas(reporte: any, reporteData: any): string {
  return `
    <div class="footer">
      <div class="signature-box">
        <div class="signature-label">NOMBRE Y FIRMA TÉCNICO</div>
        <div style="margin-top: 10px; font-weight: bold; color: #333;">${reporte.tecnico?.nombre_completo || "N/A"}</div>
        ${reporteData.firma_tecnico && reporteData.firma_tecnico.imagen ? `
        <div style="margin-top: 15px;">
          <div style="font-size: 10px; color: #666; margin-bottom: 5px;">Firmado por: ${reporteData.firma_tecnico.nombre}</div>
          <img src="${reporteData.firma_tecnico.imagen}" 
               alt="Firma del técnico" 
               style="max-width: 200px; max-height: 80px; width: auto; height: auto; border: 1px solid #ddd; padding: 5px; background: white; display: block;" />
        </div>
        ` : `
        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 5px;"></div>
        `}
      </div>
      <div class="signature-box">
        <div class="signature-label">NOMBRE Y FIRMA CLIENTE</div>
        ${reporteData.firma_cliente && reporteData.firma_cliente.nombre ? `
        <div style="margin-top: 10px; font-weight: bold; color: #333;">${reporteData.firma_cliente.nombre}</div>
        ` : ''}
        ${reporteData.firma_cliente && reporteData.firma_cliente.imagen ? `
        <div style="margin-top: 15px;">
          <div style="font-size: 10px; color: #666; margin-bottom: 5px;">Firmado por: ${reporteData.firma_cliente.nombre}</div>
          <img src="${reporteData.firma_cliente.imagen}" 
               alt="Firma del cliente" 
               style="max-width: 200px; max-height: 80px; width: auto; height: auto; border: 1px solid #ddd; padding: 5px; background: white; display: block;" />
        </div>
        ` : `
        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 5px;"></div>
        `}
      </div>
    </div>
    <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #666;">
      <div>ORIGINAL: CLIENTE | 1ª COPIA: SERVICIO TÉCNICO | 2ª COPIA: CONTROL INTERNO</div>
    </div>
  `;
}

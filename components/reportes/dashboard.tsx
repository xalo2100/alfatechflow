"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, Search, Eye, Radio, BarChart3, Calendar, Filter, Grid3x3, List, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAppConfig } from "@/lib/app-config";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/supabase";
import { ReporteDetailDialog } from "@/components/reportes/reporte-detail-dialog";
import { ReporteListView } from "@/components/reportes/reporte-list-view";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface ReporteConTicket extends Reporte {
  ticket?: Ticket;
  tecnico?: { nombre_completo: string; email: string };
}

export function ReportesDashboard({ perfil }: { perfil: any }) {
  const [reportes, setReportes] = useState<ReporteConTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReporte, setSelectedReporte] = useState<ReporteConTicket | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connected" | "disconnected">("connected");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroTipoServicio, setFiltroTipoServicio] = useState<string>("todos");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const supabase = createClient();
  const router = useRouter();

  const fetchReportes = async () => {
    setLoading(true);
    const { data: reportesData, error } = await supabase
      .from("reportes")
      .select(`
        *,
        ticket:tickets(*),
        tecnico:perfiles!reportes_tecnico_id_fkey(nombre_completo, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reportes:", error);
    } else {
      setReportes((reportesData as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReportes();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel("reportes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reportes",
        },
        (payload) => {
          console.log("🔄 Cambio detectado en reportes:", payload);
          setRealtimeStatus("connected");
          
          // Si se actualizó un reporte, verificar si fue por lectura de email
          if (payload.eventType === "UPDATE" && payload.new) {
            try {
              const reporteData = JSON.parse((payload.new as any).reporte_ia as string);
              if (reporteData.lectura_email && reporteData.lectura_email.leido) {
                const reporteActualizado = reportes.find(r => r.id === (payload.new as any).id);
                if (reporteActualizado) {
                  const clienteNombre = reporteActualizado.ticket?.cliente_nombre || "Cliente";
                  const fechaLectura = new Date(reporteData.lectura_email.fecha_lectura).toLocaleString('es-CL');
                  console.log(`📧 ${clienteNombre} ha leído el reporte del ticket #${reporteActualizado.ticket_id} el ${fechaLectura}`);
                  // Mostrar notificación visual
                  alert(`📧 Notificación: ${clienteNombre} ha leído el reporte del ticket #${reporteActualizado.ticket_id}`);
                }
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
          
          fetchReportes();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredReportes = reportes.filter((reporte) => {
    // Filtro de búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clienteNombre = reporte.ticket?.cliente_nombre?.toLowerCase() || "";
      const ticketId = reporte.ticket_id?.toString() || "";
      const tecnicoNombre = reporte.tecnico?.nombre_completo?.toLowerCase() || "";
      if (!(
        clienteNombre.includes(term) ||
        ticketId.includes(term) ||
        tecnicoNombre.includes(term)
      )) {
        return false;
      }
    }

    // Filtro por técnico
    if (filtroTecnico !== "todos" && reporte.tecnico_id !== filtroTecnico) {
      return false;
    }

    // Filtro por tipo de servicio
    if (filtroTipoServicio !== "todos") {
      let reporteData: any = {};
      try {
        reporteData = JSON.parse(reporte.reporte_ia as string);
      } catch {
        reporteData = {};
      }
      if (reporteData.tipo_servicio !== filtroTipoServicio) {
        return false;
      }
    }

    // Filtro por fecha
    if (filtroFechaDesde || filtroFechaHasta) {
      const fechaReporte = new Date(reporte.created_at);
      if (filtroFechaDesde) {
        const desde = new Date(filtroFechaDesde);
        desde.setHours(0, 0, 0, 0);
        if (fechaReporte < desde) return false;
      }
      if (filtroFechaHasta) {
        const hasta = new Date(filtroFechaHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fechaReporte > hasta) return false;
      }
    }

    return true;
  });

  // Calcular estadísticas
  const estadisticas = {
    total: reportes.length,
    facturables: reportes.filter(r => {
      try {
        const data = JSON.parse(r.reporte_ia as string);
        return data.facturable === true;
      } catch {
        return false;
      }
    }).length,
    conCosto: reportes.filter(r => r.costo_reparacion && Number(r.costo_reparacion) > 0).length,
    totalCosto: reportes.reduce((sum, r) => {
      return sum + (r.costo_reparacion ? Number(r.costo_reparacion) : 0);
    }, 0),
  };

  // Obtener técnicos únicos para el filtro
  const tecnicosUnicos = reportes
    .filter(r => r.tecnico && r.tecnico_id)
    .reduce((acc: Array<{ id: string; nombre: string }>, r) => {
      if (!acc.find(t => t.id === r.tecnico_id)) {
        acc.push({
          id: r.tecnico_id || "",
          nombre: r.tecnico?.nombre_completo || ""
        });
      }
      return acc;
    }, []);

  const descargarReportePDF = async (reporte: ReporteConTicket) => {
    let reporteData: any = {};
    try {
      reporteData = JSON.parse(reporte.reporte_ia as string);
    } catch {
      reporteData = {};
    }

    // Márgenes del PDF (2cm arriba/abajo, 1.5cm izquierda/derecha)
    const marginTop = 20;
    const marginBottom = 20;
    const marginLeft = 15;
    const marginRight = 15;
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const contentWidth = pageWidth - marginLeft - marginRight;
    const contentHeight = pageHeight - marginTop - marginBottom;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const htmlCompleto = generarHTMLReporte(reporte, reporteData);

    // Función auxiliar para generar una página desde HTML usando iframe
    const generarPaginaDesdeHTML = async (html: string): Promise<{ imgData: string; width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        // Crear un iframe oculto para renderizar el HTML
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '680px';
        iframe.style.height = '10000px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const processIframe = async () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              throw new Error('No se pudo acceder al documento del iframe');
            }

            // Esperar a que el documento esté listo
            await new Promise(resolve => setTimeout(resolve, 300));

            // Obtener el body del iframe
            const iframeBody = iframeDoc.body;
            if (!iframeBody) {
              throw new Error('No se encontró el body en el iframe');
            }

            // Esperar a que todas las imágenes se carguen
            const images = iframeBody.querySelectorAll('img');
            if (images.length > 0) {
              await Promise.all(
                Array.from(images).map((img) => {
                  if (img.complete && (img as HTMLImageElement).naturalWidth > 0) return Promise.resolve();
                  return new Promise((resolve) => {
                    img.onload = () => resolve(null);
                    img.onerror = () => resolve(null);
                    setTimeout(() => resolve(null), 5000);
                  });
                })
              );
            }

            // Esperar un poco más para asegurar el renderizado completo
            await new Promise(resolve => setTimeout(resolve, 500));

            // Obtener dimensiones reales
            const width = iframeBody.scrollWidth || iframeBody.offsetWidth || 680;
            const height = Math.max(iframeBody.scrollHeight || iframeBody.offsetHeight, 100);

            console.log('Dimensiones del contenido:', width, 'x', height);

            // Verificar que hay contenido
            const hasContent = iframeBody.textContent && iframeBody.textContent.trim().length > 0;
            if (!hasContent) {
              throw new Error('Error: El contenido del reporte está vacío');
            }

            // Capturar con html2canvas
            const canvas = await html2canvas(iframeBody, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              width: width,
              height: height,
              allowTaint: true,
              imageTimeout: 10000,
              windowWidth: width,
              windowHeight: height,
            });

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
              throw new Error('Error: Canvas vacío o inválido');
            }

            console.log('Canvas generado:', canvas.width, 'x', canvas.height);

            const imgData = canvas.toDataURL('image/png', 1.0);
            if (!imgData || imgData === 'data:,') {
              throw new Error('Error: No se pudo generar la imagen desde el canvas');
            }

            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Limpiar
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }

            resolve({ imgData, width: imgWidth, height: imgHeight });
          } catch (error) {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            reject(error);
          }
        };

        // Escribir el HTML en el iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          document.body.removeChild(iframe);
          reject(new Error('No se pudo acceder al documento del iframe'));
          return;
        }

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Procesar cuando el iframe esté listo
        if (iframeDoc.readyState === 'complete') {
          processIframe();
        } else {
          iframe.onload = () => processIframe();
        }
      });
    };

    try {
      // Crear un parser para dividir el contenido
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlCompleto, 'text/html');
      const body = doc.body;

      // Verificar que el HTML se parseó correctamente
      if (!body) {
        throw new Error('Error parseando el HTML del reporte');
      }

      // Encontrar el header y estilos
      const header = body.querySelector('.header');
      const estilos = doc.querySelector('style')?.outerHTML || '';

      // Encontrar todas las secciones
      const todasLasSecciones = Array.from(body.querySelectorAll('.section'));
      
      // Si no hay secciones, usar el HTML completo
      if (todasLasSecciones.length === 0) {
        console.warn('No se encontraron secciones, usando HTML completo');
        // Extraer solo el contenido del body para evitar problemas de renderizado
        const parserCompleto = new DOMParser();
        const docCompleto = parserCompleto.parseFromString(htmlCompleto, 'text/html');
        const bodyCompleto = docCompleto.body;
        const estilosCompleto = docCompleto.querySelector('style')?.outerHTML || '';
        
        if (!bodyCompleto) {
          throw new Error('Error: No se pudo parsear el HTML del reporte');
        }
        
        const htmlCompletoLimpio = `<div style="width: 680px; background: white; font-family: Arial, sans-serif;">${estilosCompleto}${bodyCompleto.innerHTML}</div>`;
        
        const paginaCompleta = await generarPaginaDesdeHTML(htmlCompletoLimpio);
        if (!paginaCompleta || !paginaCompleta.imgData) {
          throw new Error('Error generando PDF completo');
        }
        let heightLeft = paginaCompleta.height;
        let yPosition = marginTop;
        
        pdf.addImage(paginaCompleta.imgData, 'PNG', marginLeft, yPosition, paginaCompleta.width, paginaCompleta.height);
        heightLeft -= contentHeight;
        
        while (heightLeft > 0) {
          yPosition = marginTop - (paginaCompleta.height - heightLeft);
          pdf.addPage();
          pdf.addImage(paginaCompleta.imgData, 'PNG', marginLeft, yPosition, paginaCompleta.width, paginaCompleta.height);
          heightLeft -= contentHeight;
        }
        
        const fileName = `Reporte_Tecnico_${reporte.ticket_id}_${format(new Date(reporte.created_at), 'yyyy-MM-dd', { locale: es })}.pdf`;
        pdf.save(fileName);
        return;
      }
      
      // Encontrar índices de las secciones clave
      let indiceTipoServicio = -1;
      let indiceTiempos = -1;
      
      todasLasSecciones.forEach((section, index) => {
        const title = section.querySelector('.section-title')?.textContent || '';
        if (title.includes('TIPO DE SERVICIO')) {
          indiceTipoServicio = index;
        }
        if (title.includes('TIEMPOS')) {
          indiceTiempos = index;
        }
      });

      // Página 1: Header + secciones hasta antes de TIPO DE SERVICIO
      const seccionesPagina1 = todasLasSecciones.slice(0, indiceTipoServicio >= 0 ? indiceTipoServicio : todasLasSecciones.length);
      const htmlPagina1 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${estilos}
</head>
<body>
  <div class="content-wrapper">
    ${header?.outerHTML || ''}
    ${seccionesPagina1.map(s => s.outerHTML).join('')}
  </div>
</body>
</html>`;

      console.log('Generando página 1, secciones:', seccionesPagina1.length);
      const pagina1 = await generarPaginaDesdeHTML(htmlPagina1);
      if (!pagina1 || !pagina1.imgData || pagina1.height === 0) {
        console.error('Error en página 1:', pagina1);
        throw new Error('Error generando página 1 del PDF');
      }
      console.log('Página 1 generada, dimensiones:', pagina1.width, 'x', pagina1.height);
      pdf.addImage(pagina1.imgData, 'PNG', marginLeft, marginTop, pagina1.width, pagina1.height);

      // Página 2: TIPO DE SERVICIO hasta antes de TIEMPOS
      let pagina2: { imgData: string; width: number; height: number } | null = null;
      if (indiceTipoServicio >= 0) {
        const seccionesPagina2 = todasLasSecciones.slice(
          indiceTipoServicio,
          indiceTiempos >= 0 ? indiceTiempos : todasLasSecciones.length
        );
        const htmlPagina2 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${estilos}
</head>
<body>
  <div class="content-wrapper">
    ${seccionesPagina2.map(s => s.outerHTML).join('')}
  </div>
</body>
</html>`;

        console.log('Generando página 2, secciones:', seccionesPagina2.length);
        pagina2 = await generarPaginaDesdeHTML(htmlPagina2);
        if (!pagina2 || !pagina2.imgData || pagina2.height === 0) {
          console.error('Error en página 2:', pagina2);
          throw new Error('Error generando página 2 del PDF');
        }
        console.log('Página 2 generada, dimensiones:', pagina2.width, 'x', pagina2.height);
        pdf.addPage();
        pdf.addImage(pagina2.imgData, 'PNG', marginLeft, marginTop, pagina2.width, pagina2.height);
      }

      // Página 3: TIEMPOS en adelante + footer (ORIGINAL: CLIENTE)
      let pagina3: { imgData: string; width: number; height: number } | null = null;
      if (indiceTiempos >= 0) {
        const seccionesPagina3 = todasLasSecciones.slice(indiceTiempos);
        const footer = body.querySelector('.footer')?.outerHTML || '';
        // Footer para ORIGINAL (primera copia)
        const footerTextOriginal = `
<div style="text-align: center; margin-top: 30px; font-size: 10px; color: #999;">
  <strong style="color: #000;">ORIGINAL: CLIENTE</strong> | 1ª COPIA: SERVICIO TÉCNICO
</div>`;
        
        const htmlPagina3 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${estilos}
</head>
<body>
  <div class="content-wrapper">
    ${seccionesPagina3.map(s => s.outerHTML).join('')}
    ${footer}
    ${footerTextOriginal}
  </div>
</body>
</html>`;

        console.log('Generando página 3, secciones:', seccionesPagina3.length);
        pagina3 = await generarPaginaDesdeHTML(htmlPagina3);
        if (!pagina3 || !pagina3.imgData || pagina3.height === 0) {
          console.error('Error en página 3:', pagina3);
          throw new Error('Error generando página 3 del PDF');
        }
        console.log('Página 3 generada, dimensiones:', pagina3.width, 'x', pagina3.height);
        pdf.addPage();
        
        // Agregar la imagen completa
        let heightLeft = pagina3.height;
        let yPosition = marginTop;
        
        pdf.addImage(pagina3.imgData, 'PNG', marginLeft, yPosition, pagina3.width, pagina3.height);
        heightLeft -= contentHeight;
        
        // Agregar páginas adicionales si es necesario
        while (heightLeft > 0) {
          yPosition = marginTop - (pagina3.height - heightLeft);
          pdf.addPage();
          pdf.addImage(pagina3.imgData, 'PNG', marginLeft, yPosition, pagina3.width, pagina3.height);
          heightLeft -= contentHeight;
        }
      }

      // ===== COPIAS ADICIONALES =====
      // Página 4-6: 1ª COPIA (SERVICIO TÉCNICO) - Duplicar páginas 1-3
      console.log('Generando copias adicionales...');
      
      // Página 4: Duplicar página 1
      pdf.addPage();
      pdf.addImage(pagina1.imgData, 'PNG', marginLeft, marginTop, pagina1.width, pagina1.height);

      // Página 5: Duplicar página 2 (si existe)
      if (pagina2) {
        pdf.addPage();
        pdf.addImage(pagina2.imgData, 'PNG', marginLeft, marginTop, pagina2.width, pagina2.height);
      }

      // Página 6: Duplicar página 3 con footer modificado (1ª COPIA)
      if (pagina3 && indiceTiempos >= 0) {
        const seccionesPagina3 = todasLasSecciones.slice(indiceTiempos);
        const footer = body.querySelector('.footer')?.outerHTML || '';
        // Footer para 1ª COPIA
        const footerTextCopia1 = `
<div style="text-align: center; margin-top: 30px; font-size: 10px; color: #999;">
  ORIGINAL: CLIENTE | <strong style="color: #000;">1ª COPIA: SERVICIO TÉCNICO</strong>
</div>`;
        
        const htmlPagina3Copia1 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${estilos}
</head>
<body>
  <div class="content-wrapper">
    ${seccionesPagina3.map(s => s.outerHTML).join('')}
    ${footer}
    ${footerTextCopia1}
  </div>
</body>
</html>`;

        const pagina3Copia1 = await generarPaginaDesdeHTML(htmlPagina3Copia1);
        if (pagina3Copia1 && pagina3Copia1.imgData && pagina3Copia1.height > 0) {
          pdf.addPage();
          let heightLeft = pagina3Copia1.height;
          let yPosition = marginTop;
          
          pdf.addImage(pagina3Copia1.imgData, 'PNG', marginLeft, yPosition, pagina3Copia1.width, pagina3Copia1.height);
          heightLeft -= contentHeight;
          
          while (heightLeft > 0) {
            yPosition = marginTop - (pagina3Copia1.height - heightLeft);
            pdf.addPage();
            pdf.addImage(pagina3Copia1.imgData, 'PNG', marginLeft, yPosition, pagina3Copia1.width, pagina3Copia1.height);
            heightLeft -= contentHeight;
          }
        }
      }


      const fileName = `Reporte_Tecnico_${reporte.ticket_id}_${format(new Date(reporte.created_at), 'yyyy-MM-dd', { locale: es })}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const exportarReporte = (reporte: ReporteConTicket) => {
    // Crear ventana para imprimir
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    let reporteData: any = {};
    try {
      reporteData = JSON.parse(reporte.reporte_ia as string);
    } catch {
      reporteData = {};
    }

    const html = generarHTMLReporte(reporte, reporteData);
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 250);
  };

  const generarHTMLReporte = (reporte: ReporteConTicket, reporteData: any) => {
    const appConfig = getAppConfig();
    const logoHTML = appConfig?.logo 
      ? `<img src="${appConfig.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />`
      : `<div class="logo">${appConfig?.nombre || "α pack - Alfapack SpA"}</div>`;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Técnico #${reporte.ticket_id}</title>
  <style>
    @media print {
      @page { 
        margin: 2cm 1.5cm;
        size: A4;
      }
      body { 
        margin: 0;
        padding: 0;
      }
      .page-break-before {
        page-break-before: always;
      }
      .page-break-after {
        page-break-after: always;
      }
      .no-break {
        page-break-inside: avoid;
      }
    }
    body {
      font-family: Arial, sans-serif;
      width: 180mm;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      background-color: #ffffff;
    }
    .content-wrapper {
      padding: 20mm 15mm;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 2px solid #ff6600;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #ff6600;
    }
    .reporte-num {
      text-align: right;
      background: #ff6600;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
    }
    .section {
      margin-bottom: 20px;
    }
    .page-break-before {
      page-break-before: always;
    }
    .page-break-after {
      page-break-after: always;
    }
    .no-break {
      page-break-inside: avoid;
    }
    .section-title {
      background: #333;
      color: white;
      padding: 10px;
      margin: 20px 0 10px 0;
      font-weight: bold;
      border-radius: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .info-item {
      padding: 10px;
      background: #f5f5f5;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .info-value {
      font-weight: bold;
    }
    .content-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #ff6600;
      margin: 10px 0;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .repuestos-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .repuestos-table th, .repuestos-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .repuestos-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .equipos-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .equipos-table th, .equipos-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .equipos-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
  <div class="header">
    <div>
      ${logoHTML}
      <div style="font-size: 12px; color: #666; margin-top: 10px;">
        Rut: 76.802.874-5<br>
        Av. Presidente Jorge Alessandri R. N°24429, San Bernardo, Santiago.<br>
        Tel: +56 2323 33 610 - alfapack@alfapack.cl
      </div>
    </div>
    <div class="reporte-num">
      <div>REPORTE TÉCNICO</div>
      <div style="font-size: 24px; margin-top: 5px;">N° ${reporte.ticket_id}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Razón Social</div>
        <div class="info-value">${reporteData.razon_social || reporte.ticket?.cliente_nombre || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fecha</div>
        <div class="info-value">${reporteData.fecha ? format(new Date(reporteData.fecha), "PP", { locale: es }) : format(new Date(reporte.created_at), "PP", { locale: es })}</div>
      </div>
      <div class="info-item">
        <div class="info-label">RUT</div>
        <div class="info-value">${reporteData.rut || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Planta</div>
        <div class="info-value">${reporteData.planta || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Dirección</div>
        <div class="info-value">${reporteData.direccion || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Ciudad</div>
        <div class="info-value">${reporteData.ciudad || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Responsable</div>
        <div class="info-value">${reporteData.responsable || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Teléfono Fijo</div>
        <div class="info-value">${reporteData.telefono_fijo || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">E-mail</div>
        <div class="info-value">${reporteData.email_cliente || reporte.ticket?.cliente_contacto || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Celular</div>
        <div class="info-value">${reporteData.celular || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Facturable</div>
        <div class="info-value">${reporteData.facturable ? "SI" : "NO"}</div>
      </div>
    </div>
  </div>

  ${reporteData.equipos && reporteData.equipos.length > 0 && reporteData.equipos.some((e: any) => e.maquina || e.modelo || e.numero_serie || e.ano) ? `
  <div class="section">
    <div class="section-title">EQUIPO</div>
    <table class="equipos-table">
      <thead>
        <tr>
          <th>Máquina</th>
          <th>Modelo</th>
          <th>N° Serie</th>
          <th>Año</th>
        </tr>
      </thead>
      <tbody>
        ${reporteData.equipos.map((equipo: any) => `
          <tr>
            <td>${equipo.maquina || "N/A"}</td>
            <td>${equipo.modelo || "N/A"}</td>
            <td>${equipo.numero_serie || "N/A"}</td>
            <td>${equipo.ano || "N/A"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${reporteData.tipo_servicio && reporteData.tipo_servicio.length > 0 ? `
  <div class="section page-break-before">
    <div class="section-title">TIPO DE SERVICIO</div>
    <div class="info-grid">
      ${Array.isArray(reporteData.tipo_servicio) 
        ? reporteData.tipo_servicio.map((tipo: string) => `
          <div class="info-item">
            <div class="info-value">${tipo.replace(/_/g, " ").toUpperCase()}</div>
          </div>
        `).join("")
        : `<div class="info-item"><div class="info-value">${String(reporteData.tipo_servicio).replace(/_/g, " ").toUpperCase()}</div></div>`}
    </div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">DIAGNÓSTICO</div>
    <div class="content-box">
      ${reporteData.diagnostico || reporte.notas_brutas || "No disponible"}
    </div>
  </div>

  <div class="section">
    <div class="section-title">TRABAJO REALIZADO</div>
    <div class="content-box">
      ${reporteData.trabajo_realizado || "No disponible"}
    </div>
  </div>

  ${reporteData.observacion ? `
  <div class="section">
    <div class="section-title">OBSERVACIÓN</div>
    <div class="content-box">
      ${reporteData.observacion}
    </div>
  </div>
  ` : ""}

  ${reporteData.repuestos && reporteData.repuestos.length > 0 && reporteData.repuestos.some((r: any) => r.descripcion || r.codigo) ? `
  <div class="section">
    <div class="section-title">REPUESTOS Y/O MATERIALES UTILIZADOS</div>
    <table class="repuestos-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Cantidad</th>
          <th>Descripción de Mercaderías</th>
          <th>Garantía</th>
        </tr>
      </thead>
      <tbody>
        ${reporteData.repuestos.map((repuesto: any) => `
          <tr>
            <td>${repuesto.codigo || "N/A"}</td>
            <td>${repuesto.cantidad || "N/A"}</td>
            <td>${repuesto.descripcion || "N/A"}</td>
            <td>${repuesto.garantia ? "SI" : "NO"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : reporte.repuestos_lista ? `
  <div class="section">
    <div class="section-title">REPUESTOS Y/O MATERIALES UTILIZADOS</div>
    <div class="content-box">
      ${reporte.repuestos_lista}
    </div>
  </div>
  ` : ""}

  ${(reporteData.hora_entrada || reporteData.hora_salida || reporteData.horas_espera || reporteData.horas_trabajo || reporteData.tiempo_ida || reporteData.tiempo_regreso || reporteData.tiempo_total) ? `
  <div class="section page-break-before">
    <div class="section-title">TIEMPOS</div>
    <div class="info-grid">
      ${reporteData.hora_entrada ? `<div class="info-item"><div class="info-label">Hora Entrada</div><div class="info-value">${reporteData.hora_entrada}</div></div>` : ""}
      ${reporteData.hora_salida ? `<div class="info-item"><div class="info-label">Hora Salida</div><div class="info-value">${reporteData.hora_salida}</div></div>` : ""}
      ${reporteData.horas_espera ? `<div class="info-item"><div class="info-label">Horas Espera</div><div class="info-value">${reporteData.horas_espera}h</div></div>` : ""}
      ${reporteData.horas_trabajo ? `<div class="info-item"><div class="info-label">Horas Trabajo</div><div class="info-value">${reporteData.horas_trabajo}h</div></div>` : ""}
      ${reporteData.tiempo_ida ? `<div class="info-item"><div class="info-label">Tiempo Ida</div><div class="info-value">${reporteData.tiempo_ida}h</div></div>` : ""}
      ${reporteData.tiempo_regreso ? `<div class="info-item"><div class="info-label">Tiempo Regreso</div><div class="info-value">${reporteData.tiempo_regreso}h</div></div>` : ""}
      ${reporteData.tiempo_total ? `<div class="info-item"><div class="info-label">Tiempo Total</div><div class="info-value">${reporteData.tiempo_total}h</div></div>` : ""}
    </div>
  </div>
  ` : ""}

  ${reporte.costo_reparacion ? `
  <div class="section">
    <div class="section-title">INFORMACIÓN ADICIONAL</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Costo de Reparación</div>
        <div class="info-value">$${Number(reporte.costo_reparacion).toLocaleString('es-CL')}</div>
      </div>
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <div>
      <div class="info-label">Técnico</div>
      <div class="info-value">${reporte.tecnico?.nombre_completo || "N/A"}</div>
      <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 5px; font-size: 12px;">NOMBRE Y FIRMA TÉCNICO</div>
    </div>
    <div>
      <div class="info-label">Fecha de Generación</div>
      <div class="info-value">${format(new Date(reporte.created_at), "PPp", { locale: es })}</div>
      ${reporteData.firma_cliente && reporteData.firma_cliente.imagen ? `
      <div style="margin-top: 20px;">
        <div class="info-label">Firmado por:</div>
        <div class="info-value">${reporteData.firma_cliente.nombre}</div>
        <div style="margin-top: 10px;">
          <img src="${reporteData.firma_cliente.imagen}" alt="Firma del cliente" style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; padding: 5px; background: white;" />
        </div>
        <div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 5px; font-size: 12px;">NOMBRE Y FIRMA CLIENTE</div>
      </div>
      ` : `
      <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 5px; font-size: 12px;">NOMBRE Y FIRMA CLIENTE</div>
      `}
    </div>
  </div>
  <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #999;">
    ORIGINAL: CLIENTE | 1ª COPIA: SERVICIO TÉCNICO | 2ª COPIA: CONTROL INTERNO
  </div>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol={perfil.rol} nombre={perfil.nombre_completo} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (perfil.rol === "admin") {
                router.push("/admin");
              } else if (perfil.rol === "ventas") {
                router.push("/ventas");
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Reportes Técnicos</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">
                  Todos los reportes generados
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Radio
                    className={`h-3 w-3 ${
                      realtimeStatus === "connected" ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <span
                    className={
                      realtimeStatus === "connected" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {realtimeStatus === "connected" ? "Conectado" : "Desconectado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.facturables}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Con Costo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.conCosto}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${estadisticas.totalCosto.toLocaleString('es-CL')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Buscador */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Buscador */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, ticket o técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por Técnico */}
              <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los técnicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los técnicos</SelectItem>
                  {tecnicosUnicos.map((tecnico: any) => (
                    <SelectItem key={tecnico.id} value={tecnico.id || ""}>
                      {tecnico.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Tipo de Servicio */}
              <Select value={filtroTipoServicio} onValueChange={setFiltroTipoServicio}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="reparacion">Reparación</SelectItem>
                  <SelectItem value="garantia">Garantía</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="visita_cortesia">Visita de Cortesía</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por Fecha Desde */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Desde"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Fecha Hasta */}
            <div className="mt-4">
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Hasta"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Mostrar resultados filtrados */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredReportes.length} de {reportes.length} reportes
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando reportes...</p>
          </div>
        ) : filteredReportes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "No se encontraron reportes" : "No hay reportes aún"}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReportes.map((reporte) => (
              <Card key={reporte.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      Ticket #{reporte.ticket_id}
                    </CardTitle>
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      Reporte
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{reporte.ticket?.cliente_nombre || "N/A"}</p>
                  </div>
                  {reporte.tecnico && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Técnico</p>
                      <p className="text-sm">{reporte.tecnico.nombre_completo}</p>
                    </div>
                  )}
                  {reporte.ticket?.dispositivo_modelo && (
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Equipo</p>
                      <p className="text-sm">{reporte.ticket.dispositivo_modelo}</p>
                    </div>
                  )}
                  {(() => {
                    let reporteData: any = {};
                    try {
                      reporteData = JSON.parse(reporte.reporte_ia as string);
                    } catch {
                      reporteData = {};
                    }
                    const emailLeido = reporteData.lectura_email && reporteData.lectura_email.leido;
                    return emailLeido ? (
                      <div className="pt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ Email leído
                        </Badge>
                      </div>
                    ) : null;
                  })()}
                  <div className="pt-2 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedReporte(reporte)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => descargarReportePDF(reporte)}
                      title="Descargar como archivo PDF"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Descargar PDF
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(reporte.created_at), "PPp", { locale: es })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <ReporteListView
            reportes={filteredReportes}
            onViewDetail={(reporte) => setSelectedReporte(reporte)}
            onDownload={(reporte) => descargarReportePDF(reporte)}
          />
        )}
      </div>

      {selectedReporte && (
        <ReporteDetailDialog
          reporte={selectedReporte}
          open={!!selectedReporte}
          onOpenChange={(open) => !open && setSelectedReporte(null)}
          onExport={() => exportarReporte(selectedReporte)}
          onDownload={() => descargarReportePDF(selectedReporte)}
          onFirmaGuardada={() => {
            fetchReportes();
          }}
          userRole={perfil.rol}
        />
      )}
    </div>
  );
}







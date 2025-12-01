"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, CheckCircle, Upload, FileText, Pen } from "lucide-react";
import { ReporteAlfapackDialog } from "@/components/tecnico/reporte-alfapack-dialog";
import { FirmaClienteDialog } from "@/components/reportes/firma-cliente-dialog";
import { ReporteDetailDialog } from "@/components/reportes/reporte-detail-dialog";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAppConfig } from "@/lib/app-config";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

export function TicketDetail({
  ticket,
  tecnicoId,
  onBack,
  onUpdate,
}: {
  ticket: Ticket;
  tecnicoId: string;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showReporteDialog, setShowReporteDialog] = useState(false);
  const [showFirmaDialog, setShowFirmaDialog] = useState(false);
  const [showReporteDetailDialog, setShowReporteDetailDialog] = useState(false);
  const [reporte, setReporte] = useState<any>(null);
  const supabase = createClient();

  // Buscar el reporte cuando el ticket está finalizado
  useEffect(() => {
    if (ticket.estado === "finalizado" || ticket.estado === "entregado") {
      buscarReporte();
    }
  }, [ticket.id, ticket.estado]);

  const buscarReporte = async () => {
    try {
      const { data, error } = await supabase
        .from("reportes")
        .select(`
          *,
          tecnico:perfiles!reportes_tecnico_id_fkey(nombre_completo, email)
        `)
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error buscando reporte:", error);
      } else {
        setReporte(data);
      }
    } catch (error) {
      console.error("Error buscando reporte:", error);
    }
  };

  const verReporteYFirmar = () => {
    if (reporte) {
      // Verificar si ya tiene firma
      let reporteData: any = {};
      try {
        reporteData = JSON.parse(reporte.reporte_ia as string);
      } catch {
        reporteData = {};
      }

      const tieneFirma = reporteData.firma_cliente && reporteData.firma_cliente.imagen;
      
      if (!tieneFirma) {
        // Si no tiene firma, abrir directamente el diálogo de firma
        setShowFirmaDialog(true);
      } else {
        // Si ya tiene firma, mostrar el reporte completo
        setShowReporteDetailDialog(true);
      }
    } else {
      // Si no hay reporte, abrir el diálogo de reporte
      setShowReporteDialog(true);
    }
  };

  const generarHTMLReporte = (reporte: any, reporteData: any) => {
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
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 2px solid #ff6600;
      padding-bottom: 20px;
    }
    .section-title {
      background: #333;
      color: white;
      padding: 10px;
      margin: 20px 0 10px 0;
      font-weight: bold;
    }
    .content-box {
      background: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #ff6600;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoHTML}</div>
    <div style="background: #ff6600; color: white; padding: 10px 20px; border-radius: 5px;">
      <div>REPORTE TÉCNICO</div>
      <div style="font-size: 24px;">N° ${reporte.ticket_id}</div>
    </div>
  </div>
  <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
  <div>Cliente: ${reporteData.razon_social || ticket.cliente_nombre || "N/A"}</div>
  <div class="section-title">DIAGNÓSTICO</div>
  <div class="content-box">${reporteData.diagnostico || "N/A"}</div>
  <div class="section-title">TRABAJO REALIZADO</div>
  <div class="content-box">${reporteData.trabajo_realizado || "N/A"}</div>
  ${reporteData.observacion ? `
  <div class="section-title">OBSERVACIÓN</div>
  <div class="content-box">${reporteData.observacion}</div>
  ` : ""}
</body>
</html>
    `;
  };

  const descargarReportePDF = async (reporte: any) => {
    let reporteData: any = {};
    try {
      reporteData = JSON.parse(reporte.reporte_ia as string);
    } catch {
      reporteData = {};
    }

    // Crear un elemento temporal completamente aislado del layout
    const tempDiv = document.createElement('div');
    // Aislar completamente del layout para no afectar la interfaz
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '180mm';
    tempDiv.style.height = 'auto';
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.opacity = '0';
    tempDiv.style.pointerEvents = 'none';
    tempDiv.style.zIndex = '-9999';
    tempDiv.style.overflow = 'hidden';
    
    const html = generarHTMLReporte(reporte, reporteData);
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      // Esperar a que se renderice
      await new Promise(resolve => setTimeout(resolve, 200));

      // Convertir HTML a canvas y luego a PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Márgenes del PDF (2cm arriba/abajo, 1.5cm izquierda/derecha)
      const marginTop = 20;
      const marginBottom = 20;
      const marginLeft = 15;
      const marginRight = 15;
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const contentWidth = pageWidth - marginLeft - marginRight;
      const contentHeight = pageHeight - marginTop - marginBottom;
      
      // Calcular dimensiones de la imagen respetando los márgenes
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = marginTop;

      // Primera página con márgenes
      pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Páginas adicionales con márgenes
      while (heightLeft > 0) {
        position = marginTop - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      const fileName = `Reporte_Tecnico_${reporte.ticket_id}_${format(new Date(reporte.created_at), 'yyyy-MM-dd', { locale: es })}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intenta descargar como HTML.');
    } finally {
      // Asegurar que se elimine incluso si hay error
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    }
  };

  const cambiarEstado = async (nuevoEstado: Ticket["estado"]) => {
    setLoading(true);
    try {
      // Si se intenta finalizar, abrir el formulario de reporte
      // PERO no cambiar el estado todavía - se cambiará cuando se guarde el reporte
      if (nuevoEstado === "finalizado") {
        setShowReporteDialog(true);
        setLoading(false);
        return;
      }

      // Para otros estados, cambiar normalmente
      const { error } = await supabase
        .from("tickets")
        .update({ estado: nuevoEstado })
        .eq("id", ticket.id);

      if (error) throw error;
      onUpdate();
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${ticket.id}_${Date.now()}.${fileExt}`;
    const filePath = `tickets/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("fotos-tickets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("fotos-tickets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("tickets")
        .update({ foto_url: data.publicUrl })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      onUpdate();
      alert("Foto subida exitosamente");
    } catch (error: any) {
      console.error("Error subiendo foto:", error);
      alert("Error al subir foto: " + error.message);
    }
  };

  const puedeIniciar = ticket.estado === "asignado" || ticket.estado === "espera_repuesto";
  // Se puede detener desde en_proceso o desde asignado (si se inició pero se necesita detener)
  const puedeDetener = ticket.estado === "en_proceso" || ticket.estado === "asignado";
  // Se puede finalizar desde cualquier estado activo excepto ya finalizado
  const puedeFinalizar = ticket.estado !== "finalizado" && ticket.estado !== "entregado";

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Ticket #{ticket.id}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={
                  ticket.estado === "abierto" ? "bg-gray-200 text-gray-900 font-semibold" :
                  ticket.estado === "asignado" ? "bg-blue-500 text-white font-semibold" :
                  ticket.estado === "en_proceso" ? "bg-yellow-500 text-white font-semibold" :
                  ticket.estado === "espera_repuesto" ? "bg-orange-500 text-white font-semibold" :
                  ticket.estado === "finalizado" ? "bg-green-500 text-white font-semibold" :
                  "bg-purple-500 text-white font-semibold"
                }>
                  {ticket.estado.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={
                  ticket.prioridad === "baja" ? "bg-gray-400 text-white font-semibold" :
                  ticket.prioridad === "normal" ? "bg-blue-500 text-white font-semibold" :
                  ticket.prioridad === "alta" ? "bg-orange-500 text-white font-semibold" :
                  "bg-red-600 text-white font-semibold animate-pulse"
                }>
                  {ticket.prioridad}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{ticket.cliente_nombre}</p>
            </div>
            {ticket.cliente_contacto && (
              <div>
                <p className="font-semibold text-sm text-muted-foreground">Contacto</p>
                <p>{ticket.cliente_contacto}</p>
              </div>
            )}
            {ticket.dispositivo_modelo && (
              <div>
                <p className="font-semibold text-sm text-muted-foreground">Equipo/Producto</p>
                <p>{ticket.dispositivo_modelo}</p>
              </div>
            )}
          </div>

          <div>
            <p className="font-semibold text-sm text-muted-foreground mb-2">Problema/Solicitud Reportada</p>
            <p className="bg-muted p-4 rounded-md">{ticket.falla_declarada}</p>
          </div>

          {ticket.foto_url && (
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-2">Foto del Equipo/Producto</p>
              <img
                src={ticket.foto_url}
                alt="Dispositivo"
                className="max-w-md rounded-md border"
              />
            </div>
          )}

          <div className="border-t pt-4">
            <p className="font-semibold text-sm text-muted-foreground mb-3">Acciones Rápidas</p>
            <div className="flex flex-wrap gap-2">
              {ticket.estado === "finalizado" || ticket.estado === "entregado" ? (
                <Button
                  onClick={verReporteYFirmar}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Reporte y Firmar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => cambiarEstado("en_proceso")}
                    disabled={!puedeIniciar || loading}
                    variant="default"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button
                    onClick={() => cambiarEstado("espera_repuesto")}
                    disabled={!puedeDetener || loading}
                    variant="secondary"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Detener (Espera Repuesto)
                  </Button>
                  <Button
                    onClick={() => cambiarEstado("finalizado")}
                    disabled={!puedeFinalizar || loading}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold text-sm text-muted-foreground mb-2">Subir Foto</p>
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Foto
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <ReporteAlfapackDialog
        open={showReporteDialog}
        onOpenChange={setShowReporteDialog}
        ticketId={ticket.id}
        tecnicoId={tecnicoId}
        ticketData={{
          cliente_nombre: ticket.cliente_nombre,
          cliente_contacto: ticket.cliente_contacto || undefined,
          dispositivo_modelo: ticket.dispositivo_modelo || undefined,
          falla_declarada: ticket.falla_declarada || undefined,
          datos_cliente: (ticket as any).datos_cliente || undefined, // Datos completos de Pipedrive
        }}
        onSuccess={() => {
          setShowReporteDialog(false);
          buscarReporte();
          onUpdate();
        }}
      />

      {/* Diálogo de Firma del Cliente */}
      {reporte && (
        <FirmaClienteDialog
          open={showFirmaDialog}
          onOpenChange={setShowFirmaDialog}
          reporteId={reporte.id}
          clienteNombre={ticket.cliente_nombre}
          onSuccess={() => {
            setShowFirmaDialog(false);
            buscarReporte();
            onUpdate();
          }}
        />
      )}

      {/* Diálogo de Detalle del Reporte */}
      {reporte && (
        <ReporteDetailDialog
          reporte={reporte}
          open={showReporteDetailDialog}
          onOpenChange={setShowReporteDetailDialog}
          onExport={() => {
            // Función para exportar/imprimir
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
            setTimeout(() => ventana.print(), 250);
          }}
          onDownload={async () => {
            // Función para descargar PDF
            await descargarReportePDF(reporte);
          }}
          onFirmaGuardada={() => {
            buscarReporte();
            onUpdate();
          }}
          userRole="tecnico"
        />
      )}
    </div>
  );
}









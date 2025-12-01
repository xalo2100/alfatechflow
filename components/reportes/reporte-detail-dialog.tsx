"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Clock, DollarSign, CheckCircle2, XCircle, Pen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTimezone } from "@/lib/use-timezone";
import type { Database } from "@/types/supabase";
import { FirmaClienteDialog } from "@/components/reportes/firma-cliente-dialog";
import { useRouter } from "next/navigation";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface ReporteConTicket extends Reporte {
  ticket?: Ticket;
  tecnico?: { nombre_completo: string; email: string };
}

interface ReporteDetailDialogProps {
  reporte: ReporteConTicket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onDownload?: () => void;
  onFirmaGuardada?: () => void;
  userRole?: string;
}

export function ReporteDetailDialog({
  reporte,
  open,
  onOpenChange,
  onExport,
  onDownload,
  onFirmaGuardada,
  userRole,
}: ReporteDetailDialogProps) {
  const [showFirmaDialog, setShowFirmaDialog] = useState(false);
  const { formatDate } = useTimezone();
  
  let reporteData: any = {};
  try {
    reporteData = JSON.parse(reporte.reporte_ia as string);
  } catch {
    reporteData = {};
  }

  const tieneFirma = reporteData.firma_cliente && reporteData.firma_cliente.imagen;
  const puedeFirmar = userRole === "tecnico" && !tieneFirma;
  const emailLeido = reporteData.lectura_email && reporteData.lectura_email.leido;
  const fechaLectura = emailLeido && reporteData.lectura_email.fecha_lectura 
    ? formatDate(new Date(reporteData.lectura_email.fecha_lectura), "PPp", es)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">Reporte Técnico #{reporte.ticket_id}</DialogTitle>
              <DialogDescription>
                Reporte generado el {formatDate(new Date(reporte.created_at), "PPp", es)}
                {emailLeido && (
                  <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    ✓ Email leído el {fechaLectura}
                  </span>
                )}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {puedeFirmar && (
                <Button onClick={() => setShowFirmaDialog(true)} variant="default">
                  <Pen className="h-4 w-4 mr-2" />
                  Firmar como Cliente
                </Button>
              )}
              {onDownload && (
                <Button onClick={onDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              )}
              <Button onClick={onExport} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información del Cliente */}
          <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente: </span>
                <span className="font-medium">{reporte.ticket?.cliente_nombre || "N/A"}</span>
              </div>
              {reporte.ticket?.cliente_contacto && (
                <div>
                  <span className="text-muted-foreground">Contacto: </span>
                  <span>{reporte.ticket.cliente_contacto}</span>
                </div>
              )}
              {reporte.ticket?.dispositivo_modelo && (
                <div>
                  <span className="text-muted-foreground">Equipo: </span>
                  <span>{reporte.ticket.dispositivo_modelo}</span>
                </div>
              )}
              {reporte.tecnico && (
                <div>
                  <span className="text-muted-foreground">Técnico: </span>
                  <span>{reporte.tecnico.nombre_completo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información del Servicio */}
          {(reporteData.tipo_servicio || reporteData.horas_trabajo || reporteData.horas_espera || reporteData.facturable !== undefined || reporte.costo_reparacion) && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Información del Servicio
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {reporteData.tipo_servicio && (
                  <div>
                    <span className="text-muted-foreground">Tipo de Servicio: </span>
                    <Badge variant="outline" className="ml-1">
                      {reporteData.tipo_servicio === "reparacion" ? "Reparación" :
                       reporteData.tipo_servicio === "garantia" ? "Garantía" :
                       reporteData.tipo_servicio === "mantenimiento" ? "Mantenimiento" :
                       reporteData.tipo_servicio === "visita_cortesia" ? "Visita de Cortesía" :
                       reporteData.tipo_servicio}
                    </Badge>
                  </div>
                )}
                {reporteData.horas_trabajo && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Horas Trabajo: </span>
                    <span className="font-medium">{reporteData.horas_trabajo}h</span>
                  </div>
                )}
                {reporteData.horas_espera && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Horas Espera: </span>
                    <span className="font-medium">{reporteData.horas_espera}h</span>
                  </div>
                )}
                {reporteData.facturable !== undefined && (
                  <div className="flex items-center gap-1">
                    {reporteData.facturable ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-muted-foreground">Facturable: </span>
                    <span className="font-medium">{reporteData.facturable ? "Sí" : "No"}</span>
                  </div>
                )}
                {reporte.costo_reparacion && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Costo: </span>
                    <span className="font-medium">${Number(reporte.costo_reparacion).toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnóstico */}
          {reporteData.diagnostico && (
            <div>
              <h3 className="font-semibold mb-2 bg-black text-white p-2 rounded">DIAGNÓSTICO</h3>
              <div className="bg-muted p-4 rounded-md border-l-4 border-orange-500">
                <p className="whitespace-pre-wrap">{reporteData.diagnostico}</p>
              </div>
            </div>
          )}

          {/* Trabajo Realizado */}
          {reporteData.trabajo_realizado && (
            <div>
              <h3 className="font-semibold mb-2 bg-black text-white p-2 rounded">TRABAJO REALIZADO</h3>
              <div className="bg-muted p-4 rounded-md border-l-4 border-orange-500">
                <p className="whitespace-pre-wrap">{reporteData.trabajo_realizado}</p>
              </div>
            </div>
          )}

          {/* Observación */}
          {reporteData.observacion && (
            <div>
              <h3 className="font-semibold mb-2 bg-black text-white p-2 rounded">OBSERVACIÓN</h3>
              <div className="bg-muted p-4 rounded-md border-l-4 border-orange-500">
                <p className="whitespace-pre-wrap">{reporteData.observacion}</p>
              </div>
            </div>
          )}

          {/* Repuestos */}
          {(reporte.repuestos_lista || (reporteData.repuestos && reporteData.repuestos.length > 0)) && (
            <div>
              <h3 className="font-semibold mb-2 bg-black text-white p-2 rounded">
                REPUESTOS Y/O MATERIALES UTILIZADOS
              </h3>
              <div className="bg-muted p-4 rounded-md border-l-4 border-orange-500">
                {reporteData.repuestos && Array.isArray(reporteData.repuestos) && reporteData.repuestos.length > 0 ? (
                  <div className="space-y-2">
                    {reporteData.repuestos.map((repuesto: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border">
                        <div className="flex-1">
                          {repuesto.codigo && (
                            <div className="text-sm">
                              <span className="font-semibold">Código: </span>
                              <span>{repuesto.codigo}</span>
                            </div>
                          )}
                          {repuesto.descripcion && (
                            <div className="text-sm">
                              <span className="font-semibold">Descripción: </span>
                              <span>{repuesto.descripcion}</span>
                            </div>
                          )}
                          {repuesto.cantidad && (
                            <div className="text-sm">
                              <span className="font-semibold">Cantidad: </span>
                              <span>{repuesto.cantidad}</span>
                            </div>
                          )}
                        </div>
                        {repuesto.garantia && (
                          <Badge variant="outline" className="bg-yellow-50">
                            Garantía
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{reporte.repuestos_lista}</p>
                )}
              </div>
            </div>
          )}

          {/* Firma del Cliente */}
          {tieneFirma && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 bg-black text-white p-2 rounded">FIRMA DEL CLIENTE</h3>
              <div className="bg-white p-4 rounded-md border-2 border-gray-300">
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground">Firmado por:</p>
                  <p className="font-semibold">{reporteData.firma_cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(reporteData.firma_cliente.fecha), "PPp", { locale: es })}
                  </p>
                </div>
                <div className="border-t pt-2">
                  <img
                    src={reporteData.firma_cliente.imagen}
                    alt="Firma del cliente"
                    className="max-w-xs h-24 object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notas Brutas (solo para referencia) */}
          {reporte.notas_brutas && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Notas Originales del Técnico</h3>
              <div className="bg-gray-50 p-3 rounded-md text-sm italic">
                {reporte.notas_brutas}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {showFirmaDialog && (
        <FirmaClienteDialog
          open={showFirmaDialog}
          onOpenChange={setShowFirmaDialog}
          reporteId={reporte.id}
          clienteNombre={reporte.ticket?.cliente_nombre || "Cliente"}
          onSuccess={() => {
            setShowFirmaDialog(false);
            if (onFirmaGuardada) {
              onFirmaGuardada();
            }
            // Recargar el diálogo para mostrar la firma
            window.location.reload();
          }}
        />
      )}
    </Dialog>
  );
}







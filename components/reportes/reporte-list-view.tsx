"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, Eye } from "lucide-react";
import type { Database } from "@/types/supabase";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface ReporteConTicket extends Reporte {
  ticket?: Ticket;
  tecnico?: { nombre_completo: string; email: string };
}

interface ReporteListViewProps {
  reportes: ReporteConTicket[];
  onViewDetail: (reporte: ReporteConTicket) => void;
  onDownload: (reporte: ReporteConTicket) => void;
}

export function ReporteListView({
  reportes,
  onViewDetail,
  onDownload,
}: ReporteListViewProps) {
  return (
    <div className="space-y-2">
      {reportes.map((reporte) => {
        let reporteData: any = {};
        try {
          reporteData = JSON.parse(reporte.reporte_ia as string);
        } catch {
          reporteData = {};
        }

        return (
          <Card key={reporte.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">
                        Ticket #{reporte.ticket_id}
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        Reporte
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Cliente:{" "}
                      </span>
                      <span className="font-medium">
                        {reporte.ticket?.cliente_nombre || "N/A"}
                      </span>
                    </div>

                    {reporte.tecnico && (
                      <div>
                        <span className="text-muted-foreground font-medium">
                          Técnico:{" "}
                        </span>
                        <span>{reporte.tecnico.nombre_completo}</span>
                      </div>
                    )}

                    {reporte.ticket?.dispositivo_modelo && (
                      <div>
                        <span className="text-muted-foreground font-medium">
                          Equipo:{" "}
                        </span>
                        <span>{reporte.ticket.dispositivo_modelo}</span>
                      </div>
                    )}
                  </div>

                  {(reporteData.tipo_servicio ||
                    reporteData.facturable !== undefined ||
                    reporte.costo_reparacion) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {reporteData.tipo_servicio && (
                        <Badge variant="outline">
                          {Array.isArray(reporteData.tipo_servicio)
                            ? reporteData.tipo_servicio
                                .map((t: string) =>
                                  t.replace(/_/g, " ").toUpperCase()
                                )
                                .join(", ")
                            : String(reporteData.tipo_servicio)
                                .replace(/_/g, " ")
                                .toUpperCase()}
                        </Badge>
                      )}
                      {reporteData.facturable !== undefined && (
                        <Badge
                          variant={reporteData.facturable ? "default" : "outline"}
                        >
                          {reporteData.facturable ? "Facturable" : "No Facturable"}
                        </Badge>
                      )}
                      {reporte.costo_reparacion && (
                        <Badge variant="outline">
                          Costo: ${Number(reporte.costo_reparacion).toLocaleString('es-CL')}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Creado:{" "}
                    {format(new Date(reporte.created_at), "PPp", { locale: es })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetail(reporte)}
                    className="w-full"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(reporte)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {reportes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay reportes para mostrar
        </div>
      )}
    </div>
  );
}





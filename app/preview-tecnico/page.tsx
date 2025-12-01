"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, CheckCircle, Upload, ArrowLeft, ArrowRight } from "lucide-react";

export default function PreviewTecnicoPage() {
  const ticketsAbiertos = [
    {
      id: 1,
      cliente_nombre: "Juan Pérez",
      dispositivo_modelo: "Máquina Envasado Modelo X",
      falla_declarada: "No enciende, posible problema de alimentación",
      prioridad: "alta" as const,
      estado: "abierto" as const,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      cliente_nombre: "María García",
      dispositivo_modelo: "Equipo de Sellado Y",
      falla_declarada: "Sellado defectuoso, requiere ajuste",
      prioridad: "normal" as const,
      estado: "abierto" as const,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const misTickets = [
    {
      id: 3,
      cliente_nombre: "Carlos López",
      dispositivo_modelo: "Máquina de Envasado Z",
      falla_declarada: "Sobrecalentamiento y apagado automático",
      prioridad: "urgente" as const,
      estado: "en_proceso" as const,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">TechFlow AI</h1>
            <span className="text-sm text-muted-foreground">Vista Previa - Técnico</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Taller Técnico</h2>

        <Tabs defaultValue="abiertos" className="w-full">
          <TabsList>
            <TabsTrigger value="abiertos">
              Tickets Abiertos ({ticketsAbiertos.length})
            </TabsTrigger>
            <TabsTrigger value="mios">
              Mis Tickets ({misTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abiertos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketsAbiertos.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">#{ticket.id}</CardTitle>
                      <Badge variant="outline">{ticket.prioridad}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{ticket.cliente_nombre}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Dispositivo</p>
                      <p className="text-sm">{ticket.dispositivo_modelo}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Falla</p>
                      <p className="text-sm line-clamp-2">{ticket.falla_declarada}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Hace 1 hora</p>
                      <Button size="sm">Asignar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mios" className="mt-4">
            <div className="space-y-4">
              {misTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">Ticket #{ticket.id}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            en proceso
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            urgente
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
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Dispositivo</p>
                        <p>{ticket.dispositivo_modelo}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-2">
                        Falla Declarada
                      </p>
                      <p className="bg-muted p-4 rounded-md">
                        {ticket.falla_declarada}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="font-semibold text-sm text-muted-foreground mb-3">
                        Acciones Rápidas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="default" disabled>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar
                        </Button>
                        <Button variant="secondary">
                          <Pause className="h-4 w-4 mr-2" />
                          Detener (Espera Repuesto)
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="font-semibold text-sm text-muted-foreground mb-2">
                        Subir Foto
                      </p>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Foto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Vista de Generar Reporte */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Generar Informe con IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Ejemplo de uso:</strong> Escribe notas informales como
                  &quot;cambie el flex y limpie ventilador, quedo joya&quot; y la IA generará
                  un informe profesional estructurado.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas del Trabajo</label>
                <textarea
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  placeholder='Ej: "cambie el flex y limpie ventilador, quedo joya"'
                  defaultValue="cambie el flex y limpie ventilador, quedo joya"
                />
              </div>
              <Button className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Generar Informe con IA
              </Button>
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="font-semibold mb-2 text-green-900">Resumen para el Cliente</h4>
                <p className="text-sm text-green-800">
                  Se realizó el reemplazo del flex de pantalla y limpieza del sistema de ventilación. 
                  El equipo quedó operativo y listo para su uso.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                <h4 className="font-semibold mb-2 text-purple-900">Detalle Técnico</h4>
                <p className="text-sm text-purple-800">
                  Se procedió al reemplazo del flex de pantalla que presentaba daños físicos. 
                  Posteriormente se realizó una limpieza exhaustiva del sistema de ventilación, 
                  eliminando acumulación de polvo y residuos. Se realizaron pruebas de funcionamiento 
                  completas verificando que todos los componentes operen correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}











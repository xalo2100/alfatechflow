"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, CheckCircle, Upload, Plus, RefreshCw, Sparkles, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function PreviewPage() {
  const [showDialog, setShowDialog] = useState(false);

  const ticketsEjemplo = [
    {
      id: 1,
      cliente_nombre: "Juan Pérez",
      cliente_contacto: "555-1234",
      dispositivo_modelo: "iPhone 13",
      falla_declarada: "Pantalla rota, no enciende",
      prioridad: "alta" as const,
      estado: "en_proceso" as const,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      cliente_nombre: "María García",
      cliente_contacto: "555-5678",
      dispositivo_modelo: "Laptop Dell",
      falla_declarada: "Sobrecalentamiento y apagado automático",
      prioridad: "normal" as const,
      estado: "finalizado" as const,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      cliente_nombre: "Carlos López",
      cliente_contacto: "555-9012",
      dispositivo_modelo: "iPad Pro",
      falla_declarada: "Batería no carga",
      prioridad: "urgente" as const,
      estado: "abierto" as const,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const estadoColors: Record<string, string> = {
    abierto: "bg-gray-100 text-gray-800",
    asignado: "bg-blue-100 text-blue-800",
    en_proceso: "bg-yellow-100 text-yellow-800",
    espera_repuesto: "bg-orange-100 text-orange-800",
    finalizado: "bg-green-100 text-green-800",
    entregado: "bg-purple-100 text-purple-800",
  };

  const prioridadColors: Record<string, string> = {
    baja: "bg-gray-100 text-gray-800",
    normal: "bg-blue-100 text-blue-800",
    alta: "bg-orange-100 text-orange-800",
    urgente: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">TechFlow AI</h1>
            <span className="text-sm text-muted-foreground">Vista Previa</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vista Previa de TechFlow AI</h1>
          <p className="text-muted-foreground">
            Esta es una demostración visual de los componentes y vistas de la aplicación
          </p>
        </div>

        {/* Vista de Ventas - Dashboard */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📊 Dashboard de Ventas</h2>
          <div className="bg-white p-6 rounded-lg border shadow-sm mb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">Gestión de Tickets</h3>
                <p className="text-sm text-muted-foreground">Vista en tiempo real</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Ticket
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketsEjemplo.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">#{ticket.id}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={estadoColors[ticket.estado]}>
                          {ticket.estado.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={prioridadColors[ticket.prioridad]}>
                          {ticket.prioridad}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Vista de Técnico */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🔧 Vista de Técnico</h2>
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <Tabs defaultValue="abiertos" className="w-full">
              <TabsList>
                <TabsTrigger value="abiertos">Tickets Abiertos (3)</TabsTrigger>
                <TabsTrigger value="mios">Mis Tickets (1)</TabsTrigger>
              </TabsList>
              <TabsContent value="abiertos" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticketsEjemplo.slice(0, 2).map((ticket) => (
                    <Card key={ticket.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">#{ticket.id}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold mb-2">{ticket.cliente_nombre}</p>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {ticket.falla_declarada}
                        </p>
                        <Button size="sm" className="w-full">Asignar</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="mios" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-2xl">Ticket #1</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={estadoColors["en_proceso"]}>en proceso</Badge>
                        <Badge variant="outline" className={prioridadColors["alta"]}>alta</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-2">Cliente</p>
                      <p className="font-medium">Juan Pérez</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground mb-2">Falla Declarada</p>
                      <p className="bg-muted p-4 rounded-md">Pantalla rota, no enciende</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-sm text-muted-foreground mb-3">Acciones Rápidas</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="default" disabled>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar
                        </Button>
                        <Button variant="secondary">
                          <Pause className="h-4 w-4 mr-2" />
                          Detener
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar
                        </Button>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-sm text-muted-foreground mb-2">Subir Foto</p>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Foto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Vista de Admin */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📈 Panel de Administración</h2>
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Posición</th>
                      <th className="text-left p-2">Técnico</th>
                      <th className="text-right p-2">Tickets Resueltos</th>
                      <th className="text-right p-2">Tiempo Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-semibold">#1</td>
                      <td className="p-2">Juan Técnico</td>
                      <td className="p-2 text-right">15</td>
                      <td className="p-2 text-right">4.2 horas</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold">#2</td>
                      <td className="p-2">María Reparadora</td>
                      <td className="p-2 text-right">12</td>
                      <td className="p-2 text-right">5.1 horas</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold">#3</td>
                      <td className="p-2">Carlos Especialista</td>
                      <td className="p-2 text-right">8</td>
                      <td className="p-2 text-right">6.3 horas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Formularios */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📝 Formularios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input id="cliente" placeholder="Nombre del cliente" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispositivo">Dispositivo</Label>
                  <Input id="dispositivo" placeholder="Modelo del dispositivo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="falla">Descripción de la Falla</Label>
                  <Textarea id="falla" placeholder="Describe el problema..." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Crear Ticket</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generar Informe con IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas del Trabajo</Label>
                  <Textarea
                    id="notas"
                    placeholder='Ej: "cambie el flex y limpie ventilador, quedo joya"'
                    rows={4}
                  />
                </div>
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Informe con IA
                </Button>
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h4 className="font-semibold mb-2 text-green-900">Resumen para el Cliente</h4>
                  <p className="text-sm text-green-800">
                    Se realizó el reemplazo del flex de pantalla y limpieza del sistema de ventilación. El equipo quedó operativo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Login */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔐 Página de Login</h2>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  TechFlow AI
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  Sistema de Gestión de Soporte Técnico
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" />
                  </div>
                  <Button className="w-full">Iniciar Sesión</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Dialog de Crear Ticket */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ticket</DialogTitle>
            <DialogDescription>
              Completa los datos del cliente y la falla reportada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-cliente">Cliente *</Label>
                <Input id="dialog-cliente" placeholder="Nombre del cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-contacto">Contacto</Label>
                <Input id="dialog-contacto" placeholder="Teléfono o email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-dispositivo">Dispositivo</Label>
              <Input id="dialog-dispositivo" placeholder="Ej: iPhone 13, Laptop Dell" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-falla">Descripción de la Falla *</Label>
              <Textarea
                id="dialog-falla"
                placeholder="Describe el problema reportado..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-prioridad">Prioridad</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowDialog(false)}>Crear Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


















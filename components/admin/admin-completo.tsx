"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, BarChart3, Users, FileText, UserPlus, Key, Settings, Palette, Trash2, KeyRound, Building2, Database as DatabaseIcon, Mail } from "lucide-react";
import { PersonalizacionDialog } from "@/components/admin/personalizacion-dialog";
import { SupabaseStatus } from "@/components/admin/supabase-status";
import { PipedriveStatus } from "@/components/admin/pipedrive-status";
import { GeminiStatus } from "@/components/admin/gemini-status";
import { ResendStatus } from "@/components/admin/resend-status";
import { CreateTicketDialog } from "@/components/ventas/create-ticket-dialog";
import { TicketCard } from "@/components/ventas/ticket-card";
import { AgregarTecnicoDialog } from "@/components/admin/agregar-tecnico-dialog";
import { AgregarUsuarioDialog } from "@/components/admin/agregar-usuario-dialog";
import { CambiarContraseñaDialog } from "@/components/admin/cambiar-contraseña-dialog";
import { ConfirmarEliminarDialog } from "@/components/admin/confirmar-eliminar-dialog";
import { AsignarTecnicoDialog } from "@/components/admin/asignar-tecnico-dialog";
import { ConfigApiDialog } from "@/components/admin/config-api-dialog";
import { ConfigPipedriveDialog } from "@/components/admin/config-pipedrive-dialog";
import { ConfigSupabaseDialog } from "@/components/admin/config-supabase-dialog";
import { ConfigResendDialog } from "@/components/admin/config-resend-dialog";
import type { Database } from "@/types/supabase";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface TecnicoStats {
  tecnico_id: string;
  nombre: string;
  run?: string;
  email?: string;
  tickets_resueltos: number;
  tiempo_promedio: number;
}

interface UsuarioCompleto {
  id: string;
  email: string | null;
  nombre_completo: string | null;
  rol: string;
  activo: boolean;
  run: string | null;
  created_at: string;
}

export function AdminCompleto({ perfil }: { perfil: any }) {
  const [stats, setStats] = useState<TecnicoStats[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAgregarTecnico, setShowAgregarTecnico] = useState(false);
  const [showAgregarUsuario, setShowAgregarUsuario] = useState(false);
  const [showConfigApi, setShowConfigApi] = useState(false);
  const [showConfigPipedrive, setShowConfigPipedrive] = useState(false);
  const [showConfigSupabase, setShowConfigSupabase] = useState(false);
  const [showConfigResend, setShowConfigResend] = useState(false);
  const [showPersonalizacion, setShowPersonalizacion] = useState(false);
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<UsuarioCompleto | null>(null);
  const [usuarioParaCambiarContraseña, setUsuarioParaCambiarContraseña] = useState<UsuarioCompleto | null>(null);
  const [ticketParaAsignar, setTicketParaAsignar] = useState<Ticket | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const supabase = createClient();

  const fetchStats = async () => {
    try {
      const inicioMes = startOfMonth(new Date()).toISOString();

      const { data: ticketsFinalizados, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, asignado_a, created_at, updated_at")
        .eq("estado", "finalizado")
        .gte("updated_at", inicioMes);

      const { data: tecnicos, error: tecnicosError } = await supabase
        .from("perfiles")
        .select("id, nombre_completo, run, email")
        .eq("rol", "tecnico")
        .eq("activo", true);

      if (ticketsError || tecnicosError) {
        console.error("Error obteniendo estadísticas:", { ticketsError, tecnicosError });
        return;
      }

      if (!ticketsFinalizados || !tecnicos) {
        return;
      }

      const statsMap = new Map<string, TecnicoStats>();
      tecnicos.forEach((tecnico) => {
        statsMap.set(tecnico.id, {
          tecnico_id: tecnico.id,
          nombre: tecnico.nombre_completo || "Sin nombre",
          run: tecnico.run || undefined,
          email: tecnico.email || undefined,
          tickets_resueltos: 0,
          tiempo_promedio: 0,
        });
      });

      const tiemposPorTecnico: Record<string, number[]> = {};
      ticketsFinalizados.forEach((ticket) => {
        if (ticket.asignado_a && statsMap.has(ticket.asignado_a)) {
          const stat = statsMap.get(ticket.asignado_a)!;
          stat.tickets_resueltos++;
          const inicio = new Date(ticket.created_at).getTime();
          const fin = new Date(ticket.updated_at).getTime();
          const horas = (fin - inicio) / (1000 * 60 * 60);
          if (!tiemposPorTecnico[ticket.asignado_a]) {
            tiemposPorTecnico[ticket.asignado_a] = [];
          }
          tiemposPorTecnico[ticket.asignado_a].push(horas);
        }
      });

      const statsArray = Array.from(statsMap.values()).map((stat) => {
        const tiempos = tiemposPorTecnico[stat.tecnico_id] || [];
        const promedio =
          tiempos.length > 0
            ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
            : 0;
        return { ...stat, tiempo_promedio: promedio };
      });

      statsArray.sort((a, b) => b.tickets_resueltos - a.tickets_resueltos);
      setStats(statsArray);
    } catch (error) {
      console.error("Error en fetchStats:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          tecnico:perfiles!tickets_asignado_a_fkey(nombre_completo, id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error obteniendo tickets:", error);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error("Error en fetchTickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsuarios(data as UsuarioCompleto[]);
    }
    setLoadingUsuarios(false);
  };

  const handleEliminarUsuario = async () => {
    if (!usuarioParaEliminar) return;

    setEliminando(true);
    try {
      const response = await fetch(
        `/api/admin/eliminar-usuario?id=${usuarioParaEliminar.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar el usuario");
      }

      setUsuarioParaEliminar(null);
      fetchUsuarios();
      fetchStats();
      alert(`✅ Usuario ${usuarioParaEliminar.nombre_completo} eliminado exitosamente`);
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      alert(`Error al eliminar usuario: ${error.message}`);
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let channel: any = null;

    // Timeout de seguridad para asegurar que el loading se desactive
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Timeout de carga alcanzado, desactivando loading");
        setLoading(false);
      }
    }, 5000); // 5 segundos máximo

    const loadData = async () => {
      try {
        // Cargar datos en paralelo pero con manejo de errores individual
        const promises = [
          fetchStats().catch(err => console.error("Error en fetchStats:", err)),
          fetchTickets().catch(err => console.error("Error en fetchTickets:", err)),
          fetchUsuarios().catch(err => console.error("Error en fetchUsuarios:", err)),
        ];
        await Promise.allSettled(promises);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        if (mounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    loadData();

    // Suscripción a cambios en tiempo real
    try {
      channel = supabase
        .channel("admin-tickets")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tickets",
          },
          (payload: any) => {
            if (mounted) {
              console.log("🔄 Admin: Cambio detectado en tiempo real:", payload);
              fetchStats();
              fetchTickets();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reportes",
          },
          () => {
            if (mounted) {
              console.log("🔄 Admin: Nuevo reporte detectado");
              fetchStats();
              fetchTickets();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "perfiles",
          },
          () => {
            if (mounted) {
              console.log("🔄 Admin: Cambio en perfiles detectado");
              fetchUsuarios();
              fetchStats();
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Suscripción activa");
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Error en canal de suscripción");
          }
        });
    } catch (error) {
      console.error("Error suscribiéndose a cambios:", error);
    }

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignorar errores al remover el canal si el componente ya se desmontó
          console.warn("Error al remover canal (ignorado):", error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías - solo se ejecuta una vez al montar

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol="admin" nombre={perfil.nombre_completo} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Panel de Administración</h2>
            <p className="text-muted-foreground">
              Acceso completo al sistema - {format(new Date(), "MMMM yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPersonalizacion(true)}>
              <Palette className="h-4 w-4 mr-2" />
              Personalizar
            </Button>
            <Button variant="outline" onClick={() => setShowConfigApi(true)}>
              <Key className="h-4 w-4 mr-2" />
              Configurar IA
            </Button>
            <Button variant="outline" onClick={() => setShowConfigSupabase(true)}>
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Configurar Supabase
            </Button>
            <Button variant="outline" onClick={() => setShowAgregarTecnico(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Técnico
            </Button>
            <Button variant="outline" onClick={() => setShowAgregarUsuario(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Ticket
            </Button>
          </div>
        </div>

        <Tabs defaultValue="metricas" className="w-full">
          <TabsList>
            <TabsTrigger value="metricas">
              <BarChart3 className="h-4 w-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <FileText className="h-4 w-4 mr-2" />
              Todos los Tickets
            </TabsTrigger>
            <TabsTrigger value="tecnicos">
              <Users className="h-4 w-4 mr-2" />
              Técnicos
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="configuracion">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metricas" className="mt-6">
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
                      {stats.map((stat, index) => (
                        <tr key={stat.tecnico_id} className="border-b">
                          <td className="p-2 font-semibold">#{index + 1}</td>
                          <td className="p-2">{stat.nombre}</td>
                          <td className="p-2 text-right">{stat.tickets_resueltos}</td>
                          <td className="p-2 text-right">
                            {stat.tiempo_promedio > 0
                              ? `${stat.tiempo_promedio.toFixed(1)} horas`
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                      {stats.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            No hay datos para este mes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="relative">
                  <TicketCard
                    ticket={ticket}
                    onViewDetail={(ticket) => {
                      // Para admin, podríamos abrir un modal o navegar
                      console.log("Admin viendo ticket:", ticket.id);
                      alert(`Ticket #${ticket.id}\nCliente: ${ticket.cliente_nombre}\nEstado: ${ticket.estado}\nPrioridad: ${ticket.prioridad}`);
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTicketParaAsignar(ticket)}
                      className="bg-background/80 backdrop-blur-sm"
                      title="Asignar o cambiar técnico"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {ticket.asignado_a ? "Cambiar" : "Asignar"}
                    </Button>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No hay tickets
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tecnicos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.map((stat) => (
                    <div key={stat.tecnico_id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <span className="font-medium">{stat.nombre}</span>
                        {stat.run && (
                          <span className="text-xs text-muted-foreground ml-2">
                            RUN: {stat.run}
                          </span>
                        )}
                        {stat.email && (
                          <span className="text-xs text-muted-foreground ml-2">
                            • {stat.email}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.tickets_resueltos} tickets resueltos
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAgregarTecnico(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar Técnico
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAgregarUsuario(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar Usuario
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando usuarios...
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Nombre</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Rol</th>
                          <th className="text-left p-2">RUN</th>
                          <th className="text-left p-2">Estado</th>
                          <th className="text-left p-2">Fecha Creación</th>
                          <th className="text-left p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map((usuario) => (
                          <tr key={usuario.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">
                              {usuario.nombre_completo || "Sin nombre"}
                            </td>
                            <td className="p-2 text-sm">
                              {usuario.email || (
                                <span className="text-muted-foreground italic">
                                  Sin email
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${usuario.rol === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : usuario.rol === "ventas"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                              >
                                {usuario.rol === "admin"
                                  ? "Administrador"
                                  : usuario.rol === "ventas"
                                    ? "Ventas"
                                    : "Técnico"}
                              </span>
                            </td>
                            <td className="p-2 text-sm">
                              {usuario.run || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${usuario.activo
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {usuario.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {format(
                                new Date(usuario.created_at),
                                "PP",
                                { locale: es }
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setUsuarioParaCambiarContraseña(usuario)}
                                  title="Cambiar contraseña"
                                >
                                  <KeyRound className="h-3 w-3" />
                                </Button>
                                {usuario.id !== perfil.id && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setUsuarioParaEliminar(usuario)}
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracion" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SupabaseStatus />
              <GeminiStatus />
              <PipedriveStatus />
              <ResendStatus />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Configuración de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura la API key de Google Gemini para habilitar la generación automática de reportes técnicos.
                </p>
                <Button onClick={() => setShowConfigApi(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Configurar API Key de Gemini
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Configuración de Pipedrive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura tu API key y dominio de Pipedrive para buscar y autocompletar datos de clientes en los reportes.
                </p>
                <Button onClick={() => setShowConfigPipedrive(true)} variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  Configurar Pipedrive
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5" />
                  Configuración de Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura la URL y las API keys de tu proyecto de Supabase. Esto te permite cambiar entre diferentes proyectos o actualizar las credenciales.
                </p>
                <Button onClick={() => setShowConfigSupabase(true)} variant="outline">
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Configurar Supabase
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuración de Resend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura tu API key de Resend para habilitar el envío de emails desde la aplicación. Resend se usa para enviar reportes técnicos y notificaciones por correo electrónico.
                </p>
                <Button onClick={() => setShowConfigResend(true)} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Configurar Resend
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchTickets();
          fetchStats();
        }}
        creadoPor={perfil.id}
      />

      <AgregarTecnicoDialog
        open={showAgregarTecnico}
        onOpenChange={setShowAgregarTecnico}
        onSuccess={() => {
          fetchStats();
          fetchUsuarios();
        }}
      />

      <AgregarUsuarioDialog
        open={showAgregarUsuario}
        onOpenChange={setShowAgregarUsuario}
        onSuccess={() => {
          fetchUsuarios();
        }}
      />

      <ConfigApiDialog
        open={showConfigApi}
        onOpenChange={setShowConfigApi}
        onSuccess={() => {
          // Recargar si es necesario
        }}
      />

      <ConfigPipedriveDialog
        open={showConfigPipedrive}
        onOpenChange={setShowConfigPipedrive}
        onSuccess={() => {
          // Recargar si es necesario
        }}
      />

      <ConfigSupabaseDialog
        open={showConfigSupabase}
        onOpenChange={setShowConfigSupabase}
        onSuccess={() => {
          // Recargar si es necesario
        }}
      />

      <ConfigResendDialog
        open={showConfigResend}
        onOpenChange={setShowConfigResend}
        onSuccess={() => {
          // Recargar si es necesario
        }}
      />

      <PersonalizacionDialog
        open={showPersonalizacion}
        onOpenChange={setShowPersonalizacion}
      />

      {usuarioParaEliminar && (
        <ConfirmarEliminarDialog
          open={!!usuarioParaEliminar}
          onOpenChange={(open) => !open && setUsuarioParaEliminar(null)}
          usuarioNombre={usuarioParaEliminar.nombre_completo || "Usuario"}
          usuarioRol={
            usuarioParaEliminar.rol === "admin"
              ? "Administrador"
              : usuarioParaEliminar.rol === "ventas"
                ? "Ventas"
                : "Técnico"
          }
          onConfirm={handleEliminarUsuario}
          loading={eliminando}
        />
      )}

      {usuarioParaCambiarContraseña && (
        <CambiarContraseñaDialog
          open={!!usuarioParaCambiarContraseña}
          onOpenChange={(open) => !open && setUsuarioParaCambiarContraseña(null)}
          usuarioId={usuarioParaCambiarContraseña.id}
          usuarioNombre={usuarioParaCambiarContraseña.nombre_completo || "Usuario"}
          onSuccess={() => {
            setUsuarioParaCambiarContraseña(null);
          }}
        />
      )}

      {ticketParaAsignar && (
        <AsignarTecnicoDialog
          open={!!ticketParaAsignar}
          onOpenChange={(open) => !open && setTicketParaAsignar(null)}
          ticket={ticketParaAsignar}
          onSuccess={() => {
            setTicketParaAsignar(null);
            fetchTickets();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}


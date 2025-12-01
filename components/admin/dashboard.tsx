"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface TecnicoStats {
  tecnico_id: string;
  nombre: string;
  tickets_resueltos: number;
  tiempo_promedio: number; // en horas
}

export function AdminDashboard({ perfil }: { perfil: any }) {
  const [stats, setStats] = useState<TecnicoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const inicioMes = startOfMonth(new Date()).toISOString();

    // Obtener todos los tickets finalizados del mes actual
    const { data: ticketsFinalizados } = await supabase
      .from("tickets")
      .select("id, asignado_a, created_at, updated_at")
      .eq("estado", "finalizado")
      .gte("updated_at", inicioMes);

    // Obtener perfiles de técnicos
    const { data: tecnicos } = await supabase
      .from("perfiles")
      .select("id, nombre_completo")
      .eq("rol", "tecnico")
      .eq("activo", true);

    if (!ticketsFinalizados || !tecnicos) {
      setLoading(false);
      return;
    }

    // Calcular estadísticas por técnico
    const statsMap = new Map<string, TecnicoStats>();

    tecnicos.forEach((tecnico) => {
      statsMap.set(tecnico.id, {
        tecnico_id: tecnico.id,
        nombre: tecnico.nombre_completo || "Sin nombre",
        tickets_resueltos: 0,
        tiempo_promedio: 0,
      });
    });

    const tiemposPorTecnico: Record<string, number[]> = {};

    ticketsFinalizados.forEach((ticket) => {
      if (ticket.asignado_a && statsMap.has(ticket.asignado_a)) {
        const stat = statsMap.get(ticket.asignado_a)!;
        stat.tickets_resueltos++;

        // Calcular tiempo de resolución
        const inicio = new Date(ticket.created_at).getTime();
        const fin = new Date(ticket.updated_at).getTime();
        const horas = (fin - inicio) / (1000 * 60 * 60);

        if (!tiemposPorTecnico[ticket.asignado_a]) {
          tiemposPorTecnico[ticket.asignado_a] = [];
        }
        tiemposPorTecnico[ticket.asignado_a].push(horas);
      }
    });

    // Calcular promedios
    const statsArray = Array.from(statsMap.values()).map((stat) => {
      const tiempos = tiemposPorTecnico[stat.tecnico_id] || [];
      const promedio =
        tiempos.length > 0
          ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
          : 0;
      return { ...stat, tiempo_promedio: promedio };
    });

    // Ordenar por tickets resueltos
    statsArray.sort((a, b) => b.tickets_resueltos - a.tickets_resueltos);

    setStats(statsArray);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar rol="admin" nombre={perfil.nombre_completo} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">
            Métricas de productividad - {format(new Date(), "MMMM yyyy", { locale: es })}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="space-y-4">
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
          </div>
        )}
      </div>
    </div>
  );
}















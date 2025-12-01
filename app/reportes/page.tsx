import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportesDashboard } from "@/components/reportes/dashboard";

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (perfilError || !perfil) {
    redirect("/auth/login");
  }

  // Solo admin y ventas pueden ver reportes
  if (perfil.rol !== "admin" && perfil.rol !== "ventas") {
    redirect("/");
  }

  return <ReportesDashboard perfil={perfil} />;
}











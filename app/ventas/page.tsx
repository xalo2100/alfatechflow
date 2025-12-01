import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VentasDashboard } from "@/components/ventas/dashboard";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Consulta optimizada: solo obtener campos necesarios
  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("id, email, nombre_completo, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilError || !perfil || perfil.rol !== "ventas") {
    redirect("/auth/login");
  }

  return <VentasDashboard perfil={perfil} />;
}







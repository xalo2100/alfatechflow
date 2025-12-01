import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TecnicoDashboard } from "@/components/tecnico/dashboard";

export default async function TecnicoPage() {
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

  if (perfilError || !perfil || perfil.rol !== "tecnico") {
    redirect("/auth/login");
  }

  return <TecnicoDashboard perfil={perfil} />;
}







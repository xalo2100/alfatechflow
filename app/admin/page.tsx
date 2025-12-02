import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminCompleto } from "@/components/admin/admin-completo";

export default async function AdminPage() {
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

  if (perfilError || !perfil || perfil.rol !== "admin") {
    redirect("/auth/login");
  }

  return <AdminCompleto perfil={perfil} />;
}







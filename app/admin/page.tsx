import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";

// Importar dinámicamente para evitar errores de hidratación
const AdminCompleto = dynamic(
  () => import("@/components/admin/admin-completo").then((mod) => ({ default: mod.AdminCompleto })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }
);

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







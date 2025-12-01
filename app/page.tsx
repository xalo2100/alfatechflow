import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Si no hay variables de entorno, redirigir a preview
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/preview");
  }

  const supabase = await createClient();
  
  // Consulta optimizada: obtener usuario y perfil en paralelo si es posible
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Consulta optimizada: solo obtener el rol necesario
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol) {
    switch (perfil.rol) {
      case "admin":
        redirect("/admin");
      case "ventas":
        redirect("/ventas");
      case "tecnico":
        redirect("/tecnico");
      default:
        redirect("/auth/login");
    }
  }

  redirect("/auth/login");
}


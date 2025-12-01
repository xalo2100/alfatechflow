"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, User, FileText } from "lucide-react";
import { getAppConfig } from "@/lib/app-config";
import { useEffect, useState } from "react";

export function Navbar({ rol, nombre }: { rol: string; nombre?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [appConfig, setAppConfig] = useState<ReturnType<typeof getAppConfig> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAppConfig(getAppConfig());
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const canViewReportes = rol === "admin" || rol === "ventas";

  // Valores consistentes para evitar errores de hidratación
  // Usar valores por defecto hasta que el componente esté montado
  const nombreApp = mounted && appConfig ? appConfig.nombre : "AlfaTechFlow";
  const colorPrimario = mounted && appConfig ? appConfig.colores.primary : undefined;
  const logoUrl = mounted && appConfig?.logo ? appConfig.logo : null;
  
  // Usar pathname solo después de montar para evitar diferencias de hidratación
  const currentPath = mounted ? pathname : "/";

  // Renderizar siempre la misma estructura para evitar errores de hidratación
  // No renderizar logo hasta que esté montado para evitar diferencias
  return (
    <nav className="border-b bg-background shadow-sm" suppressHydrationWarning>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Renderizar siempre la misma estructura para evitar errores de hidratación */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {mounted && logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-6 sm:h-8 w-auto max-w-[120px] sm:max-w-[200px] object-contain"
                  onError={(e) => {
                    // Si la imagen falla, ocultarla y mostrar el nombre
                    (e.target as HTMLImageElement).style.display = 'none';
                    const nombreElement = (e.target as HTMLElement).nextElementSibling;
                    if (nombreElement) {
                      (nombreElement as HTMLElement).style.display = 'block';
                    }
                  }}
                />
              )}
              <h1 
                className="text-base sm:text-xl font-bold truncate"
                style={colorPrimario ? { color: colorPrimario } : {}}
              >
                {nombreApp}
              </h1>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground capitalize hidden sm:inline">
              {rol}
            </span>
            {canViewReportes && (
              <Button
                variant={currentPath === "/reportes" ? "default" : "ghost"}
                size="sm"
                onClick={() => router.push("/reportes")}
                className="hidden sm:flex"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Reportes</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {nombre && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline truncate max-w-[100px] sm:max-w-none">{nombre}</span>
              </div>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}









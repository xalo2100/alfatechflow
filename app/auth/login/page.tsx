"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Intentar login usando la API route que soporta RUN o email
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      // Log para debugging
      console.log("📊 Respuesta del API:", result);
      console.log("📊 Status:", response.status);

      if (!response.ok) {
        console.error("❌ Error del API:", result);
        throw new Error(result.error || "Error al iniciar sesión");
      }

      // Verificar que tenemos los datos necesarios
      if (!result.session) {
        console.error("❌ No se recibió sesión del servidor");
        console.error("📊 Respuesta completa:", result);
        throw new Error(result.error || "No se recibió sesión del servidor. " + (result.hint || ""));
      }

      if (!result.user || !result.user.rol) {
        console.error("❌ No se recibió información de usuario o rol");
        console.error("📊 Respuesta completa:", result);
        throw new Error("Usuario sin rol asignado. Contacta al administrador.");
      }

      // Si la API devuelve éxito, establecer la sesión manualmente
      if (result.session) {
        console.log("✅ Estableciendo sesión...");
        console.log("👤 Usuario:", result.user);
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Redirigir según rol
        const redirectPath =
          result.user.rol === "super_admin" || result.user.rol === "admin" ? "/admin" :
            result.user.rol === "ventas" ? "/ventas" :
              result.user.rol === "tecnico" ? "/tecnico" : "/auth/login";

        console.log("🔄 Redirigiendo a:", redirectPath);

        // Pequeña pausa para asegurar que setSession se complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Usar window.location.replace para redirección sin agregar al historial
        window.location.replace(redirectPath);

        // No setear loading a false porque estamos redirigiendo
        // setLoading(false); 
      } else {
        throw new Error("No se recibió sesión del servidor");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            AlfaTechFlow
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestión de Soporte Técnico
            <br />
            <span className="text-xs text-muted-foreground">v1.2 (Fix Login)</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email o RUN</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="tu@email.com o 164121489"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Técnicos: Puedes usar tu RUN (ej: 164121489) o tu email
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}







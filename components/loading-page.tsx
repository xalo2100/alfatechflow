"use client";

import { Loader2 } from "lucide-react";

export function LoadingPage({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}







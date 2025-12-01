"use client";

import { useState } from "react";

interface UseEmailReturn {
  sendEmail: (options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) => Promise<{ success: boolean; id?: string; warning?: string; error?: string }>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para enviar emails desde componentes del cliente
 * Usa la API route /api/email/send
 */
export function useEmail(): UseEmailReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el email");
      }

      return {
        success: true,
        id: data.id,
        warning: data.warning,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido al enviar email";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    loading,
    error,
  };
}



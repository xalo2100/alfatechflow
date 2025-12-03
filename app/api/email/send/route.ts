import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/emailService";

// API Route para enviar emails usando el servicio de email
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject y html son requeridos" },
        { status: 400 }
      );
    }

    // Usar el servicio de email centralizado
    if (process.env.RESEND_API_KEY) {
      const result = await sendEmail({
        to,
        subject,
        html,
        from: from || "Soporte Técnico Alfapack <soportetecnico@alfapack.cl>",
      });

      return NextResponse.json({
        success: true,
        id: result.id,
        warning: result.warning
      });
    }

    // Opción 2: Usar nodemailer con SMTP (deshabilitado para evitar errores de build)
    // Si necesitas usar SMTP, descomenta este código y asegúrate de tener nodemailer instalado
    // npm install nodemailer
    // Opción 2: Usar nodemailer con SMTP (deshabilitado para evitar errores de build)
    // Si necesitas usar SMTP, descomenta este código y asegúrate de tener nodemailer instalado
    // (Código eliminado para evitar errores de build en Vercel)

    // Si no hay configuración de email, retornar error
    return NextResponse.json(
      {
        error: "No hay configuración de email. Configura RESEND_API_KEY o SMTP en .env.local",
        hint: "Para usar Resend: npm install resend y agrega RESEND_API_KEY=tu_key"
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar el email" },
      { status: 500 }
    );
  }
}





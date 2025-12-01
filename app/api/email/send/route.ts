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

    // Opción 2: Usar nodemailer con SMTP
    // Necesitas instalar: npm install nodemailer
    // Y configurar variables SMTP en .env.local
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Importar nodemailer dinámicamente solo si está instalado
        let nodemailer;
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          nodemailer = require("nodemailer");
        } catch {
          return NextResponse.json(
            { 
              error: "nodemailer no está instalado. Instálalo con: npm install nodemailer",
              hint: "O configura RESEND_API_KEY para usar Resend"
            },
            { status: 500 }
          );
        }
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: from || "Soporte Técnico Alfapack <soportetecnico@alfapack.cl>",
          to: Array.isArray(to) ? to.join(", ") : to,
          subject: subject,
          html: html,
        });

        return NextResponse.json({ success: true, messageId: info.messageId });
      } catch (smtpError: any) {
        return NextResponse.json(
          { 
            error: "Error configurando SMTP. Asegúrate de tener nodemailer instalado.",
            details: smtpError.message 
          },
          { status: 500 }
        );
      }
    }

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





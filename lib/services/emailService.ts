/**
 * Servicio de correos usando Resend
 * Permite enviar correos como soportetecnico@alfapack.cl
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface SendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
  warning?: string;
}

/**
 * Envía un correo a través de Resend
 * @param options - Opciones del correo (to, subject, html, from)
 * @returns Promise con la respuesta de Resend
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResponse> {
  const { to, subject, html, from = 'Soporte Técnico Alfapack <soportetecnico@alfapack.cl>' } = options;

  // Intentar obtener la API key desde la base de datos primero, luego desde variables de entorno
  let apiKey: string;
  try {
    const { getResendApiKey } = await import("@/lib/resend");
    apiKey = await getResendApiKey();
  } catch (error: any) {
    // Si falla, usar variable de entorno como fallback
    apiKey = process.env.RESEND_API_KEY || "";
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada. Por favor, configúrala en el panel de administración o en .env.local');
    }
  }

  try {
    // Intentar enviar con el dominio personalizado
    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Si el dominio no está verificado, usar dominio de prueba de Resend
      if (error.message && error.message.includes('domain is not verified')) {
        console.warn('⚠️ Dominio no verificado, usando dominio de prueba de Resend');
        
        const fallbackFrom = 'Soporte Técnico Alfapack <onboarding@resend.dev>';
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fallbackFrom,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
          }),
        });

        if (!response.ok) {
          const fallbackError = await response.json();
          throw new Error(fallbackError.message || 'Error al enviar el correo');
        }

        const data = await response.json();
        return {
          ...data,
          warning: 'Email enviado desde dominio de prueba de Resend. Para usar soportetecnico@alfapack.cl, verifica el dominio en https://resend.com/domains'
        };
      }
      
      throw new Error(error.message || 'Error al enviar el correo');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error enviando correo:', error);
    throw error;
  }
}

/**
 * Envía correo de confirmación de contacto
 */
export async function sendContactConfirmation(
  destinatario: string,
  nombre: string,
  email: string,
  asunto: string
): Promise<SendEmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #1a1a1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Alfapack Lo Herrera</h1>
          <p>Soluciones en Empaque y Maquinaria</p>
        </div>
        
        <div class="content">
          <h2>¡Gracias por tu contacto, ${nombre}!</h2>
          <p>Hemos recibido tu mensaje correctamente.</p>
          
          <p><strong>Detalles de tu consulta:</strong></p>
          <ul>
            <li>Correo: ${email}</li>
            <li>Tema: ${asunto}</li>
            <li>Fecha: ${new Date().toLocaleDateString('es-CL')}</li>
          </ul>
          
          <p>Nuestro equipo de soporte técnico se pondrá en contacto contigo en las próximas 24 horas.</p>
          
          <p>Si tienes urgencia, puedes llamarnos directamente.</p>
          
          <a href="https://www.alfapack.cl" class="button">Visita nuestro sitio</a>
        </div>
        
        <div class="footer">
          <p>© 2025 Alfapack Lo Herrera. Todos los derechos reservados.</p>
          <p><strong>soportetecnico@alfapack.cl</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject: `Re: ${asunto} - Confirma tu contacto`,
    html,
  });
}

/**
 * Envía correo de notificación interna (para administradores)
 */
export async function sendInternalNotification(
  asunto: string,
  contenido: string,
  detalles: Record<string, string>,
  destinatario: string = 'gsanchez@alfapack.cl'
): Promise<SendEmailResponse> {
  const detallesHtml = Object.entries(detalles)
    .map(([clave, valor]) => `<li><strong>${clave}:</strong> ${valor}</li>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; border-left: 4px solid #1a1a1a; margin-top: 20px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📧 Nueva notificación - ${asunto}</h2>
        </div>
        
        <div class="content">
          <p>${contenido}</p>
          
          <div class="details">
            <h3>Detalles:</h3>
            <ul>
              ${detallesHtml}
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject: `[NOTIFICACIÓN] ${asunto}`,
    html,
  });
}

/**
 * Envía recordatorio de pedido
 */
export async function sendOrderReminder(
  emailCliente: string,
  numeroPedido: string,
  detalles: string
): Promise<SendEmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        h2 { color: #1a1a1a; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Recordatorio de tu pedido #${numeroPedido}</h2>
        <p>Hola,</p>
        <p>Tu pedido sigue en proceso:</p>
        <pre>${detalles}</pre>
        <p>¿Tienes preguntas? Contáctanos a soportetecnico@alfapack.cl</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: emailCliente,
    subject: `Recordatorio: Tu pedido #${numeroPedido}`,
    html,
  });
}



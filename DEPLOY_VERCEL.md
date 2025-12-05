# Guía de Despliegue en Vercel

Sigue estos pasos para subir tu aplicación a producción usando Vercel.

## 1. Preparación

Asegúrate de que tu proyecto esté subido a un repositorio de GitHub (o GitLab/Bitbucket).

## 2. Importar Proyecto en Vercel

1.  Inicia sesión en [Vercel](https://vercel.com).
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  Selecciona tu repositorio de GitHub (`alfatechflow-hosting-basico` o el nombre que tenga).
4.  Haz clic en **"Import"**.

## 3. Configuración del Proyecto

En la pantalla de configuración ("Configure Project"):

*   **Framework Preset:** Next.js (debería detectarse automáticamente).
*   **Root Directory:** `./` (déjalo como está).
*   **Build Command:** `npm run build` (o `next build`).
*   **Install Command:** `npm install`.

## 4. Variables de Entorno (Environment Variables)

**IMPORTANTE:** Debes agregar las variables de entorno para que la aplicación funcione correctamente. Despliega la sección **"Environment Variables"** y agrega las siguientes (copia los valores de tu archivo `.env.local`):

| Nombre (Key) | Valor (Value) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Tu URL de Supabase* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Tu Anon Key de Supabase* |
| `SUPABASE_SERVICE_ROLE_KEY` | *Tu Service Role Key de Supabase* |
| `RESEND_API_KEY` | *Tu API Key de Resend* |
| `GEMINI_API_KEY` | *Tu API Key de Google Gemini* |
| `PIPEDRIVE_API_TOKEN` | *Tu Token de Pipedrive (si usas)* |
| `PIPEDRIVE_COMPANY_DOMAIN` | *Tu Dominio de Pipedrive (si usas)* |

> **Nota:** Asegúrate de no incluir espacios extra al copiar las claves.

## 5. Desplegar

1.  Haz clic en **"Deploy"**.
2.  Espera a que termine el proceso de construcción (Build).
3.  Si todo sale bien, verás una pantalla de "Congratulations!".

## 6. Verificación

Haz clic en la imagen de vista previa o en el botón **"Visit"** para ver tu aplicación en vivo.
Prueba iniciar sesión y generar un reporte para asegurarte de que la conexión con Supabase y las APIs funcione correctamente.

---

### Solución de Problemas Comunes

*   **Error 500 en API:** Generalmente significa que falta una variable de entorno (como la `SUPABASE_SERVICE_ROLE_KEY`). Revisa la configuración en Vercel -> Settings -> Environment Variables.
*   **Estilos rotos:** Asegúrate de que `tailwind.config.ts` esté correctamente configurado (ya debería estarlo).

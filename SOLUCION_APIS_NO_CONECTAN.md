# Solución: APIs no Conectan (Solo Supabase funciona)

## Problema

Las APIs de Gemini, Pipedrive y Resend no conectan, solo Supabase funciona.

## Causa

El problema es que las políticas RLS (Row Level Security) en la tabla `configuraciones` están bloqueando el acceso cuando se usa `SERVICE_ROLE_KEY` desde las API routes del servidor.

## Solución Rápida: Usar Variables de Entorno

Mientras se corrige el problema de RLS, puedes usar las variables de entorno directamente:

1. Abre tu archivo `.env.local`
2. Agrega las API keys directamente:

```env
# API Keys (temporalmente mientras se corrige RLS)
GEMINI_API_KEY=tu_api_key_de_gemini
PIPEDRIVE_API_KEY=tu_api_key_de_pipedrive
PIPEDRIVE_DOMAIN=tu_dominio
RESEND_API_KEY=tu_api_key_de_resend
```

3. Reinicia el servidor de desarrollo:
```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

## Solución Permanente: Corregir Políticas RLS

El `SERVICE_ROLE_KEY` de Supabase debería bypasear RLS automáticamente, pero si no funciona:

### Opción 1: Verificar que SERVICE_ROLE_KEY esté correcta

1. Ve a tu proyecto de Supabase
2. Settings → API
3. Copia la `service_role` key (secreta)
4. Verifica que esté en `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Opción 2: Ejecutar Script SQL (si es necesario)

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script: `supabase/fix-configuraciones-rls.sql`

Este script recrea las políticas RLS para que funcionen correctamente con el service role.

## Verificar que Funciona

1. Recarga la página del panel de administración
2. Ve a la pestaña "Configuración"
3. Deberías ver el estado de conexión de todas las APIs

## Notas

- El código ahora tiene mejor manejo de errores y usará automáticamente las variables de entorno si no puede acceder a la base de datos
- Las API keys en variables de entorno funcionarán como fallback
- Una vez que se corrija RLS, las API keys guardadas en la base de datos funcionarán correctamente



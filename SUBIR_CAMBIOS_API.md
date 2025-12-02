# 🚀 Subir Cambios de APIs de Pipedrive y Gemini

## 📋 Cambios Importantes Pendientes

Los siguientes archivos contienen correcciones críticas para que las APIs de Pipedrive y Gemini funcionen correctamente, pero **NO están subidos a Git ni desplegados en Vercel**:

### ✅ Correcciones de APIs (IMPORTANTE)

1. **lib/gemini.ts** - Cambio a `createAdminClient()` para funcionar en servidor
2. **lib/pipedrive.ts** - Cambio a `createAdminClient()` para funcionar en servidor
3. **app/api/pipedrive/buscar-organizacion/route.ts** - Agregado `force-dynamic`
4. **app/api/pipedrive/test-search/route.ts** - Agregado `force-dynamic`
5. **app/api/reportes/track-lectura/route.ts** - Agregado `force-dynamic`

### 📁 Nuevas Funcionalidades

6. **app/api/reportes/enviar-email/route.ts** - Actualizado para incluir firmas
7. **app/api/reportes/guardar-firma-tecnico/** - Nueva API para firma del técnico
8. **app/api/reportes/subir-pdf-temporal/** - Nueva API para WhatsApp

### 🔧 Otros Cambios Recientes

- Mostrar técnico asignado en tickets
- Botón de WhatsApp en reportes
- Firma del técnico

## 📤 Cómo Subir los Cambios

Ejecuta estos comandos en orden:

```bash
# 1. Agregar solo los archivos importantes de API
git add lib/gemini.ts lib/pipedrive.ts
git add app/api/pipedrive/buscar-organizacion/route.ts
git add app/api/pipedrive/test-search/route.ts
git add app/api/reportes/track-lectura/route.ts
git add app/api/reportes/enviar-email/route.ts
git add app/api/reportes/guardar-firma-tecnico/
git add app/api/reportes/subir-pdf-temporal/

# 2. Agregar otros cambios importantes recientes
git add components/reportes/dashboard.tsx
git add components/reportes/reporte-detail-dialog.tsx
git add components/tecnico/dashboard.tsx
git add components/tecnico/ticket-detail.tsx
git add components/tecnico/ticket-list.tsx
git add components/ventas/dashboard.tsx
git add components/ventas/ticket-card.tsx
git add components/ventas/ticket-list-view.tsx
git add components/reportes/firma-tecnico-dialog.tsx
git add components/dynamic-favicon.tsx
git add components/dynamic-title.tsx

# 3. Hacer commit
git commit -m "Fix: Correcciones APIs Pipedrive/Gemini + nuevas funcionalidades

- Fix: lib/gemini.ts y lib/pipedrive.ts usan createAdminClient() para funcionar en servidor
- Fix: Agregado force-dynamic a rutas API para evitar errores de build
- Nuevo: API para guardar firma del técnico
- Nuevo: API para subir PDF temporal para WhatsApp
- Nuevo: Mostrar técnico asignado en recuadros de tickets
- Nuevo: Botón de WhatsApp en reportes
- Nuevo: Firma del técnico en reportes"

# 4. Subir a GitHub (esto desplegará automáticamente en Vercel)
git push origin main
```

## ⚠️ IMPORTANTE

Después de hacer `git push`, Vercel desplegará automáticamente los cambios. Esto puede tomar 2-5 minutos.

Una vez desplegado, las APIs de Pipedrive y Gemini deberían funcionar correctamente porque:
- Usan `createAdminClient()` que funciona en el servidor sin necesidad de sesión de usuario
- Tienen `force-dynamic` para evitar errores de build

## 🔍 Verificar que Funcionen

Después del despliegue:

1. Ve a tu aplicación en Vercel
2. Prueba buscar en Pipedrive desde el panel de admin
3. Prueba generar un reporte (usando Gemini)
4. Verifica que no haya errores en los logs de Vercel

## 📝 Nota

Hay otros archivos modificados (como archivos .md, scripts, etc.) que puedes subir después si quieres, pero los archivos listados arriba son los **críticos** para que las APIs funcionen.





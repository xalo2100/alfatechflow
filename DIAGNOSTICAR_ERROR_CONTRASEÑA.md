# 🔍 Diagnosticar Error al Cambiar Contraseña

## ❌ Problema Actual

El modal muestra: "Error en la respuesta del servidor. Por favor, intenta de nuevo."

Esto significa que el servidor está devolviendo HTML en lugar de JSON.

## 🔧 Pasos para Diagnosticar

### Paso 1: Abrir DevTools del Navegador

1. Presiona `F12` o `Cmd+Option+I` (Mac)
2. Ve a la pestaña **"Network"** (Red)
3. Asegúrate de que esté grabando (botón rojo activado)

### Paso 2: Intentar Cambiar la Contraseña

1. Llena el formulario de cambio de contraseña
2. Haz clic en "Cambiar Contraseña"
3. Observa la pestaña Network

### Paso 3: Revisar la Petición

1. Busca una petición a `/api/admin/cambiar-contraseña`
2. Haz clic en ella
3. Ve a la pestaña **"Response"** o **"Preview"**
4. Copia y comparte lo que veas ahí

## 🔄 Solución Rápida: Reiniciar el Servidor

A veces el servidor necesita reiniciarse para que los cambios tomen efecto:

1. En la terminal donde corre `npm run dev`:
   - Presiona `Ctrl + C` para detenerlo
   - Ejecuta `npm run dev` de nuevo

2. Espera a que termine de compilar
3. Intenta cambiar la contraseña de nuevo

## 🐛 Verificar Logs del Servidor

En la terminal donde corre `npm run dev`, busca mensajes como:

- `Error en cambiar-contraseña API:`
- `Error de autenticación:`
- Cualquier error en rojo

Copia esos mensajes y compártelos.

## ✅ Verificar que el Código Esté Correcto

Ejecuta esto en la terminal:

```bash
# Verificar sintaxis
npx tsc --noEmit app/api/admin/cambiar-contraseña/route.ts
```

Si hay errores, compártelos.

## 🔐 Verificar Variables de Entorno

Asegúrate de que `.env.local` tenga:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 📝 Qué Revisar

### 1. Estado del Código
- ✅ `force-dynamic` agregado
- ✅ Manejo de errores mejorado

### 2. Posibles Causas
- ❌ El servidor no está detectando los cambios (reiniciar)
- ❌ Error en tiempo de ejecución (revisar logs)
- ❌ Problema de autenticación (revisar cookies/sesión)
- ❌ Variables de entorno incorrectas

### 3. Código de Estado HTTP
En DevTools → Network → busca la petición y revisa:
- **Status Code**: ¿200, 401, 403, 404, 500?
- **Response**: ¿JSON o HTML?

## 🆘 Si Nada Funciona

Comparte esta información:

1. **Status Code** de la petición (en Network)
2. **Response** completa (en Network → Response)
3. **Errores en la terminal** del servidor
4. **Errores en la consola del navegador** (F12 → Console)





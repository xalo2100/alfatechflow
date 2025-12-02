# 🔧 Solución: Buscador de Pipedrive No Funciona

## 🚨 Problemas Comunes

El buscador de Pipedrive puede fallar por varias razones:
1. ❌ Credenciales no configuradas
2. ❌ API Key o Dominio incorrectos
3. ❌ Problemas de conexión con Pipedrive
4. ❌ Error en la respuesta de la API

---

## ✅ PASO 1: Verificar Configuración de Pipedrive

### En la Aplicación:

1. **Inicia sesión como administrador**
2. Ve al **Panel de Administración**
3. Busca la opción **"Configurar Pipedrive"** o **"Pipedrive"**
4. Verifica que estén configurados:
   - ✅ **API Key** de Pipedrive
   - ✅ **Dominio** de Pipedrive (ej: `tu-empresa` sin `.pipedrive.com`)

### Si NO están configurados:

1. Ve al panel de administración
2. Click en **"Configurar Pipedrive"**
3. Sigue el PASO 2 para obtener las credenciales

---

## 🔑 PASO 2: Obtener Credenciales de Pipedrive

### 2.1 Obtener el Dominio de Pipedrive

1. Ve a tu cuenta de Pipedrive: **https://app.pipedrive.com**
2. Inicia sesión
3. Mira la URL en tu navegador, verás algo como:
   ```
   https://tu-empresa.pipedrive.com
   ```
4. El dominio es la parte antes de `.pipedrive.com`:
   - Ejemplo: Si la URL es `https://mi-empresa.pipedrive.com`
   - El dominio es: **`mi-empresa`** (sin `.pipedrive.com`)

### 2.2 Obtener la API Key

1. En Pipedrive, click en tu **perfil** (arriba a la derecha)
2. Selecciona **"Settings"** (Configuración)
3. En el menú lateral, busca **"Personal preferences"** o **"Preferences"**
4. Busca la sección **"API"** o **"API Token"**
5. Si ya tienes un token, cópialo
6. Si NO tienes un token:
   - Click en **"Generate API token"** o **"Crear token"**
   - Copia el token generado (empieza con letras y números)

**⚠️ IMPORTANTE:**
- El token es SENSIBLE - no lo compartas
- Guarda el token en un lugar seguro
- Si pierdes el token, puedes generar uno nuevo

---

## 🔧 PASO 3: Configurar en la Aplicación

1. **Ve al panel de administración**
2. Click en **"Configurar Pipedrive"**
3. Ingresa:
   - **API Key:** Pega el token que copiaste
   - **Dominio:** Ingresa solo el dominio (ej: `mi-empresa`)
4. Click en **"Probar Conexión"** antes de guardar
   - Debe aparecer un mensaje de éxito
5. Si la conexión funciona, click en **"Guardar"**

---

## 🔍 PASO 4: Diagnosticar el Problema

### Abrir la Consola del Navegador:

1. En tu aplicación, presiona **F12** (o Cmd+Option+I en Mac)
2. Ve a la pestaña **"Console"** (Consola)
3. Intenta buscar algo en Pipedrive
4. Revisa los mensajes en la consola

### Buscar estos mensajes:

```
[FRONTEND] 🔍 Buscando: "nombre"
[FRONTEND] 📡 Status: 200 (o 400, 500, etc.)
[FRONTEND] ❌ Error: ...
```

### Mensajes de Error Comunes:

#### Error: "API key de Pipedrive no configurada"
**Solución:**
- Ve al PASO 3 y configura la API key

#### Error: "Dominio de Pipedrive no configurado"
**Solución:**
- Ve al PASO 3 y configura el dominio

#### Error: "API key inválida" o Status 401
**Solución:**
- La API key está incorrecta o expirada
- Genera una nueva API key en Pipedrive (PASO 2.2)
- Actualízala en la aplicación (PASO 3)

#### Error: "Dominio no encontrado" o Status 404
**Solución:**
- El dominio está incorrecto
- Verifica el dominio correcto en Pipedrive (PASO 2.1)
- Solo usa la parte antes de `.pipedrive.com`
- Actualízalo en la aplicación (PASO 3)

#### Error: "Error al buscar organizaciones"
**Solución:**
- Verifica que tu cuenta de Pipedrive tenga organizaciones
- Verifica que la API key tenga permisos para leer organizaciones

---

## 🧪 PASO 5: Probar la Conexión

### Opción A: Desde la Aplicación

1. Ve al panel de administración
2. Click en **"Configurar Pipedrive"**
3. Click en **"Probar Conexión"**
4. Debe aparecer un mensaje de éxito

### Opción B: Desde la Consola del Navegador

Abre la consola (F12) y ejecuta:

```javascript
fetch('/api/pipedrive/test-connection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'TU_API_KEY',
    domain: 'tu-dominio'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Reemplaza:**
- `TU_API_KEY` → Tu API key de Pipedrive
- `tu-dominio` → Tu dominio (sin `.pipedrive.com`)

---

## 📋 Checklist de Solución

- [ ] Verifiqué que la configuración de Pipedrive existe en el panel de admin
- [ ] Obtuve la API Key correcta de Pipedrive
- [ ] Obtuve el dominio correcto (solo la parte antes de `.pipedrive.com`)
- [ ] Configuré ambas credenciales en la aplicación
- [ ] Probé la conexión y funcionó
- [ ] Guardé la configuración
- [ ] Probé buscar un cliente y funcionó

---

## 🚨 Si Nada Funciona

### Verificar en Vercel (si estás desplegado ahí):

1. Ve a Vercel → Tu proyecto → Settings → Environment Variables
2. Verifica que NO necesitas variables de entorno para Pipedrive
   - Las credenciales se guardan en la base de datos
   - NO se usan variables de entorno para Pipedrive

### Verificar en la Base de Datos:

Las credenciales de Pipedrive se guardan encriptadas en la tabla `configuraciones`:
- `pipedrive_api_key` → API Key encriptada
- `pipedrive_domain` → Dominio encriptado

**Si las credenciales no están guardadas:**
- Configúralas desde el panel de administración
- NO intentes editarlas directamente en la base de datos

---

## 🔗 Enlaces Útiles

- **Pipedrive:** https://app.pipedrive.com
- **Documentación API de Pipedrive:** https://developers.pipedrive.com/docs/api/v1
- **Generar API Token:** https://app.pipedrive.com/settings/api

---

## 💡 Consejos

1. **El dominio es solo el nombre:**
   - ❌ Incorrecto: `mi-empresa.pipedrive.com`
   - ✅ Correcto: `mi-empresa`

2. **La API Key es sensible:**
   - No la compartas
   - Si se compromete, genera una nueva

3. **Verifica permisos:**
   - La API key debe tener permisos de lectura
   - Verifica en Pipedrive Settings → API

---

## ✅ Después de Solucionar

Una vez configurado correctamente, el buscador debería:
- ✅ Mostrar resultados al escribir 2+ caracteres
- ✅ Buscar en organizaciones y personas
- ✅ Mostrar información completa del cliente
- ✅ Permitir seleccionar y auto-completar el formulario

**¿Sigues teniendo problemas?** Revisa la consola del navegador (F12) para ver errores específicos.





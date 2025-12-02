# 🔧 Diagnóstico: Error 500 en Búsqueda de Pipedrive

## 🚨 Problema

Al buscar un cliente en Pipedrive, aparece un error **500 (Internal Server Error)**:
```
Failed to load resource: api/pipedrive/buscar-organizacion server responded with a status of 500
```

## 🔍 Causas Posibles

El error 500 puede deberse a:

1. ❌ **Credenciales de Pipedrive no configuradas**
   - Falta API Key
   - Falta Dominio
   - Credenciales incorrectas

2. ❌ **Error al obtener credenciales desde la base de datos**
   - Problema de permisos
   - Error de encriptación/desencriptación

3. ❌ **Error al conectarse con la API de Pipedrive**
   - API Key inválida
   - Dominio incorrecto
   - Problema de red

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Verificar Credenciales en el Panel de Administración

1. **Inicia sesión como administrador**
2. Ve al **Panel de Administración**
3. Busca la opción **"Configurar Pipedrive"** o **"Pipedrive"**
4. Verifica que estén configurados:
   - ✅ **API Key** de Pipedrive
   - ✅ **Dominio** de Pipedrive

**Si NO están configurados:**
- Ve al PASO 2 para obtener las credenciales
- Luego configúralas en el panel

**Si YA están configurados:**
- Ve al PASO 3 para verificar que sean correctas

---

### PASO 2: Obtener Credenciales de Pipedrive

#### 2.1 Obtener el Dominio

1. Ve a tu cuenta de Pipedrive: **https://app.pipedrive.com**
2. Inicia sesión
3. Mira la URL en tu navegador:
   ```
   https://tu-empresa.pipedrive.com
   ```
4. El dominio es la parte antes de `.pipedrive.com`
   - Ejemplo: Si la URL es `https://mi-empresa.pipedrive.com`
   - El dominio es: **`mi-empresa`** (sin `.pipedrive.com`)

#### 2.2 Obtener la API Key

1. En Pipedrive, click en tu **perfil** (arriba a la derecha)
2. Selecciona **"Settings"** (Configuración)
3. En el menú lateral, busca **"Personal preferences"** o **"Preferences"**
4. Busca la sección **"API"** o **"API Token"**
5. Si ya tienes un token, cópialo
6. Si NO tienes un token:
   - Click en **"Generate API token"** o **"Crear token"**
   - Copia el token generado

---

### PASO 3: Configurar en la Aplicación

1. **Ve al panel de administración**
2. Click en **"Configurar Pipedrive"**
3. Ingresa:
   - **API Key:** Pega el token que copiaste
   - **Dominio:** Ingresa solo el dominio (ej: `mi-empresa`)
4. **IMPORTANTE:** Click en **"Probar Conexión"** antes de guardar
   - Debe aparecer un mensaje de éxito
   - Si falla, revisa que las credenciales sean correctas
5. Si la conexión funciona, click en **"Guardar"**

---

### PASO 4: Verificar los Logs del Servidor

Si el error persiste, revisa los logs del servidor:

#### En Vercel:

1. Ve a https://vercel.com
2. Entra a tu proyecto
3. Ve a la pestaña **"Deployments"**
4. Click en el último deployment
5. Ve a la pestaña **"Functions"** o **"Logs"**
6. Busca mensajes relacionados con:
   - `[API]` o `[PIPEDRIVE]`
   - Errores específicos

#### Buscar estos mensajes:

```
[API] ❌ Error obteniendo credenciales
[PIPEDRIVE] ❌ ERROR EN BÚSQUEDA COMPLETA
```

---

## 🔍 Mensajes de Error Específicos

### Error: "API key de Pipedrive no configurada"

**Solución:**
- La API key no está guardada en la base de datos
- Configura la API key en el panel de administración (PASO 3)

### Error: "Dominio de Pipedrive no configurado"

**Solución:**
- El dominio no está guardado en la base de datos
- Configura el dominio en el panel de administración (PASO 3)

### Error: "Error al desencriptar la API key"

**Solución:**
- La clave de encriptación puede estar incorrecta
- Vuelve a configurar la API key en el panel de administración
- Asegúrate de que `ENCRYPTION_KEY` esté correcta en Vercel

### Error: "401 Unauthorized" o "API key inválida"

**Solución:**
- La API key está incorrecta o expirada
- Genera una nueva API key en Pipedrive
- Actualízala en la aplicación

### Error: "404 Not Found" o "Dominio no encontrado"

**Solución:**
- El dominio está incorrecto
- Verifica el dominio correcto en Pipedrive
- Solo usa la parte antes de `.pipedrive.com`

---

## 🧪 Probar la Conexión

### Opción A: Desde el Panel de Administración

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

---

## 📋 Checklist de Solución

- [ ] Verifiqué que la configuración de Pipedrive existe en el panel de admin
- [ ] Obtuve la API Key correcta de Pipedrive
- [ ] Obtuve el dominio correcto (solo la parte antes de `.pipedrive.com`)
- [ ] Configuré ambas credenciales en la aplicación
- [ ] Probé la conexión y funcionó
- [ ] Guardé la configuración
- [ ] Revisé los logs del servidor para ver errores específicos
- [ ] Probé buscar un cliente y funcionó

---

## 🔗 Enlaces Útiles

- **Pipedrive:** https://app.pipedrive.com
- **Documentación API de Pipedrive:** https://developers.pipedrive.com/docs/api/v1
- **Generar API Token:** https://app.pipedrive.com/settings/api
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 💡 Si Nada Funciona

1. **Revisa los logs del servidor** (Vercel → Deployments → Logs)
2. **Verifica que las credenciales estén correctas** (sin espacios extra)
3. **Prueba generar una nueva API key** en Pipedrive
4. **Verifica que el dominio sea correcto** (solo el nombre, sin `.pipedrive.com`)
5. **Asegúrate de que `ENCRYPTION_KEY` esté configurada** en Vercel

---

**¿Necesitas ayuda con algún paso específico?** Revisa los logs del servidor para ver el error exacto.





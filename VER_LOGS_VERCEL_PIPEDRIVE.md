# 🔍 Ver Logs del Servidor en Vercel para Diagnóstico

## 🚨 Problema Actual

El error 500 persiste en la búsqueda de Pipedrive. Para identificar la causa exacta, necesitamos revisar los logs del servidor.

---

## 📋 PASO 1: Acceder a los Logs en Vercel

1. **Ve a Vercel:** https://vercel.com
2. **Inicia sesión** en tu cuenta
3. **Selecciona tu proyecto:** `alfatechflow`
4. **Ve a la pestaña "Deployments"** (arriba en el menú)
5. **Click en el último deployment** (el más reciente)
6. **Busca la pestaña "Functions"** o **"Logs"**

---

## 🔍 PASO 2: Buscar los Logs de Pipedrive

En los logs, busca mensajes que contengan:

- `[PIPEDRIVE]`
- `[API]`
- `Error`
- `500`

### Logs importantes a buscar:

1. **Al inicio de la búsqueda:**
   ```
   [PIPEDRIVE] 🔍 BÚSQUEDA INICIADA
   [PIPEDRIVE] 🌐 Dominio: ...
   [PIPEDRIVE] 🔑 API Key: ...
   ```

2. **Si hay error de credenciales:**
   ```
   [PIPEDRIVE] ❌ Error obteniendo credenciales
   ```

3. **Si hay error en la búsqueda:**
   ```
   [PIPEDRIVE] ❌ ERROR EN BÚSQUEDA COMPLETA
   ```

4. **Errores de la API:**
   ```
   [API] ❌ ERROR EN BÚSQUEDA
   ```

---

## 📸 PASO 3: Capturar los Logs

1. **Copia los logs completos** que contengan `[PIPEDRIVE]` o `[API]`
2. **Busca especialmente:**
   - Mensajes de error (❌)
   - Stack traces
   - Mensajes que digan qué variable está undefined o null

---

## 🔧 PASO 4: Errores Comunes y Soluciones

### Error: "Error obteniendo credenciales"

**Causa:** No puede acceder a las credenciales desde el servidor.

**Posibles causas:**
1. Las credenciales no están guardadas en la base de datos
2. Problema de permisos al acceder a la tabla `configuraciones`
3. Error de encriptación/desencriptación

**Solución:**
- Verifica que las credenciales estén guardadas en el panel de administración
- Verifica que `ENCRYPTION_KEY` esté configurada en Vercel

### Error: "Error al buscar organizaciones: 401"

**Causa:** API key inválida o expirada.

**Solución:**
- Genera una nueva API key en Pipedrive
- Actualízala en el panel de administración

### Error: "Error al buscar organizaciones: 404"

**Causa:** Dominio incorrecto.

**Solución:**
- Verifica el dominio correcto (solo el nombre, sin `.pipedrive.com`)
- Actualízalo en el panel de administración

### Error: "No se pudo obtener el nombre"

**Causa:** La respuesta de Pipedrive no tiene la estructura esperada.

**Solución:**
- Esto requiere revisar la estructura real de la respuesta de Pipedrive
- Puede necesitar ajustes en el código

---

## 🧪 PASO 5: Probar la Conexión

Antes de revisar logs complejos, prueba la conexión básica:

1. Ve al panel de administración
2. Click en **"Configurar Pipedrive"**
3. Click en **"Probar Conexión"**
4. Si funciona, el problema está en la búsqueda, no en las credenciales

---

## 📋 PASO 6: Logs en Tiempo Real

Para ver logs en tiempo real mientras pruebas:

1. **Abre dos pestañas:**
   - Una: Vercel → Deployments → Último deployment → Logs
   - Otra: Tu aplicación

2. **En la aplicación, intenta buscar** un cliente en Pipedrive
3. **Observa los logs** en tiempo real en Vercel
4. **Busca el error exacto** que aparece

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Tu proyecto:** https://vercel.com/[tu-usuario]/alfatechflow

---

## ✅ Después de Revisar los Logs

Una vez que identifiques el error exacto en los logs:

1. **Anota el mensaje de error completo**
2. **Anota el stack trace** si aparece
3. **Verifica qué variable o función está fallando**

Con esa información, podremos solucionarlo específicamente.

---

**¿Necesitas ayuda para acceder a los logs?** Sigue el PASO 1 paso a paso.





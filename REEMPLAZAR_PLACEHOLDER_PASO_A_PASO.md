# 🔧 REEMPLAZAR PLACEHOLDER: Paso a Paso Visual

## 🚨 Problema Actual

En Vercel tienes:
```
SUPABASE_SERVICE_ROLE_KEY = PLACEHOLDER_SUPABASE_SERVICE_ROLE_KEY
```

**Esto NO funciona.** Necesitas la clave REAL de Supabase.

---

## ✅ SOLUCIÓN EN 4 PASOS

### PASO 1: Obtener la Clave Real de Supabase

1. **Abre una nueva pestaña** en tu navegador
2. Ve a: **https://supabase.com/dashboard**
3. Inicia sesión si es necesario
4. Selecciona tu proyecto: **`pprqdmeqavrcrpjguwrn`**
5. En el menú lateral izquierdo, click en **"Settings"** (⚙️ icono de engranaje)
6. En el menú de Settings, click en **"API"**
7. Busca la sección **"Project API keys"**
8. Verás dos claves:
   - `anon` `public` ← NO uses esta
   - `service_role` `secret` ← ✅ USA ESTA

9. En la fila de `service_role`, verás un ícono de ojo 👁️
10. **Click en el ojo** para revelar la clave
11. **Copia TODA la clave** (es muy larga, empieza con `eyJhbGci...`)
   - La clave completa es de varias líneas cuando la muestras
   - Asegúrate de copiarla completa

**⚠️ IMPORTANTE:**
- La clave es SENSIBLE - no la compartas
- Es muy larga (puede tener más de 200 caracteres)
- Debe empezar con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### PASO 2: Reemplazar el Placeholder en Vercel

1. **Vuelve a la pestaña de Vercel** donde tienes abierto el editor de la variable
2. En el campo **"Value"**, verás:
   ```
   PLACEHOLDER_SUPABASE_SERVICE_ROLE_KEY
   ```
3. **Selecciona y borra TODO** el texto placeholder
4. **Pega la clave real** que copiaste de Supabase
   - Debe ser una línea larga que empieza con `eyJhbGci...`
5. **Verifica que no haya espacios** al inicio o final

---

### PASO 3: Guardar los Cambios

1. Verifica que el campo **"Environments"** diga **"All Environments"**
   - Si no, cámbialo a "All Environments"
2. En la parte inferior derecha, click en **"Save"**
3. Deberías ver un mensaje de confirmación

---

### PASO 4: HACER REDEPLOY (MUY IMPORTANTE)

**⚠️ SIN REDEPLOY, los cambios NO se aplican. El error seguirá apareciendo.**

#### Opción A: Redeploy desde Vercel (Recomendado)

1. En Vercel, ve a la pestaña **"Deployments"** (arriba en el menú)
2. Busca el último deployment (el más reciente)
3. Click en los **3 puntos** (⋮) a la derecha del deployment
4. Click en **"Redeploy"**
5. Confirma el redeploy
6. Espera 2-5 minutos a que termine

#### Opción B: Hacer un cambio pequeño y push

Si prefieres, puedes hacer un cambio pequeño en el código y hacer push:
- Esto forzará un nuevo deploy automáticamente

---

## ✅ Verificar que Funcionó

1. Espera a que termine el redeploy (debe decir "Ready" en verde)
2. Ve a tu aplicación en Vercel
3. Inicia sesión como administrador
4. Intenta crear un nuevo usuario
5. **Debería funcionar sin el error "Invalid API key"**

---

## 🚨 Si Todavía Sale el Error

### Verifica que:

1. **La clave está completa:**
   - La clave debe empezar con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
   - Debe ser muy larga (más de 200 caracteres)
   - No debe tener espacios al inicio o final

2. **Hiciste redeploy:**
   - Ve a Deployments y verifica que haya un deploy reciente (después de cambiar la variable)
   - El deploy debe estar en estado "Ready" (verde)

3. **La clave es la correcta:**
   - Verifica en Supabase que copiaste la clave "service_role", NO "anon"
   - La clave "anon" empieza diferente y NO funciona para crear usuarios

4. **La variable está en "All Environments":**
   - Verifica que en Vercel, la variable esté marcada para Production, Preview y Development

---

## 📸 Ayuda Visual

### En Supabase (para copiar la clave):

```
Settings → API
  ↓
Project API keys:
  ↓
[service_role] [secret] [👁️] ← Click aquí
  ↓
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NzI2MCwiZXhwIjoyMDc5NjUzMjYwfQ.XXXXXXXXXXXXXXXXXXXXXXXX
```

### En Vercel (para pegar la clave):

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [BORRAR PLACEHOLDER] [PEGAR CLAVE REAL AQUÍ]
Environments: All Environments
  ↓
[Save] ← Click aquí
```

---

## 🔗 Enlaces Directos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/pprqdmeqavrcrpjguwrn/settings/api
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Tu proyecto Vercel:** https://vercel.com/[tu-usuario]/alfatechflow/settings/environment-variables

---

## 💡 Consejo Final

Si tienes la clave en tu archivo `.env.local` local y funciona ahí:
1. Abre tu archivo `.env.local` local
2. Busca `SUPABASE_SERVICE_ROLE_KEY=`
3. Copia el valor que está después del `=`
4. Pégalo en Vercel

**Pero OJO:** Asegúrate de que sea la clave "service_role", no otra.

---

## ✅ Checklist Final

- [ ] Obtuve la clave "service_role" de Supabase
- [ ] Copié la clave completa (muy larga)
- [ ] Reemplacé el placeholder en Vercel
- [ ] Verifiqué que no haya espacios
- [ ] Marqué "All Environments"
- [ ] Guardé los cambios
- [ ] Hice REDEPLOY en Vercel
- [ ] Esperé 2-5 minutos
- [ ] Probé crear un usuario

**Si todo está marcado, debería funcionar.** 🎉





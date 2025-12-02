# 🔧 Solución: Error "Invalid API key" al Crear Usuario

## 🚨 Problema

Cuando intentas crear un usuario nuevo, aparece el error:
```
Error al crear usuario: Invalid API key
```

## 🔍 Causa

El error ocurre porque falta o está mal configurada la variable de entorno:
- `SUPABASE_SERVICE_ROLE_KEY`

Esta clave es necesaria para crear usuarios administrativamente desde el servidor.

---

## ✅ SOLUCIÓN: Agregar SUPABASE_SERVICE_ROLE_KEY en Vercel

### PASO 1: Obtener la Service Role Key de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto (`pprqdmeqavrcrpjguwrn`)
3. Ve a **Settings** (⚙️ en el menú lateral)
4. Click en **API** (en el menú de Settings)
5. Busca la sección **"Project API keys"**
6. Encuentra **"service_role"** (NO uses "anon" key)
7. Click en el ícono de **"Reveal"** (👁️) para mostrar la clave
8. **Copia toda la clave** (es muy larga, asegúrate de copiar todo)

**⚠️ IMPORTANTE:**
- Esta clave es **SENSIBLE** - no la compartas
- Usa la clave **"service_role"**, NO la "anon"
- La clave es muy larga (empieza con `eyJhbGci...`)

---

### PASO 2: Agregar la Variable en Vercel

1. Ve a https://vercel.com
2. Entra a tu proyecto `alfatechflow`
3. Ve a **Settings** (arriba en el menú)
4. Click en **Environment Variables** (en el menú lateral izquierdo)
5. Busca si ya existe `SUPABASE_SERVICE_ROLE_KEY`
   - Si existe pero sigue el error: Puede estar mal configurada
   - Si NO existe: Necesitas agregarla

#### Opción A: Si NO existe la variable

1. Click en **"Add New"** (botón arriba)
2. En **"Key"**: Escribe exactamente:
   ```
   SUPABASE_SERVICE_ROLE_KEY
   ```
3. En **"Value"**: Pega la clave que copiaste de Supabase
4. **Marca las 3 casillas:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click en **"Save"**

#### Opción B: Si YA existe pero sigue el error

1. Click en la variable `SUPABASE_SERVICE_ROLE_KEY` existente
2. Verifica que el valor sea correcto (completo, sin espacios)
3. Si está mal, edítala:
   - Elimina espacios al inicio/final
   - Verifica que esté completa (la clave es muy larga)
   - Copia y pega de nuevo desde Supabase
4. Marca las 3 casillas (Production, Preview, Development)
5. Click en **"Save"**

---

### PASO 3: HACER REDEPLOY (MUY IMPORTANTE)

**⚠️ SIN REDEPLOY, los cambios NO se aplican**

Después de agregar/editar la variable:

1. Ve a la pestaña **"Deployments"** (arriba en el menú)
2. Busca el último deployment
3. Click en los **3 puntos** (⋮) del deployment
4. Click en **"Redeploy"**
5. Espera 2-5 minutos

**Alternativa:**
- Haz un pequeño cambio en el código
- Haz `git push`
- Esto forzará un nuevo deploy con las nuevas variables

---

### PASO 4: Verificar que Funciona

1. Ve a tu aplicación en Vercel
2. Inicia sesión como administrador
3. Intenta crear un nuevo usuario
4. Debería funcionar sin el error "Invalid API key"

---

## 🔍 Verificar la Configuración Actual

### En Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Verifica que existan estas variables:

| Variable | ¿Debe Existir? |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sí (esta es la que falta) |

### En tu archivo `.env.local` local:

Verifica que tengas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pprqdmeqavrcrpjguwrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota:** En `.env.local` puedes tenerla, pero debe estar también en Vercel.

---

## 🚨 Errores Comunes

### Error: "Variable not found"
- **Solución:** La variable no está agregada en Vercel
- Sigue el PASO 2 para agregarla

### Error: "Invalid API key" después de agregar la variable
- **Solución:** No hiciste redeploy
- Sigue el PASO 3 para hacer redeploy

### Error: La clave parece incorrecta
- **Solución:** Verifica que:
  1. Copiaste toda la clave (es muy larga)
  2. No hay espacios al inicio o final
  3. Usaste la clave "service_role", NO "anon"
  4. La clave empieza con `eyJhbGci...`

### Error: Funciona local pero no en Vercel
- **Causa:** La variable está en `.env.local` pero no en Vercel
- **Solución:** Agrega la variable en Vercel (PASO 2)

---

## 📋 Resumen Rápido

1. ✅ Obtener `SUPABASE_SERVICE_ROLE_KEY` de Supabase Dashboard
2. ✅ Agregarla en Vercel → Settings → Environment Variables
3. ✅ Marcar para Production, Preview y Development
4. ✅ **HACER REDEPLOY** (muy importante)
5. ✅ Probar crear un usuario

---

## 🔗 Enlaces Útiles

- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Tu proyecto Supabase: https://supabase.com/dashboard/project/pprqdmeqavrcrpjguwrn

---

## ✅ Después de Solucionar

Una vez que funcione, deberías poder:
- ✅ Crear nuevos usuarios (admin y ventas)
- ✅ Crear nuevos técnicos
- ✅ Gestionar usuarios sin errores de API key

**¿Necesitas ayuda con algún paso?** Revisa los logs en Vercel → Deployments para ver errores específicos.





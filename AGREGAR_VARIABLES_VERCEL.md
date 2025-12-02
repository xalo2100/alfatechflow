# 🔑 CÓMO AGREGAR VARIABLES EN VERCEL - Guía Visual

## 📍 Ubicación Exacta:

1. Ve a: **https://vercel.com**
2. Click en tu proyecto: **alfatechflow**
3. En el menú superior, click en: **"Settings"**
4. En el menú lateral izquierdo, click en: **"Environment Variables"**

---

## ➕ Agregar Cada Variable:

### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`

1. Click en el botón **"Add New"** (arriba a la derecha)
2. En el campo **"Key"**, escribe: `NEXT_PUBLIC_SUPABASE_URL`
3. En el campo **"Value"**, pega: `https://pprqdmeqavrcrpjguwrn.supabase.co`
4. Marca los checkboxes:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
5. Click en **"Save"**

### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. Click en **"Add New"**
2. **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzcyNjAsImV4cCI6MjA3OTY1MzI2MH0.9d0j9AztwRKpfaHgqFE29FC4jV_KhntdeQzm1KpIYzw`
4. Marca: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**

### Variable 3: `SUPABASE_SERVICE_ROLE_KEY`

**PRIMERO - Obtener el valor:**

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Click en **"Settings"** (icono de engranaje, abajo a la izquierda)
4. Click en **"API"** (en el menú lateral)
5. Busca la sección **"Project API keys"**
6. Busca **"service_role"** (NO uses "anon")
7. Click en el icono de **ojo** para mostrar la key
8. **COPIA** toda la key (es larga)

**Luego en Vercel:**

1. Click en **"Add New"**
2. **Key:** `SUPABASE_SERVICE_ROLE_KEY`
3. **Value:** (pega la key que copiaste de Supabase)
4. Marca: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**

### Variable 4: `RESEND_API_KEY`

1. Click en **"Add New"**
2. **Key:** `RESEND_API_KEY`
3. **Value:** `re_ViXZcfg3_6FKvBq2RofQc29je96raWisa`
4. Marca: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**

### Variable 5: `ENCRYPTION_KEY`

1. Click en **"Add New"**
2. **Key:** `ENCRYPTION_KEY`
3. **Value:** `OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=`
4. Marca: ✅ Production, ✅ Preview, ✅ Development
5. Click **"Save"**

---

## 🔄 PASO CRÍTICO: Hacer Redeploy

**⚠️ MUY IMPORTANTE:** Las variables NO funcionan hasta que haces redeploy.

1. Ve a la pestaña **"Deployments"** (arriba, junto a "Settings")
2. Busca el **último deployment** (el más reciente, arriba)
3. A la derecha del deployment, verás **3 puntos** (⋮)
4. Click en los **3 puntos**
5. Click en **"Redeploy"**
6. Confirma el redeploy
7. **Espera 2-5 minutos** a que termine

---

## ✅ Verificación:

Después del redeploy:

1. Ve a la pestaña **"Deployments"**
2. Espera a que el nuevo deployment diga **"Ready"** o **"Success"**
3. Click en el deployment para ver la URL
4. Abre la URL en tu navegador
5. **Ya NO debería redirigir a /preview**
6. Debería mostrar la página de login o la app funcionando

---

## 📋 Checklist Final:

- [ ] Agregué las 5 variables en Vercel
- [ ] Marqué todas para Production, Preview y Development
- [ ] **Hice redeploy después de agregar las variables**
- [ ] Esperé a que termine el redeploy
- [ ] Recargué la página de la app
- [ ] Ya no redirige a /preview

---

## 🎯 Si Sigue el Error:

1. Verifica que las variables estén realmente guardadas (ve a Settings → Environment Variables)
2. Verifica que hiciste redeploy DESPUÉS de agregar las variables
3. Revisa los logs del deployment en Vercel para ver errores específicos

---

## 🔗 Links Directos:

- **Vercel Environment Variables:** https://vercel.com → Tu proyecto → Settings → Environment Variables
- **Supabase API Keys:** https://supabase.com/dashboard → Settings → API






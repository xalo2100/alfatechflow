# 🔑 PASO A PASO: Agregar Variables en Vercel

## ⚠️ El Error es porque faltan las variables de entorno

Sigue estos pasos **en orden**:

---

## 📋 PASO 1: Ir a Vercel

1. Abre: **https://vercel.com**
2. Inicia sesión
3. Entra a tu proyecto `alfatechflow`

---

## 📋 PASO 2: Ir a Environment Variables

1. En el menú superior, click en **"Settings"**
2. En el menú lateral izquierdo, click en **"Environment Variables"**

---

## 📋 PASO 3: Agregar Variables (Una por una)

Click en **"Add New"** para cada variable:

### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`

1. **Key:** `NEXT_PUBLIC_SUPABASE_URL`
2. **Value:** `https://pprqdmeqavrcrpjguwrn.supabase.co`
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzcyNjAsImV4cCI6MjA3OTY1MzI2MH0.9d0j9AztwRKpfaHgqFE29FC4jV_KhntdeQzm1KpIYzw`
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

### Variable 3: `SUPABASE_SERVICE_ROLE_KEY`

**PRIMERO obtén el valor:**

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. Busca la sección **"service_role"**
5. Copia la key completa (es larga)

**Luego en Vercel:**

1. **Key:** `SUPABASE_SERVICE_ROLE_KEY`
2. **Value:** (pega la key que copiaste)
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

### Variable 4: `RESEND_API_KEY`

1. **Key:** `RESEND_API_KEY`
2. **Value:** `re_ViXZcfg3_6FKvBq2RofQc29je96raWisa`
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

### Variable 5: `ENCRYPTION_KEY`

1. **Key:** `ENCRYPTION_KEY`
2. **Value:** `OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=`
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Click **"Save"**

---

## 📋 PASO 4: HACER REDEPLOY (MUY IMPORTANTE)

**⚠️ CRÍTICO:** Sin redeploy, las variables NO funcionan.

1. Ve a la pestaña **"Deployments"** (arriba)
2. Busca el **último deployment** (el más reciente)
3. Click en los **3 puntos** (⋮) a la derecha
4. Click en **"Redeploy"**
5. Confirma el redeploy
6. **Espera 2-5 minutos** a que termine

---

## 📋 PASO 5: Verificar

1. Espera a que el redeploy termine (verás "Ready" o "Success")
2. Click en el deployment para ver la URL
3. Abre la URL en tu navegador
4. Debería funcionar ahora

---

## ✅ Checklist Final:

- [ ] Agregué `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Obtuve `SUPABASE_SERVICE_ROLE_KEY` de Supabase
- [ ] Agregué `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Agregué `RESEND_API_KEY`
- [ ] Agregué `ENCRYPTION_KEY`
- [ ] Marqué todas para Production, Preview y Development
- [ ] **Hice redeploy después de agregar las variables**
- [ ] Esperé a que termine el redeploy
- [ ] Recargué la página de la app

---

## 🎯 Recuerda:

**Las variables NO funcionan hasta que haces REDEPLOY.**

Después de agregar variables, SIEMPRE debes:
1. Ir a Deployments
2. Click en 3 puntos → Redeploy
3. Esperar a que termine

---

## 🔗 Links:

- **Vercel:** https://vercel.com
- **Supabase Keys:** https://supabase.com/dashboard → Settings → API
- **Archivo con valores:** `COPIAR_VARIABLES_VERCEL.txt`






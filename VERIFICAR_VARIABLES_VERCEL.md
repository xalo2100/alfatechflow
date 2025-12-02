# ✅ Verificar Variables de Entorno en Vercel

## 🔍 PASO A PASO:

### 1️⃣ Ir a Vercel

1. Ve a: **https://vercel.com**
2. Inicia sesión
3. Click en tu proyecto `alfatechflow`

### 2️⃣ Verificar Variables

1. Ve a: **Settings** (en el menú superior)
2. Click en: **Environment Variables** (en el menú lateral)
3. Deberías ver una lista de variables

### 3️⃣ Verificar que estas variables existan:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `RESEND_API_KEY`
- ✅ `ENCRYPTION_KEY`

### 4️⃣ Si NO están:

**Agrégalas ahora:**

#### Agregar Variable:

1. Click en **"Add New"**
2. **Key:** (nombre de la variable)
3. **Value:** (el valor)
4. Marca los checkboxes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click en **"Save"**

#### Valores a usar:

**`NEXT_PUBLIC_SUPABASE_URL`**
```
https://pprqdmeqavrcrpjguwrn.supabase.co
```

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzcyNjAsImV4cCI6MjA3OTY1MzI2MH0.9d0j9AztwRKpfaHgqFE29FC4jV_KhntdeQzm1KpIYzw
```

**`SUPABASE_SERVICE_ROLE_KEY`**
- Obtener de: https://supabase.com/dashboard → Settings → API → service_role

**`RESEND_API_KEY`**
```
re_ViXZcfg3_6FKvBq2RofQc29je96raWisa
```

**`ENCRYPTION_KEY`**
```
OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=
```

### 5️⃣ HACER REDEPLOY

**MUY IMPORTANTE:** Después de agregar/modificar variables:

1. Ve a la pestaña **"Deployments"**
2. Click en los **3 puntos** (⋮) del último deployment
3. Click en **"Redeploy"**
4. Espera 2-5 minutos

---

## ⚠️ IMPORTANTE:

- Las variables **NO se aplican** hasta que haces redeploy
- Si agregaste variables pero NO hiciste redeploy, todavía no funcionan
- **Debes hacer redeploy** después de cada cambio

---

## ✅ Verificación Final:

1. ✅ Todas las variables están agregadas
2. ✅ Todas marcadas para Production, Preview y Development
3. ✅ Hice redeploy después de agregar las variables
4. ✅ Esperé a que termine el redeploy
5. ✅ Recargué la página de la app

---

## 📋 Checklist:

- [ ] Verifiqué que las variables existan en Vercel
- [ ] Agregué todas las variables faltantes
- [ ] Marqué todas para Production, Preview y Development
- [ ] Hice redeploy después de agregar variables
- [ ] Esperé a que termine el redeploy
- [ ] Recargué la página de la app






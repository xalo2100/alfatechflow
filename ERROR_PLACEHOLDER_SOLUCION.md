# 🔧 SOLUCIÓN: Error "placeholder.supabase.co"

## ❌ Error que estás viendo:

```
Failed to load resource: placeholder.supabase... net::ERR_NAME_NOT_RESOLVED
```

## 🔍 Causa:

Las **variables de entorno NO están configuradas en Vercel**. El código está usando valores placeholder por defecto.

---

## ✅ SOLUCIÓN INMEDIATA:

### PASO 1: Ir a Vercel y agregar variables

1. Ve a: **https://vercel.com**
2. Entra a tu proyecto `alfatechflow`
3. Ve a: **Settings** → **Environment Variables**
4. Agrega estas variables **UNA POR UNA**:

---

### Variables a Agregar:

#### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Valor:** `https://pprqdmeqavrcrpjguwrn.supabase.co`
- Marca: ✅ Production, ✅ Preview, ✅ Development

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzcyNjAsImV4cCI6MjA3OTY1MzI2MH0.9d0j9AztwRKpfaHgqFE29FC4jV_KhntdeQzm1KpIYzw`
- Marca: ✅ Production, ✅ Preview, ✅ Development

#### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Valor:** (Obtener de Supabase Dashboard → Settings → API → service_role)
- Marca: ✅ Production, ✅ Preview, ✅ Development

#### 4. `RESEND_API_KEY`
- **Valor:** `re_ViXZcfg3_6FKvBq2RofQc29je96raWisa`
- Marca: ✅ Production, ✅ Preview, ✅ Development

#### 5. `ENCRYPTION_KEY`
- **Valor:** `OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=`
- Marca: ✅ Production, ✅ Preview, ✅ Development

#### 6. `NEXT_PUBLIC_APP_URL` (Opcional)
- **Valor:** Déjalo vacío por ahora o usa la URL que te dé Vercel
- Marca: ✅ Production, ✅ Preview, ✅ Development

---

### PASO 2: Obtener SUPABASE_SERVICE_ROLE_KEY

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. Busca la sección **"service_role"** (NO uses "anon")
5. Copia la key completa
6. Pégala en Vercel como `SUPABASE_SERVICE_ROLE_KEY`

---

### PASO 3: Hacer Redeploy

**MUY IMPORTANTE:** Después de agregar las variables:

1. Ve a la pestaña **"Deployments"**
2. Click en los **3 puntos** del último deployment
3. Click en **"Redeploy"**
4. Espera 2-5 minutos

---

## ⚠️ IMPORTANTE:

- **NO funcionará** hasta que agregues las variables
- **Debes hacer redeploy** después de agregar variables
- Las variables `NEXT_PUBLIC_*` se usan en el cliente (navegador)
- Las variables sin `NEXT_PUBLIC_` solo en el servidor

---

## ✅ Verificación:

Después del redeploy, la app debería:
- ✅ Conectarse a Supabase correctamente
- ✅ Ya no mostrar errores de "placeholder"
- ✅ Funcionar normalmente

---

## 📋 Checklist:

- [ ] Agregué `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Agregué `SUPABASE_SERVICE_ROLE_KEY` (obtenida de Supabase)
- [ ] Agregué `RESEND_API_KEY`
- [ ] Agregué `ENCRYPTION_KEY`
- [ ] Marqué todas para Production, Preview y Development
- [ ] Hice redeploy después de agregar variables

---

## 🎯 Resumen Rápido:

1. Ve a Vercel → Settings → Environment Variables
2. Agrega las 6 variables de arriba
3. Obtén `SUPABASE_SERVICE_ROLE_KEY` de Supabase
4. Haz redeploy
5. ¡Listo!






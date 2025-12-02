# 🔧 Solución: Error "Application error" en Vercel

## ❌ Error que estás viendo:
```
Application error: a client-side exception has occurred
(see the browser console for more information)
```

---

## 🔍 CAUSAS COMUNES:

### 1️⃣ Variables de Entorno Faltantes

**Síntoma:** La app no puede conectarse a Supabase o servicios.

**Solución:**
1. Ve a Vercel → Tu proyecto → **Settings** → **Environment Variables**
2. Verifica que TODAS estas estén configuradas:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `RESEND_API_KEY`
   - ✅ `ENCRYPTION_KEY`

3. Después de agregar/modificar variables:
   - Ve a **Deployments**
   - Click en los **3 puntos** del último deployment
   - Click en **"Redeploy"**

---

### 2️⃣ Error de Hidratación

**Síntoma:** Diferencia entre servidor y cliente.

**Solución:**
- Ya arreglamos algunos problemas de hidratación antes
- Puede que haya otros componentes que necesiten ajuste

---

### 3️⃣ Variables de Entorno Incorrectas

**Síntoma:** La app no puede iniciar.

**Verificar:**
- Que `NEXT_PUBLIC_SUPABASE_URL` esté correcto
- Que las keys no tengan espacios extras
- Que todas las variables estén marcadas para **Production**

---

## 🔍 CÓMO DIAGNOSTICAR:

### Paso 1: Ver Logs en Vercel

1. Ve a Vercel → Tu proyecto
2. Click en la pestaña **"Deployments"**
3. Click en el último deployment
4. Ve a la pestaña **"Logs"** o **"Runtime Logs"**
5. Busca errores en rojo

### Paso 2: Ver Console del Navegador

1. Abre la URL de tu app en Vercel
2. Presiona `F12` o `Cmd+Option+I` (Mac) para abrir DevTools
3. Ve a la pestaña **"Console"**
4. Busca errores en rojo
5. Cópialos y compártelos

---

## ✅ SOLUCIÓN PASO A PASO:

### 1. Verificar Variables de Entorno

**En Vercel:**
- Settings → Environment Variables
- Verifica que todas estén ahí
- **Importante:** `SUPABASE_SERVICE_ROLE_KEY` es crítica

### 2. Obtener Service Role Key

Si no la tienes:
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. Busca **"service_role"** (NO uses "anon")
5. Cópiala
6. Agrégala en Vercel como `SUPABASE_SERVICE_ROLE_KEY`

### 3. Redeploy

Después de agregar/modificar variables:
1. Ve a **Deployments**
2. Click en **3 puntos** → **Redeploy**
3. Espera 2-5 minutos

---

## 🎯 CHECKLIST:

- [ ] Todas las variables de entorno están en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurada
- [ ] Las variables están marcadas para **Production**
- [ ] Se hizo redeploy después de agregar variables
- [ ] Revisé los logs en Vercel
- [ ] Revisé la consola del navegador

---

## 📝 PRÓXIMOS PASOS:

1. **Revisa los logs** en Vercel (lo más importante)
2. **Verifica las variables** de entorno
3. **Comparte el error específico** que ves en los logs o console

---

## 🔗 Links Útiles:

- **Ver logs:** Vercel → Tu proyecto → Deployments → [Deployment] → Logs
- **Variables:** Vercel → Tu proyecto → Settings → Environment Variables
- **Supabase Keys:** https://supabase.com/dashboard → Settings → API

---

## 💡 Tip:

El error más común es que **falte `SUPABASE_SERVICE_ROLE_KEY`**. Asegúrate de agregarla.

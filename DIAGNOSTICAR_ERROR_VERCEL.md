# 🔍 Diagnosticar Error en Vercel

## ❌ Error Actual:
```
Application error: a client-side exception has occurred
```

---

## 🔍 PASO 1: Ver los Logs en Vercel

### Cómo ver los logs:

1. Ve a: https://vercel.com
2. Entra a tu proyecto
3. Click en la pestaña **"Deployments"**
4. Click en el **último deployment** (el más reciente)
5. Ve a la pestaña **"Logs"** o **"Runtime Logs"**
6. Busca errores en **rojo**

**Comparte conmigo qué errores ves ahí** (es lo más importante)

---

## 🔍 PASO 2: Ver Console del Navegador

### Cómo ver la consola:

1. Abre la URL de tu app en Vercel
2. Presiona:
   - **Mac:** `Cmd + Option + I`
   - **Windows/Linux:** `F12`
3. Ve a la pestaña **"Console"**
4. Busca errores en **rojo**
5. **Copia los errores** que veas

---

## ✅ PASO 3: Verificar Variables de Entorno

### Variables que DEBEN estar configuradas:

Ve a: Vercel → Tu proyecto → **Settings** → **Environment Variables**

Verifica que tengas:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ← **MUY IMPORTANTE**
- ✅ `RESEND_API_KEY`
- ✅ `ENCRYPTION_KEY`
- ⚠️ `NEXT_PUBLIC_APP_URL` (opcional por ahora)

### Cómo obtener `SUPABASE_SERVICE_ROLE_KEY`:

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. Busca **"service_role"** (NO uses "anon")
5. Cópiala
6. Agrégala en Vercel

---

## 🔧 SOLUCIONES COMUNES:

### Problema 1: Faltan Variables de Entorno

**Solución:**
1. Agrega todas las variables en Vercel
2. Haz **Redeploy** (Deployments → 3 puntos → Redeploy)

### Problema 2: Variables Incorrectas

**Solución:**
- Verifica que las URLs y keys estén correctas
- Sin espacios extras
- Sin caracteres raros

### Problema 3: Error de Hidratación

**Solución:**
- Ya arreglamos algunos problemas de hidratación
- Puede que haya otros componentes que necesiten ajuste

---

## 📋 CHECKLIST:

- [ ] Revisé los logs en Vercel
- [ ] Revisé la consola del navegador
- [ ] Verifiqué que todas las variables de entorno estén configuradas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurada
- [ ] Hice redeploy después de agregar variables

---

## 🎯 QUÉ HACER AHORA:

1. **Primero:** Revisa los logs en Vercel y la consola del navegador
2. **Segundo:** Verifica las variables de entorno
3. **Tercero:** Comparte conmigo qué errores específicos ves

---

## 💡 El Error Más Común:

**90% de las veces** el error es porque falta `SUPABASE_SERVICE_ROLE_KEY`.

Asegúrate de agregarla y hacer redeploy.






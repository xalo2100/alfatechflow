# 🚀 Guía Rápida: Desplegar AlfaTechFlow en Vercel (GRATIS)

## ⚡ ¿Por qué Vercel?

- ✅ **100% Gratis** para proyectos personales
- ✅ **Hecho para Next.js** (funciona perfecto)
- ✅ **SSL automático** (HTTPS incluido)
- ✅ **Sin configurar servidores** (todo automático)
- ✅ **Deploy automático** desde GitHub
- ✅ **Puedes usar tu dominio de Hostinger**

---

## 📋 PASO 1: Preparar el Código en GitHub

### 1.1 Crear Cuenta en GitHub

1. Ve a https://github.com
2. Crea una cuenta (o inicia sesión)
3. Verifica tu email

### 1.2 Crear Repositorio

1. Click en **"New repository"** (botón verde)
2. Nombre: `alfatechflow` (o el que prefieras)
3. Marca como **"Private"** (recomendado para proyectos privados)
4. **NO marques** "Add README" (ya tienes archivos)
5. Click en **"Create repository"**

### 1.3 Subir Código a GitHub

**Opción A: Por Terminal (Mac/Linux)**

```bash
# Ve a la carpeta del proyecto
cd /Users/gonzalo/Downloads/Soporte

# Inicializa git (si no está inicializado)
git init

# Crea .gitignore si no existe
cat > .gitignore << 'EOF'
.env.local
node_modules/
.next/
*.log
.DS_Store
EOF

# Agrega todos los archivos
git add .

# Haz commit
git commit -m "Initial commit - AlfaTechFlow"

# Conecta con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/alfatechflow.git

# Sube el código
git branch -M main
git push -u origin main
```

**Opción B: Por GitHub Desktop**

1. Descarga GitHub Desktop: https://desktop.github.com/
2. Instala y abre GitHub Desktop
3. Click en **"File"** → **"Add Local Repository"**
4. Selecciona la carpeta `/Users/gonzalo/Downloads/Soporte`
5. Click en **"Publish repository"**
6. Selecciona tu cuenta de GitHub
7. Nombre: `alfatechflow`
8. Click en **"Publish repository"**

**⚠️ IMPORTANTE:** Asegúrate de que `.env.local` NO se suba a GitHub (debe estar en `.gitignore`)

---

## 📤 PASO 2: Conectar Vercel con GitHub

### 2.1 Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Click en **"Sign Up"**
3. Selecciona **"Continue with GitHub"** (más fácil)
4. Autoriza a Vercel a acceder a tus repositorios

### 2.2 Importar Proyecto

1. En el dashboard de Vercel, click en **"Add New Project"**
2. Selecciona tu repositorio `alfatechflow`
3. Click en **"Import"**

### 2.3 Configurar el Proyecto

Vercel detectará automáticamente que es Next.js. Solo verifica:

- **Framework Preset:** Next.js (debe estar seleccionado)
- **Root Directory:** `./` (dejar por defecto)
- **Build Command:** `npm run build` (automático)
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install` (automático)

**NO hagas click en "Deploy" todavía.** Primero necesitas configurar las variables de entorno.

---

## 🔐 PASO 3: Configurar Variables de Entorno

### 3.1 Agregar Variables

En la página de configuración del proyecto, busca **"Environment Variables"** y agrega:

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pprqdmeqavrcrpjguwrn.supabase.co` | Ya lo tienes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (tu anon key) | Ya lo tienes |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (tu service role key) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.com` o `https://alfatechflow.vercel.app` | Tu dominio o URL de Vercel |
| `RESEND_API_KEY` | `re_ViXZcfg3_6FKvBq2RofQc29je96raWisa` | Ya lo tienes |
| `ENCRYPTION_KEY` | `OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=` | Ya lo tienes |
| `GEMINI_API_KEY` | `tu_gemini_key` | Opcional, puedes agregarlo después |

### 3.2 Obtener Service Role Key

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca **"service_role"** (NO uses la "anon" key)
5. Copia el **"service_role key"**
6. Pégalo en Vercel como `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 Configurar para Todos los Entornos

Asegúrate de que cada variable esté marcada para:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

---

## 🚀 PASO 4: Hacer el Deploy

1. Después de agregar todas las variables, click en **"Deploy"**
2. Vercel comenzará a construir tu aplicación
3. Esto puede tardar 2-5 minutos
4. Verás el progreso en tiempo real

### 4.1 Verificar el Deploy

Cuando termine, verás:
- ✅ **"Ready"** en verde
- Una URL como: `alfatechflow.vercel.app`

**¡Ya está funcionando!** Puedes hacer click en la URL para ver tu aplicación.

---

## 🌐 PASO 5: Conectar tu Dominio de Hostinger

### 5.1 Agregar Dominio en Vercel

1. En tu proyecto de Vercel, ve a **Settings** → **Domains**
2. En el campo de texto, escribe: `tu-dominio.com`
3. Click en **"Add"**
4. Vercel te mostrará instrucciones para configurar DNS

### 5.2 Configurar DNS en Hostinger

1. Ve a tu panel de Hostinger (hpanel.hostinger.com)
2. Busca **"DNS"** o **"Zona DNS"** o **"Administrador de DNS"**
3. Vercel te dará dos opciones:

**Opción A: Usar Registro A (Recomendado)**

Agrega estos registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `A` | `@` | `76.76.21.21` | `3600` |
| `CNAME` | `www` | `cname.vercel-dns.com.` | `3600` |

**⚠️ NOTA:** Los valores exactos los verás en Vercel. Pueden variar.

**Opción B: Usar CNAME (Más Simple)**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `CNAME` | `@` | `cname.vercel-dns.com.` | `3600` |
| `CNAME` | `www` | `cname.vercel-dns.com.` | `3600` |

4. Guarda los cambios en Hostinger
5. Espera 5-10 minutos para que se propague el DNS

### 5.3 Verificar en Vercel

1. Vuelve a Vercel → Settings → Domains
2. Verás el estado de tu dominio
3. Cuando esté listo, verás ✅ **"Valid Configuration"**
4. Vercel configurará SSL automáticamente

### 5.4 Probar tu Dominio

1. Visita `https://tu-dominio.com`
2. Deberías ver tu aplicación AlfaTechFlow
3. El SSL (candado verde) se configurará automáticamente

---

## 🔗 PASO 6: Configurar Supabase

### 6.1 Agregar Dominio a Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca **"Allowed Origins"** o **"Site URL"**
5. Agrega:
   - `https://tu-dominio.com`
   - `https://www.tu-dominio.com`
   - `https://alfatechflow.vercel.app` (URL de Vercel)
6. Guarda los cambios

---

## ✅ PASO 7: Verificar que Todo Funciona

1. Visita `https://tu-dominio.com`
2. Deberías ver la página de login de AlfaTechFlow
3. Intenta hacer login con tu usuario admin
4. Verifica que las funcionalidades básicas funcionen

---

## 🔄 Actualizar la Aplicación

Cada vez que hagas cambios:

1. **En tu computadora local:**
   ```bash
   cd /Users/gonzalo/Downloads/Soporte
   git add .
   git commit -m "Descripción de los cambios"
   git push
   ```

2. **Vercel automáticamente:**
   - Detectará los cambios en GitHub
   - Hará un nuevo build
   - Desplegará la nueva versión
   - En 1-2 minutos tu app estará actualizada

3. **Ver el progreso:**
   - Ve a tu proyecto en Vercel
   - Verás el nuevo deploy en la pestaña **"Deployments"**

---

## 🚨 Solución de Problemas

### ❌ Error: "Build Failed"

**Solución:**
1. Ve a Vercel → Tu proyecto → **Deployments**
2. Click en el deploy fallido
3. Revisa los logs para ver el error
4. Comúnmente es por:
   - Variables de entorno faltantes
   - Errores de TypeScript
   - Dependencias faltantes

### ❌ Error: "Invalid API key" en Supabase

**Solución:**
1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté correcta
2. Asegúrate de que el dominio esté en "Allowed Origins" de Supabase
3. Reinicia el deploy en Vercel

### ❌ El dominio no carga

**Solución:**
1. Verifica que los registros DNS estén correctos en Hostinger
2. Espera más tiempo (DNS puede tardar hasta 24 horas, pero generalmente 5-10 minutos)
3. Usa https://dnschecker.org para verificar la propagación
4. Verifica en Vercel → Settings → Domains que el dominio esté configurado

### ❌ Error: "CORS" o no se conecta a Supabase

**Solución:**
1. Ve a Supabase Dashboard → Settings → API
2. Agrega tu dominio en "Allowed Origins"
3. Agrega también la URL de Vercel: `https://alfatechflow.vercel.app`
4. Guarda y espera unos minutos

---

## 📊 Ventajas de Vercel vs Hostinger Hosting Compartido

| Característica | Vercel | Hostinger Compartido |
|----------------|--------|----------------------|
| **Costo** | ✅ Gratis | ⚠️ Requiere plan con Node.js |
| **Configuración** | ✅ Automática | ❌ Manual (compleja) |
| **SSL** | ✅ Automático | ⚠️ Manual |
| **Deploy** | ✅ Automático desde GitHub | ❌ Manual por FTP |
| **Optimización** | ✅ Perfecto para Next.js | ⚠️ Genérico |
| **Velocidad** | ✅ CDN global | ⚠️ Depende del servidor |
| **Escalabilidad** | ✅ Automática | ❌ Limitada |

---

## 💰 Límites del Plan Gratis de Vercel

El plan gratis incluye:
- ✅ 100GB de ancho de banda por mes
- ✅ Deploys ilimitados
- ✅ SSL ilimitado
- ✅ Dominios personalizados ilimitados

**Para AlfaTechFlow:** El plan gratis es más que suficiente.

---

## 🎉 ¡Listo!

Tu aplicación **AlfaTechFlow** está funcionando en Vercel de forma **gratis** y **automática**.

**URLs de acceso:**
- `https://alfatechflow.vercel.app` (URL de Vercel)
- `https://tu-dominio.com` (tu dominio personalizado)

**Próximos pasos:**
- Cada vez que hagas cambios, solo haz `git push` y Vercel actualizará automáticamente
- Puedes ver todos los deploys en Vercel → Deployments
- Puedes configurar notificaciones por email cuando hay un nuevo deploy

---

*Última actualización: 2024*


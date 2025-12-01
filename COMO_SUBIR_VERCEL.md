# 🚀 Cómo Subir a Vercel - Paso a Paso

## ✅ Ya está listo

- ✅ Git inicializado
- ✅ .gitignore creado
- ✅ Proyecto preparado

---

## 📋 PASO 1: Crear repositorio en GitHub

1. Ve a: **https://github.com/new**
2. Nombre del repositorio: `alfatechflow` (o el que prefieras)
3. Marca como **Private** (recomendado)
4. **NO** marques "Add README"
5. Click en **"Create repository"**

---

## 📋 PASO 2: Subir código a GitHub

**Abre la terminal y ejecuta estos comandos:**

```bash
# Ir a la carpeta del proyecto
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - AlfaTechFlow"

# Cambiar a rama main
git branch -M main

# Conectar con GitHub (REEMPLAZA TU_USUARIO con tu usuario real)
git remote add origin https://github.com/TU_USUARIO/alfatechflow.git

# Subir el código
git push -u origin main
```

**⚠️ IMPORTANTE:**
- Reemplaza `TU_USUARIO` con tu usuario de GitHub (ejemplo: si eres `gonzalo123`, sería `https://github.com/gonzalo123/alfatechflow.git`)
- Te pedirá tu usuario y contraseña de GitHub (o token de acceso)

---

## 📋 PASO 3: Conectar con Vercel

1. Ve a: **https://vercel.com**
2. Click en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel a acceder a tus repositorios
5. Click en **"Add New Project"**
6. Selecciona tu repositorio `alfatechflow`
7. Click en **"Import"**

---

## 📋 PASO 4: Configurar Variables de Entorno

En la página de configuración, agrega estas variables:

| Variable | Valor | Dónde obtenerlo |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pprqdmeqavrcrpjguwrn.supabase.co` | Ya lo tienes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Ya lo tienes |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` | Se actualizará después del deploy |
| `RESEND_API_KEY` | `re_ViXZcfg3...` | Ya lo tienes |
| `ENCRYPTION_KEY` | `OWQTQK6i9MmXRYhn...` | Ya lo tienes |
| `GEMINI_API_KEY` | (opcional) | Tu API key de Gemini |

**📝 Cómo agregar variables:**
1. Busca la sección "Environment Variables"
2. Agrega cada variable una por una
3. Marca para **Production**, **Preview** y **Development**

---

## 📋 PASO 5: Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Listo! Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 🎉 ¡Listo!

Tu aplicación estará corriendo en Vercel. Cada vez que hagas un cambio y lo subas a GitHub, Vercel lo desplegará automáticamente.

---

## 📚 Documentación Adicional

- `GUIA_VERCEL_GRATIS.md` - Guía completa detallada
- `DEPLOY_VERCEL.md` - Resumen rápido

---

## ❓ Problemas Comunes

**Error al hacer push:**
- Verifica tu usuario de GitHub
- Usa un token de acceso personal si pide contraseña

**Error en Vercel:**
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Vercel para ver el error específico


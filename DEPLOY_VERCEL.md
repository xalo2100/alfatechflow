# 🚀 Guía Rápida: Subir a Vercel desde aquí

## 📋 PASO 1: Inicializar Git (si no está hecho)

```bash
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico

# Inicializar git
git init

# Verificar que .gitignore existe
# (Ya debería existir, pero verifica)
```

## 📋 PASO 2: Subir a GitHub

### Opción A: Usando Terminal (Recomendado)

```bash
# 1. Agregar todos los archivos
git add .

# 2. Hacer commit
git commit -m "Initial commit - AlfaTechFlow"

# 3. Conectar con GitHub (REEMPLAZA TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/alfatechflow.git

# 4. Subir el código
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANTE:**
- Primero crea el repositorio en GitHub (https://github.com/new)
- Reemplaza `TU_USUARIO` con tu usuario real de GitHub
- Si el repositorio no existe, créalo primero

### Opción B: Usando GitHub Desktop

1. Descarga: https://desktop.github.com/
2. Instala y abre
3. File → Add Local Repository
4. Selecciona: `/Users/gonzalo/Documents/alfatechflow-hosting-basico`
5. Publish repository

## 📋 PASO 3: Conectar Vercel

1. Ve a: https://vercel.com
2. Sign Up → Continue with GitHub
3. Add New Project
4. Selecciona tu repositorio `alfatechflow`
5. Click en Import

## 📋 PASO 4: Configurar Variables de Entorno en Vercel

En la página de configuración del proyecto, agrega estas variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `ENCRYPTION_KEY`
- `GEMINI_API_KEY` (opcional)

## 📋 PASO 5: Deploy

Click en "Deploy" y espera 2-3 minutos.

¡Listo! Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 🔧 Script Automático

Si quieres, puedo crear un script que haga todo esto automáticamente.


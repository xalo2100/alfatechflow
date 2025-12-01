# 🚀 Guía Paso a Paso: Instalación en Hostinger Hosting Compartido

## ⚠️ IMPORTANTE: Antes de Empezar

**Hostinger Hosting Compartido** tiene limitaciones. Verifica que tu plan incluya:
- ✅ **Node.js** (versión 18 o superior) - **OBLIGATORIO**
- ✅ **Acceso SSH** - Recomendado (algunos planes no lo incluyen)
- ✅ **Base de datos PostgreSQL** - No necesaria (usamos Supabase)

**Si tu plan NO incluye Node.js**, tendrás que:
1. Actualizar a un plan VPS de Hostinger, O
2. Usar Vercel/Netlify (gratis) y apuntar tu dominio

---

## 📦 PASO 1: Preparar los Archivos en tu Computadora

### 1.1 Descomprimir el ZIP

1. Descarga `alfatechflow-hostinger.zip` si aún no lo tienes
2. Descomprime el archivo en una carpeta (ejemplo: `alfatechflow-hostinger`)
3. Verifica que tengas estas carpetas y archivos:
   ```
   alfatechflow-hostinger/
   ├── app/
   ├── components/
   ├── lib/
   ├── public/
   ├── package.json
   ├── package-lock.json
   ├── next.config.js
   └── tsconfig.json
   ```

### 1.2 Crear el Archivo `.env.local` (Localmente para pruebas)

Crea un archivo `.env.local` en la carpeta del proyecto con este contenido:

```env
# ============================================
# SUPABASE (OBLIGATORIO)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://pprqdmeqavrcrpjguwrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFkbWVxYXZyY3Jwamd1d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzcyNjAsImV4cCI6MjA3OTY1MzI2MH0.9d0j9AztwRKpfaHgqFE29FC4jV_KhntdeQzm1KpIYzw
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI

# ============================================
# URL DE LA APLICACIÓN
# ============================================
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# ============================================
# EMAIL (OBLIGATORIO)
# ============================================
RESEND_API_KEY=re_ViXZcfg3_6FKvBq2RofQc29je96raWisa

# ============================================
# ENCRIPTACIÓN (OBLIGATORIO)
# ============================================
ENCRYPTION_KEY=OWQTQK6i9MmXRYhnOjakR9w4LG3fsKFQuIBdgib6g/w=

# ============================================
# GEMINI (OPCIONAL - se puede configurar después)
# ============================================
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

**⚠️ IMPORTANTE:** Reemplaza:
- `TU_SERVICE_ROLE_KEY_AQUI` → Tu Service Role Key de Supabase (ver abajo cómo obtenerla)
- `https://tu-dominio.com` → Tu dominio real (ej: `https://alfatechflow.com`)
- `tu_gemini_api_key_aqui` → Tu API key de Gemini (opcional)

### 1.3 Obtener el Service Role Key de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca **"service_role"** (NO uses la "anon" key)
5. Copia el **"service_role key"** (es secreta, no la compartas)
6. Pégala en `.env.local` como `SUPABASE_SERVICE_ROLE_KEY`

---

## 📤 PASO 2: Subir Archivos a Hostinger

### 2.1 Conectar por FTP/SFTP

**Opción A: FileZilla (Recomendado para Windows/Mac)**

1. Descarga FileZilla: https://filezilla-project.org/
2. Abre FileZilla
3. En la parte superior, ingresa:
   - **Host:** `ftp.tu-dominio.com` o la IP que te dio Hostinger
   - **Usuario:** Tu usuario FTP (lo encuentras en el panel de Hostinger)
   - **Contraseña:** Tu contraseña FTP
   - **Puerto:** `21` (FTP) o `22` (SFTP)
4. Click en **"Conexión rápida"**

**Opción B: Panel de Hostinger (File Manager)**

1. Ve a tu panel de Hostinger (hpanel.hostinger.com)
2. Busca **"Administrador de archivos"** o **"File Manager"**
3. Navega a `public_html` (o la carpeta raíz que te indiquen)

### 2.2 Subir los Archivos

1. **Navega a `public_html`** en el servidor (o la carpeta raíz)
2. **Sube TODAS las carpetas y archivos** del proyecto:
   - `app/` (carpeta completa)
   - `components/` (carpeta completa)
   - `lib/` (carpeta completa)
   - `public/` (carpeta completa)
   - `package.json`
   - `package-lock.json`
   - `next.config.js`
   - `tsconfig.json`
   - `.env.local` (el que creaste con tus valores reales)

**💡 Tip:** Puedes subir todo de una vez seleccionando todas las carpetas y arrastrándolas.

**⚠️ IMPORTANTE:** Asegúrate de que `.env.local` esté en la raíz (mismo nivel que `package.json`)

---

## 🔧 PASO 3: Configurar Node.js en Hostinger

### 3.1 Activar Node.js desde el Panel

1. Ve a tu panel de Hostinger (hpanel.hostinger.com)
2. Busca **"Node.js"** o **"Node.js App"** en el menú
3. Si no lo encuentras, busca en **"Avanzado"** o **"Desarrollador"**
4. Click en **"Crear aplicación Node.js"** o **"Activar Node.js"**
5. Configura:
   - **Versión:** 18.x o superior (recomendado: 20.x)
   - **Carpeta de la aplicación:** `public_html` (o donde subiste los archivos)
   - **Modo:** Producción
6. Guarda los cambios

### 3.2 Verificar Node.js (Por SSH)

Si tienes acceso SSH:

```bash
# Conecta por SSH
ssh usuario@tu-servidor.hostinger.com

# Verifica la versión de Node.js
node --version
# Debe mostrar: v18.x.x o superior

# Verifica npm
npm --version
```

**Si NO tienes acceso SSH:** No te preocupes, puedes continuar desde el panel.

---

## 📦 PASO 4: Instalar Dependencias

### 4.1 Por SSH (Recomendado)

```bash
# Conecta por SSH
ssh usuario@tu-servidor.hostinger.com

# Ve a la carpeta del proyecto
cd public_html  # o la carpeta donde subiste los archivos

# Instala dependencias de producción
npm install --production

# Esto puede tardar varios minutos...
```

### 4.2 Por Terminal del Panel de Hostinger

1. Ve al panel de Hostinger
2. Busca **"Terminal"** o **"SSH Terminal"**
3. Ejecuta:
   ```bash
   cd public_html
   npm install --production
   ```

### 4.3 Verificar Instalación

Después de instalar, verifica que existe la carpeta `node_modules`:

```bash
ls -la node_modules
# Debe mostrar muchas carpetas
```

---

## 🏗️ PASO 5: Compilar la Aplicación

### 5.1 Ejecutar el Build

```bash
# En el servidor (por SSH o terminal del panel)
cd public_html
npm run build
```

**Esto puede tardar 5-10 minutos.** Al finalizar, deberías ver:
```
✓ Compiled successfully
```

### 5.2 Verificar que se Creó `.next`

```bash
ls -la .next
# Debe mostrar la carpeta .next con archivos compilados
```

**⚠️ Si hay errores en el build:**
- Revisa los mensajes de error
- Verifica que todas las variables en `.env.local` estén correctas
- Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurada

---

## 🚀 PASO 6: Configurar PM2 (Gestor de Procesos)

PM2 mantiene la aplicación corriendo y la reinicia automáticamente.

### 6.1 Instalar PM2

```bash
# En el servidor
npm install -g pm2
```

### 6.2 Iniciar la Aplicación con PM2

```bash
# Ve a la carpeta del proyecto
cd public_html

# Inicia la aplicación
pm2 start npm --name "alfatechflow" -- start

# Deberías ver algo como:
# [PM2] Starting npm in fork_mode
# [PM2] Successfully started
```

### 6.3 Guardar Configuración de PM2

```bash
# Guarda la configuración actual
pm2 save

# Configura PM2 para iniciar al arrancar el servidor
pm2 startup
# Sigue las instrucciones que te muestre (puede pedirte ejecutar un comando)
```

### 6.4 Verificar que Está Corriendo

```bash
# Ver estado
pm2 status

# Deberías ver "alfatechflow" con status "online"

# Ver logs en tiempo real
pm2 logs alfatechflow

# Presiona Ctrl+C para salir de los logs
```

**💡 Comandos útiles de PM2:**
```bash
pm2 restart alfatechflow    # Reiniciar
pm2 stop alfatechflow       # Detener
pm2 logs alfatechflow       # Ver logs
pm2 monit                   # Monitor de recursos
```

---

## 🌐 PASO 7: Configurar el Proxy Reverso

Necesitas que tu dominio apunte a `localhost:3000` donde corre Next.js.

### 7.1 Verificar qué Servidor Web Usa Hostinger

**Opción A: Contactar Soporte de Hostinger**

1. Abre un ticket de soporte
2. Pide que configuren un **proxy reverso** para tu dominio
3. Indica que tu aplicación Next.js corre en `localhost:3000`
4. Proporciona tu dominio

**Opción B: Configurar Manualmente (Si tienes acceso)**

### 7.2 Si Hostinger Usa Nginx

Crea o edita el archivo de configuración (puede estar en `/etc/nginx/sites-available/` o en el panel):

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Luego reinicia Nginx:
```bash
sudo systemctl restart nginx
```

### 7.3 Si Hostinger Usa Apache

Crea un archivo `.htaccess` en `public_html`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

ProxyPreserveHost On
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
```

**⚠️ IMPORTANTE:** Es posible que necesites habilitar `mod_proxy` y `mod_rewrite` en Apache. Contacta al soporte de Hostinger.

---

## 🔒 PASO 8: Configurar SSL/HTTPS

### 8.1 Activar SSL desde el Panel

1. Ve al panel de Hostinger
2. Busca **"SSL"** o **"Let's Encrypt"**
3. Selecciona tu dominio
4. Click en **"Activar SSL"** o **"Instalar SSL"**
5. Espera a que se configure (puede tardar 5-10 minutos)

### 8.2 Verificar SSL

1. Visita `https://tu-dominio.com`
2. Deberías ver un candado verde en el navegador
3. Si no funciona, espera unos minutos más y recarga

---

## 🔗 PASO 9: Configurar Supabase

### 9.1 Agregar Dominio a Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca **"Allowed Origins"** o **"Site URL"**
5. Agrega:
   - `https://tu-dominio.com`
   - `https://www.tu-dominio.com`
   - `http://tu-dominio.com` (temporal, hasta que SSL esté activo)
6. Guarda los cambios

### 9.2 Verificar Configuración

En Supabase Dashboard → Settings → API, verifica que tengas:
- ✅ **Project URL:** `https://pprqdmeqavrcrpjguwrn.supabase.co`
- ✅ **anon key:** Configurada en `.env.local`
- ✅ **service_role key:** Configurada en `.env.local`
- ✅ **Allowed Origins:** Incluye tu dominio

---

## ✅ PASO 10: Verificar que Todo Funciona

### 10.1 Probar la Aplicación

1. Visita `https://tu-dominio.com`
2. Deberías ver la página de login de AlfaTechFlow
3. Intenta hacer login con tu usuario admin

### 10.2 Verificar Funcionalidades

- [ ] Login funciona
- [ ] Puedes ver el dashboard
- [ ] Los reportes se cargan
- [ ] Las API routes funcionan (ej: `/api/health`)

### 10.3 Ver Logs si Hay Problemas

```bash
# Ver logs de PM2
pm2 logs alfatechflow

# Ver últimas 100 líneas
pm2 logs alfatechflow --lines 100
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### ❌ Error: "Node.js no encontrado"

**Solución:**
1. Ve al panel de Hostinger
2. Activa Node.js desde el panel
3. Asegúrate de usar versión 18 o superior
4. Verifica que la carpeta de la aplicación esté correcta

### ❌ Error: "Puerto 3000 ya en uso"

**Solución:**
```bash
# Ver qué está usando el puerto
lsof -i :3000

# O cambiar el puerto
# Edita package.json y cambia:
# "start": "next start -p 3001"
# Luego actualiza el proxy reverso para usar puerto 3001
```

### ❌ Error: "Permiso denegado"

**Solución:**
```bash
# Dar permisos correctos
chmod 755 public_html
chmod 600 .env.local
chown -R usuario:usuario public_html
```

### ❌ Error: "Cannot find module"

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install --production
npm run build
pm2 restart alfatechflow
```

### ❌ La app funciona pero se cae después de unos minutos

**Solución:**
- Verifica que PM2 esté corriendo: `pm2 status`
- Asegúrate de haber ejecutado `pm2 save` y `pm2 startup`
- Revisa los logs: `pm2 logs alfatechflow`

### ❌ Error: "CORS" o no se conecta a Supabase

**Solución:**
1. Ve a Supabase Dashboard → Settings → API
2. Agrega tu dominio en "Allowed Origins"
3. Verifica que las keys en `.env.local` sean correctas
4. Reinicia la app: `pm2 restart alfatechflow`

### ❌ Error: "Invalid API key" o problemas con Resend

**Solución:**
1. Verifica que `RESEND_API_KEY` en `.env.local` sea correcta
2. Asegúrate de que el dominio esté verificado en Resend
3. Si no está verificado, Resend usará `onboarding@resend.dev` automáticamente

### ❌ La aplicación no carga o muestra error 502

**Solución:**
1. Verifica que PM2 esté corriendo: `pm2 status`
2. Si no está corriendo: `pm2 start npm --name "alfatechflow" -- start`
3. Verifica que el proxy reverso esté configurado correctamente
4. Revisa los logs: `pm2 logs alfatechflow`

---

## 📋 CHECKLIST FINAL

Antes de considerar la instalación completa, verifica:

- [ ] Archivos subidos a `public_html` (o carpeta raíz)
- [ ] `.env.local` creado con TODAS las variables (especialmente `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Node.js activado en Hostinger (versión 18+)
- [ ] Dependencias instaladas (`npm install --production`)
- [ ] Aplicación compilada (`npm run build` - existe carpeta `.next`)
- [ ] PM2 instalado y aplicación corriendo (`pm2 status` muestra "online")
- [ ] PM2 configurado para iniciar al arrancar (`pm2 save` y `pm2 startup`)
- [ ] Proxy reverso configurado (Nginx/Apache apunta a `localhost:3000`)
- [ ] SSL/HTTPS activado (candado verde en el navegador)
- [ ] Supabase configurado con tu dominio en "Allowed Origins"
- [ ] La aplicación carga en `https://tu-dominio.com`
- [ ] Login funciona correctamente
- [ ] Funcionalidades básicas funcionan (crear reporte, etc.)

---

## 🔄 ACTUALIZAR LA APLICACIÓN (Cuando hagas cambios)

Cuando quieras actualizar la aplicación:

```bash
# 1. En tu computadora local, haz los cambios y compila
npm run build

# 2. Sube los archivos nuevos por FTP/SFTP
# (especialmente la carpeta .next y cualquier archivo modificado)

# 3. En el servidor, reinicia la aplicación
pm2 restart alfatechflow

# 4. Verifica que funciona
pm2 logs alfatechflow
```

---

## 📞 CONTACTO Y SOPORTE

### Si tienes problemas con Hostinger:
- **Soporte de Hostinger:** Abre un ticket desde el panel
- Pregunta sobre: Node.js, SSH, proxy reverso, PM2

### Si tienes problemas con la aplicación:
- Revisa los logs: `pm2 logs alfatechflow`
- Verifica las variables de entorno en `.env.local`
- Consulta la sección "Solución de Problemas" arriba

---

## 🎉 ¡LISTO!

Si completaste todos los pasos y el checklist, tu aplicación **AlfaTechFlow** debería estar funcionando en Hostinger.

**URL de acceso:** `https://tu-dominio.com`

**Usuario admin:** El que configuraste en Supabase (generalmente `gsanchez@alfapack.cl`)

---

**💡 Tip Final:** Si Hostinger hosting compartido no funciona bien (por limitaciones), considera:
- Actualizar a un **VPS de Hostinger** (más control)
- Usar **Vercel** (gratis) y apuntar tu dominio desde Hostinger

---

## 🆓 ALTERNATIVA: Si NO Puedes Usar VPS

Si tu plan de Hostinger **NO incluye Node.js** o tiene limitaciones, aquí tienes **alternativas GRATIS** que funcionan perfectamente:

---

## 🌟 OPCIÓN 1: Vercel (RECOMENDADO - 100% Gratis)

Vercel es la plataforma creada por los mismos creadores de Next.js. **Es completamente gratis** para proyectos personales y pequeños.

### Ventajas:
- ✅ **100% Gratis** (hasta cierto límite de uso)
- ✅ **Optimizado para Next.js** (funciona perfecto)
- ✅ **SSL automático** (HTTPS incluido)
- ✅ **Deploy automático** desde GitHub
- ✅ **CDN global** (rápido en todo el mundo)
- ✅ **Sin configuración de servidor** (todo automático)

### Pasos para Usar Vercel:

#### 1.1 Preparar el Código en GitHub

1. Crea una cuenta en https://github.com (si no tienes)
2. Crea un nuevo repositorio (ej: `alfatechflow`)
3. Sube tu código:
   ```bash
   # En tu computadora local
   cd /Users/gonzalo/Downloads/Soporte
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/alfatechflow.git
   git push -u origin main
   ```

**⚠️ IMPORTANTE:** NO subas `.env.local` a GitHub. Crea un archivo `.gitignore`:
```gitignore
.env.local
node_modules/
.next/
```

#### 1.2 Conectar Vercel con GitHub

1. Ve a https://vercel.com
2. Crea una cuenta (puedes usar tu cuenta de GitHub)
3. Click en **"Add New Project"**
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente que es Next.js

#### 1.3 Configurar Variables de Entorno en Vercel

1. En la configuración del proyecto, ve a **"Environment Variables"**
2. Agrega todas las variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY`
   - `ENCRYPTION_KEY`
   - `GEMINI_API_KEY`

3. Click en **"Deploy"**

#### 1.4 Vercel te Dará una URL

Después del deploy, Vercel te dará una URL como:
- `alfatechflow.vercel.app`

**¡Ya está funcionando!** Puedes acceder a tu app en esa URL.

#### 1.5 Conectar tu Dominio de Hostinger a Vercel

1. En Vercel, ve a tu proyecto → **Settings** → **Domains**
2. Agrega tu dominio: `tu-dominio.com`
3. Vercel te dará instrucciones para configurar DNS

4. **En el panel de Hostinger:**
   - Ve a **"DNS"** o **"Zona DNS"**
   - Agrega estos registros que Vercel te indique:
     - Tipo: `A` o `CNAME`
     - Nombre: `@` o `www`
     - Valor: La IP o dominio que Vercel te dé
   - Guarda los cambios

5. Espera 5-10 minutos para que se propague el DNS
6. ¡Listo! Tu dominio apuntará a Vercel

### Actualizar la Aplicación en Vercel

Cada vez que hagas cambios:
1. Haz `git push` a GitHub
2. Vercel **automáticamente** detectará los cambios y hará deploy
3. En 1-2 minutos tu app estará actualizada

---

## 🌟 OPCIÓN 2: Netlify (También Gratis)

Netlify es otra excelente opción gratuita.

### Pasos:

1. Ve a https://netlify.com
2. Crea una cuenta
3. Conecta con GitHub (igual que Vercel)
4. Selecciona tu repositorio
5. Configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
6. Agrega las variables de entorno en **Site settings** → **Environment variables**
7. Click en **"Deploy site"**

Netlify también te dará una URL gratuita y puedes conectar tu dominio.

---

## 🌟 OPCIÓN 3: Railway (Gratis con Límites)

Railway ofrece un plan gratuito con $5 de crédito mensual.

1. Ve a https://railway.app
2. Conecta con GitHub
3. Crea un nuevo proyecto desde tu repositorio
4. Railway detectará Next.js automáticamente
5. Agrega las variables de entorno
6. Railway hará el deploy automáticamente

---

## 🌟 OPCIÓN 4: Render (Gratis)

Render ofrece hosting gratuito con algunas limitaciones.

1. Ve a https://render.com
2. Crea una cuenta
3. Conecta con GitHub
4. Crea un nuevo **Web Service**
5. Selecciona tu repositorio
6. Configura:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
7. Agrega las variables de entorno
8. Click en **"Create Web Service"**

---

## 📊 Comparación de Opciones Gratis

| Servicio | Gratis | Fácil de Usar | Optimizado para Next.js | SSL | Deploy Automático |
|----------|--------|---------------|-------------------------|-----|-------------------|
| **Vercel** | ✅ Sí | ⭐⭐⭐⭐⭐ | ✅ Perfecto | ✅ Sí | ✅ Sí |
| **Netlify** | ✅ Sí | ⭐⭐⭐⭐ | ✅ Bueno | ✅ Sí | ✅ Sí |
| **Railway** | ✅ $5/mes crédito | ⭐⭐⭐ | ✅ Bueno | ✅ Sí | ✅ Sí |
| **Render** | ✅ Sí (con límites) | ⭐⭐⭐ | ⚠️ Requiere config | ✅ Sí | ✅ Sí |

**Recomendación:** **Vercel** es la mejor opción para Next.js.

---

## 🔄 Migrar desde Hostinger a Vercel (Si ya intentaste Hostinger)

Si ya subiste archivos a Hostinger pero no funciona:

1. **No necesitas borrar nada de Hostinger**
2. Simplemente:
   - Sube tu código a GitHub
   - Conecta Vercel con GitHub
   - Configura las variables de entorno
   - Conecta tu dominio desde Hostinger a Vercel (solo cambias DNS)
3. Tu dominio seguirá siendo de Hostinger, pero apuntará a Vercel

---

## 💰 ¿Cuándo Necesitas un VPS?

Solo necesitas un VPS si:
- ❌ Necesitas instalar software personalizado
- ❌ Necesitas acceso root completo
- ❌ Necesitas más de 100GB de almacenamiento
- ❌ Tienes tráfico muy alto (millones de visitas)
- ❌ Necesitas servidores de base de datos locales

**Para AlfaTechFlow:** **NO necesitas VPS**. Vercel es perfecto y gratis.

---

## ✅ Recomendación Final

**Para tu caso (AlfaTechFlow en Hostinger hosting compartido):**

1. **Si Hostinger NO tiene Node.js:** Usa **Vercel** (gratis)
2. **Si Hostinger SÍ tiene Node.js:** Sigue la guía principal de esta página
3. **Si Hostinger tiene limitaciones:** Migra a **Vercel**

**Vercel es la mejor opción porque:**
- ✅ Es gratis
- ✅ Está hecho para Next.js
- ✅ No necesitas configurar servidores
- ✅ SSL automático
- ✅ Deploy automático desde GitHub
- ✅ Puedes usar tu dominio de Hostinger

---

*Última actualización: 2024*


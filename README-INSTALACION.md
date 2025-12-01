# 🚀 AlfaTechFlow - Instalación en Hosting Básico

## ⚠️ IMPORTANTE: Requisitos

Este hosting DEBE soportar **Node.js** (versión 18 o superior).

Si tu hosting NO soporta Node.js, usa Vercel (gratis):
- Ver: `GUIA_VERCEL_GRATIS.md`

## 📋 Pasos de Instalación

### 1. Subir Archivos

Sube TODOS los archivos de esta carpeta a tu servidor (por FTP/SFTP).

### 2. Instalar Dependencias

Por SSH, ejecuta:
```bash
npm install --production
```

### 3. Compilar la Aplicación

```bash
npm run build
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz con tus valores (ver `.env.local.example`).

### 5. Iniciar la Aplicación

```bash
npm start
```

O usa PM2 para mantenerla corriendo:
```bash
npm install -g pm2
pm2 start npm --name "alfatechflow" -- start
pm2 save
pm2 startup
```

### 6. Configurar Proxy Reverso

Configura tu servidor web (Nginx/Apache) para que apunte a `localhost:3000`.

Ver instrucciones detalladas en: `INSTALACION_HOSTINGER_PASO_A_PASO.md`

## 📊 Tamaño del Repositorio

Este paquete NO incluye:
- ❌ `node_modules/` (se instala en el servidor)
- ❌ `.next/` (se genera con `npm run build`)
- ❌ Archivos compilados

**Tamaño estimado:** < 5 MB (solo código fuente)

## 🔗 Más Información

- Guía completa: `INSTALACION_HOSTINGER_PASO_A_PASO.md`
- Guía Vercel (gratis): `GUIA_VERCEL_GRATIS.md`

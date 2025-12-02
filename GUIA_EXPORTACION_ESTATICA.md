# 📦 Guía: Exportar Next.js a HTML + JS Estático

## ⚠️ ADVERTENCIAS IMPORTANTES

Al exportar Next.js como sitio estático, **muchas funcionalidades NO funcionarán**:

### ❌ NO FUNCIONARÁN:
- ❌ **API Routes** (`/app/api/*`) - Se ejecutan en el servidor
- ❌ **Server Components** - El renderizado del servidor no está disponible
- ❌ **Autenticación del servidor** - Necesita servidor para cookies seguras
- ❌ **Funciones del servidor** - Cualquier código que use `createClient` del servidor
- ❌ **Generación de reportes con IA** - Las API routes no funcionarán
- ❌ **Envío de emails desde el servidor** - Necesita API routes

### ✅ SÍ FUNCIONARÁN:
- ✅ **Interfaz de usuario** - Todos los componentes React
- ✅ **Conexión directa a Supabase** - Desde el cliente (con autenticación del lado del cliente)
- ✅ **Navegación** - Rutas y páginas estáticas
- ✅ **Estilos y temas** - Tailwind CSS y temas funcionan

---

## 🚀 PASOS PARA EXPORTAR

### 1. Compilar el Proyecto

```bash
npm run build
```

Esto generará una carpeta `out/` con todos los archivos estáticos.

### 2. Estructura Generada

Después del build, tendrás:

```
out/
├── index.html
├── _next/
│   ├── static/
│   │   ├── css/         # Estilos compilados
│   │   └── chunks/      # JavaScript compilado
│   └── ...
├── admin/
│   └── index.html
├── auth/
│   └── login/
│       └── index.html
├── tecnico/
│   └── index.html
└── ... (todas las páginas)
```

### 3. Subir a Hosting Compartido

**Opción A: Carpeta raíz**
```
public_html/
├── index.html
├── _next/
├── admin/
└── ...
```

**Opción B: Subcarpeta**
Si quieres ponerlo en una subcarpeta (ej: `/app`):
1. Configura `basePath: '/app'` en `next.config.js`
2. Sube todo el contenido de `out/` a `public_html/app/`

### 4. Configurar Servidor Web

Necesitas configurar tu servidor web (Apache/Nginx) para:
- Servir archivos estáticos
- Redirigir todas las rutas a `index.html` (para React Router)

**Ejemplo para Apache (.htaccess):**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## ⚠️ PROBLEMAS CONOCIDOS

### 1. Páginas con Server Components

**Error:** Las páginas que usan `createClient` del servidor no funcionarán.

**Solución:** Necesitas convertir todas las páginas a Client Components o usar el cliente de Supabase directamente.

### 2. API Routes

**Error:** Las llamadas a `/api/*` fallarán porque no hay servidor.

**Solución:** 
- Mueve toda la lógica a funciones del cliente
- Usa Supabase directamente desde el cliente
- Para operaciones que requieren servidor, necesitarás un backend separado

### 3. Autenticación

**Problema:** La autenticación del servidor no funciona.

**Solución:** Usa autenticación del lado del cliente con Supabase.

---

## 📝 MODIFICACIONES NECESARIAS

### Convertir páginas del servidor a cliente

**Antes (Server Component):**
```typescript
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  // ...
}
```

**Después (Client Component):**
```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);
  
  // ...
}
```

---

## 🔧 ARCHIVOS A MODIFICAR

Para que funcione completamente, necesitas modificar:

1. **Todas las páginas en `/app`** - Convertirlas a Client Components
2. **Componentes que usan API routes** - Modificarlos para usar Supabase directamente
3. **Lógica de autenticación** - Moverla al cliente

---

## 📦 LO QUE OBTIENES

Después del build, en `out/` tendrás:

- ✅ **HTML estático** - Archivos `.html` para cada ruta
- ✅ **JavaScript** - En `_next/static/chunks/`
- ✅ **CSS** - En `_next/static/css/`
- ✅ **Assets** - Imágenes y recursos estáticos

**Tamaño aproximado:** 2-5 MB (sin imágenes)

---

## 🚨 RECOMENDACIÓN

**Si necesitas que TODO funcione:**
👉 Usa Vercel o un hosting con Node.js

**Si solo necesitas la interfaz:**
👉 Sigue esta guía, pero prepárate para hacer muchos cambios en el código

---

## 📚 SIGUIENTE PASO

Después de exportar, revisa:
1. ✅ Todas las páginas funcionan
2. ✅ La autenticación funciona (desde el cliente)
3. ✅ Las conexiones a Supabase funcionan
4. ⚠️ Las API routes no funcionarán (esperado)

Para solucionar las API routes, necesitarás:
- Un backend separado (ej: funciones de Netlify, Vercel Functions, o un servidor)
- O mover toda la lógica al cliente






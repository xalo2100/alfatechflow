# 📦 Cómo Exportar a HTML + JS Estático

## ⚡ PASOS RÁPIDOS

### 1. Compilar el proyecto

```bash
# Opción A: Usar el script automático
./build-estatico.sh

# Opción B: Manual
npm run build
```

### 2. Verificar que se generó

Deberías tener una carpeta `out/` con:
```
out/
├── index.html
├── _next/
│   └── static/
│       ├── css/
│       └── chunks/
├── admin/
├── auth/
└── ...
```

### 3. Subir a tu hosting compartido

1. **Conecta por FTP** a tu hosting
2. **Sube TODO** el contenido de `out/` a `public_html/`
3. **Sube también** el archivo `.htaccess` a `public_html/`

### 4. Estructura final en el servidor

```
public_html/
├── .htaccess          ← IMPORTANTE para que funcione
├── index.html
├── _next/
│   └── static/
├── admin/
└── ...
```

---

## ⚠️ PROBLEMAS ESPERADOS

Al compilar, probablemente verás errores porque:

1. **Páginas con Server Components** - Necesitas convertirlas a Client Components
2. **API Routes** - No se pueden exportar (se omiten automáticamente)
3. **Server-side rendering** - No funciona en modo estático

---

## 🔧 SOLUCIONAR ERRORES COMUNES

### Error: "Cannot use server-side APIs"

**Solución:** Marca la página como Client Component:
```typescript
"use client";  // ← Agregar esto al inicio

export default function MiPagina() {
  // ...
}
```

### Error: "API Route not found"

**Solución:** Las API routes no funcionan en modo estático. Necesitas:
- Usar Supabase directamente desde el cliente, O
- Tener un backend separado

---

## 📝 CHECKLIST ANTES DE EXPORTAR

- [ ] Leer `GUIA_EXPORTACION_ESTATICA.md` para entender limitaciones
- [ ] Convertir páginas del servidor a cliente
- [ ] Reemplazar llamadas a API routes
- [ ] Configurar variables de entorno públicas (`NEXT_PUBLIC_*`)
- [ ] Probar la aplicación localmente

---

## 🎯 RESULTADO FINAL

Después de exportar, tendrás:
- ✅ HTML estático
- ✅ JavaScript en `_next/static/chunks/`
- ✅ CSS en `_next/static/css/`
- ✅ Todo listo para subir a hosting compartido

**NO tendrás:**
- ❌ API routes funcionando
- ❌ Server Components
- ❌ Funcionalidades del servidor

---

## 📚 DOCUMENTACIÓN COMPLETA

- `GUIA_EXPORTACION_ESTATICA.md` - Guía detallada con todas las limitaciones
- `build-estatico.sh` - Script para generar el build automáticamente
- `.htaccess` - Configuración de Apache para el hosting

---

## ❓ ¿TIENES PROBLEMAS?

1. Revisa los errores al compilar
2. Lee `GUIA_EXPORTACION_ESTATICA.md`
3. Verifica que todas las páginas sean Client Components
4. Asegúrate de que no uses API routes directamente


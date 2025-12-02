# 📍 ¿Dónde está la carpeta `out`?

## Ubicación

La carpeta `out` se generará en la **raíz de tu proyecto**:

```
/Users/gonzalo/Documents/alfatechflow-hosting-basico/
├── out/              ← AQUÍ estarán los archivos HTML + JS
│   ├── index.html
│   ├── _next/
│   │   └── static/
│   └── ...
├── app/
├── components/
├── package.json
└── ...
```

## ⚠️ ¿Por qué no existe todavía?

La carpeta `out` **se crea automáticamente** cuando ejecutas:

```bash
npm run build
```

**Si no existe**, es porque:
1. ❌ Aún no has ejecutado el build
2. ❌ El build falló con errores

## 🔨 Cómo generarla

```bash
# Desde la raíz del proyecto
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico
npm run build
```

Después del build exitoso, verás:
```
✅ Export successful. Files are in the 'out' directory.
```

## 📁 Contenido de la carpeta `out`

Una vez generada, `out/` contendrá:

```
out/
├── index.html                    # Página principal
├── _next/
│   └── static/
│       ├── css/                  # Estilos CSS
│       └── chunks/               # JavaScript compilado
│           ├── [hash].js
│           └── ...
├── admin/
│   └── index.html               # Página admin
├── auth/
│   └── login/
│       └── index.html           # Página login
└── ... (todas las páginas)
```

## 🚨 Problema Actual

El build está fallando porque:
1. **Las API routes no se pueden exportar** en modo estático
2. Next.js está intentando procesarlas de todas formas

**Solución:** Las API routes se omitirán automáticamente, pero necesitamos que el build continúe. Puede que necesitemos ajustar la configuración.

## ✅ Verificar si existe

```bash
# Ver si existe
ls -la out/

# O verificar con
test -d out && echo "✅ Existe" || echo "❌ No existe"
```

## 📤 Después de generar

Una vez que tengas la carpeta `out/`:

1. **Sube todo su contenido** a tu hosting compartido
2. La estructura sería:
   ```
   public_html/
   ├── index.html
   ├── _next/
   ├── admin/
   └── ...
   ```

## 💡 Tip

Puedes usar el script automático:
```bash
./build-estatico.sh
```

Este script te dirá exactamente dónde está la carpeta cuando termine.






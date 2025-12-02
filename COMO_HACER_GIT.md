# 📚 Cómo Hacer Git Add, Commit y Push (Paso a Paso)

## ¿Qué son estos comandos?

- **`git add`**: Agrega archivos para que Git los "vea" y los incluya en el próximo commit
- **`git commit`**: Guarda los cambios con un mensaje descriptivo
- **`git push`**: Sube los cambios a GitHub (y Vercel los detecta automáticamente)

## 🚀 Método Rápido (Recomendado)

### Opción 1: Usar el script automático

Simplemente ejecuta:

```bash
./subir-cambios-api.sh
```

Este script hace todo automáticamente. Te preguntará si quieres subir a GitHub al final.

---

## 📝 Método Manual (Paso a Paso)

Si prefieres hacerlo manualmente, sigue estos pasos:

### Paso 1: Ver qué archivos están cambiados

```bash
git status
```

Esto te mostrará todos los archivos modificados.

### Paso 2: Agregar los archivos importantes

Agrega los archivos que quieres subir:

```bash
# Archivos de API (críticos)
git add lib/gemini.ts
git add lib/pipedrive.ts
git add app/api/pipedrive/buscar-organizacion/route.ts
git add app/api/pipedrive/test-search/route.ts
git add app/api/reportes/track-lectura/route.ts
git add app/api/reportes/enviar-email/route.ts
git add app/api/reportes/guardar-firma-tecnico/
git add app/api/reportes/subir-pdf-temporal/

# Componentes y otras funcionalidades
git add components/reportes/dashboard.tsx
git add components/reportes/reporte-detail-dialog.tsx
git add components/tecnico/dashboard.tsx
git add components/tecnico/ticket-detail.tsx
git add components/tecnico/ticket-list.tsx
git add components/ventas/dashboard.tsx
git add components/ventas/ticket-card.tsx
git add components/ventas/ticket-list-view.tsx
git add components/reportes/firma-tecnico-dialog.tsx
git add components/dynamic-favicon.tsx
git add components/dynamic-title.tsx
```

**O agrega todo de una vez:**

```bash
git add lib/gemini.ts lib/pipedrive.ts
git add app/api/pipedrive/
git add app/api/reportes/
git add components/reportes/ components/tecnico/ components/ventas/
git add components/dynamic-favicon.tsx components/dynamic-title.tsx
```

### Paso 3: Verificar qué se va a subir

```bash
git status
```

Los archivos que aparecen en verde están listos para commit.

### Paso 4: Hacer commit (guardar con mensaje)

```bash
git commit -m "Fix: Correcciones APIs Pipedrive/Gemini + nuevas funcionalidades"
```

**O con un mensaje más detallado:**

```bash
git commit -m "Fix: Correcciones APIs Pipedrive/Gemini + nuevas funcionalidades

- Fix: lib/gemini.ts y lib/pipedrive.ts usan createAdminClient() para funcionar en servidor
- Fix: Agregado force-dynamic a rutas API para evitar errores de build
- Nuevo: API para guardar firma del técnico
- Nuevo: API para subir PDF temporal para WhatsApp
- Nuevo: Mostrar técnico asignado en recuadros de tickets
- Nuevo: Botón de WhatsApp en reportes
- Nuevo: Firma del técnico en reportes"
```

### Paso 5: Subir a GitHub

```bash
git push origin main
```

Si te pide credenciales:
- **Usuario**: Tu nombre de usuario de GitHub
- **Contraseña**: Tu **Personal Access Token** (no tu contraseña normal)

Si no tienes un token, crea uno en:
https://github.com/settings/tokens

---

## ✅ ¿Cómo saber si funcionó?

### Después de `git add`:
```bash
git status
```
Deberías ver archivos en verde (staged)

### Después de `git commit`:
```bash
git log --oneline -1
```
Deberías ver tu commit reciente

### Después de `git push`:
```bash
git status
```
Debería decir "Tu rama está actualizada con 'origin/main'"

### En Vercel:
1. Ve a https://vercel.com/dashboard
2. Busca tu proyecto
3. Verás un nuevo "Deployment" en progreso
4. Espera 2-5 minutos a que termine

---

## 🆘 Solución de Problemas

### Error: "nothing to commit"
**Problema**: No hay archivos agregados
**Solución**: Ejecuta `git add` primero

### Error: "fatal: not a git repository"
**Problema**: No estás en la carpeta del proyecto
**Solución**: 
```bash
cd /Users/gonzalo/Documents/alfatechflow-hosting-basico
```

### Error: "Permission denied" al hacer push
**Problema**: Necesitas autenticarte
**Solución**: Usa un Personal Access Token de GitHub

### Error: "remote: Invalid username or password"
**Problema**: Estás usando tu contraseña normal
**Solución**: Usa un Personal Access Token en lugar de la contraseña

---

## 📋 Resumen Visual

```
Tu Computadora          Git Local        GitHub          Vercel
   (código)            (commits)      (repositorio)    (producción)
      │                    │               │                │
      │  git add           │               │                │
      ├───────────────────>│               │                │
      │                    │               │                │
      │  git commit        │               │                │
      ├───────────────────>│               │                │
      │                    │               │                │
      │  git push          │               │                │
      ├────────────────────────────────────>               │
      │                    │               │                │
      │                    │               │                │
      │                    │               │  Vercel detecta│
      │                    │               │  cambios       │
      │                    │               ├───────────────>│
      │                    │               │                │
      │                    │               │  Vercel despliega│
      │                    │               │  automáticamente│
      │                    │               │<───────────────┤
```

---

## 💡 Consejo

**Usa el script automático** (`./subir-cambios-api.sh`) - es más fácil y evita errores.

Si prefieres aprender, sigue los pasos manuales arriba.





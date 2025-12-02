# 🚀 Cómo Ver el Proyecto Localmente

## ✅ El servidor está iniciando

El servidor de desarrollo de Next.js se está ejecutando en segundo plano.

## 🌐 Cómo Acceder

Una vez que termine de compilar (1-2 minutos), abre tu navegador y ve a:

```
http://localhost:3000
```

## 📋 Información del Servidor

- **Puerto**: 3000
- **URL Local**: http://localhost:3000
- **Hot Reload**: ✅ Activo (los cambios se reflejan automáticamente)

## 🔍 Verificar que Está Funcionando

### Método 1: En el Navegador
Abre http://localhost:3000 en tu navegador.

### Método 2: En la Terminal
Deberías ver un mensaje como:
```
✓ Ready in Xs
○ Local:        http://localhost:3000
```

## ⏹️ Detener el Servidor

Para detener el servidor:
1. Presiona `Ctrl + C` en la terminal
2. O cierra la terminal

## 🔄 Reiniciar el Servidor

Si necesitas reiniciarlo:

```bash
npm run dev
```

## ⚠️ Solución de Problemas

### El servidor no inicia
1. Verifica que el puerto 3000 esté libre
2. Cierra otras aplicaciones que usen ese puerto
3. Reinstala dependencias: `npm install`

### Error de compilación
1. Revisa la terminal para ver los errores
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de tener las variables de entorno configuradas

### No se ve la página
1. Espera 1-2 minutos a que termine de compilar
2. Verifica que veas "Ready" en la terminal
3. Recarga la página en el navegador (F5)

## 📝 Notas

- El servidor está en modo desarrollo (hot reload activo)
- Los cambios que hagas en el código se reflejarán automáticamente
- Los errores se mostrarán en la terminal y en el navegador

## 🔐 Variables de Entorno

✅ Ya tienes configuradas las variables de entorno en `.env.local`

Si necesitas modificar algo, edita el archivo `.env.local` y reinicia el servidor.





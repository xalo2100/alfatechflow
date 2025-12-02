# Solución para Error "Usuario no encontrado" al Cambiar Contraseña

## Problema Identificado

El error "Usuario no encontrado en el sistema" aparece cuando intentas cambiar la contraseña de un usuario, especialmente de técnicos sin email como "Carlos".

### Error Real

Los logs muestran:
```
Usuario no encontrado en perfiles: Invalid API key
UsuarioId buscado: c860a644-cde7-429a-a46b-210b117b56aa
```

El problema es que el `createAdminClient()` no tiene acceso correcto a la base de datos debido a un problema con la **SUPABASE_SERVICE_ROLE_KEY**.

## Solución

### Paso 1: Verificar la Configuración de la API Key

1. Verifica que tengas un archivo `.env.local` en la raíz del proyecto
2. Asegúrate de que contiene la variable `SUPABASE_SERVICE_ROLE_KEY`:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Paso 2: Obtener la Service Role Key

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca la sección **Project API keys**
5. Copia la **`service_role`** key (NO la `anon` key)
6. Pégalo en tu archivo `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 3: Reiniciar el Servidor

Después de agregar o actualizar la variable:

1. Detén el servidor (Ctrl+C en la terminal)
2. Reinicia el servidor:
   ```bash
   npm run dev
   ```

### Paso 4: Verificar que Funciona

Intenta cambiar la contraseña nuevamente. Debería funcionar correctamente.

## Notas Importantes

- ⚠️ **NUNCA** compartas la SERVICE_ROLE_KEY públicamente
- ⚠️ **NUNCA** la subas a Git (asegúrate de que `.env.local` está en `.gitignore`)
- ✅ La SERVICE_ROLE_KEY es diferente a la ANON_KEY
- ✅ La SERVICE_ROLE_KEY tiene permisos de administrador completo

## Si el Problema Persiste

Si después de configurar la SERVICE_ROLE_KEY el problema continúa:

1. Verifica los logs del servidor en la terminal
2. Revisa que la key sea correcta (cópiala de nuevo desde Supabase)
3. Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
4. Verifica que no haya espacios extra en la variable de entorno

## Usuarios Sin Email

Los usuarios técnicos sin email (como "Carlos") pueden tener problemas porque:
- Se crean con un email temporal (`nombre@tecnico.local`)
- El sistema busca por ID primero, luego por email
- Si el usuario no existe en `auth.users`, no se puede cambiar la contraseña

Si un usuario no tiene email configurado en `auth.users`, será necesario:
1. Agregar un email al usuario
2. O crear el usuario en `auth.users` si solo existe en `perfiles`




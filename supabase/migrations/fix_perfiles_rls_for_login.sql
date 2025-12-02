-- Política RLS para permitir lectura pública de perfiles durante el login
-- Esto es necesario para que el login con RUN funcione sin Service Role Key

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Permitir lectura pública de perfiles para login" ON perfiles;

-- Crear nueva política que permite SELECT público
CREATE POLICY "Permitir lectura pública de perfiles para login"
ON perfiles
FOR SELECT
TO public
USING (true);

-- Nota: Esta política permite que cualquiera lea la tabla perfiles
-- Esto es necesario para el flujo de login con RUN
-- Los datos sensibles (como contraseñas) están en auth.users, no en perfiles

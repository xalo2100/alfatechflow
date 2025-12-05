-- Arreglar políticas RLS para la tabla configuraciones
-- Permitir a administradores gestionar configuraciones

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins pueden ver configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Admins pueden insertar configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Admins pueden actualizar configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Admins pueden eliminar configuraciones" ON configuraciones;

-- Crear políticas para administradores
CREATE POLICY "Admins pueden ver configuraciones"
ON configuraciones FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins pueden insertar configuraciones"
ON configuraciones FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins pueden actualizar configuraciones"
ON configuraciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins pueden eliminar configuraciones"
ON configuraciones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'superadmin')
  )
);

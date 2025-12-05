-- Primero, verificar la estructura actual de la tabla configuraciones
-- y agregar las columnas faltantes si no existen

-- Agregar columna 'valor' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'configuraciones' AND column_name = 'valor'
  ) THEN
    ALTER TABLE configuraciones ADD COLUMN valor TEXT;
  END IF;
END $$;

-- Agregar columna 'descripcion' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'configuraciones' AND column_name = 'descripcion'
  ) THEN
    ALTER TABLE configuraciones ADD COLUMN descripcion TEXT;
  END IF;
END $$;

-- Habilitar RLS si no está habilitado
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
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

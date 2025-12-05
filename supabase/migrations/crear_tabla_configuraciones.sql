-- Crear tabla configuraciones si no existe
CREATE TABLE IF NOT EXISTS configuraciones (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

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

-- Insertar configuraciones por defecto si no existen
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES 
  ('nombre_empresa', 'Alfapack SpA', 'Nombre de la empresa')
ON CONFLICT (clave) DO NOTHING;

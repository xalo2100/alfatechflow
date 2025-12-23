
-- Habilitar RLS en la tabla configuraciones si no está habilitado
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados (admins)
DROP POLICY IF EXISTS "Permitir lectura de configuraciones a autenticados" ON configuraciones;
CREATE POLICY "Permitir lectura de configuraciones a autenticados"
ON configuraciones FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para permitir modificación a admins/super_admins
DROP POLICY IF EXISTS "Permitir modificar configuraciones a admins" ON configuraciones;
CREATE POLICY "Permitir modificar configuraciones a admins"
ON configuraciones FOR ALL
USING (
  exists (
    select 1 from perfiles
    where perfiles.id = auth.uid()
    and perfiles.rol in ('super_admin', 'admin')
  )
);

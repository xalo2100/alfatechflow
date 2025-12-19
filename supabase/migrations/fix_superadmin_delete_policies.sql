-- Corregir políticas de eliminación para superadmins (usando 'rol' en lugar de 'role')

DROP POLICY IF EXISTS "Superadmins can delete any ticket" ON tickets;
DROP POLICY IF EXISTS "Superadmins can delete any report" ON reportes;

CREATE POLICY "Superadmins can delete any ticket"
ON tickets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'super_admin'
  )
);

CREATE POLICY "Superadmins can delete any report"
ON reportes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol = 'super_admin'
  )
);

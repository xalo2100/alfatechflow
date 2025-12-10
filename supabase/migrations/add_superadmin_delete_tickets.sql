-- Permitir a superadmins eliminar tickets
-- Esta política permite que los superadministradores eliminen cualquier ticket,
-- incluso si está asignado a un técnico

CREATE POLICY "Superadmins can delete any ticket"
ON tickets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.role = 'super_admin'
  )
);

-- Permitir a superadmins eliminar reportes asociados
CREATE POLICY "Superadmins can delete any report"
ON reportes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.role = 'super_admin'
  )
);

-- Agregar comentarios
COMMENT ON POLICY "Superadmins can delete any ticket" ON tickets IS 
'Permite a los superadministradores eliminar cualquier ticket del sistema, incluso si está asignado a un técnico';

COMMENT ON POLICY "Superadmins can delete any report" ON reportes IS 
'Permite a los superadministradores eliminar reportes asociados a tickets que están siendo eliminados';


-- 1. Eliminar la restricción check existente
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 2. Agregar la nueva restricción check incluyendo 'super_admin'
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
  CHECK (rol IN ('super_admin', 'admin', 'ventas', 'tecnico'));

-- 3. Actualizar políticas RLS para incluir super_admin
-- Política: Tickets visibles según rol (super_admin ve todo igual que admin)
DROP POLICY IF EXISTS "Tickets visibles según rol" ON tickets;
CREATE POLICY "Tickets visibles según rol"
  ON tickets FOR SELECT
  USING (
    auth.uid() = creado_por OR
    auth.uid() = asignado_a OR
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol in ('super_admin', 'admin', 'ventas')
    )
  );

-- Política: Ventas y Admin (y Super Admin) pueden crear tickets
DROP POLICY IF EXISTS "Crear tickets para ventas y admin" ON tickets;
CREATE POLICY "Crear tickets para ventas y admin"
  ON tickets FOR INSERT
  WITH CHECK (
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol in ('super_admin', 'admin', 'ventas')
    )
  );

-- Política: Técnicos y Admin (y Super Admin) pueden actualizar tickets
DROP POLICY IF EXISTS "Actualizar tickets para técnicos y admin" ON tickets;
CREATE POLICY "Actualizar tickets para técnicos y admin"
  ON tickets FOR UPDATE
  USING (
    auth.uid() = asignado_a OR
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol in ('super_admin', 'admin')
    )
  );

-- Política: Reportes visibles según ticket (incluir super_admin)
DROP POLICY IF EXISTS "Reportes visibles según ticket" ON reportes;
CREATE POLICY "Reportes visibles según ticket"
  ON reportes FOR SELECT
  USING (
    exists (
      select 1 from tickets
      where tickets.id = reportes.ticket_id
      and (
        tickets.creado_por = auth.uid() OR
        tickets.asignado_a = auth.uid() OR
        exists (
          select 1 from perfiles
          where perfiles.id = auth.uid()
          and perfiles.rol in ('super_admin', 'admin', 'ventas')
        )
      )
    )
  );

-- 4. Actualizar el usuario principal a super_admin
UPDATE perfiles 
SET rol = 'super_admin' 
WHERE email = 'gsanchez@alfapack.cl';

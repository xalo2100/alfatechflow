-- Permitir a usuarios autenticados (especialmente admins) insertar y actualizar configuraciones

-- 1. Habilitar RLS en configuraciones (por si acaso no está)
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Permitir lectura a todos los autenticados" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir insertar a admins" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir actualizar a admins" ON public.configuraciones;

-- 3. Crear política de lectura (todos los usuarios autenticados pueden leer)
CREATE POLICY "Permitir lectura a todos los autenticados"
ON public.configuraciones
FOR SELECT
TO authenticated
USING (true);

-- 4. Crear política de inserción/actualización (solo admins y super_admins)
-- Nota: Asumimos que el admin tiene rol 'admin' o 'super_admin' en public.perfiles
CREATE POLICY "Permitir gestion a admins"
ON public.configuraciones
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE perfiles.id = auth.uid()
    AND perfiles.rol IN ('admin', 'super_admin')
  )
);

-- 5. Alternativa simple si la anterior falla (permitir a cualquier autenticado configurar, temporalmente)
-- Descomentar si la de arriba da problemas
-- CREATE POLICY "Permitir todo a autenticados"
-- ON public.configuraciones
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

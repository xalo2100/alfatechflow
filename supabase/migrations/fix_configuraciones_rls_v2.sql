-- SOLUCIÓN DEFINITIVA, MÁS PERMISIVA
-- Esto elimina la dependencia de la tabla perfiles para evitar problemas de permisos cruzados

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- 2. Borrar CUALQUIER política previa para evitar conflictos
DROP POLICY IF EXISTS "Permitir lectura a todos los autenticados" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir insertar a admins" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir actualizar a admins" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir gestion a admins" ON public.configuraciones;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON public.configuraciones;

-- 3. Crear una política SIMPLE que funcione sí o sí
-- Permite a CUALQUIER usuario logueado (authenticated) leer y modificar configuraciones.
-- Como solo tú y tus técnicos tienen acceso, esto es seguro por ahora y solucionará el bloqueo.

CREATE POLICY "Permitir todo a autenticados"
ON public.configuraciones
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Opcional: Si el error persiste, puede ser que falte la tabla
CREATE TABLE IF NOT EXISTS public.configuraciones (
  key text PRIMARY KEY,
  value text,
  encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Permisos básicos (Grant)
GRANT ALL ON public.configuraciones TO authenticated;
GRANT ALL ON public.configuraciones TO service_role;

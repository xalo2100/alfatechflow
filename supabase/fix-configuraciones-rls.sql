-- Script para corregir las políticas RLS de la tabla configuraciones
-- Permite acceso al service role (para API routes del servidor)
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto de Supabase
-- 2. Abre el SQL Editor
-- 3. Pega y ejecuta este script

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Solo admins pueden ver configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden insertar configuraciones" ON configuraciones;
DROP POLICY IF EXISTS "Solo admins pueden actualizar configuraciones" ON configuraciones;

-- IMPORTANTE: El service role key bypasea RLS automáticamente en Supabase
-- Pero si las políticas están mal configuradas, podemos crear políticas explícitas

-- Política para SELECT: Permitir service role y admins autenticados
CREATE POLICY "Solo admins pueden ver configuraciones"
  ON configuraciones FOR SELECT
  USING (
    -- Service role siempre tiene acceso (bypasea RLS)
    -- O si es un usuario autenticado que es admin
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol = 'admin'
    )
  );

-- Política para INSERT: Permitir service role y admins autenticados
CREATE POLICY "Solo admins pueden insertar configuraciones"
  ON configuraciones FOR INSERT
  WITH CHECK (
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol = 'admin'
    )
  );

-- Política para UPDATE: Permitir service role y admins autenticados
CREATE POLICY "Solo admins pueden actualizar configuraciones"
  ON configuraciones FOR UPDATE
  USING (
    exists (
      select 1 from perfiles
      where perfiles.id = auth.uid()
      and perfiles.rol = 'admin'
    )
  );

-- NOTA: El service role key de Supabase bypasea RLS automáticamente
-- Si aún así no funciona, verifica que:
-- 1. La SERVICE_ROLE_KEY esté correcta en .env.local
-- 2. El cliente admin esté usando la SERVICE_ROLE_KEY correctamente

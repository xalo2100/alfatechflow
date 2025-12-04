-- Script para actualizar la estructura de la tabla perfiles
-- Ejecuta esto PRIMERO, antes de recrear_usuarios_limpio.sql

-- 1. Agregar columna updated_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE perfiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Agregar columna run (RUT/RUN) si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles' AND column_name = 'run'
    ) THEN
        ALTER TABLE perfiles ADD COLUMN run text UNIQUE;
    END IF;
END $$;

-- 3. Modificar el check constraint del rol para incluir 'super_admin'
-- Primero, eliminar el constraint existente
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- Luego, crear el nuevo constraint con super_admin incluido
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check 
CHECK (rol IN ('super_admin', 'admin', 'ventas', 'tecnico'));

-- 4. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_perfiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS update_perfiles_updated_at_trigger ON perfiles;

-- Crear el nuevo trigger
CREATE TRIGGER update_perfiles_updated_at_trigger
    BEFORE UPDATE ON perfiles
    FOR EACH ROW
    EXECUTE FUNCTION update_perfiles_updated_at();

-- 5. Verificar la estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'perfiles'
ORDER BY ordinal_position;

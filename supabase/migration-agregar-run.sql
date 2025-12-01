-- Migración: Agregar campo RUN a perfiles y hacer email opcional para técnicos
-- Ejecutar en Supabase SQL Editor

-- Agregar columna RUN (única para técnicos)
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS run text;

-- Crear índice único para RUN (solo para técnicos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_run_tecnico 
ON perfiles(run) 
WHERE rol = 'tecnico' AND run IS NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN perfiles.run IS 'RUN (Rol Único Nacional) chileno para técnicos. Formato: 164121489 o 16412148K (sin guion)';


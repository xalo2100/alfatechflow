-- Hacer que tecnico_id sea opcional en reportes
-- Esto permite guardar reportes incluso si el técnico no existe o no está asignado

ALTER TABLE reportes 
ALTER COLUMN tecnico_id DROP NOT NULL;

-- Agregar un comentario explicativo
COMMENT ON COLUMN reportes.tecnico_id IS 'ID del técnico que generó el reporte (opcional)';

-- Agregar campo JSON para guardar todos los datos del cliente desde Pipedrive
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS datos_cliente JSONB DEFAULT NULL;

-- Comentario para documentar el campo
COMMENT ON COLUMN tickets.datos_cliente IS 'Datos completos del cliente desde Pipedrive: razon_social, rut, direccion, ciudad, responsable, email, telefono, etc.';




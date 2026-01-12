-- Hacer que la columna valor_encriptado sea opcional (nullable)
-- Esto permite guardar configuraciones que no requieren encriptación (como URLs)
-- sin que falle por restricción de NOT NULL.

DO $$ 
BEGIN
    ALTER TABLE configuraciones ALTER COLUMN valor_encriptado DROP NOT NULL;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'La columna valor_encriptado no existe en la tabla configuraciones.';
END $$;

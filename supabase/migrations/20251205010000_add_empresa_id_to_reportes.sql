-- Add empresa_id column to reportes table
ALTER TABLE reportes 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Update existing reportes to use the principal company (optional, but good for consistency)
DO $$
DECLARE
    principal_id UUID;
BEGIN
    SELECT id INTO principal_id FROM empresas WHERE es_principal = true LIMIT 1;
    
    IF principal_id IS NOT NULL THEN
        UPDATE reportes SET empresa_id = principal_id WHERE empresa_id IS NULL;
    END IF;
END $$;

-- Habilitar RLS en la tabla reportes (por si no está habilitado)
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Política para permitir a usuarios autenticados ver reportes
CREATE POLICY "Usuarios autenticados pueden ver reportes"
ON reportes FOR SELECT
TO authenticated
USING (true);

-- Política para permitir a usuarios autenticados crear reportes
CREATE POLICY "Usuarios autenticados pueden crear reportes"
ON reportes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir a usuarios autenticados actualizar sus propios reportes (opcional, pero útil)
CREATE POLICY "Usuarios pueden actualizar sus propios reportes"
ON reportes FOR UPDATE
TO authenticated
USING (auth.uid() = tecnico_id);

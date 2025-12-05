-- Create empresas table
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    rut TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    web TEXT,
    logo_url TEXT,
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.empresas
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all access to admins (assuming admin role or similar check)
-- For now, allowing authenticated users to insert/update if they are admins
-- You might want to refine this based on your specific role system
CREATE POLICY "Allow full access to admins" ON public.empresas
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol IN ('admin', 'super_admin')
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default company from existing config (migration helper)
-- This is a best-effort attempt to migrate existing config
DO $$
DECLARE
    v_nombre text;
    v_logo text;
BEGIN
    -- Try to get name
    SELECT valor INTO v_nombre FROM public.configuraciones WHERE clave = 'app_nombre';
    IF v_nombre IS NULL THEN
        SELECT valor_encriptado INTO v_nombre FROM public.configuraciones WHERE clave = 'app_nombre';
    END IF;
    
    -- Try to get logo
    SELECT valor INTO v_logo FROM public.configuraciones WHERE clave = 'app_logo';
    IF v_logo IS NULL THEN
        SELECT valor_encriptado INTO v_logo FROM public.configuraciones WHERE clave = 'app_logo';
    END IF;

    -- Insert if not exists
    IF NOT EXISTS (SELECT 1 FROM public.empresas) THEN
        INSERT INTO public.empresas (nombre, logo_url, es_principal)
        VALUES (
            COALESCE(v_nombre, 'Alfapack SpA'),
            v_logo,
            true
        );
    END IF;
END $$;

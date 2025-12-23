
-- 1. Agregar columna last_seen a perfiles para el sistema de presencia
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- 2. Crear tabla para suscripciones de notificaciones push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    subscription_json JSONB NOT NULL,
    device_type TEXT, -- 'mobile', 'desktop'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subscription_json)
);

-- 3. Habilitar RLS en push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias suscripciones"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias suscripciones"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden borrar sus propias suscripciones"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- 4. Función para actualizar last_seen
CREATE OR REPLACE FUNCTION public.update_user_presence(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.perfiles
    SET last_seen = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

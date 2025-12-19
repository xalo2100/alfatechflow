-- Create messages table
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'audio')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month')
);

-- Enable RLS
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON public.mensajes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.mensajes
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Function to clean up expired media
CREATE OR REPLACE FUNCTION public.cleanup_expired_media()
RETURNS void AS $$
BEGIN
  -- We just delete the rows. 
  -- In a production scenario with Storage, we'd use a Trigger or Edge Function to delete the files too.
  -- For this MVP, deleting the DB reference effectively hides it.
  DELETE FROM public.mensajes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- If pg_cron is available, we could schedule it. 
-- Since we can't guarantee extensions, we'll rely on a manual trigger or app-level check, 
-- or just rely on the fact that queries could filter by expires_at too.
-- But for now, let's just define the function.

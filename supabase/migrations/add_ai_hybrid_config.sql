-- Añadir nuevas claves de configuración para IA Híbrida
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES 
  ('local_ai_url', 'http://184.174.36.189:3000/v1/chat', 'URL del servidor de IA local (VPS)'),
  ('preferred_ai_provider', 'local', 'Proveedor de IA preferido (local o gemini)')
ON CONFLICT (clave) DO NOTHING;

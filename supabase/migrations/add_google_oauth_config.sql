
-- Add columns for Google Drive OAuth
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES 
('google_drive_refresh_token', '', 'Token de refresco para acceso offline a Google Drive'),
('google_drive_email', '', 'Email de la cuenta conectada de Google Drive'),
('google_drive_access_token_expiry', '', 'Marca de tiempo de expiración del access token (opcional)')
ON CONFLICT (clave) DO NOTHING;

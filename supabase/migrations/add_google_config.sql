-- Ensure keys exist for Google Drive configuration
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES 
('google_service_account_json', '', 'Contenido del archivo JSON de credenciales de Google Service Account'),
('google_drive_folder_id', '', 'ID de la carpeta de destino en Google Drive')
ON CONFLICT (clave) DO NOTHING;

-- Ensure RLS allows admin update (already covered by fix_configuraciones_completo.sql but good to verify ownership if needed)

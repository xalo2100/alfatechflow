-- Crear usuario técnico con RUN 80371039
-- Este script crea un usuario en auth.users y su perfil en perfiles

-- Paso 1: Crear usuario en auth.users (si no existe)
-- Nota: Debes ejecutar esto en el SQL Editor de Supabase

-- Primero, verificar si el usuario ya existe
DO $$
DECLARE
  user_id uuid;
  user_email text := 'tecnico.80371039@alfatechflow.com';
  user_password text := 'Alfa2024!'; -- Cambiar esta contraseña después del primer login
  user_run text := '80371039';
  user_nombre text := 'Técnico 80371039';
BEGIN
  -- Buscar si ya existe un usuario con este email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- Si no existe, crear el usuario
  IF user_id IS NULL THEN
    -- Crear usuario en auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nombre_completo', user_nombre, 'run', user_run),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;

    RAISE NOTICE 'Usuario creado con ID: %', user_id;
  ELSE
    RAISE NOTICE 'Usuario ya existe con ID: %', user_id;
  END IF;

  -- Crear o actualizar perfil
  INSERT INTO perfiles (
    id,
    email,
    nombre_completo,
    rol,
    run,
    activo,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_nombre,
    'tecnico',
    user_run,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre_completo = EXCLUDED.nombre_completo,
    rol = EXCLUDED.rol,
    run = EXCLUDED.run,
    activo = EXCLUDED.activo,
    updated_at = NOW();

  RAISE NOTICE 'Perfil creado/actualizado para usuario: %', user_email;
  RAISE NOTICE 'RUN: %', user_run;
  RAISE NOTICE 'Contraseña temporal: %', user_password;
  RAISE NOTICE 'Puedes iniciar sesión con el RUN o el email';
END $$;

-- Verificar que se creó correctamente
SELECT 
  u.id,
  u.email,
  p.nombre_completo,
  p.rol,
  p.run,
  p.activo
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE u.email = 'tecnico.80371039@alfatechflow.com';

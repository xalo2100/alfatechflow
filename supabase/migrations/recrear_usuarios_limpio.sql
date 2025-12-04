-- Script SQL para limpiar y recrear usuarios correctamente
-- IMPORTANTE: Ejecuta PRIMERO el script 'actualizar_estructura_perfiles.sql'
-- antes de ejecutar este script, para asegurar que la tabla tenga todas las columnas necesarias.
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- PASO 1: Limpiar referencias de foreign keys en tickets
-- Opción A: Eliminar todos los tickets
DELETE FROM tickets;

-- Si prefieres mantener los tickets, usa la Opción B en su lugar:
-- UPDATE tickets SET asignado_a = NULL WHERE asignado_a IS NOT NULL;

-- PASO 2: Eliminar todas las configuraciones (tienen foreign keys a perfiles)
DELETE FROM configuraciones;

-- PASO 3: Eliminar todos los perfiles
DELETE FROM perfiles;

-- PASO 4: Eliminar usuarios de auth.users
-- Esto es necesario para evitar error de "duplicate key value"
DELETE FROM auth.users 
WHERE email IN ('gsanchez@alfapack.cl', 'tecnico.80371039@alfatechflow.com');

-- PASO 5: Crear Superadmin (gsanchez@alfapack.cl)
-- Nota: Este script inserta directamente en auth.users y perfiles

DO $$
DECLARE
    superadmin_id uuid := gen_random_uuid();
    tecnico_id uuid := gen_random_uuid();
BEGIN
    -- Crear SUPERADMIN en auth.users
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
        superadmin_id,
        'authenticated',
        'authenticated',
        'gsanchez@alfapack.cl',
        crypt('123456', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"nombre_completo":"Gonzalo Sánchez"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Crear perfil SUPERADMIN
    INSERT INTO perfiles (
        id,
        email,
        nombre_completo,
        rol,
        activo,
        created_at,
        updated_at
    ) VALUES (
        superadmin_id,
        'gsanchez@alfapack.cl',
        'Gonzalo Sánchez',
        'super_admin',
        true,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Superadmin creado: %', superadmin_id;

    -- Crear TÉCNICO en auth.users
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
        tecnico_id,
        'authenticated',
        'authenticated',
        'tecnico.80371039@alfatechflow.com',
        crypt('Alfa2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"nombre_completo":"Técnico 80371039","run":"80371039"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Crear perfil TÉCNICO con RUN
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
        tecnico_id,
        'tecnico.80371039@alfatechflow.com',
        'Técnico 80371039',
        'tecnico',
        '80371039',
        true,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Técnico creado: %', tecnico_id;
    RAISE NOTICE 'RUN: 80371039';

END $$;

-- PASO 6: Verificar que se crearon correctamente
SELECT 
    u.id,
    u.email,
    p.nombre_completo,
    p.rol,
    p.run,
    p.activo
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
ORDER BY p.rol DESC;

-- CREDENCIALES:
-- Superadmin:
--   Email: gsanchez@alfapack.cl
--   Password: 123456
-- 
-- Técnico:
--   Email: tecnico.80371039@alfatechflow.com
--   RUN: 80371039
--   Password: Alfa2024!

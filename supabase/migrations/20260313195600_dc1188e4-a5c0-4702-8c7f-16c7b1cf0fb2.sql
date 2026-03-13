UPDATE auth.users 
SET encrypted_password = crypt('Sanket@15432', gen_salt('bf'))
WHERE id = '69ca62bc-45af-4ba5-82df-2c0ac5a2b503';
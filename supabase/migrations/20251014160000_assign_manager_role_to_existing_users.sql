-- Migration: Atribuir role 'manager' para usuários existentes sem role
-- Data: 2025-10-14
-- Descrição: Adiciona a role 'manager' para todos os usuários que já estão
--            cadastrados mas não possuem uma role definida na tabela user_roles

-- Inserir role 'manager' para todos os usuários que existem na tabela profiles
-- mas não têm registro na tabela user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'manager'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id
);

-- Verificar quantos usuários foram atualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.user_roles
    WHERE role = 'manager';
    
    RAISE NOTICE 'Total de usuários com role manager: %', updated_count;
END $$;

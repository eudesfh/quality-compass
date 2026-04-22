
-- Função para verificar se o email de um usuário está confirmado (apenas admin)
CREATE OR REPLACE FUNCTION public.admin_get_user_email_confirmed(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  confirmed boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.';
  END IF;

  SELECT (email_confirmed_at IS NOT NULL) INTO confirmed
  FROM auth.users
  WHERE id = target_user_id;

  RETURN COALESCE(confirmed, false);
END;
$$;

-- Função para confirmar manualmente o e-mail de um usuário (apenas admin)
CREATE OR REPLACE FUNCTION public.admin_confirm_user_email(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem confirmar e-mails.';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now())
  WHERE id = target_user_id;
END;
$$;

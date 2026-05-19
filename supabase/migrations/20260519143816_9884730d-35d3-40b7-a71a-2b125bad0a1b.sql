-- Expand has_rnc_access to include stage/action responsibles
CREATE OR REPLACE FUNCTION public.has_rnc_access(_user_id uuid, _rnc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.rnc_occurrences
    WHERE id = _rnc_id
      AND (created_by = _user_id OR approver_id = _user_id)
  )
  OR public.has_role(_user_id, 'admin'::app_role)
  OR public.is_rnc_participant(_user_id, _rnc_id)
  OR EXISTS (
    SELECT 1 FROM public.rnc_stages
    WHERE rnc_id = _rnc_id AND responsible_user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.rnc_actions
    WHERE rnc_id = _rnc_id AND responsible_user_id = _user_id
  )
$function$;

-- Allow stage/action responsibles to SELECT the parent occurrence
DROP POLICY IF EXISTS "Users view own RNCs" ON public.rnc_occurrences;
CREATE POLICY "Users view own RNCs"
ON public.rnc_occurrences
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR auth.uid() = approver_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_rnc_participant(auth.uid(), id)
  OR EXISTS (SELECT 1 FROM public.rnc_stages s WHERE s.rnc_id = rnc_occurrences.id AND s.responsible_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.rnc_actions a WHERE a.rnc_id = rnc_occurrences.id AND a.responsible_user_id = auth.uid())
);

-- Also allow responsibles to UPDATE limited fields via existing policy: extend it
DROP POLICY IF EXISTS "Authorized users update RNCs" ON public.rnc_occurrences;
CREATE POLICY "Authorized users update RNCs"
ON public.rnc_occurrences
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR auth.uid() = approver_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.rnc_stages s WHERE s.rnc_id = rnc_occurrences.id AND s.responsible_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.rnc_actions a WHERE a.rnc_id = rnc_occurrences.id AND a.responsible_user_id = auth.uid())
);
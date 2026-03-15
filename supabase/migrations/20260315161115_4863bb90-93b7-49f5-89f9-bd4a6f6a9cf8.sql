
-- Fix the buggy RLS policy on rnc_occurrences (rnc_participants.rnc_id = rnc_participants.id should be rnc_participants.rnc_id = rnc_occurrences.id)
DROP POLICY IF EXISTS "Users view own RNCs" ON public.rnc_occurrences;
CREATE POLICY "Users view own RNCs" ON public.rnc_occurrences
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR auth.uid() = approver_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM rnc_participants
      WHERE rnc_participants.rnc_id = rnc_occurrences.id
        AND rnc_participants.user_id = auth.uid()
    )
  );

-- Create missing triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER generate_rnc_code_trigger
  BEFORE INSERT ON public.rnc_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.generate_rnc_code();

CREATE OR REPLACE TRIGGER generate_risk_code_trigger
  BEFORE INSERT ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.generate_risk_code();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_rnc_occurrences_updated_at
  BEFORE UPDATE ON public.rnc_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admins to delete user_roles (needed for removing admin role on edit)
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

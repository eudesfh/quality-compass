
-- Fix overly permissive RLS policies

-- Drop and recreate cause analysis management policy
DROP POLICY "Manage cause analysis" ON public.rnc_cause_analysis;
CREATE POLICY "Manage cause analysis" ON public.rnc_cause_analysis FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = analyzed_by OR EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (approver_id = auth.uid() OR created_by = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Update cause analysis" ON public.rnc_cause_analysis FOR UPDATE TO authenticated USING (
  auth.uid() = analyzed_by OR EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND approver_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Drop and recreate actions management policy
DROP POLICY "Manage RNC actions" ON public.rnc_actions;
CREATE POLICY "Insert RNC actions" ON public.rnc_actions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
      created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    )
  ) OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_actions.rnc_id AND user_id = auth.uid())
);
CREATE POLICY "Update RNC actions" ON public.rnc_actions FOR UPDATE TO authenticated USING (
  auth.uid() = responsible_user_id OR EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND approver_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Drop and recreate efficacy management policy
DROP POLICY "Manage efficacy" ON public.rnc_efficacy;
CREATE POLICY "Insert efficacy" ON public.rnc_efficacy FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ) OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_efficacy.rnc_id AND user_id = auth.uid())
);
CREATE POLICY "Update efficacy" ON public.rnc_efficacy FOR UPDATE TO authenticated USING (
  auth.uid() = evaluated_by OR public.has_role(auth.uid(), 'admin')
);

-- Drop and recreate risk efficacy management policy
DROP POLICY "Manage risk efficacy" ON public.risk_efficacy;
CREATE POLICY "Insert risk efficacy" ON public.risk_efficacy FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.risks WHERE id = risk_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Update risk efficacy" ON public.risk_efficacy FOR UPDATE TO authenticated USING (
  auth.uid() = evaluated_by OR public.has_role(auth.uid(), 'admin')
);

-- Fix notification insert policy
DROP POLICY "System creates notifications" ON public.notifications;
CREATE POLICY "Authenticated create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

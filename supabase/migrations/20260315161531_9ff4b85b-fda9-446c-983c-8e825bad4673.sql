
-- Create security definer function to check if user is participant of an RNC
-- This avoids infinite recursion between rnc_occurrences and rnc_participants RLS
CREATE OR REPLACE FUNCTION public.is_rnc_participant(_user_id uuid, _rnc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rnc_participants
    WHERE user_id = _user_id AND rnc_id = _rnc_id
  )
$$;

-- Create security definer function to check if user has access to an RNC
CREATE OR REPLACE FUNCTION public.has_rnc_access(_user_id uuid, _rnc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rnc_occurrences
    WHERE id = _rnc_id
      AND (created_by = _user_id OR approver_id = _user_id)
  )
  OR public.has_role(_user_id, 'admin'::app_role)
  OR public.is_rnc_participant(_user_id, _rnc_id)
$$;

-- Fix rnc_occurrences SELECT policy
DROP POLICY IF EXISTS "Users view own RNCs" ON public.rnc_occurrences;
CREATE POLICY "Users view own RNCs" ON public.rnc_occurrences
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR auth.uid() = approver_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR is_rnc_participant(auth.uid(), id)
  );

-- Fix rnc_participants policies to avoid recursion
DROP POLICY IF EXISTS "Manage participants" ON public.rnc_participants;
CREATE POLICY "Manage participants" ON public.rnc_participants
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_rnc_access(auth.uid(), rnc_id)
  );

DROP POLICY IF EXISTS "View participants" ON public.rnc_participants;
CREATE POLICY "View participants" ON public.rnc_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_rnc_access(auth.uid(), rnc_id)
  );

-- Fix rnc_stages policies
DROP POLICY IF EXISTS "Manage RNC stages" ON public.rnc_stages;
CREATE POLICY "Manage RNC stages" ON public.rnc_stages
  FOR ALL TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "View RNC stages" ON public.rnc_stages;
CREATE POLICY "View RNC stages" ON public.rnc_stages
  FOR SELECT TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

-- Fix rnc_actions policies
DROP POLICY IF EXISTS "Insert RNC actions" ON public.rnc_actions;
CREATE POLICY "Insert RNC actions" ON public.rnc_actions
  FOR INSERT TO authenticated
  WITH CHECK (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "Update RNC actions" ON public.rnc_actions;
CREATE POLICY "Update RNC actions" ON public.rnc_actions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = responsible_user_id
    OR has_rnc_access(auth.uid(), rnc_id)
  );

DROP POLICY IF EXISTS "View RNC actions" ON public.rnc_actions;
CREATE POLICY "View RNC actions" ON public.rnc_actions
  FOR SELECT TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

-- Fix rnc_attachments policies
DROP POLICY IF EXISTS "View RNC attachments" ON public.rnc_attachments;
CREATE POLICY "View RNC attachments" ON public.rnc_attachments
  FOR SELECT TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

-- Fix rnc_cause_analysis policies
DROP POLICY IF EXISTS "Manage cause analysis" ON public.rnc_cause_analysis;
CREATE POLICY "Manage cause analysis" ON public.rnc_cause_analysis
  FOR INSERT TO authenticated
  WITH CHECK (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "Update cause analysis" ON public.rnc_cause_analysis;
CREATE POLICY "Update cause analysis" ON public.rnc_cause_analysis
  FOR UPDATE TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "View cause analysis" ON public.rnc_cause_analysis;
CREATE POLICY "View cause analysis" ON public.rnc_cause_analysis
  FOR SELECT TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

-- Fix rnc_efficacy policies
DROP POLICY IF EXISTS "Insert efficacy" ON public.rnc_efficacy;
CREATE POLICY "Insert efficacy" ON public.rnc_efficacy
  FOR INSERT TO authenticated
  WITH CHECK (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "Update efficacy" ON public.rnc_efficacy;
CREATE POLICY "Update efficacy" ON public.rnc_efficacy
  FOR UPDATE TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

DROP POLICY IF EXISTS "View efficacy" ON public.rnc_efficacy;
CREATE POLICY "View efficacy" ON public.rnc_efficacy
  FOR SELECT TO authenticated
  USING (has_rnc_access(auth.uid(), rnc_id));

-- Add DELETE policies for companies, sectors, permission_profiles (for admin management)
CREATE POLICY "Admins delete companies" ON public.companies
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete sectors" ON public.sectors
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete permission_profiles" ON public.permission_profiles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policies for companies and sectors (admins already have ALL but let's be explicit)
CREATE POLICY "Admins update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update sectors" ON public.sectors
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update permission_profiles" ON public.permission_profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

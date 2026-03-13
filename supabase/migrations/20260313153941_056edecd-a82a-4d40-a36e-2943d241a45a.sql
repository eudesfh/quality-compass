
-- ============================================
-- SGQ - Sistema de Gestão da Qualidade
-- Complete Database Schema
-- ============================================

-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.occurrence_type AS ENUM ('real', 'potencial', 'oportunidade');
CREATE TYPE public.criticality_level AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.company_type AS ENUM ('obra', 'escritorio');
CREATE TYPE public.rnc_status AS ENUM (
  'aberta', 'triagem', 'analise_causa', 'plano_acao', 
  'validacao', 'implementacao', 'eficacia', 'concluida', 'recusada'
);
CREATE TYPE public.risk_response AS ENUM ('aceitar', 'compartilhar', 'eliminar', 'minimizar', 'evitar');
CREATE TYPE public.risk_frequency AS ENUM ('por_evento', 'diario', 'semanal', 'mensal', 'trimestral', 'anual');
CREATE TYPE public.risk_status AS ENUM ('em_andamento', 'concluido', 'iniciar', 'sem_previsao', 'acao_constante');
CREATE TYPE public.stage_status AS ENUM ('pendente', 'em_andamento', 'aprovado', 'reprovado', 'concluido');

-- ============================================
-- 1. Profiles (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_id UUID,
  sector_id UUID,
  permission_profile_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. User Roles (admin/user)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- 3. Companies
-- ============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type company_type NOT NULL DEFAULT 'escritorio',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Sectors
-- ============================================
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Permission Profiles
-- ============================================
CREATE TABLE public.permission_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  can_create_rnc BOOLEAN NOT NULL DEFAULT true,
  can_approve_rnc BOOLEAN NOT NULL DEFAULT false,
  can_manage_risks BOOLEAN NOT NULL DEFAULT true,
  can_validate BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_settings BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;

-- Add FK to profiles now that tables exist
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_company FOREIGN KEY (company_id) REFERENCES public.companies(id),
  ADD CONSTRAINT fk_profiles_sector FOREIGN KEY (sector_id) REFERENCES public.sectors(id),
  ADD CONSTRAINT fk_profiles_permission FOREIGN KEY (permission_profile_id) REFERENCES public.permission_profiles(id);

-- ============================================
-- 6. RNC Occurrences
-- ============================================
CREATE TABLE public.rnc_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  occurrence_type occurrence_type NOT NULL,
  reclassified_type occurrence_type,
  subject TEXT NOT NULL,
  description TEXT,
  criticality criticality_level NOT NULL,
  occurrence_date DATE NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  company_type company_type NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.sectors(id),
  origin TEXT NOT NULL,
  status rnc_status NOT NULL DEFAULT 'aberta',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  rejection_reason TEXT,
  notify_participants BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rnc_occurrences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RNC Attachments
-- ============================================
CREATE TABLE public.rnc_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rnc_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RNC Workflow Stages
-- ============================================
CREATE TABLE public.rnc_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 5),
  stage_name TEXT NOT NULL,
  responsible_user_id UUID REFERENCES auth.users(id),
  responsible_sector_id UUID REFERENCES public.sectors(id),
  deadline DATE,
  status stage_status NOT NULL DEFAULT 'pendente',
  rejection_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rnc_id, stage_number)
);

ALTER TABLE public.rnc_stages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RNC Cause Analysis (5 Whys)
-- ============================================
CREATE TABLE public.rnc_cause_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  why_1 TEXT,
  why_2 TEXT,
  why_3 TEXT,
  why_4 TEXT,
  why_5 TEXT,
  root_cause_why INTEGER CHECK (root_cause_why BETWEEN 1 AND 5),
  root_cause_description TEXT,
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rnc_cause_analysis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. RNC Action Plans
-- ============================================
CREATE TABLE public.rnc_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  what_to_do TEXT NOT NULL,
  why_to_do TEXT NOT NULL,
  how_to_do TEXT NOT NULL,
  responsible_user_id UUID NOT NULL REFERENCES auth.users(id),
  deadline DATE NOT NULL,
  cost DECIMAL(12,2),
  related_cause_why INTEGER CHECK (related_cause_why BETWEEN 1 AND 5),
  evidence TEXT,
  evidence_file_path TEXT,
  is_implemented BOOLEAN NOT NULL DEFAULT false,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rnc_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RNC Efficacy Evaluation
-- ============================================
CREATE TABLE public.rnc_efficacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  is_effective BOOLEAN,
  evidence TEXT,
  evidence_file_path TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluation_date DATE,
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rnc_efficacy ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. RNC Participants (who can see the RNC)
-- ============================================
CREATE TABLE public.rnc_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_id UUID NOT NULL REFERENCES public.rnc_occurrences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rnc_id, user_id)
);

ALTER TABLE public.rnc_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. Risks
-- ============================================
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  risk_description TEXT NOT NULL,
  cause TEXT NOT NULL,
  cause_source TEXT,
  consequence TEXT,
  probability INTEGER NOT NULL CHECK (probability BETWEEN 1 AND 3),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  risk_level INTEGER GENERATED ALWAYS AS (probability * severity) STORED,
  response risk_response NOT NULL,
  frequency risk_frequency,
  treatment TEXT,
  deadline DATE,
  status risk_status NOT NULL DEFAULT 'iniciar',
  sector_id UUID REFERENCES public.sectors(id),
  company_id UUID REFERENCES public.companies(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. Risk Efficacy Evaluation
-- ============================================
CREATE TABLE public.risk_efficacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  is_effective BOOLEAN,
  evidence TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_efficacy ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. Notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Timestamp update trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rnc_occurrences_updated_at BEFORE UPDATE ON public.rnc_occurrences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rnc_stages_updated_at BEFORE UPDATE ON public.rnc_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rnc_cause_analysis_updated_at BEFORE UPDATE ON public.rnc_cause_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rnc_actions_updated_at BEFORE UPDATE ON public.rnc_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rnc_efficacy_updated_at BEFORE UPDATE ON public.rnc_efficacy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Auto-generate RNC codes
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_rnc_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.rnc_occurrences;
  NEW.code = 'RNC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_rnc_code_trigger
BEFORE INSERT ON public.rnc_occurrences
FOR EACH ROW EXECUTE FUNCTION public.generate_rnc_code();

-- ============================================
-- Auto-generate Risk codes
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_risk_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.risks;
  NEW.code = 'RSK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_risk_code_trigger
BEFORE INSERT ON public.risks
FOR EACH ROW EXECUTE FUNCTION public.generate_risk_code();

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles: authenticated users can read all, update own
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only viewable/manageable by admins
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Companies: readable by all authenticated, managed by admins
CREATE POLICY "Companies viewable" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage companies" ON public.companies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sectors: readable by all authenticated, managed by admins
CREATE POLICY "Sectors viewable" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sectors" ON public.sectors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Permission profiles: readable by authenticated, managed by admins
CREATE POLICY "Permission profiles viewable" ON public.permission_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage permission profiles" ON public.permission_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RNC Occurrences: viewable by participants and admins
CREATE POLICY "Users view own RNCs" ON public.rnc_occurrences FOR SELECT TO authenticated USING (
  auth.uid() = created_by 
  OR auth.uid() = approver_id 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users create RNCs" ON public.rnc_occurrences FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authorized users update RNCs" ON public.rnc_occurrences FOR UPDATE TO authenticated USING (
  auth.uid() = created_by 
  OR auth.uid() = approver_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- RNC Attachments
CREATE POLICY "View RNC attachments" ON public.rnc_attachments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_attachments.rnc_id AND user_id = auth.uid())
  ))
);
CREATE POLICY "Upload RNC attachments" ON public.rnc_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

-- RNC Stages
CREATE POLICY "View RNC stages" ON public.rnc_stages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_stages.rnc_id AND user_id = auth.uid())
  ))
);
CREATE POLICY "Manage RNC stages" ON public.rnc_stages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  ))
);

-- RNC Cause Analysis
CREATE POLICY "View cause analysis" ON public.rnc_cause_analysis FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_cause_analysis.rnc_id AND user_id = auth.uid())
  ))
);
CREATE POLICY "Manage cause analysis" ON public.rnc_cause_analysis FOR ALL TO authenticated USING (true);

-- RNC Actions
CREATE POLICY "View RNC actions" ON public.rnc_actions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_actions.rnc_id AND user_id = auth.uid())
  ))
);
CREATE POLICY "Manage RNC actions" ON public.rnc_actions FOR ALL TO authenticated USING (true);

-- RNC Efficacy
CREATE POLICY "View efficacy" ON public.rnc_efficacy FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (
    created_by = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.rnc_participants WHERE rnc_id = rnc_efficacy.rnc_id AND user_id = auth.uid())
  ))
);
CREATE POLICY "Manage efficacy" ON public.rnc_efficacy FOR ALL TO authenticated USING (true);

-- RNC Participants
CREATE POLICY "View participants" ON public.rnc_participants FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Manage participants" ON public.rnc_participants FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.rnc_occurrences WHERE id = rnc_id AND (approver_id = auth.uid() OR created_by = auth.uid())
  )
);

-- Risks
CREATE POLICY "Users view risks" ON public.risks FOR SELECT TO authenticated USING (
  auth.uid() = created_by OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users create risks" ON public.risks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users update own risks" ON public.risks FOR UPDATE TO authenticated USING (
  auth.uid() = created_by OR public.has_role(auth.uid(), 'admin')
);

-- Risk Efficacy
CREATE POLICY "View risk efficacy" ON public.risk_efficacy FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.risks WHERE id = risk_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Manage risk efficacy" ON public.risk_efficacy FOR ALL TO authenticated USING (true);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- Storage bucket for RNC attachments
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('rnc-attachments', 'rnc-attachments', false);

CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rnc-attachments');
CREATE POLICY "Authenticated users can view attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'rnc-attachments');

-- ============================================
-- Seed initial data
-- ============================================
INSERT INTO public.companies (name, type) VALUES 
  ('Lura', 'escritorio'),
  ('OK Empreendimentos', 'obra');

INSERT INTO public.sectors (name) VALUES 
  ('Financeiro'), ('TI'), ('Sala Técnica'), ('Contabilidade'),
  ('Engenharia'), ('RH'), ('Qualidade'), ('Suprimentos'),
  ('Planejamento'), ('Segurança do Trabalho');

INSERT INTO public.permission_profiles (name, description, can_create_rnc, can_approve_rnc, can_manage_risks, can_validate, can_manage_users, can_manage_settings) VALUES
  ('Administrador', 'Acesso total ao sistema', true, true, true, true, true, true),
  ('Qualidade', 'Aprovação e validação de RNCs', true, true, true, true, false, false),
  ('Engenharia', 'Criação de RNCs e gestão de riscos', true, false, true, false, false, false),
  ('Operacional', 'Criação e resposta de RNCs', true, false, false, false, false, false);

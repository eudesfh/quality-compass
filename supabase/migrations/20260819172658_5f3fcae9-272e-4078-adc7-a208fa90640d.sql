ALTER TABLE public.risks
  ADD COLUMN IF NOT EXISTS risk_type text NOT NULL DEFAULT 'com_prazo',
  ADD COLUMN IF NOT EXISTS opened_at date;

ALTER TABLE public.risks DROP CONSTRAINT IF EXISTS risks_risk_type_check;
ALTER TABLE public.risks ADD CONSTRAINT risks_risk_type_check CHECK (risk_type IN ('com_prazo','continuo'));
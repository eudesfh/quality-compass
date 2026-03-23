-- ============================================
-- Fix Auto-generate RNC codes (add SECURITY DEFINER)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Fix Auto-generate Risk codes (add SECURITY DEFINER)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Attach trigger for RNC code generation
CREATE OR REPLACE TRIGGER trg_generate_rnc_code
  BEFORE INSERT ON public.rnc_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_rnc_code();

-- Attach trigger for Risk code generation
CREATE OR REPLACE TRIGGER trg_generate_risk_code
  BEFORE INSERT ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_risk_code();

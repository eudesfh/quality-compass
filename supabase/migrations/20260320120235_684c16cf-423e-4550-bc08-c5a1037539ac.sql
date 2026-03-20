
CREATE OR REPLACE FUNCTION public.generate_rnc_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.rnc_occurrences;
  NEW.code = 'RNC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_risk_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.risks;
  NEW.code = 'RSK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_generate_rnc_code ON public.rnc_occurrences;
CREATE TRIGGER trg_generate_rnc_code BEFORE INSERT ON public.rnc_occurrences FOR EACH ROW EXECUTE FUNCTION public.generate_rnc_code();

DROP TRIGGER IF EXISTS trg_generate_risk_code ON public.risks;
CREATE TRIGGER trg_generate_risk_code BEFORE INSERT ON public.risks FOR EACH ROW EXECUTE FUNCTION public.generate_risk_code();

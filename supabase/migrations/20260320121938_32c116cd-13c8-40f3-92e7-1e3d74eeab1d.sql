
CREATE OR REPLACE FUNCTION public.generate_rnc_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  IF NEW.occurrence_type = 'oportunidade' THEN
    prefix := 'OP-';
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) + 1
    INTO next_num FROM public.rnc_occurrences WHERE code LIKE 'OP-%';
  ELSE
    prefix := 'RNC-';
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num FROM public.rnc_occurrences WHERE code LIKE 'RNC-%';
  END IF;
  NEW.code = prefix || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

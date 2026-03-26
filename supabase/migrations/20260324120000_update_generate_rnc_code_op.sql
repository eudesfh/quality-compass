-- ============================================
-- Fix Auto-generate RNC codes for OP Type
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_rnc_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.occurrence_type = 'oportunidade' THEN
    -- For OP, we count from existing OP-XXXX codes
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) + 1
    INTO next_num FROM public.rnc_occurrences WHERE code LIKE 'OP-%';
    
    NEW.code = 'OP-' || LPAD(next_num::TEXT, 4, '0');
  ELSE
    -- For Real and Potencial, use RNC-XXXX codes
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num FROM public.rnc_occurrences WHERE code LIKE 'RNC-%';
    
    NEW.code = 'RNC-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

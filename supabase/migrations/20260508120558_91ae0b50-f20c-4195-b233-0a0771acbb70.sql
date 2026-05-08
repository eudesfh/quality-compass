
-- Function to sync rnc_occurrences.status from rnc_stages
CREATE OR REPLACE FUNCTION public.sync_rnc_status_from_stages(_rnc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_stage RECORD;
  total_stages INT;
  completed_stages INT;
  rnc_rec RECORD;
  new_status rnc_status;
BEGIN
  SELECT status, occurrence_type, reclassified_type INTO rnc_rec FROM rnc_occurrences WHERE id = _rnc_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Don't override aberta/triagem/recusada/concluida
  IF rnc_rec.status IN ('aberta','triagem','recusada') THEN RETURN; END IF;

  SELECT COUNT(*) INTO total_stages FROM rnc_stages WHERE rnc_id = _rnc_id;
  IF total_stages = 0 THEN RETURN; END IF;

  SELECT COUNT(*) INTO completed_stages FROM rnc_stages WHERE rnc_id = _rnc_id AND status IN ('concluido','aprovado');

  IF completed_stages = total_stages THEN
    new_status := 'concluida';
  ELSE
    SELECT * INTO active_stage FROM rnc_stages
    WHERE rnc_id = _rnc_id AND status = 'em_andamento'
    ORDER BY stage_number LIMIT 1;

    IF NOT FOUND THEN
      -- fallback: first non-completed stage
      SELECT * INTO active_stage FROM rnc_stages
      WHERE rnc_id = _rnc_id AND status NOT IN ('concluido','aprovado')
      ORDER BY stage_number LIMIT 1;
    END IF;

    IF NOT FOUND THEN RETURN; END IF;

    new_status := CASE active_stage.stage_name
      WHEN 'Análise de Causa' THEN 'analise_causa'::rnc_status
      WHEN 'Plano de Ação' THEN 'plano_acao'::rnc_status
      WHEN 'Validação' THEN 'validacao'::rnc_status
      WHEN 'Implementação' THEN 'implementacao'::rnc_status
      WHEN 'Análise de Eficácia' THEN 'eficacia'::rnc_status
      ELSE rnc_rec.status
    END;
  END IF;

  IF new_status IS DISTINCT FROM rnc_rec.status THEN
    UPDATE rnc_occurrences SET status = new_status, updated_at = now() WHERE id = _rnc_id;
  END IF;
END;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION public.trg_sync_rnc_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_rnc_status_from_stages(COALESCE(NEW.rnc_id, OLD.rnc_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS rnc_stages_sync_status ON public.rnc_stages;
CREATE TRIGGER rnc_stages_sync_status
AFTER INSERT OR UPDATE OR DELETE ON public.rnc_stages
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_rnc_status();

-- Backfill existing data
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM rnc_occurrences LOOP
    PERFORM public.sync_rnc_status_from_stages(r.id);
  END LOOP;
END $$;

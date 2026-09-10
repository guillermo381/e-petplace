-- REVERSA de 20260912480000 · escrita ANTES.
-- Restaura el conjunto permitido SIN liquidacion_id. ⚠️ Revertir esto vuelve
-- imposible atar un comprobante autorizado a su liquidación — o sea, deja la
-- compuerta de liquidación imposible de satisfacer.
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_inmutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_permitido public.documentos_fiscales;
BEGIN
  IF OLD.estado <> 'autorizada' THEN RETURN NEW; END IF;
  IF (NEW.estado IS DISTINCT FROM OLD.estado) AND NEW.estado <> 'anulada' THEN
    RAISE EXCEPTION 'documento_autorizado_no_cambia_de_estado' USING ERRCODE='42501';
  END IF;
  v_permitido := OLD;
  v_permitido.xml_url := NEW.xml_url; v_permitido.pdf_url := NEW.pdf_url;
  v_permitido.estado := NEW.estado;   v_permitido.updated_at := NEW.updated_at;
  IF ROW(NEW.*) IS DISTINCT FROM ROW(v_permitido.*) THEN
    RAISE EXCEPTION 'documento_autorizado_es_inmutable' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $function$;

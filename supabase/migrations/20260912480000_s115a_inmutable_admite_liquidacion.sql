-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA INMUTABILIDAD ADMITE `liquidacion_id` — y la decisión se escribe
--
-- 🔴 LO ENCONTRÓ EL FIXTURE DE LA COMPUERTA, y el trigger hizo exactamente lo
--    que su comentario prometía: *«se compara por LO QUE PUEDE CAMBIAR, no por
--    una lista de prohibidos… así una columna nueva nace protegida»*. Nació
--    protegida `liquidacion_id`, y con eso **atar un comprobante autorizado a su
--    liquidación era imposible** — o sea, la compuerta que acabo de poner no se
--    podía satisfacer nunca.
--
-- LA DECISIÓN, explícita: `liquidacion_id` **no es contenido fiscal**. No cambia
-- una cifra, ni el receptor, ni la clave; no altera en nada lo que el documento
-- dice ante el SRI. Es un vínculo administrativo — de la misma naturaleza que
-- `xml_url` y `pdf_url`, que ya estaban permitidos por la misma razón.
--
-- ⚠️ Y la forma se conserva: se agrega UNA columna al conjunto permitido, no se
--    pasa a lista de prohibidos. *La próxima columna que alguien agregue tiene
--    que seguir naciendo protegida, y su autor tiene que venir a esta migración
--    a decir por qué puede moverse.*
--
-- 76(g) — VEDA: NO RIGE (reemplazo de función).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_permitido public.documentos_fiscales;
BEGIN
  IF OLD.estado <> 'autorizada' THEN RETURN NEW; END IF;

  IF (NEW.estado IS DISTINCT FROM OLD.estado) AND NEW.estado <> 'anulada' THEN
    RAISE EXCEPTION 'documento_autorizado_no_cambia_de_estado'
      USING ERRCODE = '42501',
            DETAIL  = 'De autorizada solo se sale a anulada; una correccion es una nota de credito.';
  END IF;

  v_permitido                := OLD;
  v_permitido.xml_url        := NEW.xml_url;
  v_permitido.pdf_url        := NEW.pdf_url;
  v_permitido.estado         := NEW.estado;
  v_permitido.updated_at     := NEW.updated_at;
  /* Vinculo administrativo, no contenido fiscal: atar el comprobante a la
     liquidacion que respalda no cambia lo que el documento dice ante el SRI. */
  v_permitido.liquidacion_id := NEW.liquidacion_id;

  IF ROW(NEW.*) IS DISTINCT FROM ROW(v_permitido.*) THEN
    RAISE EXCEPTION 'documento_autorizado_es_inmutable'
      USING ERRCODE = '42501',
            DETAIL  = 'Solo xml_url, pdf_url, liquidacion_id, estado->anulada y updated_at pueden moverse.';
  END IF;

  RETURN NEW;
END $function$;

-- CINTURÓN: la columna nueva se mueve, y NINGUNA otra.
DO $c$
DECLARE v_id uuid; v_liq uuid; v_paso boolean;
BEGIN
  SELECT id INTO v_liq FROM public.liquidaciones LIMIT 1;
  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero, items, fecha_emision)
  VALUES ('EC','factura', 1, 'autorizada','recibido','comprobante_proveedor', true,
          '[]'::jsonb, public.fiscal_hoy())
  RETURNING id INTO v_id;

  UPDATE public.documentos_fiscales SET liquidacion_id = v_liq WHERE id = v_id;   -- permitido

  BEGIN
    UPDATE public.documentos_fiscales SET total = 999 WHERE id = v_id;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN v_paso := false;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: se pudo cambiar el TOTAL de una autorizada. La inmutabilidad se rompio.';
  END IF;

  DELETE FROM public.documentos_fiscales WHERE id = v_id;
  IF (SELECT count(*) FROM public.documentos_fiscales) <> 0 THEN
    RAISE EXCEPTION 'cinturon: residuo';
  END IF;
  RAISE NOTICE 'cinturon VERDE: liquidacion_id se mueve, el total NO, residuo 0';
END $c$;

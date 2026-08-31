-- REVERSA de 20260829120000_s107a_documentos_y_actas.sql · ESCRITA ANTES.
-- 🔴 ABORTA si hay actas levantadas o aceptaciones firmadas: un acta es el
--    registro que responde «cuándo apareció la lesión», y una aceptación es
--    una firma con sello de tiempo. Borrarlas es destruir prueba.
-- 🔴 Y devuelve `_guarderia_puede_reservar` a UNA sola condición: revertir
--    esto REABRE la reserva sin documentos aceptados.
BEGIN;
DO $$
DECLARE v_a int; v_f int;
BEGIN
  SELECT count(*) INTO v_a FROM public.guarderia_actas;
  SELECT count(*) INTO v_f FROM public.guarderia_aceptaciones;
  IF v_a > 0 OR v_f > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % acta(s) y % aceptacion(es). Eso es prueba, no estado.', v_a, v_f;
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.confirmar_acta_guarderia(uuid, text, text);
DROP FUNCTION IF EXISTS public.levantar_acta_guarderia(uuid, text, boolean, text, text, timestamptz, text);
DROP FUNCTION IF EXISTS public.evaluar_documentos_guarderia(uuid);
DROP FUNCTION IF EXISTS public.aceptar_documentos_guarderia(uuid, jsonb, numeric, text, jsonb, jsonb, boolean);
DROP FUNCTION IF EXISTS public.obtener_documentos_guarderia();
DROP TABLE IF EXISTS public.guarderia_actas;
DROP TABLE IF EXISTS public.guarderia_aceptaciones;
DROP TABLE IF EXISTS public.guarderia_autorizaciones_familia;
DROP TABLE IF EXISTS public.guarderia_documentos;
-- la compuerta vuelve a UNA condición
CREATE OR REPLACE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public','pg_temp' AS $$
DECLARE v_san jsonb;
BEGIN
  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  IF v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios', 'faltantes', v_san->'faltantes');
  END IF;
  RETURN jsonb_build_object('puede', true);
END $$;
COMMIT;

-- REVERSA de 20260908500000 · el traspaso deja de cerrar las otras
-- solicitudes del mismo animal.
-- ⚠️ Las filas YA cerradas con 'no_concretada_otra_familia' NO vuelven: el
-- estado saldría del CHECK y la reversa fallaría. Se las mueve a 'declinada'
-- ANTES de angostar el vocabulario — y eso **cambia lo que dice la pantalla**:
-- de «ya encontró familia» a «te declinaron», que es otra cosa y es peor.
-- Por eso esta reversa AVISA en vez de hacerlo en silencio.
DO $r$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM adopcion_solicitud WHERE estado='no_concretada_otra_familia';
  IF v_n > 0 THEN
    RAISE WARNING 'REVERSA: % solicitud(es) pasan de «ya encontro familia» a «declinada» — la voz cambia', v_n;
    UPDATE adopcion_solicitud SET estado='declinada' WHERE estado='no_concretada_otra_familia';
  END IF;
END $r$;
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada','desistida','no_concretada_fallecimiento']));
-- (el CHECK de cerrada_en se re-crea igual, sin el estado nuevo)

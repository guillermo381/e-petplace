-- ============================================================================
-- S87-A · LOTE 1 · PASO 6 — SE CIERRA LA PUERTA TRASERA
--
-- Las ONCE intenciones ya pasan por `registrar_intencion_notificacion`. Este
-- paso es el que hace que eso NO SE DEGRADE: sin él, "puerta única" es una
-- convención, y la función número doce que alguien escriba dentro de seis meses
-- va a insertar directo sin que nadie se entere. Es la clase D-654 exacta:
-- funcionaría, y haría lo incorrecto en silencio.
--
-- `notificaciones` queda de SOLO LECTURA: es historia (26 filas, pre-motor).
-- El motor escribe en `notificacion_intencion`, por la puerta y solo por ella.
--
-- VEDA 76(g): NO RIGE — privilegios + un trigger de guarda, sin tocar datos.
-- REVERSA: DROP del trigger + el GRANT inverso. Y revertir DEVUELVE el agujero:
-- cualquier función podría volver a insertar sin pasar por los cinco gates.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public._trg_notificaciones_solo_lectura()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  RAISE EXCEPTION 'notificaciones_es_historia'
    USING ERRCODE = '42501',
          HINT = 'Esta tabla quedo de solo lectura en S87. El motor escribe por '
              || 'registrar_intencion_notificacion, que aplica los cinco gates '
              || 'de MODELO_NOTIFICACIONES §5. Insertar aca los saltea.';
END $$;

CREATE TRIGGER trg_notificaciones_solo_lectura
  BEFORE INSERT ON public.notificaciones
  FOR EACH ROW EXECUTE FUNCTION public._trg_notificaciones_solo_lectura();

REVOKE INSERT ON public.notificaciones FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._trg_notificaciones_solo_lectura() FROM PUBLIC, anon, authenticated;

-- Cinturón: el rojo se PRODUCE acá adentro (L-199). Un guard que nunca rebotó
-- no es un guard.
DO $$
DECLARE v_m text;
BEGIN
  BEGIN
    INSERT INTO public.notificaciones (user_id, country_code, rol_destino, tipo, canal, titulo, mensaje)
    VALUES ('00000000-0000-0000-0000-000000000000','EC','pet_parent','sistema','in_app','x','y');
    RAISE EXCEPTION 'la_puerta_trasera_NO_se_cerro';
  EXCEPTION WHEN sqlstate '42501' THEN
    GET STACKED DIAGNOSTICS v_m = MESSAGE_TEXT;
    IF v_m <> 'notificaciones_es_historia' THEN RAISE; END IF;
    RAISE NOTICE 'puerta trasera CERRADA · rebote producido: %', v_m;
  END;
END $$;

COMMIT;

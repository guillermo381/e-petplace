-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · los dos mapeos de postventa — mismo criterio, no uno nuevo
--
-- MEDIDO CONTRA META, no heredado (7-sep-2026 **20:50** Guayaquil, corriendo
-- `?verificar=1` contra la edge desplegada):
--   **10 plantillas** · 8 APPROVED · **2 PENDING** · 10 UTILITY · 0 MARKETING
--   Las dos nuevas: `caso_elegir_devolucion` y `caso_resuelto`, ambas `es`.
--
-- POR QUÉ SE SIEMBRAN Y LAS OTRAS SIETE NO: **el criterio no cambió.** Se
-- siembra el mapeo cuyo nombre coincide EXACTO con un tipo del catálogo, y
-- estas dos coinciden exacto con los dos tipos que `LETRA_POSTVENTA` §10
-- nombra como los ÚNICOS momentos de WhatsApp. Las otras siete siguen sin
-- sembrar porque siguen dependiendo de suponer qué significan `_u` y `_v`.
--
-- ⚠️ ESTÁN **PENDING**, y el mapeo lo registra igual. Son dos hechos distintos:
--    «cómo se llama la plantilla de este aviso» es nuestro y ya está decidido;
--    «Meta la aprobó» es de Meta y todavía no. Sembrar el nombre no promete el
--    envío — y con `transporte_vivo=false` no hay envío que prometer.
--    **El día que Meta apruebe, no hay que tocar nada.**
--
-- 🔴 Y SE DECLARA LA HORA, no sólo la fecha (`L-500`): con cinco pistas en
--    paralelo un estado de plantillas dura horas. Este se midió a las 20:50.
--
-- VEDA 76(g): NO RIGE — dos UPDATE sobre un catálogo, cero backfill.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.cat_notificacion_tipos
   SET plantilla_whatsapp = 'caso_elegir_devolucion', plantilla_idioma = 'es'
 WHERE codigo = 'caso_elegir_devolucion';

UPDATE public.cat_notificacion_tipos
   SET plantilla_whatsapp = 'caso_resuelto', plantilla_idioma = 'es'
 WHERE codigo = 'caso_resuelto';

DO $cinturon$
DECLARE v_map int; r jsonb;
BEGIN
  SELECT count(*) INTO v_map FROM cat_notificacion_tipos WHERE plantilla_whatsapp IS NOT NULL;
  -- 🔴 Si los tipos `caso_*` todavía no existen (los crea el arco de avisos de
  -- postventa), el UPDATE no toca nada y el conteo se queda en 1. Eso NO es un
  -- fallo: es que la fila aún no nació. Se DICE en vez de abortar.
  IF v_map = 1 THEN
    RAISE NOTICE '⚠️ los tipos caso_elegir_devolucion / caso_resuelto todavía NO existen en '
                 'cat_notificacion_tipos — el mapeo queda pendiente de que nazcan. '
                 'Sigue habiendo 1 mapeo (pedido_confirmado).';
  ELSIF v_map = 3 THEN
    RAISE NOTICE 'CINTURÓN VERDE · 3 mapeos (pedido_confirmado + los dos de postventa)';
  ELSE
    RAISE EXCEPTION 'CINTURÓN: % mapeos, esperaba 1 (tipos sin nacer) o 3', v_map;
  END IF;

  r := public.resolver_plantilla_whatsapp('pedido_confirmado');
  IF (r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURÓN: el mapeo que ya existía se rompió — %', r;
  END IF;
END $cinturon$;

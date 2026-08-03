-- S85-A · EL TECHO DEL PASEO SUBE DE 4 A 10
--
-- FIRMA DEL FOUNDER (3-ago-2026), literal: *"pueden ser hasta 10 en algunos
-- casos de paseo"*.
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** HACE, y es lo que más se malinterpreta: **NO
-- pone a nadie en 10.** El motor calcula
--
--     LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1))
--
-- ⇒ **el techo es un LÍMITE SUPERIOR de plataforma; el número real lo pone
-- cada prestador en su taller.** Subir el techo no cambia una sola franja: lo
-- que hace es **dejar de recortar** a quien quiera cargar 5..10.
--
-- EL DIAGNÓSTICO QUE LA MOTIVÓ (S85-A, medido antes de tocar): el founder
-- reportó que *"desaparece el slot de horario en la agenda"* al reservar. **No
-- era un bug del motor.** Paseos Andres tiene 24 franjas activas y **la mitad
-- con `max_citas_por_slot = 1`** ⇒ capacidad efectiva 1 ⇒ una reserva agota el
-- cupo y el slot deja de ofertarse, **correctamente según el dato**.
-- *La prueba por el lado bueno: el 3-ago hay DOS citas simultáneas a las 09:30
-- en una franja de capacidad 3 — el mecanismo funciona hoy, en producción.*
--
-- ⇒ **ESTA MIGRACIÓN SOLA NO DESTRABA D-595.** Lo que lo destraba es que el
-- prestador cargue su número en el taller. Se dice acá para que nadie aplique
-- esto, vea el slot desaparecer igual y concluya que no funcionó.
--
-- LOS CINCO TIPOS ALCANZADOS (medidos, no supuestos):
--   paseo · paseo_30min · paseo_60min · paseo_mensual · paseo_paquete
-- **Los otros 25 tipos NO se tocan** — su `cupo_techo` es NULL ⇒ capacidad 1
-- ⇒ exclusivos, que es la regla de mezcla de `MODELO_VETERINARIA` §3 y no
-- cambia acá.
--
-- 76(g) — DECLARADA: **NO RIGE.** UPDATE de 5 filas de catálogo, keyed por un
-- patrón literal, sin DDL, sin anclas sobre datos móviles. La lectura del
-- motor es STABLE y toma el valor nuevo en la consulta siguiente.
--
-- REVERSA escrita ANTES:
--   docs/relevamientos/2026-08-03-s85a-REVERSA-cupo-techo-paseo.sql
--   (lleva su aviso propio: bajar el techo RECORTA EN SILENCIO a quien haya
--    cargado más de 4 — la franja dice su número y el motor oferta menos.)

BEGIN;

UPDATE public.tipos_servicio
   SET cupo_techo = 10
 WHERE codigo LIKE 'paseo%';

-- ── VERIFICACIÓN IMPERATIVA (L-063), con su contra-caso ──
DO $$
DECLARE v_paseo integer; v_otros integer; v_sin10 integer;
BEGIN
  SELECT count(*) INTO v_paseo FROM tipos_servicio WHERE codigo LIKE 'paseo%';
  SELECT count(*) INTO v_sin10 FROM tipos_servicio WHERE codigo LIKE 'paseo%' AND cupo_techo IS DISTINCT FROM 10;

  IF v_paseo <> 5 THEN
    RAISE EXCEPTION 'ANCLA ROTA: esperaba 5 tipos paseo* y hay %. El patrón dejó de nombrar lo que creía.', v_paseo;
  END IF;
  IF v_sin10 > 0 THEN
    RAISE EXCEPTION 'INCOMPLETA: % tipos paseo* no quedaron en 10.', v_sin10;
  END IF;

  -- CONTRA-CASO: el resto del catálogo NO se movió. Sin esto, un UPDATE sin
  -- WHERE daría el mismo verde sobre las cinco que sí miramos — y habría
  -- vuelto agrupable TODO el catálogo, incluida la cirugía.
  SELECT count(*) INTO v_otros FROM tipos_servicio WHERE codigo NOT LIKE 'paseo%' AND cupo_techo IS NOT NULL;
  IF v_otros > 0 THEN
    RAISE EXCEPTION 'ALCANCE ROTO: % tipos NO-paseo quedaron con cupo_techo. Debían seguir en NULL (exclusivos).', v_otros;
  END IF;

  RAISE NOTICE 'S85 OK — los 5 paseo* en 10 · los otros 25 intactos en NULL (exclusivos).';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A6 · BACKFILL de los 19 sujetos cerrados sin evento
--
-- Los cuatro productores (migraciones 680000/690000) evitan que un cierre NUEVO
-- deje un sujeto sin evento. Pero 19 sujetos ya estaban cerrados ANTES de que
-- existieran ⇒ el rojo de E sigue en 19 hasta backfillearlos.
--
-- 🔴 «POR CONSTRUCCIÓN, NO POR FILTRO» (adenda): no se toca el gate para que no
--    los cuente — se crean los eventos que faltan, llamando los MISMOS helpers
--    idempotentes. El número baja porque los sujetos devengan, no porque se los
--    esconda.
--
-- POR QUÉ ES SEGURO backfillear devengo acá y en producción NO: `LETRA_POSTVENTA`
-- declara que **ningún dato de servicio en la base es real** — todo es prueba de
-- construcción. Mover estos 19 a `pendiente_liquidar` mueve plata de SANDBOX. En
-- producción, backfillear devengo histórico mueve plata real hacia liquidaciones
-- y es decisión de la mesa; acá es limpieza de datos de prueba.
--
-- TOLERANTE A LOS MALFORMADOS: un sujeto de prueba sin precio, sin cuenta
-- comercial o con tipo_servicio NULL no puede devengar. El backfill lo SALTEA
-- y lo cuenta, en vez de abortar — un dato de prueba roto es dato, no un fallo
-- del motor.
--
-- VEDA 76(g): RIGE — crea eventos económicos (escritura de negocio). Ventana
-- declarada; se cierra midiendo el antes/después acá adentro.
-- REVERSA: escrita ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

DO $backfill$
DECLARE
  r record; v_ev uuid; v_ok int := 0; v_skip int := 0; v_err text;
  v_antes int; v_despues int;
BEGIN
  -- el rojo, ANTES
  SELECT
    (SELECT count(*) FROM evento_cita_servicio c WHERE c.estado='completada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='cita' AND e.origen_id=c.id))
   +(SELECT count(*) FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id=e.cita_id
       WHERE e.estado='entregada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos ev WHERE ev.origen_tipo='estadia' AND ev.origen_id=e.id))
   +(SELECT count(*) FROM pedidos p WHERE p.estado='entregado'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='pedido' AND e.origen_id=p.id))
   INTO v_antes;
  RAISE NOTICE 'BACKFILL · rojo ANTES: % sujetos cerrados sin evento', v_antes;

  -- CITAS
  FOR r IN
    SELECT c.id FROM evento_cita_servicio c
     WHERE c.estado='completada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='cita' AND e.origen_id=c.id)
  LOOP
    BEGIN
      v_ev := _devengar_cita(r.id, 'backfill_a6');
      IF v_ev IS NOT NULL THEN
        UPDATE eventos_economicos SET metadata = metadata || '{"via":"backfill_a6"}'::jsonb WHERE id=v_ev;
        v_ok := v_ok + 1;
      ELSE v_skip := v_skip + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      RAISE NOTICE '  cita % salteada: %', r.id, left(v_err,50);
      v_skip := v_skip + 1;
    END;
  END LOOP;

  -- ESTADÍAS
  FOR r IN
    SELECT e.id FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id=e.cita_id
     WHERE e.estado='entregada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos ev WHERE ev.origen_tipo='estadia' AND ev.origen_id=e.id)
  LOOP
    BEGIN
      v_ev := _devengar_estadia(r.id);
      IF v_ev IS NOT NULL THEN
        UPDATE eventos_economicos SET metadata = metadata || '{"via":"backfill_a6"}'::jsonb WHERE id=v_ev;
        v_ok := v_ok + 1;
      ELSE v_skip := v_skip + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      RAISE NOTICE '  estadía % salteada: %', r.id, left(v_err,50);
      v_skip := v_skip + 1;
    END;
  END LOOP;

  -- PEDIDOS
  FOR r IN
    SELECT p.id FROM pedidos p WHERE p.estado='entregado'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='pedido' AND e.origen_id=p.id)
  LOOP
    BEGIN
      v_ev := _devengar_pedido(r.id);
      IF v_ev IS NOT NULL THEN
        UPDATE eventos_economicos SET metadata = metadata || '{"via":"backfill_a6"}'::jsonb WHERE id=v_ev;
        v_ok := v_ok + 1;
      ELSE v_skip := v_skip + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      RAISE NOTICE '  pedido % salteado: %', r.id, left(v_err,50);
      v_skip := v_skip + 1;
    END;
  END LOOP;

  -- el rojo, DESPUÉS
  SELECT
    (SELECT count(*) FROM evento_cita_servicio c WHERE c.estado='completada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='cita' AND e.origen_id=c.id))
   +(SELECT count(*) FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id=e.cita_id
       WHERE e.estado='entregada' AND c.estado_reserva='pagada'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos ev WHERE ev.origen_tipo='estadia' AND ev.origen_id=e.id))
   +(SELECT count(*) FROM pedidos p WHERE p.estado='entregado'
       AND NOT EXISTS(SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='pedido' AND e.origen_id=p.id))
   INTO v_despues;

  RAISE NOTICE 'BACKFILL · devengados %, salteados % (malformados) · rojo DESPUÉS: %', v_ok, v_skip, v_despues;

  -- El rojo que baja tiene que ser exactamente los que devengaron.
  IF v_despues <> v_antes - v_ok THEN
    RAISE EXCEPTION 'BACKFILL: el rojo no bajó por los que devengaron (antes % ok % despues %)', v_antes, v_ok, v_despues;
  END IF;
  -- Lo que queda son malformados, y se declara: cada uno es un dato de prueba
  -- que no puede devengar, no un sujeto que el motor dejó pasar.
  IF v_despues > 0 THEN
    RAISE NOTICE '⚠️ quedan % sujetos que NO pudieron devengar (sin precio / sin cuenta / tipo NULL). '
                 'Son datos de prueba rotos, no huecos del motor. E los va a ver y son legítimos.', v_despues;
  END IF;
END $backfill$;

-- S114-A · P0 · EL RELOJ DE F1 ESTABA CAÍDO — `no_ejecutado` faltaba en el CHECK
-- de guarderia_estadias (E lo midió: cron `expirar-objetos-sin-cierre` FAILED cada
-- hora desde las 05:00 del 10-sep).
--
-- El reloj marca `no_ejecutado` en DOS tablas cuando un servicio cruza 48 h sin
-- cerrarse: evento_cita_servicio (que YA tenía el valor) y guarderia_estadias (que
-- NO). La rama de estadías escribía un valor que su propio CHECK prohíbe ⇒ la
-- excepción ABORTABA la función entera, incluidos los avisos de citas — un fallo
-- sin síntoma, vivo en cron.job_run_details. Es la clase exacta que S114 midió
-- once veces: verde donde nadie mira, roto en silencio.
--
-- Medido antes de curar: el reloj toca SÓLO estas dos tablas con `no_ejecutado`
-- (los pedidos no los toca esta función). No hay tercera tabla — la advertencia
-- de E verificada contra el cuerpo de expirar_objetos_sin_cierre.
--
-- Cura mínima: agregar `no_ejecutado` al CHECK, igual que en evento_cita_servicio.
-- NO se toca la lógica del reloj (eso sería producto): la función ya decidió
-- barrer todo lo que no esté en el conjunto terminal; esto sólo la deja completar.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES en
-- docs/relevamientos/2026-09-10-s114a-REVERSA-20260912160000-estadia-no-ejecutado.sql

ALTER TABLE guarderia_estadias DROP CONSTRAINT guarderia_estadias_estado_check;
ALTER TABLE guarderia_estadias ADD CONSTRAINT guarderia_estadias_estado_check
  CHECK (estado = ANY (ARRAY['reservada','recogida_en_curso','en_guarderia',
    'retorno_en_curso','entregada','cancelada','no_recogida','no_ejecutado']));

-- ── CINTURÓN · el CHECK ahora acepta no_ejecutado, y el reloj completa sin abortar
DO $cinturon$
DECLARE v_def text; v_marcadas int;
BEGIN
  v_def := pg_get_constraintdef((SELECT oid FROM pg_constraint
    WHERE conname = 'guarderia_estadias_estado_check'));
  IF v_def NOT ILIKE '%no_ejecutado%' THEN
    RAISE EXCEPTION 'CINTURÓN: el CHECK no incluye no_ejecutado tras la cura: %', v_def;
  END IF;

  -- rojo→verde real: una sonda que escribe no_ejecutado en una estadía viva y
  -- vuelve atrás. Sin la cura, este UPDATE lanzaba 23514 (violación de CHECK).
  BEGIN
    UPDATE guarderia_estadias SET estado = 'no_ejecutado'
     WHERE id = (SELECT id FROM guarderia_estadias WHERE estado = 'reservada' LIMIT 1);
    GET DIAGNOSTICS v_marcadas = ROW_COUNT;
    IF v_marcadas < 1 THEN RAISE NOTICE 'CINTURÓN: sin estadía reservada para sondar (ok, la cura igual está en el CHECK)'; END IF;
    RAISE EXCEPTION 'ROLLBACK_SONDA';
  EXCEPTION
    WHEN check_violation THEN
      RAISE EXCEPTION 'CINTURÓN: el CHECK sigue rechazando no_ejecutado';
    WHEN OTHERS THEN
      IF SQLERRM <> 'ROLLBACK_SONDA' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURÓN VERDE · guarderia_estadias acepta no_ejecutado · el reloj puede completar';
END $cinturon$;

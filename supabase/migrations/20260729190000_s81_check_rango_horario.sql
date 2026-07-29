-- S81 · EL CHECK QUE FALTABA (orden founder sobre la medición C5):
-- hora_fin > hora_inicio EN LA FUENTE. Hoy la franja invertida es
-- insertable y el motor la trata MUDA (generate_series con delta
-- negativo = serie vacía, cero inicios, sin error — el verosímil-falso
-- de agenda medido en s81-C5 §2). El wrapper ya rebota (horarios.ts:289)
-- — este CHECK es el guard de FUENTE que ningún caller puede esquivar.
--
-- 76(g): NO RIGE — DDL puro; el ADD CONSTRAINT valida contra las filas
-- vivas en el propio apply (medido ANTES: 56 filas, 0 invertidas) sin
-- backfill ni anclas de snapshot.
-- Regla 78: cero cambio de GRANTS/RETURNS — no toca bundles.
-- NOTA DE ALCANCE: este CHECK exige fin > inicio MISMO DÍA — el CRUCE
-- de medianoche queda EXCLUIDO A PROPÓSITO (es decisión de modelado
-- diferida, C5 §2 caso B; si algún día se firma, este CHECK se enmienda
-- CON esa letra, jamás antes).
-- Reversa escrita ANTES: docs/relevamientos/
--   2026-07-29-s81-REVERSA-check-rango-horario.sql

ALTER TABLE public.prestador_horarios
  ADD CONSTRAINT chk_horario_rango_valido CHECK (hora_fin > hora_inicio);

-- CINTURÓN: el constraint existe y está VALIDADO.
DO $verificacion$
DECLARE v_ok boolean;
BEGIN
  SELECT convalidated INTO v_ok FROM pg_constraint
  WHERE conname = 'chk_horario_rango_valido'
    AND conrelid = 'public.prestador_horarios'::regclass;
  IF v_ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'cinturon: chk_horario_rango_valido ausente o sin validar';
  END IF;
END;
$verificacion$;

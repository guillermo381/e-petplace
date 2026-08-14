-- S97-A · LOS CORTES DECLARAN QUÉ DÍAS RIGEN Y SI CUENTAN LOS FESTIVOS
--          (contrato de C, firma del founder sobre el formulario de cortes)
--
-- ⚠️ NOTA DE DIRECCIÓN: el contrato de C nombraba la tabla
-- `reglas_envio_turnos` y **la tabla es `entrega_turnos`**. Sus DIEZ columnas
-- estaban listadas una por una y las diez son exactas — *midió la FORMA bien
-- y erró la DIRECCIÓN*. Se corrige acá y se le avisa: **un contrato con el
-- nombre equivocado y el contenido correcto es más peligroso que uno vago —
-- se lee como verificado.**
--
-- ═══ EL ESTADO DE HOY, MEDIDO ═══
-- `entrega_turnos` tiene `codigo · corte · entrega_desde · entrega_hasta
-- · dia_offset · orden · zona_horaria · activo`. **No hay días ni festivos:
-- todo corte aplica TODOS los días.**
--
-- ═══ 🔴 LA CONVENCIÓN NO SE INVENTÓ: SE MIDIÓ ═══
-- La casa YA tiene vocabulario de día de semana —`prestador_horarios.
-- dia_semana` y `prestador_dias_cerrados.dia_semana`, las dos `0..6` por
-- CHECK— **y el semántico salió del código que lo compara**, no de suponer:
--
--     h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
--
-- `EXTRACT(DOW)` de Postgres devuelve **0 = DOMINGO** ⇒ **0=dom … 6=sáb**.
-- *Elegir la otra convención habría dado una tabla que valida perfecto y
--  entrega los pedidos un día corrido — el peor defecto posible acá, porque
--  no falla: acierta seis de siete veces.*
--
-- ═══ POR QUÉ CONJUNTO Y NO SIETE BOOLEANOS NI BITMASK (contrato de C) ═══
--   · siete booleanos: siete columnas que hay que leer juntas para saber una
--     sola cosa, y siete lugares donde olvidarse de una.
--   · bitmask: eficiente y **opaco** — `62` no se lee, y un `WHERE` sobre él
--     no se escribe sin una tabla de verdad al lado.
--   · **`smallint[]`**: se lee, se consulta con `= ANY`, y su CHECK expresa
--     exactamente la regla.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **RIGE**.
--   Esta migración BACKFILLEA `entrega_turnos`. Las filas vivas se
--   miden abajo y el cinturón verifica que ninguna quede sin días.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ 🔴 EL BACKFILL ES L–D, Y ESA ES LA DECISIÓN DE LA MIGRACIÓN ═══
-- Hoy **todo corte aplica todos los días**, así que el único backfill que
-- **no cambia la operación de nadie** es el set completo.
--
-- > ***Poner L–V «porque es el caso común» le cambiaría la operación a quien
-- > hoy entrega sábados, sin preguntarle.*** Un backfill que mejora el dato
-- > promedio y rompe un caso real no es una mejora: es una decisión de
-- > producto tomada por una migración.

BEGIN;

ALTER TABLE public.entrega_turnos
  ADD COLUMN IF NOT EXISTS dias_semana      smallint[],
  ADD COLUMN IF NOT EXISTS incluye_festivos boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.entrega_turnos.dias_semana IS
  'Días en que rige el corte. 0=domingo … 6=sábado, la MISMA convención que '
  '`prestador_horarios.dia_semana` (medida contra EXTRACT(DOW)). Conjunto, no '
  'bitmask: se lee y se consulta con = ANY.';

COMMENT ON COLUMN public.entrega_turnos.incluye_festivos IS
  'Si el corte rige también en feriado. FALSE por defecto: en Ecuador el '
  'feriado mueve la operación real, y asumir que se trabaja es la suposición '
  'cara. NO es un día de la semana — por eso vive aparte y no adentro del array.';

-- ── EL BACKFILL: lo que ya era cierto, escrito ─────────────────────────────
UPDATE public.entrega_turnos
   SET dias_semana = ARRAY[0,1,2,3,4,5,6]::smallint[]
 WHERE dias_semana IS NULL;

-- Recién con todas las filas pobladas se puede exigir el NOT NULL.
ALTER TABLE public.entrega_turnos
  ALTER COLUMN dias_semana SET NOT NULL,
  ALTER COLUMN dias_semana SET DEFAULT ARRAY[0,1,2,3,4,5,6]::smallint[];

-- ── LOS CHECKS: la regla, expresada ───────────────────────────────────────
-- ① rango y no-vacío. Un corte sin días no es un corte apagado: es un corte
--    que no se puede evaluar. `activo=false` es cómo se apaga.
ALTER TABLE public.entrega_turnos
  ADD CONSTRAINT chk_ret_dias_semana_validos CHECK (
    array_length(dias_semana, 1) BETWEEN 1 AND 7
    AND dias_semana <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
  );

-- ② sin repetidos. `{1,1,3}` valida el rango y miente sobre cuántos días son.
--
-- ⚠️ Postgres NO admite subconsultas en un CHECK, así que la regla vive en una
--    función `IMMUTABLE`. **Se hace así y no se delega a la puerta a
--    propósito:** una regla que solo vive en el wrapper la esquiva cualquier
--    escritura que no pase por él, y esta tabla ya tiene siembra por SQL.
CREATE OR REPLACE FUNCTION public._dias_sin_repetidos(p_dias smallint[])
RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path TO 'public', 'pg_temp'
AS $fn$
  SELECT p_dias IS NULL
      OR array_length(p_dias, 1) = (SELECT count(DISTINCT d) FROM unnest(p_dias) AS d);
$fn$;

ALTER TABLE public.entrega_turnos
  ADD CONSTRAINT chk_ret_dias_semana_sin_repetidos
  CHECK (public._dias_sin_repetidos(dias_semana));

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR
--
-- No basta con que la columna exista: tiene que estar POBLADA en todas las
-- filas vivas, y los dos CHECKs tienen que RECHAZAR de verdad. Se prueban en
-- rojo adentro de la transacción y se deshacen a mano.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_filas int; v_sin_dias int; v_id uuid; v_orig smallint[];
  v_rechazo_rango boolean := false; v_rechazo_repes boolean := false;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE dias_semana IS NULL)
    INTO v_filas, v_sin_dias FROM entrega_turnos;

  IF v_filas = 0 THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: no hay filas vivas — sin ellas este backfill no se puede verificar y el assert seria decorativo.';
  END IF;
  IF v_sin_dias > 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: % filas quedaron sin dias_semana', v_sin_dias;
  END IF;

  -- Y que el backfill sea L–D, no otra cosa: si alguien lo cambia a L–V, acá se entera.
  IF EXISTS (SELECT 1 FROM entrega_turnos
              WHERE dias_semana <> ARRAY[0,1,2,3,4,5,6]::smallint[]) THEN
    RAISE EXCEPTION
      'CINTURON ROJO: alguna fila NO quedo en L-D. El backfill honesto es el set completo — cambiarlo le altera la operacion a quien entrega fin de semana.';
  END IF;

  SELECT id, dias_semana INTO v_id, v_orig FROM entrega_turnos LIMIT 1;

  -- ── ROJO ①: fuera de rango ──
  BEGIN
    UPDATE entrega_turnos SET dias_semana = ARRAY[0,7]::smallint[] WHERE id = v_id;
  EXCEPTION WHEN check_violation THEN v_rechazo_rango := true;
  END;
  IF NOT v_rechazo_rango THEN
    UPDATE entrega_turnos SET dias_semana = v_orig WHERE id = v_id;
    RAISE EXCEPTION 'CINTURON ROJO: el CHECK de rango ACEPTO un 7. No discrimina.';
  END IF;

  -- ── ROJO ②: repetidos ──
  BEGIN
    UPDATE entrega_turnos SET dias_semana = ARRAY[1,1,3]::smallint[] WHERE id = v_id;
  EXCEPTION WHEN check_violation THEN v_rechazo_repes := true;
  END;
  IF NOT v_rechazo_repes THEN
    UPDATE entrega_turnos SET dias_semana = v_orig WHERE id = v_id;
    RAISE EXCEPTION 'CINTURON ROJO: el CHECK ACEPTO dias repetidos.';
  END IF;

  -- ── TEARDOWN con residuo medido ──
  UPDATE entrega_turnos SET dias_semana = v_orig WHERE id = v_id;
  IF (SELECT dias_semana FROM entrega_turnos WHERE id = v_id) IS DISTINCT FROM v_orig THEN
    RAISE EXCEPTION 'CINTURON ABORTA: el teardown dejo residuo.';
  END IF;

  RAISE NOTICE 'CINTURON OK · % filas en L-D · los dos CHECKs rechazaron · residuo 0', v_filas;
END;
$cinturon$;

COMMIT;

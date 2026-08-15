-- S97-A · LA PUERTA DEL CORTE APRENDE LOS DÍAS Y LOS FESTIVOS
--
-- 🔴 CIERRA UN «MOTOR SIN PUERTA» PROPIO, y lo midió C: la migración
-- `20260815100000` ensanchó la TABLA y dejó `definir_turno_entrega` sin los
-- dos campos ⇒ **hoy solo pueden valer su default**, y por eso C no montó los
-- chips de días: habrían sido estado local que se guarda y vuelve apagado.
--
-- *Es exactamente el patrón que esta sesión viene depositando en fichas ajenas
--  todo el día. Ensanchar la tabla se siente como terminar; la puerta es lo
--  que lo vuelve cierto.*
--
-- ═══ 🔴 `NULL` = «NO LO TOQUES», Y ES LO QUE HACE SEGURA A ESTA PUERTA ═══
-- La puerta **upsertea por `(cuenta_comercial_id, codigo)`**. Con un DEFAULT
-- no-nulo, **cada corrección de HORA resetearía los días en silencio** — el
-- vendedor arregla un horario y pierde el «sábados no» sin enterarse.
--   ⇒ `NULL` no escribe: hace `COALESCE` contra lo que la fila ya tiene.
-- *Un default que parece inofensivo en la firma es una escritura invisible en
--  el upsert.* (Precisión de C, adoptada literal.)
--
-- 76(g) — VEDA: **NO RIGE.** DDL sobre el cuerpo de una función. Cero filas.
-- ⚠️ La firma CAMBIA (8 → 10 args) ⇒ **L-119: DROP explícito** de la vieja,
--    y se verifica `sobrecargas = 1` al final. *Dejar las dos vivas es cómo
--    un caller viejo sigue funcionando y escribiendo la mitad del dato.*

BEGIN;

DROP FUNCTION IF EXISTS public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text);

CREATE OR REPLACE FUNCTION public.definir_turno_entrega(
  p_cuenta_comercial_id uuid,
  p_codigo              text,
  p_corte               time without time zone,
  p_entrega_desde       time without time zone,
  p_entrega_hasta       time without time zone,
  p_dia_offset          integer  DEFAULT 0,
  p_orden               integer  DEFAULT 1,
  p_zona_horaria        text     DEFAULT 'America/Guayaquil'::text,
  p_dias_semana         smallint[] DEFAULT NULL,
  p_incluye_festivos    boolean    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  INSERT INTO entrega_turnos (cuenta_comercial_id, codigo, corte, entrega_desde,
                              entrega_hasta, dia_offset, orden, zona_horaria,
                              dias_semana, incluye_festivos)
    VALUES (p_cuenta_comercial_id, p_codigo, p_corte, p_entrega_desde,
            p_entrega_hasta, p_dia_offset, p_orden, p_zona_horaria,
            -- al CREAR, `NULL` cae al default de la columna (L–D): un corte
            -- nuevo sin días declarados rige todos los días, que es el
            -- estado que la tabla tenía antes de existir esta columna.
            COALESCE(p_dias_semana, ARRAY[0,1,2,3,4,5,6]::smallint[]),
            COALESCE(p_incluye_festivos, false))
  ON CONFLICT (cuenta_comercial_id, codigo)
    DO UPDATE SET corte = EXCLUDED.corte, entrega_desde = EXCLUDED.entrega_desde,
                  entrega_hasta = EXCLUDED.entrega_hasta, dia_offset = EXCLUDED.dia_offset,
                  orden = EXCLUDED.orden, zona_horaria = EXCLUDED.zona_horaria,
                  -- 🔴 al EDITAR, `NULL` NO PISA: conserva lo que la fila
                  --    tiene. `entrega_turnos` es la tabla, no EXCLUDED.
                  dias_semana      = COALESCE(p_dias_semana,      entrega_turnos.dias_semana),
                  incluye_festivos = COALESCE(p_incluye_festivos, entrega_turnos.incluye_festivos),
                  activo = true
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'turno_id', v_id);
END $function$;

REVOKE ALL ON FUNCTION public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text, smallint[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text, smallint[], boolean) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR — el brazo que importa es el de NO PISAR
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_sobrecargas int;
  v_cc uuid; v_cod text; v_id uuid;
  v_orig smallint[]; v_desp smallint[]; v_fest boolean;
BEGIN
  SELECT count(*) INTO v_sobrecargas FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='definir_turno_entrega';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO (L-119): quedaron % sobrecargas. Un caller viejo escribiria la mitad del dato.', v_sobrecargas;
  END IF;

  -- El fixture llama la puerta REAL, así que necesita pasar su gate: se le
  -- ponen claims de ADMIN, los mismos que pone PostgREST. **No se esquiva el
  -- gate: se lo satisface** — de hecho el primer intento de esta migración
  -- ABORTÓ con `no_sos_el_vendedor`, que es el gate haciendo su trabajo.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}', true);

  SELECT cuenta_comercial_id, codigo, id, dias_semana
    INTO v_cc, v_cod, v_id, v_orig
    FROM entrega_turnos LIMIT 1;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay turnos vivos — sin ellos no se puede probar el upsert.';
  END IF;

  -- Se marca un set DISTINTO del default, para que «no pisar» sea observable.
  UPDATE entrega_turnos SET dias_semana = ARRAY[1,2,3]::smallint[], incluye_festivos = true
   WHERE id = v_id;

  -- ── EL BRAZO QUE IMPORTA: editar SIN mandar los días no los toca ──
  PERFORM public.definir_turno_entrega(
    v_cc, v_cod, '13:00'::time, '15:00'::time, '19:00'::time, 0, 1, 'America/Guayaquil'
  );
  SELECT dias_semana, incluye_festivos INTO v_desp, v_fest FROM entrega_turnos WHERE id = v_id;

  IF v_desp IS DISTINCT FROM ARRAY[1,2,3]::smallint[] THEN
    RAISE EXCEPTION
      'CINTURON ROJO: editar la HORA piso los dias (quedo %). Ese es exactamente el defecto que el NULL viene a evitar.', v_desp;
  END IF;
  IF v_fest IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO: editar la hora piso incluye_festivos.';
  END IF;

  -- ── Y el otro brazo: mandarlos SÍ los cambia ──
  PERFORM public.definir_turno_entrega(
    v_cc, v_cod, '13:00'::time, '15:00'::time, '19:00'::time, 0, 1, 'America/Guayaquil',
    ARRAY[5,6]::smallint[], false
  );
  SELECT dias_semana, incluye_festivos INTO v_desp, v_fest FROM entrega_turnos WHERE id = v_id;
  IF v_desp IS DISTINCT FROM ARRAY[5,6]::smallint[] OR v_fest IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO: mandar los dias NO los cambio (quedo %, festivos %).', v_desp, v_fest;
  END IF;

  -- ── TEARDOWN con residuo medido ──
  UPDATE entrega_turnos SET dias_semana = v_orig, incluye_festivos = false WHERE id = v_id;
  IF (SELECT dias_semana FROM entrega_turnos WHERE id = v_id) IS DISTINCT FROM v_orig THEN
    RAISE EXCEPTION 'CINTURON ABORTA: el teardown dejo residuo.';
  END IF;

  RAISE NOTICE 'CINTURON OK · sobrecargas=1 · NULL no pisa · valores si cambian · residuo 0';
END;
$cinturon$;

COMMIT;

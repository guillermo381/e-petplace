-- ============================================================================
-- S106-A tanda 3 · LA CITA RESUELTA DICE SU MODALIDAD
--
-- ── POR QUÉ, Y NO ES UNA COMODIDAD DE PANTALLA ─────────────────────────────
-- `LETRA_TELEMEDICINA` §7 firma que **la consulta queda marcada como atendida
-- por videoconsulta**, y firma también CÓMO: *«el padre es la propia cita, con
-- `modalidad='telemedicina'` — no nace evento separado y NO hay columna nueva
-- en los eventos. **Los lectores derivan la marca de la cita.»***
--
-- Este lector es uno de esos lectores y **no derivaba nada**: devolvía trece
-- claves de la cita y no la modalidad, que es justo el dato que la firma pide
-- que viaje.
--
-- ── 🔴 POR QUÉ NO ALCANZABA CON DERIVARLO DEL `tipo_servicio` ──────────────
-- C ya lo derivaba así (`tipo_servicio = 'telemedicina' ⇒ teleconsulta`) y
-- pidió el dato igual. **Tiene razón, y su argumento es de modo de falla:**
--
-- > *El día que exista una cita cuyo `tipo_servicio` no sea telemedicina pero
-- > cuya `modalidad` SÍ lo sea —o al revés—, la derivación mentiría y **nada
-- > avisaría**: los dos son texto y compilan igual.*
--
-- Y el modelo ya lo permite hoy: `modalidad` es una columna **propia** de la
-- cita con su propio `CHECK` de cinco valores (`presencial · telemedicina ·
-- domicilio · emergencia_movil · local`), independiente del catálogo de
-- servicios. *Derivar un dato que existe es fabricar una segunda fuente de
-- verdad para algo que ya tiene una.*
--
-- ── LO QUE **NO** HACE ─────────────────────────────────────────────────────
-- No traduce. Devuelve el código del motor tal cual (`telemedicina`), jamás el
-- vocabulario de la pieza (`teleconsulta`): **la voz es de la pantalla**
-- (Ley 3), igual que `tipo_servicio` — que este mismo lector ya devuelve crudo.
--
-- ── VEDA 76(g): NO RIGE. `CREATE OR REPLACE` de una función, misma firma,
--    cero DDL de tablas, cero backfill, cero anclas.
-- ── L-119: NO RIGE — la firma `(uuid) RETURNS jsonb` no cambia ⇒ no hay
--    sobrecarga posible y no hace falta DROP.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-cita-resuelta-modalidad.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_cita_resuelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c evento_cita_servicio;
  v_uid uuid := auth.uid();
  v_puede boolean;
  v_motivo text;
  v_causa text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_c FROM evento_cita_servicio WHERE id = p_cita_id;
  IF NOT FOUND THEN
    /* 🔴 «NO EXISTE» ES UNA RESPUESTA LEGÍTIMA Y DISTINTA DE «CANCELADA».
       *Confundir las dos es exactamente el defecto que esta función viene a
       curar: la pantalla tiene que poder decir cuál de las dos pasó.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  /* EL GATE — las dos audiencias legítimas y ninguna más.
     🔴 Se reusan los helpers de la casa en vez de escribir el predicado:
     *un permiso re-implementado diverge del original el día que uno de los dos
     se corrija.* */
  SELECT public.user_tiene_acceso_a_mascota(v_c.mascota_id)          -- la familia
      OR public.es_mi_prestador(v_c.prestador_id)                    -- quien atiende
      OR public.is_admin()
    INTO v_puede;

  IF NOT COALESCE(v_puede, false) THEN
    /* Mismo código que «no existe» a propósito: *decirle «existe pero no es
       tuya» a quien no tiene acceso le confirma que esa cita existe.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  /* ¿POR QUÉ SE CANCELÓ? — hoy hay DOS causas vivas que escriben el mismo
     estado, y la pantalla no puede distinguirlas sin esto.
     ⚠️ SALE DE `metadata`, **NO de la columna `motivo`**: esa columna es el
     motivo de CONSULTA que escribió la familia al reservar (*«cojea de la pata
     trasera»*). Leerla acá pondría el síntoma del perro donde va la razón de
     la cancelación. */
  v_motivo := v_c.metadata->>'motivo';
  v_causa := CASE
    WHEN v_c.estado <> 'cancelada' THEN NULL
    WHEN v_c.metadata ? 'cancelada_por_reverso_en' THEN 'pago_reversado'
    WHEN v_motivo = 'cierre_periodo_plan'          THEN 'cierre_de_plan'
    WHEN v_motivo IS NOT NULL                      THEN 'otra'
    /* 🔴 `desconocida` NO ES UN HUECO QUE HAYA QUE TAPAR: hay citas canceladas
       ANTES de que nadie guardara el porqué. *Devolver «otra» ahí sería
       afirmar que hubo una razón registrada.* La pantalla dice lo que sabe. */
    ELSE 'desconocida'
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_c.id,
    'estado', v_c.estado,
    'estado_reserva', v_c.estado_reserva,
    'fecha', v_c.fecha,
    'hora', v_c.hora,
    'tipo_servicio', v_c.tipo_servicio,
    'prestador_id', v_c.prestador_id,
    'mascota_id', v_c.mascota_id,
    'cancelada', (v_c.estado = 'cancelada'),
    'causa_cancelacion', v_causa,
    'motivo_crudo', v_motivo,
    'cancelada_en', v_c.metadata->>'cancelada_por_reverso_en',
    -- ═══ S106 t3 · LA MARCA DE §7 ══════════════════════════════════════════
    -- Código del motor, sin traducir. `NULL` es legítimo: hay citas viejas sin
    -- modalidad escrita, y decir `presencial` por ellas sería INVENTAR.
    'modalidad', v_c.modalidad
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_cita_resuelta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_cita_resuelta(uuid) TO authenticated;

-- ── CINTURÓN: EJERCE, no declara ───────────────────────────────────────────
-- Corre la función POR SU CAMINO REAL, con el JWT de la familia dueña de una
-- cita de telemedicina VIVA, y exige que la clave venga con el valor correcto.
-- *«La clave existe en el jsonb» no prueba nada: `jsonb_build_object` la pone
-- igual con NULL adentro. El cinturón pide el VALOR.*
DO $cinturon$
DECLARE
  v_rol_mig text := current_user;   -- ⚠️ jamás RESET ROLE (skill: vuelve al rol de login del tool)
  v_cita uuid; v_uid uuid; v_out jsonb; v_mod text;
BEGIN
  IF has_function_privilege('anon', 'public.obtener_cita_resuelta(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: la cita resuelta quedo alcanzable por anon';
  END IF;

  -- Una cita de telemedicina real y quién es su familia.
  SELECT c.id, fm.user_id INTO v_cita, v_uid
  FROM evento_cita_servicio c
  JOIN mascotas m          ON m.id = c.mascota_id
  JOIN familia_miembro fm  ON fm.familia_id = m.familia_id AND fm.hasta IS NULL
  WHERE c.modalidad = 'telemedicina'
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_cita IS NULL THEN
    -- 🔴 NO se da por buena en silencio: sin caso, el cinturón NO MIDIÓ.
    RAISE EXCEPTION 'cinturon: no hay ninguna cita de telemedicina para ejercer contra ella';
  END IF;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_uid, 'role', 'authenticated')::text);
  SET LOCAL ROLE authenticated;

  v_out := public.obtener_cita_resuelta(v_cita);

  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  IF (v_out->>'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'cinturon: la familia no pudo leer su propia cita (%)', v_out->>'codigo';
  END IF;
  v_mod := v_out->>'modalidad';
  IF v_mod IS DISTINCT FROM 'telemedicina' THEN
    RAISE EXCEPTION 'cinturon: la modalidad no viajo — esperaba telemedicina, vino %',
                    coalesce(v_mod, '(ausente)');
  END IF;

  RAISE NOTICE 'cinturon cita-resuelta: OK · cita % · modalidad %', v_cita, v_mod;
END;
$cinturon$;

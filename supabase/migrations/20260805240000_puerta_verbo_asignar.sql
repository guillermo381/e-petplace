-- S88-A · LA PUERTA DEL VERBO ASIGNAR
--
-- Cierra el «MOTOR SIN PUERTA» declarado en S77: el tercer brazo de
-- `cita_update_prestador` existe desde entonces y NINGÚN wrapper escribe
-- `evento_cita_servicio.empleado_id` (medido hoy: 0 ocurrencias de escritura
-- en packages/api). El despegue de `dar_de_baja_empleado` PRODUCE citas sin
-- persona; hasta hoy nadie podía volver a ruteárselas a alguien.
--
-- 76(g) — VEDA: **NO RIGE.** DDL aditivo puro, sin backfill, sin anclas.
--   Cero filas se tocan al aplicar. (Medido antes de escribir:
--   citas con `empleado_id IS NULL` = 0 — el universo de entrada está vacío
--   hoy, y eso es «no hay», no «no puede».)
--
-- L-140 — el REVOKE/GRANT explícito va al pie. Sin él, toda función nace
--   con EXECUTE para `anon`.
--
-- ─────────────────────────────────────────────────────────────────────────
-- LA TRAMPA QUE ESTA MIGRACIÓN ESQUIVA, con su literal:
--
--   `empleado_tiene_rol(prestador, ARRAY['recepcion'])` **NO sirve de gate.**
--   La fila `recepcion` es MEMBRESÍA, JAMÁS IDENTIDAD (ley madre S76): se
--   concede al entrar y la tienen TODOS. Medido hoy: de las 9 filas
--   `recepcion` vivas, TRES pertenecen a veterinarios con 6, 6 y 2 chips.
--   Un gate escrito sobre esa fila habría dejado pasar al profesional.
--
--   Por eso recepción se deriva por AUSENCIA DE CHIPS, que es como la letra
--   de S76 la definió y como la app ya la computa (D-521).
--
-- Y LA SEGUNDA, que también vino del dato:
--   el rol `profesional` y los chips ESTÁN DESINCRONIZADOS — 2 de las 5
--   personas con chips NO tienen la fila `profesional`. Gatear por esa fila
--   habría dejado pasar a dos profesionales reales. El chip manda.
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

-- ① EL PREDICADO — nombrado por el VERBO que autoriza, no por el rol.
--    Si mañana cambia quién puede asignar, cambia UN lugar.
CREATE OR REPLACE FUNCTION public.empleado_puede_asignar_citas(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  -- (a) LA GESTIÓN: titular, administrador del negocio, admin de plataforma.
  --     Se ENSANCHA la puerta única de D-660 en vez de copiar su predicado
  --     (L-175). Nota: un administrador CON chips igual pasa por acá — el
  --     que rebota es el profesional PURO, que es lo que la mesa firmó.
  SELECT public.user_gestiona_prestador(p_prestador_id)
  -- (b) LA RECEPCIÓN, DERIVADA: miembro activo del negocio con CERO chips.
  --     No se lee la fila `recepcion` (ver la trampa en la cabecera).
      OR EXISTS (
        SELECT 1
        FROM prestador_empleados pe
        WHERE pe.prestador_id = p_prestador_id
          AND pe.user_id      = auth.uid()
          AND pe.activo       = true
          AND NOT EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id
          )
      );
$$;

COMMENT ON FUNCTION public.empleado_puede_asignar_citas(uuid) IS
  'S88: ¿el llamante puede RUTEAR citas de este negocio? Gestión (D-660) o '
  'recepción DERIVADA POR AUSENCIA DE CHIPS. Jamás por la fila `recepcion`: '
  'esa es membresía y la tienen todos, veterinarios incluidos (ley S76).';


-- ② LA PUERTA. Cada freno declara CONTRA QUÉ MIDIÓ (ley S84).
CREATE OR REPLACE FUNCTION public.asignar_cita_a_persona(
  p_cita_id     uuid,
  p_empleado_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid           uuid := auth.uid();
  v_prestador     uuid;
  v_tipo          text;
  v_estado        text;
  v_empleado_hoy  uuid;
  v_es_futura     boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- ── LA CITA EXISTE ────────────────────────────────────────────────────
  SELECT c.prestador_id, c.tipo_servicio, c.estado, c.empleado_id,
         (c.fecha + c.hora) > (now() AT TIME ZONE 'America/Guayaquil')
    INTO v_prestador, v_tipo, v_estado, v_empleado_hoy, v_es_futura
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  -- ── GATE 1 · EL ROL ───────────────────────────────────────────────────
  -- Acá rebota el profesional puro. La ventanilla gatea por MEMBRESÍA
  -- (ley madre S76) y ruteo es ventanilla, no acto clínico.
  IF NOT public.empleado_puede_asignar_citas(v_prestador) THEN
    RAISE EXCEPTION 'rol_sin_asignacion: quien rutea es la recepción, el administrador o el titular'
      USING ERRCODE = '42501';
  END IF;

  -- ── GATE 2 · LA CITA NO TIENE PERSONA ─────────────────────────────────
  -- REASIGNAR ES OTRO VERBO, y su precondición es el aviso a la familia
  -- que todavía NO EXISTE (`notificar_reasignacion_cita`, medido: ausente
  -- — es el mismo artefacto que gatea la vitrina desde S78).
  -- Mover una cita YA asignada sin avisar sería cambiarle el profesional a
  -- una familia por la espalda.
  IF v_empleado_hoy IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_asignada: ya tiene persona (%); reasignar exige el aviso a la familia, que aún no existe',
      v_empleado_hoy USING ERRCODE = '22023';
  END IF;

  -- ── GATE 3 · LA CITA ES RUTEABLE ──────────────────────────────────────
  -- Espeja EXACTAMENTE `_cita_despegable`: estado pendiente/confirmada y en
  -- el futuro. El conjunto de lo ASIGNABLE == el conjunto de lo DESPEGABLE,
  -- a propósito: el verbo no debe alcanzar nada que el despegue no produzca.
  -- Una cita pasada sin persona se queda «de la clínica» — que es lo que
  -- §11(a) firmó — y jamás se reescribe quién la atendió.
  IF v_estado NOT IN ('pendiente', 'confirmada') THEN
    RAISE EXCEPTION 'cita_no_asignable: estado %; solo se rutea lo pendiente o confirmado',
      v_estado USING ERRCODE = '22023';
  END IF;

  IF NOT v_es_futura THEN
    RAISE EXCEPTION 'cita_no_asignable: la cita ya ocurrió; asignarla reescribiría quién atendió'
      USING ERRCODE = '22023';
  END IF;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'cita_sin_tipo_servicio: sin oficio no se puede verificar el chip de la persona'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 4 · LA PERSONA ES DE ESTE NEGOCIO Y ESTÁ ACTIVA ──────────────
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe
    WHERE pe.id = p_empleado_id
      AND pe.prestador_id = v_prestador
      AND pe.activo = true
  ) THEN
    RAISE EXCEPTION 'persona_no_es_del_negocio: no hay vínculo activo con este negocio'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 5 · LA PERSONA TIENE EL OFICIO ───────────────────────────────
  -- Espeja el tercer brazo de `cita_update_prestador` (S77): el chip es por
  -- TIPO de servicio, que es equivalente por construcción a la oferta —
  -- los chips se dan y se quitan a oficio completo.
  IF NOT EXISTS (
    SELECT 1
    FROM prestador_empleado_servicios pes
    JOIN prestador_servicios ps ON ps.id = pes.servicio_id
    WHERE pes.empleado_id = p_empleado_id
      AND ps.tipo_servicio = v_tipo
  ) THEN
    RAISE EXCEPTION 'persona_sin_oficio: no tiene el chip de % en este negocio', v_tipo
      USING ERRCODE = '22023';
  END IF;

  -- ── EL ACTO ───────────────────────────────────────────────────────────
  -- De los 5 triggers de la tabla, este UPDATE dispara SOLO
  -- `trg_evento_cita_servicio_updated_at` (los otros tres son `UPDATE OF
  -- estado` y el quinto es AFTER INSERT) — medido en S77 y citado acá para
  -- que nadie lo vuelva a medir.
  UPDATE evento_cita_servicio
  SET empleado_id = p_empleado_id
  WHERE id = p_cita_id;

  RETURN jsonb_build_object(
    'ok',          true,
    'cita_id',     p_cita_id,
    'empleado_id', p_empleado_id
  );
END;
$$;

COMMENT ON FUNCTION public.asignar_cita_a_persona(uuid, uuid) IS
  'S88: la PUERTA del verbo asignar. Cierra el motor sin puerta de S77 — el '
  'despegue de `dar_de_baja_empleado` produce citas sin persona y esta es la '
  'única vía de producto para volver a ruteárselas a alguien. NO reasigna.';


-- L-140 — sin esto, ambas nacen con EXECUTE para `anon`.
REVOKE EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.asignar_cita_a_persona(uuid, uuid)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.asignar_cita_a_persona(uuid, uuid)  TO authenticated;


-- ── CINTURÓN ──────────────────────────────────────────────────────────────
-- Mide SIN EFECTOS LATERALES (ley del instrumento, S88) y sobre el objeto,
-- jamás sobre la prosa de esta migración.
DO $belt$
DECLARE
  v_anon int;
BEGIN
  IF to_regprocedure('public.asignar_cita_a_persona(uuid, uuid)') IS NULL
     OR to_regprocedure('public.empleado_puede_asignar_citas(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: alguna de las dos funciones no quedó creada';
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('asignar_cita_a_persona', 'empleado_puede_asignar_citas')
    AND array_to_string(COALESCE(p.proacl, '{}'), ',') LIKE '%anon=%';

  IF v_anon <> 0 THEN
    RAISE EXCEPTION 'CINTURON (L-140): % función(es) con anon en proacl', v_anon;
  END IF;

  RAISE NOTICE 'CINTURON VERDE: 2 funciones creadas, 0 con anon en proacl.';
END
$belt$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────
-- S86-A · EL MOTOR DE **LA PIZARRA**
-- Contra la lámina FIRMADA por el founder el 4-ago-2026
-- (`docs/laminas/2026-08-04-s86-lamina-mostrador-y-pizarra.html`).
--
-- 76(g): **NO RIGE.** DDL puro, sin backfill, sin anclas sobre datos
-- vivos. (`tomar_cita` escribe, pero por acción del usuario en runtime:
-- la migración misma no toca una fila.)
-- L-140: REVOKE + GRANT explícitos al pie, con su verificación.
-- REVERSA escrita ANTES: `docs/relevamientos/2026-08-04-s86a-REVERSA-pizarra.sql`
--
-- ─── LAS TRES DECISIONES DE ESTE ARCHIVO ─────────────────────────────
--
-- ① EL PREDICADO DE ESPECIALIDAD **NO SE INVENTA**: es el que S78 ya
--    extrajo en `obtener_personas_que_atienden` —
--        pe.rol = 'dueño'  OR  EXISTS (prestador_empleado_servicios …)
--    — el titular atiende todo, el resto por CHIP. Copiarlo con una
--    variante sería fabricar una segunda verdad sobre quién puede
--    atender qué, y las dos compilarían igual (D-645).
--    ⚠️ Nota medida y declarada: el chip vive en
--    `prestador_empleado_servicios.servicio_id` → `prestador_servicios.id`,
--    mientras la cita guarda `tipo_servicio` (el CÓDIGO). El puente es
--    `ps.prestador_id = c.prestador_id AND ps.tipo_servicio = c.tipo_servicio`.
--    No es un join de conveniencia: es el mismo que usa el motor.
--
-- ② «TOMAR» RELLENA UN NULL — Y REASIGNAR ES **INEXPRESABLE**, NO
--    PROHIBIDO. El `WHERE empleado_id IS NULL` no es una validación que
--    se pueda olvidar: es la forma del UPDATE. Por esta puerta **no
--    existe** el SQL que pise a un tratante ya asignado, ni siquiera si
--    alguien lo quisiera. Es la diferencia entre un muro y un cartel
--    (L-198: un comentario que explica un porqué vence con el porqué;
--    una cláusula WHERE, no).
--    Y el conteo se lee de `GET DIAGNOSTICS`: **cero filas ⇒ rebote
--    TIPADO `ya_tomada`**, jamás un `RETURN` silencioso. Un escritor que
--    no escribió y no lo dice es exactamente la familia de S85.
--
-- ③ LA REASIGNACIÓN QUEDA DIFERIDA CON SU ARTEFACTO NOMBRADO (L-171):
--    pisar un tratante ya asignado exige avisar a la familia que eligió
--    persona (S78 §3). Ese aviso es `notificar_reasignacion_cita`, que
--    **medido hoy NO EXISTE** (`to_regprocedure` → NULL, 0 funciones con
--    'reasign' en el nombre). El día que exista, la puerta de reasignar
--    se diseña; hasta entonces no se escribe media.
-- ─────────────────────────────────────────────────────────────────────

-- ① EL LECTOR ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_pizarra(p_prestador_id uuid)
RETURNS TABLE(
  cita_id        uuid,
  fecha          date,
  hora           time,
  tipo_servicio  text,
  servicio_voz   text,
  mascota_id     uuid,
  mascota_nombre text,
  mascota_especie text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid      uuid := auth.uid();
  v_empleado uuid;
  v_es_dueno boolean;
  v_hoy      date := (now() AT TIME ZONE 'America/Guayaquil')::date;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- La pizarra es del EMPLEADO: se resuelve su fila, no su membresía
  -- genérica. Sin fila activa no hay especialidad que filtrar.
  SELECT pe.id, (pe.rol = 'dueño')
  INTO v_empleado, v_es_dueno
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id
    AND pe.user_id = v_uid
    AND pe.activo
  LIMIT 1;

  IF v_empleado IS NULL THEN
    RAISE EXCEPTION 'no_sos_del_equipo' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.fecha, c.hora, c.tipo_servicio, ts.nombre,
    m.id, m.nombre, m.especie
  FROM evento_cita_servicio c
  LEFT JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio
  LEFT JOIN mascotas m        ON m.id      = c.mascota_id
  WHERE c.prestador_id = p_prestador_id
    AND c.empleado_id IS NULL                    -- SIN TRATANTE: es la pizarra
    AND c.estado = ANY(public._estados_cita_contables())
    AND c.fecha >= v_hoy                         -- lo que ya pasó no se toma
    -- ① el predicado de S78, no uno nuevo
    AND (
      v_es_dueno
      OR EXISTS (
        SELECT 1
        FROM prestador_servicios ps
        JOIN prestador_empleado_servicios pes
          ON pes.servicio_id = ps.id AND pes.empleado_id = v_empleado
        WHERE ps.prestador_id = c.prestador_id
          AND ps.tipo_servicio = c.tipo_servicio
      )
    )
  ORDER BY c.fecha ASC, c.hora ASC NULLS LAST, c.id ASC;
END;
$function$;


-- ② EL ESCRITOR ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tomar_cita(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_prestador uuid;
  v_servicio  text;
  v_empleado  uuid;
  v_es_dueno  boolean;
  v_puede     boolean;
  v_filas     integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT c.prestador_id, c.tipo_servicio
  INTO v_prestador, v_servicio
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  SELECT pe.id, (pe.rol = 'dueño')
  INTO v_empleado, v_es_dueno
  FROM prestador_empleados pe
  WHERE pe.prestador_id = v_prestador AND pe.user_id = v_uid AND pe.activo
  LIMIT 1;

  IF v_empleado IS NULL THEN
    RAISE EXCEPTION 'no_sos_del_equipo' USING ERRCODE = '42501';
  END IF;

  -- ① mismo predicado que el lector: lo que no se lista, no se toma.
  v_puede := v_es_dueno OR EXISTS (
    SELECT 1
    FROM prestador_servicios ps
    JOIN prestador_empleado_servicios pes
      ON pes.servicio_id = ps.id AND pes.empleado_id = v_empleado
    WHERE ps.prestador_id = v_prestador AND ps.tipo_servicio = v_servicio
  );

  IF NOT v_puede THEN
    RAISE EXCEPTION 'no_es_tu_especialidad' USING ERRCODE = '42501';
  END IF;

  -- ② EL ACTO. `empleado_id IS NULL` en el WHERE es lo que vuelve
  -- IMPOSIBLE reasignar por esta puerta — no hay SQL acá que pueda pisar
  -- a un tratante ya puesto, ni por error ni a propósito.
  UPDATE evento_cita_servicio c
  SET empleado_id = v_empleado,
      metadata    = COALESCE(c.metadata, '{}'::jsonb)
                    || jsonb_build_object('tomada_en', now(), 'tomada_por', v_uid),
      updated_at  = now()
  WHERE c.id = p_cita_id
    AND c.empleado_id IS NULL;

  GET DIAGNOSTICS v_filas = ROW_COUNT;

  -- Cero filas NO es "no pasó nada": es que alguien llegó primero. El
  -- rebote es TIPADO y la superficie lo dice — «nunca te la saca en
  -- silencio» (decisión ③ de la lámina).
  IF v_filas = 0 THEN
    RAISE EXCEPTION 'ya_tomada' USING ERRCODE = '23505';
  END IF;

  RETURN jsonb_build_object('ok', true, 'citaId', p_cita_id, 'empleadoId', v_empleado);
END;
$function$;


-- ③ L-140 ────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.obtener_pizarra(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tomar_cita(uuid)      FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_pizarra(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.tomar_cita(uuid)      TO authenticated;

DO $verificacion$
DECLARE
  v_nombre text;
  v_acl    text;
BEGIN
  FOREACH v_nombre IN ARRAY ARRAY['obtener_pizarra','tomar_cita'] LOOP
    SELECT array_to_string(proacl, ' ') INTO v_acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_nombre;
    IF v_acl LIKE '%anon=X%' THEN
      RAISE EXCEPTION 'L-140: anon conserva EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
    IF v_acl NOT LIKE '%authenticated=X%' THEN
      RAISE EXCEPTION 'authenticated NO tiene EXECUTE en % — proacl=%', v_nombre, v_acl;
    END IF;
  END LOOP;
  RAISE NOTICE 'L-140 OK en obtener_pizarra y tomar_cita';
END;
$verificacion$;

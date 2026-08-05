-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ⑤bis — LOS RPC: de titularidad a gestión
--
-- ⚠️ ESTOS CUATRO NO GATEAN UN ID: TRES LO RESUELVEN. Decían «el prestador
-- cuyo titular soy» — para un administrador eso daba NULL y el RPC moría
-- después, con un error que hablaba de otra cosa. Es una forma distinta del
-- mismo defecto, y por eso necesita una pieza propia y no el helper a secas.
--
-- NACE `prestador_que_gestiono()`, y su decisión de diseño es la ambigüedad:
-- **si alguien gestiona DOS negocios, NO ADIVINA — rebota hablado.** Medido
-- hoy: 0 de 8 gestores tienen más de uno, así que nadie lo va a ver; se
-- escribe igual porque el día que ocurra, elegir en silencio sería escribir en
-- el negocio equivocado. *Un resolvedor que adivina es peor que uno que falla.*
--
-- `dar_de_baja_empleado` sí gateaba un id explícito: pasa al helper directo.
-- El ANTI-LOCKOUT (§10, el titular no se da de baja a sí mismo) queda INTACTO.
--
-- VEDA 76(g): NO RIGE.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.prestador_que_gestiono()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE v_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT x.id) INTO v_ids FROM (
    SELECT p.id FROM public.prestadores p WHERE p.user_id = auth.uid()
    UNION
    SELECT pe.prestador_id FROM public.prestador_empleados pe
      JOIN public.empleado_roles er ON er.empleado_id = pe.id AND er.rol = 'administrador'
     WHERE pe.user_id = auth.uid() AND pe.activo
  ) x;

  IF v_ids IS NULL THEN RETURN NULL; END IF;          -- el caller ya lo maneja
  IF array_length(v_ids,1) > 1 THEN
    RAISE EXCEPTION 'gestiona_varios_negocios' USING ERRCODE = '22023',
      HINT = 'Esta persona gestiona mas de un negocio: el RPC tiene que recibir '
          || 'el prestador_id explicito en vez de resolverlo. No se adivina.';
  END IF;
  RETURN v_ids[1];
END $$;

REVOKE EXECUTE ON FUNCTION public.prestador_que_gestiono() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.prestador_que_gestiono() TO authenticated;

CREATE OR REPLACE FUNCTION public.actualizar_nombre_comercial(p_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_nombre    text;
  v_prestador uuid;
  v_cuenta    uuid;
  v_owner     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  v_nombre := btrim(coalesce(p_nombre, ''));
  IF v_nombre = '' THEN
    -- las dos columnas son NOT NULL: un nombre vacío no es "limpiar el campo",
    -- es un estado que la tabla no admite. Rebota hablado en vez de romper.
    RAISE EXCEPTION 'nombre_vacio';
  END IF;

  -- D-660: el sujeto se resuelve por GESTIÓN, no por titularidad.
  v_prestador := public.prestador_que_gestiono();
  SELECT p.cuenta_comercial_id INTO v_cuenta FROM prestadores p WHERE p.id = v_prestador;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'no_es_titular';
  END IF;
  IF v_cuenta IS NULL THEN
    -- estado real y no teórico: la cuenta puede no existir todavía en el alta.
    RAISE EXCEPTION 'sin_cuenta_comercial';
  END IF;

  SELECT cc.owner_profile_id INTO v_owner
  FROM cuentas_comerciales cc WHERE cc.id = v_cuenta;

  IF v_owner IS DISTINCT FROM v_uid THEN
    -- la segunda pata del gate: sin esto, un titular podría escribir la fila
    -- fiscal de una cuenta ajena por esta puerta (el DEFINER salta la RLS).
    RAISE EXCEPTION 'no_es_owner_de_la_cuenta';
  END IF;

  -- LAS DOS, en la MISMA transacción. Es la pieza entera: si la segunda
  -- falla, la primera se deshace sola y el nombre queda como estaba.
  UPDATE prestadores          SET nombre_comercial = v_nombre WHERE id = v_prestador;
  UPDATE cuentas_comerciales  SET nombre_comercial = v_nombre WHERE id = v_cuenta;

  RETURN jsonb_build_object('ok', true, 'nombre', v_nombre);
END;
$function$

;

CREATE OR REPLACE FUNCTION public.elegir_modo_horarios(p_modo text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prestador_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF p_modo IS NULL OR p_modo NOT IN ('universal', 'por_servicio') THEN
    RAISE EXCEPTION 'modo_invalido' USING ERRCODE = '22023';
  END IF;

  -- D-660: por GESTIÓN.
  v_prestador_id := public.prestador_que_gestiono();

  IF v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- el trigger _modo_horarios_sin_franjas_ajenas es la red: si quedan
  -- franjas del modo viejo, este UPDATE rebota
  -- 'franjas_del_otro_modo_existen' y el error viaja tipado al wrapper.
  UPDATE public.prestadores
  SET modo_horarios = p_modo
  WHERE id = v_prestador_id;

  RETURN p_modo;
END;
$function$

;

CREATE OR REPLACE FUNCTION public.convertir_horarios_a_por_servicio()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prestador uuid;
  v_franjas   int;
  v_servicios int;
  v_replicas  int;
BEGIN
  -- gate de identidad (espejo de elegir_modo_horarios)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- D-660: por GESTIÓN.
  v_prestador := public.prestador_que_gestiono();
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- sin generales no hay qué convertir. NOTA: esto CUBRE la idempotencia
  -- — en modo por_servicio las generales no pueden existir (guard D-386),
  -- así que la segunda llamada rebota acá, tipada.
  SELECT count(*) INTO v_franjas
  FROM public.prestador_horarios h
  WHERE h.prestador_id = v_prestador AND h.servicio_id IS NULL;
  IF v_franjas = 0 THEN
    RAISE EXCEPTION 'sin_franjas_generales' USING ERRCODE = '22023';
  END IF;

  -- oferta cobrable activa = activa Y reservable (los procedimientos y
  -- tipos no reservables no tienen agenda que servir — S68)
  SELECT count(*) INTO v_servicios
  FROM public.prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.activo AND ps.reservable;
  IF v_servicios = 0 THEN
    RAISE EXCEPTION 'sin_servicios_activos' USING ERRCODE = '22023';
  END IF;

  -- (1) snapshot de las generales — de TODAS las personas del negocio
  -- (V0: la franja es de alguien; la réplica conserva a su dueño)
  DROP TABLE IF EXISTS pg_temp._conv_franjas;
  CREATE TEMP TABLE _conv_franjas ON COMMIT DROP AS
  SELECT h.empleado_id, h.dia_semana, h.hora_inicio, h.hora_fin,
         h.duracion_slot_minutos, h.max_citas_por_slot, h.activo
  FROM public.prestador_horarios h
  WHERE h.prestador_id = v_prestador AND h.servicio_id IS NULL;

  -- (2) mueren las generales (deja el terreno limpio para el trigger-red
  -- del cambio de modo — _modo_horarios_sin_franjas_ajenas, INTACTO)
  DELETE FROM public.prestador_horarios
  WHERE prestador_id = v_prestador AND servicio_id IS NULL;

  -- (3) la elección de modo por su ÚNICO escritor (D-386, intacto)
  PERFORM public.elegir_modo_horarios('por_servicio');

  -- (4) réplica día × oferta cobrable activa (el trigger
  -- _horarios_respetan_modo, INTACTO, ve modo por_servicio + específicas)
  INSERT INTO public.prestador_horarios
    (prestador_id, empleado_id, servicio_id, dia_semana, hora_inicio,
     hora_fin, duracion_slot_minutos, max_citas_por_slot, activo)
  SELECT v_prestador, f.empleado_id, ps.id, f.dia_semana, f.hora_inicio,
         f.hora_fin, f.duracion_slot_minutos, f.max_citas_por_slot, f.activo
  FROM _conv_franjas f
  CROSS JOIN public.prestador_servicios ps
  WHERE ps.prestador_id = v_prestador AND ps.activo AND ps.reservable;
  GET DIAGNOSTICS v_replicas = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'franjas_convertidas', v_replicas,
    'servicios', v_servicios
  );
END;
$function$

;

CREATE OR REPLACE FUNCTION public.dar_de_baja_empleado(p_empleado_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_prestador  uuid;
  v_user_emp   uuid;
  v_despegadas int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT pe.prestador_id, pe.user_id INTO v_prestador, v_user_emp
  FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Solo el titular (o admin) da de baja. Espeja la policy
  -- `empleados_dueño_actualiza` que hoy usa `desvincularEmpleado`.
  IF NOT (
    -- D-660: la puerta única (incluye is_admin y el administrador del negocio).
    public.user_gestiona_prestador(v_prestador)
  ) THEN
    RAISE EXCEPTION 'no_es_titular' USING ERRCODE = '42501';
  END IF;

  -- ANTI-LOCKOUT (§10): el titular no se da de baja a sí mismo.
  IF EXISTS (SELECT 1 FROM prestadores p
             WHERE p.id = v_prestador AND p.user_id = v_user_emp) THEN
    RAISE EXCEPTION 'no_se_puede_dar_de_baja_al_titular' USING ERRCODE = '22023';
  END IF;

  -- (a) EL DESPEGUE — antes de la baja, para que el predicado todavía
  --     encuentre la fila del vínculo si algún día mira `activo`.
  WITH despegadas AS (
    UPDATE evento_cita_servicio c
    SET    empleado_id = NULL,
           -- REDUNDANTE Y DECLARADO: `trg_evento_cita_servicio_updated_at`
           -- (BEFORE UPDATE, sin OF) ya lo escribe. Se deja explícito para
           -- que nadie lea el despegue como una escritura que no toca la
           -- marca de tiempo. Verificado 4.2: de los 5 triggers de la tabla,
           -- es el ÚNICO que dispara con este UPDATE — los otros tres son
           -- `UPDATE OF estado` y el quinto es AFTER INSERT. Cero append-only
           -- que pueda rebotar (la lección de `prestador_atencion_log`).
           updated_at  = now()
    WHERE  c.empleado_id = p_empleado_id
      AND  public._cita_despegable(c.id, p_empleado_id)
    RETURNING 1
  )
  SELECT count(*) INTO v_despegadas FROM despegadas;

  -- (b) LA BAJA.
  UPDATE prestador_empleados
  SET    activo = false
  WHERE  id = p_empleado_id;

  RETURN jsonb_build_object(
    'ok', true,
    'empleado_id', p_empleado_id,
    'citas_despegadas', v_despegadas
  );
END;
$function$

;
COMMIT;

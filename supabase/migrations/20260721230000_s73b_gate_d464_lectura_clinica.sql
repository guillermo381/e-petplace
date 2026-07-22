-- ─────────────────────────────────────────────────────────────────────
-- S73-B · EL GATE D-464 — la lectura CLÍNICA gana rol (fase 3 de la
-- secuencia, OK founder). Diseño revisado por mesa; cero desviación.
--
-- CERO PERSONAS REALES AFECTADAS: post-desactivación (fase 2) no queda
-- NINGÚN empleado activo sin rol adjudicado — el gate cambia lo que un
-- rol futuro podrá leer, no lo que alguien lee hoy.
--
-- Nace `user_acceso_clinico_a_mascota(uuid)`: la pata FAMILIA (y admin,
-- y caducidad) BYTE-IDÉNTICA a `user_tiene_acceso_a_mascota` — el body
-- se construyó por CITA LITERAL de pg_get_functiondef y la verificación
-- imperativa PRUEBA que, quitada la única línea del gate, ambos cuerpos
-- son idénticos módulo whitespace. La pata prestador exige
-- empleado_tiene_rol(negocio, ['dueño','profesional']).
--
-- Las 14 policies SELECT clínicas de la clasificación S73-B cambian su
-- qual al helper nuevo. `eventos_mascota` ENTERA — razón de mesa: A3 §4
-- nunca le prometió el timeline a recepción; su destilado es identidad
-- + etapa + alerta, el stream no está en su letra.
-- `mascota_perfil_vigente` GATEADO con VENTANA DECLARADA S73→S74
-- (D-489): incluye `tiene_emergencia_activa` — la alerta de seguridad
-- que A3 §4 le deja a recepción no tiene lector angosto hasta S74 (o el
-- veto founder, que adelanta el lector patrón D-455).
-- Los DOS helpers de caso (`_user_clinica_{tratante,consultor}_del_caso`)
-- ganan el gate en su pata empleado — por JOIN a empleado_roles sobre el
-- MISMO pe (no vía empleado_tiene_rol: estos helpers toman p_user_id
-- como PARÁMETRO y empleado_tiene_rol lee auth.uid() — llamarla mentiría
-- si p_user_id difiere; declarado, no desviación: la mesa fijó el QUÉ,
-- el join es el CÓMO correcto para firmas parametrizadas).
--
-- NO SE TOCA: la pata FAMILIA (byte-idéntica) · la agenda
-- (evento_cita_servicio) · la identidad (mascotas, microchip, cambios de
-- nombre) · los oficios no clínicos (grooming/paseo/adiestramiento) ·
-- temperamento y emergencia_solicitada (seguridad/manejo, A3 §4) ·
-- peso (dato de cuidado general) · el helper viejo (sus consumidores
-- no clínicos siguen tal cual).
--
-- 76(g) — DECLARACIÓN DE VEDA: DDL + swap de quals; CERO backfill, CERO
-- cómputo de anclas sobre datos vivos. La veda NO RIGE.
-- ─────────────────────────────────────────────────────────────────────

-- 1 ── el helper clínico (cita literal del viejo + UNA línea de gate)
CREATE FUNCTION public.user_acceso_clinico_a_mascota(p_mascota_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_caducidad_meses integer;
BEGIN
  -- Sin sesion -> no
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admin -> si
  IF is_admin() THEN
    RETURN true;
  END IF;

  -- Dueño de la mascota -> si
  IF EXISTS (
    SELECT 1 FROM mascotas
    WHERE id = p_mascota_id AND user_id = v_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Plazo de caducidad parametrizable (default defensivo 6 si falta config)
  SELECT COALESCE(
    (SELECT valor::integer FROM app_config
      WHERE clave = 'acceso_prestador_caducidad_meses'),
    6
  ) INTO v_caducidad_meses;

  -- Dueño o empleado activo de algun prestador cuya cuenta_comercial tiene
  -- acceso activo a la mascota.
  IF EXISTS (
    SELECT 1
    FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id
      AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
      AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores
        WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id
        FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true
          AND empleado_tiene_rol(pe.prestador_id, ARRAY['dueño','profesional'])
      )
      -- Caducidad lazy: las filas otorgadas por cita automatica solo siguen
      -- vigentes si hay una cita con esta mascota y esta cuenta dentro de la
      -- ventana de N meses. Las filas de otro metodo pasan sin esta condicion.
      AND (
        map.metodo_otorgamiento <> 'cita_automatica'
        OR EXISTS (
          SELECT 1
          FROM evento_cita_servicio ecs
          JOIN prestadores p2 ON p2.id = ecs.prestador_id
          WHERE ecs.mascota_id = map.mascota_id
            AND p2.cuenta_comercial_id = map.cuenta_comercial_id
            AND ecs.fecha >= (now() - make_interval(months => v_caducidad_meses))::date
        )
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

COMMENT ON FUNCTION public.user_acceso_clinico_a_mascota(uuid) IS
  'D-464 (S73): acceso de LECTURA CLÍNICA — familia byte-idéntica a '
  'user_tiene_acceso_a_mascota; la pata prestador exige rol dueño/profesional '
  '(empleado_tiene_rol). La recepción NO lee expediente clínico (A3 ley madre).';

-- L-140: cierre explícito (el helper VIEJO trae anon=X legacy — hallazgo
-- reportado aparte, NO se toca acá: fuera de lo revisado).
REVOKE EXECUTE ON FUNCTION public.user_acceso_clinico_a_mascota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_acceso_clinico_a_mascota(uuid) TO authenticated;

-- 2 ── las 14 policies clínicas cambian su qual
ALTER POLICY hc_select ON public.evento_historia_clinica_registrada
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY medicacion_select ON public.evento_medicacion_prescrita
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY medicacion_adm_select ON public.evento_medicacion_administrada
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY examen_select ON public.evento_examen_diagnostico
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY alergia_select ON public.evento_alergia_diagnosticada
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY condicion_select ON public.evento_condicion_cronica_diagnosticada
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY intervencion_select ON public.evento_intervencion_permanente
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY vacuna_select ON public.evento_vacuna_aplicada
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY certificado_select ON public.evento_certificado_emitido
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY perfil_vigente_select ON public.mascota_perfil_vigente
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY eventos_mascota_select ON public.eventos_mascota
  USING (user_acceso_clinico_a_mascota(mascota_id));
ALTER POLICY caso_abierto_select ON public.evento_caso_clinico_abierto
  USING (user_acceso_clinico_a_mascota(mascota_id) OR is_admin());
ALTER POLICY caso_cerrado_select ON public.evento_caso_clinico_cerrado
  USING (user_acceso_clinico_a_mascota(mascota_id) OR is_admin());
ALTER POLICY caso_transferido_select ON public.evento_caso_clinico_transferido
  USING (user_acceso_clinico_a_mascota(mascota_id) OR is_admin());

-- 3 ── los dos helpers de caso ganan el gate en su pata empleado
CREATE OR REPLACE FUNCTION public._user_clinica_tratante_del_caso(p_caso_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico cc
    JOIN cuentas_comerciales cco ON cco.id = cc.cuenta_comercial_tratante_id
    WHERE cc.id = p_caso_id
      AND (
        -- Caso A: user es owner de la cuenta tratante
        cco.owner_profile_id = p_user_id
        -- Caso B: user es empleado activo CON ROL CLINICO (D-464 S73)
        OR EXISTS (
          SELECT 1 FROM prestador_empleados pe
          JOIN prestadores p ON p.id = pe.prestador_id
          WHERE p.cuenta_comercial_id = cc.cuenta_comercial_tratante_id
            AND pe.user_id = p_user_id
            AND pe.activo = true
            AND EXISTS (
              SELECT 1 FROM empleado_roles er
              WHERE er.empleado_id = pe.id
                AND er.rol IN ('dueño', 'profesional')
            )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public._user_clinica_consultor_del_caso(p_caso_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM caso_clinico_consultor ccc
    JOIN cuentas_comerciales cco ON cco.id = ccc.cuenta_comercial_consultor_id
    WHERE ccc.caso_clinico_id = p_caso_id
      AND ccc.hasta IS NULL
      AND (
        cco.owner_profile_id = p_user_id
        OR EXISTS (
          SELECT 1 FROM prestador_empleados pe
          JOIN prestadores p ON p.id = pe.prestador_id
          WHERE p.cuenta_comercial_id = ccc.cuenta_comercial_consultor_id
            AND pe.user_id = p_user_id
            AND pe.activo = true
            AND EXISTS (
              SELECT 1 FROM empleado_roles er
              WHERE er.empleado_id = pe.id
                AND er.rol IN ('dueño', 'profesional')
            )
        )
      )
  );
$function$;

-- 4 ── verificación imperativa EN LA MISMA TRANSACCIÓN
DO $$
DECLARE
  v_old  text;
  v_new  text;
  v_n    integer;
  v_acl  text;
BEGIN
  -- (a) FAMILIA BYTE-IDÉNTICA: quitada la ÚNICA línea del gate, los dos
  -- cuerpos son idénticos módulo whitespace.
  SELECT prosrc INTO v_old FROM pg_proc WHERE proname = 'user_tiene_acceso_a_mascota';
  SELECT prosrc INTO v_new FROM pg_proc WHERE proname = 'user_acceso_clinico_a_mascota';
  IF regexp_replace(v_old, '\s+', '', 'g') IS DISTINCT FROM
     regexp_replace(replace(v_new,
       'AND empleado_tiene_rol(pe.prestador_id, ARRAY[''dueño'',''profesional''])', ''),
       '\s+', '', 'g') THEN
    RAISE EXCEPTION 'D-464: la pata familia NO es byte-idéntica al helper viejo';
  END IF;

  -- (b) las 14 policies citan el helper nuevo
  SELECT count(*) INTO v_n FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'SELECT'
    AND qual LIKE '%user_acceso_clinico_a_mascota%';
  IF v_n <> 14 THEN
    RAISE EXCEPTION 'D-464: se esperaban 14 policies con el helper clínico, hay %', v_n;
  END IF;

  -- (c) lo NO tocado sigue con el helper viejo (spot: agenda + atención +
  -- un oficio no clínico + temperamento)
  IF (SELECT qual FROM pg_policies WHERE tablename='evento_cita_servicio' AND policyname='cita_select_por_acceso') NOT LIKE '%user_tiene_acceso_a_mascota%'
     OR (SELECT qual FROM pg_policies WHERE tablename='evento_atencion' AND policyname='atencion_select') NOT LIKE '%user_tiene_acceso_a_mascota%'
     OR (SELECT qual FROM pg_policies WHERE tablename='evento_grooming_notas' AND policyname='grooming_notas_select') NOT LIKE '%user_tiene_acceso_a_mascota%'
     OR (SELECT qual FROM pg_policies WHERE tablename='evento_temperamento_observacion' AND policyname='temperamento_select') NOT LIKE '%user_tiene_acceso_a_mascota%' THEN
    RAISE EXCEPTION 'D-464: una policy NO clínica fue tocada por error';
  END IF;

  -- (d) L-140: el helper nuevo sin anon/PUBLIC
  SELECT COALESCE(proacl::text,'') INTO v_acl FROM pg_proc
  WHERE oid = 'public.user_acceso_clinico_a_mascota(uuid)'::regprocedure;
  IF v_acl LIKE '%anon=%' OR v_acl LIKE '%{=X%' THEN
    RAISE EXCEPTION 'L-140: user_acceso_clinico_a_mascota expuesta: %', v_acl;
  END IF;

  -- (e) los dos helpers de caso portan el gate
  IF (SELECT prosrc FROM pg_proc WHERE proname='_user_clinica_tratante_del_caso') NOT LIKE '%empleado_roles%'
     OR (SELECT prosrc FROM pg_proc WHERE proname='_user_clinica_consultor_del_caso') NOT LIKE '%empleado_roles%' THEN
    RAISE EXCEPTION 'D-464: un helper de caso quedó sin gate';
  END IF;
END $$;

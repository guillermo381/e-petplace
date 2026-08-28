-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — LA OFERTA DE GUARDERÍA: PRECIO Y VISIBILIDAD
--
-- Qué destraba, y por eso va antes que el cobro: **hoy el prestador configura
-- su cupo y sus dos ventanas y su guardería NO APARECE.** Sin oferta no hay
-- nada que reservar — es el último eslabón del primer recorrido de C.
--
-- 🔴 LA OFERTA NO ES UNA TABLA NUEVA: vive en `prestador_servicios` con
-- `tipo_servicio = 'guarderia_dia'`, que **ya está en su CHECK** (medido). Sus
-- tres precios ya tienen columna y CHECK propios:
--   `precio`              → el día suelto
--   `precio_paquete`      → el día cuando se compra por paquete
--   `precio_mensual_plan` → el mes
-- *Crear una tabla de ofertas de guardería habría duplicado el catálogo del
-- que cuelgan las citas de los otros cinco oficios.*
--
-- 🔴 Y LA DECISIÓN QUE VUELVE HONESTA LA PALABRA «VISIBLE»: publicar exige
-- **franjas configuradas Y capacidad configurada**. Una guardería en la
-- vitrina sin ventana de recogida es una guardería que **nadie puede usar** —
-- la familia elegiría un día y no habría a qué hora pasar a buscar al animal.
-- *Fail-closed, con rebote hablado: `franjas_no_configuradas` /
-- `sin_espacios_configurados` dicen QUÉ falta, no «revisá los datos».*
--
-- ── LA DURACIÓN, derivada y no tecleada ───────────────────────────────────
-- `prestador_servicios.duracion_minutos` es obligatoria para el gate de
-- cobrable de la casa. Para guardería **es LA JORNADA** y se DERIVA: del
-- inicio de la ventana de recogida al fin de la de devolución. *Pedírsela al
-- prestador sería pedirle un número que sus propias franjas ya dicen — y dos
-- fuentes para el mismo dato se separan un día.*
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828190000-oferta-guarderia.sql
-- 76(g): 🔴 RIGE — el cinturón crea una oferta real y la deshace en
--        subtransacción (L-406). Residuo verificado en 0.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Una guardería por prestador: el cupo es DEL LUGAR, así que dos ofertas
-- serían dos precios para el mismo pozo de espacios.
CREATE UNIQUE INDEX uq_oferta_guarderia_por_prestador
  ON public.prestador_servicios (prestador_id)
  WHERE tipo_servicio = 'guarderia_dia';

CREATE FUNCTION public.definir_oferta_guarderia(
  p_prestador_id       uuid,
  p_precio_dia         numeric,
  p_precio_paquete     numeric DEFAULT NULL,
  p_precio_mensual     numeric DEFAULT NULL,
  p_activo             boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_id        uuid;
  v_recoge    time;
  v_devuelve  time;
  v_jornada   int;
  v_capacidad int;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_precio_dia IS NULL OR p_precio_dia <= 0 THEN
    RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_precio_paquete IS NOT NULL AND p_precio_paquete <= 0 THEN
    RAISE EXCEPTION 'precio_paquete_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_precio_mensual IS NOT NULL AND p_precio_mensual <= 0 THEN
    RAISE EXCEPTION 'precio_mensual_invalido' USING ERRCODE = '22023';
  END IF;

  /* 🔴 LAS DOS PRECONDICIONES DE «VISIBLE», y las dos hablan. */
  SELECT min(f.desde) FILTER (WHERE f.tipo = 'recogida'),
         max(f.hasta)  FILTER (WHERE f.tipo = 'devolucion')
    INTO v_recoge, v_devuelve
    FROM guarderia_franjas f
   WHERE f.prestador_id = p_prestador_id AND f.activo;
  IF v_recoge IS NULL OR v_devuelve IS NULL THEN
    RAISE EXCEPTION 'franjas_no_configuradas' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(sum(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e WHERE e.prestador_id = p_prestador_id AND e.activo;
  IF v_capacidad = 0 THEN
    RAISE EXCEPTION 'sin_espacios_configurados' USING ERRCODE = '22023';
  END IF;

  -- LA JORNADA, derivada de las franjas del propio prestador.
  v_jornada := EXTRACT(epoch FROM (v_devuelve - v_recoge))::int / 60;
  IF v_jornada <= 0 THEN
    RAISE EXCEPTION 'franjas_se_cruzan' USING ERRCODE = '22023';
  END IF;

  /* 🔴 `especies_compatibles` SE LLENA, y hay que decir por qué: la columna es
     NOT NULL con DEFAULT `'[]'::jsonb`, y todos los lectores de la casa la
     leen como `(IS NULL OR ? especie)`. **Con NOT NULL, la rama `IS NULL`
     es inalcanzable** ⇒ una oferta que nunca la tocó queda con `[]` y **no
     matchea NINGUNA especie: es invisible en su propia vitrina.**
     Medido el 28-ago: **11 ofertas activas y reservables de OTROS oficios**
     (paseo, grooming, adiestramiento, consulta_general, emergencia) están hoy
     en ese estado — ficha `D-959`, no se curan acá.
     La oferta de guardería nace con **el techo de su tipo**, derivado y no
     tecleado: el prestador ACOTA sobre eso si quiere. */
  INSERT INTO prestador_servicios (
    prestador_id, tipo_servicio, precio, precio_paquete, precio_mensual_plan,
    duracion_minutos, activo, reservable, atiende_local, atiende_domicilio,
    especies_compatibles
  ) VALUES (
    p_prestador_id, 'guarderia_dia', p_precio_dia, p_precio_paquete, p_precio_mensual,
    v_jornada, p_activo, true,
    /* Firma ⑩ del plan: la guardería es PRESENCIAL, en el local. El transporte
       puerta a puerta es CONTENIDO del servicio, no una modalidad — por eso
       `atiende_domicilio` va en false y no nace ningún valor nuevo. */
    true, false,
    (SELECT COALESCE(ts.especies_elegibles, '["perro","gato"]'::jsonb)
       FROM tipos_servicio ts WHERE ts.codigo = 'guarderia_dia')
  )
  ON CONFLICT (prestador_id) WHERE tipo_servicio = 'guarderia_dia'
    DO UPDATE SET precio              = EXCLUDED.precio,
                  precio_paquete      = EXCLUDED.precio_paquete,
                  precio_mensual_plan = EXCLUDED.precio_mensual_plan,
                  duracion_minutos    = EXCLUDED.duracion_minutos,
                  activo              = EXCLUDED.activo
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'prestador_servicio_id', v_id,
                            'jornada_minutos', v_jornada, 'capacidad_dia', v_capacidad);
END $$;

-- ── EL GATE DE COBRABLE (regla founder S54 / 7.13) ─────────────────────────
CREATE FUNCTION public._guarderia_ofertas_cobrables(p_mascota_id uuid)
RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text,
              precio numeric, precio_paquete numeric, precio_mensual numeric,
              jornada_minutos int, direccion text, ciudad text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT pr.id, ps.id, pr.nombre_comercial,
         ps.precio, ps.precio_paquete, ps.precio_mensual_plan,
         ps.duracion_minutos, pr.direccion, pr.ciudad
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.activo AND ts.reservable
   WHERE m.id = p_mascota_id
     AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable
     AND ps.precio IS NOT NULL AND ps.precio > 0
     AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
     -- el prestador ACOTA; NULL = rige el techo del tipo (patrón §5 grooming)
     AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie);
$$;

-- ── EL LECTOR DE LA FAMILIA ────────────────────────────────────────────────
CREATE FUNCTION public.obtener_guarderias_disponibles(
  p_fecha      date,
  p_mascota_id uuid,
  p_lat        double precision DEFAULT NULL,
  p_lon        double precision DEFAULT NULL
) RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text,
                precio numeric, precio_paquete numeric, precio_mensual numeric,
                jornada_minutos int, direccion text, ciudad text,
                disponible int, sobrevendido boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  /* La especie manda desde la DB, jamás desde un `if` (letra §1 + su nota). */
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  /* Un día que ya pasó no se oferta. La guardería no tiene hora de inicio:
     la unidad es el DÍA, así que el corte es el día local. */
  IF p_fecha < public.hoy_local() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
         o.precio, o.precio_paquete, o.precio_mensual,
         o.jornada_minutos, o.direccion, o.ciudad,
         (c->>'disponible')::int, (c->>'sobrevendido')::boolean
    FROM _guarderia_ofertas_cobrables(p_mascota_id) o
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(o.prestador_id, p_fecha) c
   WHERE
     -- LETRA_PERFIL §2.2 (firma): SIN COALESCE. §2.3: cliente sin coordenadas
     -- = sin filtro (lo de hoy).
     (
       p_lat IS NULL OR p_lon IS NULL
       OR EXISTS (
         SELECT 1 FROM prestadores geo
          WHERE geo.id = o.prestador_id
            AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
            AND geo.radio_cobertura_km IS NOT NULL
            AND 2 * 6371 * asin(sqrt(
                  power(sin(radians((geo.lat - p_lat) / 2)), 2)
                  + cos(radians(p_lat)) * cos(radians(geo.lat))
                    * power(sin(radians((geo.lon - p_lon) / 2)), 2)
                )) <= geo.radio_cobertura_km
       )
     )
     /* 🔴 EL DÍA LLENO NO SE OFERTA — pero OJO, esto es el lector de QUIÉN
        PUEDE ese día. **El calendario de la familia NO se arma con esto**: ahí
        el día lleno SE VE LLENO y lo dice (`cupo_guarderia_del_rango`). Son
        dos preguntas distintas y la Ley 23 se aplica distinto a cada una. */
     AND (c->>'disponible')::int > 0
   ORDER BY o.precio, o.prestador_nombre;
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, numeric, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._guarderia_ofertas_cobrables(uuid)                                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date, uuid, double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, numeric, boolean) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date, uuid, double precision, double precision) TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — con discriminador, en subtransacción que se deshace sola (L-406)
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $c$
DECLARE
  v_rol      text := current_user;
  v_prest    uuid; v_titular uuid; v_perro uuid; v_pez uuid;
  v_espacio  uuid; v_err text; v_res jsonb; v_n int; v_residuo int; v_familiar uuid;
  v_fecha    date := public.hoy_local() + 31;
BEGIN
  SELECT p.id, p.user_id INTO v_prest, v_titular
    FROM prestadores p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.estado='activo' AND p.user_id IS NOT NULL AND cc.estado='activa' LIMIT 1;
  /* 🔴 LA VITRINA LA LEE LA FAMILIA, NO EL TITULAR — y las DOS mascotas tienen
     que ser de la MISMA familia. Si el caso negativo usara una mascota ajena,
     rebotaría con `no_access_to_mascota` y el assert pasaría **por la razón
     equivocada**: creeríamos haber probado la especie y habríamos probado el
     acceso. *Un rojo por la razón equivocada está tan roto como un verde por
     la razón equivocada.* (Lo pagó la primera corrida de este mismo cinturón.) */
  SELECT fm.user_id,
         (array_agg(m.id ORDER BY m.id) FILTER (WHERE m.especie = 'perro'))[1],
         (array_agg(m.id ORDER BY m.id) FILTER (WHERE m.especie NOT IN ('perro','gato')))[1]
    INTO v_familiar, v_perro, v_pez
    FROM familia_miembro fm
    JOIN mascotas m ON m.familia_id = fm.familia_id AND m.estado_vida = 'activa'
   GROUP BY fm.user_id
  HAVING count(*) FILTER (WHERE m.especie = 'perro') > 0
     AND count(*) FILTER (WHERE m.especie NOT IN ('perro','gato')) > 0
   LIMIT 1;
  IF v_prest IS NULL OR v_perro IS NULL OR v_pez IS NULL OR v_familiar IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: falta el caso que discrimina — hace falta UNA familia con perro Y con otra especie (prestador=% perro=% otra=% familiar=%).', v_prest, v_perro, v_pez, v_familiar;
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role', 'authenticated')::text, true);

    -- ── A1 · SIN FRANJAS NO HAY VITRINA, y lo DICE ──────────────────────────
    BEGIN
      PERFORM public.definir_oferta_guarderia(v_prest, 20);
      RAISE EXCEPTION 'A1 ROJO: publico una guarderia SIN franjas configuradas.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'franjas_no_configuradas' THEN RAISE; END IF;
    END;

    PERFORM public.definir_franja_guarderia(v_prest, 'recogida',   '07:00', '09:00', ARRAY[1,2,3,4,5]);
    PERFORM public.definir_franja_guarderia(v_prest, 'devolucion', '16:30', '18:30', ARRAY[1,2,3,4,5]);

    -- ── A2 · CON FRANJAS PERO SIN ESPACIOS, TAMPOCO ────────────────────────
    BEGIN
      PERFORM public.definir_oferta_guarderia(v_prest, 20);
      RAISE EXCEPTION 'A2 ROJO: publico una guarderia SIN capacidad configurada.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'sin_espacios_configurados' THEN RAISE; END IF;
    END;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion)
      VALUES (v_prest, '__cinturon_oferta__', 3, ARRAY[0,1,2,3,4,5,6]) RETURNING id INTO v_espacio;
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role', 'authenticated')::text, true);

    -- ── A3 · AHORA SÍ, Y LA JORNADA SE DERIVA ──────────────────────────────
    v_res := public.definir_oferta_guarderia(v_prest, 20, 18, 320);
    IF (v_res->>'jornada_minutos')::int <> 690 THEN   -- 07:00 → 18:30
      RAISE EXCEPTION 'A3 ROJO: la jornada deberia derivarse a 690 min de las franjas. Dio %', v_res;
    END IF;

    -- ── A4 · EL DISCRIMINADOR DE VITRINA, CON LA SESIÓN DE LA FAMILIA ─────
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_familiar::text, 'role', 'authenticated')::text, true);
    SELECT count(*) INTO v_n FROM public.obtener_guarderias_disponibles(v_fecha, v_perro);
    IF v_n < 1 THEN
      RAISE EXCEPTION 'A4 ROJO: con oferta, franjas y cupo, la guarderia NO aparece para un perro.';
    END IF;
    BEGIN
      PERFORM public.obtener_guarderias_disponibles(v_fecha, v_pez);
      RAISE EXCEPTION 'A4 ROJO: una especie fuera de la letra pudo consultar guarderias.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'mascota_no_elegible' THEN RAISE; END IF;
    END;

    -- ── A5 · APAGADA, DESAPARECE (apaga el titular; mira la familia) ───────
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role', 'authenticated')::text, true);
    PERFORM public.definir_oferta_guarderia(v_prest, 20, NULL, NULL, false);
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_familiar::text, 'role', 'authenticated')::text, true);
    SELECT count(*) INTO v_n FROM public.obtener_guarderias_disponibles(v_fecha, v_perro)
     WHERE prestador_id = v_prest;
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'A5 ROJO: una oferta apagada sigue en la vitrina.';
    END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_OK::5';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'CINTURON_OK::%' THEN RAISE; END IF;
  END;

  SELECT (SELECT count(*) FROM guarderia_espacios)
       + (SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_residuo;
  IF v_residuo <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: residuo de % fila(s).', v_residuo;
  END IF;
  RAISE NOTICE '✅ CINTURON OFERTA: 5/5 (sin franjas NO · sin espacios NO · jornada derivada 690 · vitrina discrimina especie · apagada desaparece) · residuo 0';
END $c$;

COMMIT;

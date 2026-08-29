-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — LOS TRES TAMAÑOS DE PAQUETE, Y LA COMPUERTA DE LA VÍSPERA
--
-- Ajustes de la mesa tras el gate del founder en el aparato (29-ago-2026).
--
-- ── ① EL PAQUETE DEJA DE SER UN PRECIO Y PASA A SER UNA ESTRUCTURA ─────────
-- **Tres tamaños FIJOS — 5, 10 y 15 estadías — y el prestador enciende los que
-- quiera: ninguno, uno, dos o los tres, cada uno con su precio propio.**
--
-- 🔴 Y SE MODELA COMO DATO, no como tres columnas. *Tres columnas
-- (`precio_paquete_5`, `_10`, `_15`) habrían hecho que agregar un tamaño sea
-- una migración; una fila por tamaño lo vuelve un INSERT.* El techo de hoy
-- (5·10·15) vive en un CHECK, que es donde una lista cerrada se puede leer y
-- ampliar con una decisión — no en el código de cinco funciones.
--
-- ⚠️ **CONSECUENCIA QUE TOCA A C, y por eso el contrato se publica junto:**
-- `prestador_servicios.precio_paquete` **deja de usarse en guardería** y
-- `definir_oferta_guarderia` **pierde su parámetro `p_precio_paquete`**. Se
-- DROPea la firma vieja (L-119: `CREATE OR REPLACE` con firma distinta no
-- reemplaza — crea sobrecarga y deja la vieja zombi).
--
-- ── ② NINGUNA RESERVA ENTRA PARA HOY ──────────────────────────────────────
-- Firma de la mesa: **el primer día reservable es el SIGUIENTE día en que el
-- lugar opera**, según sus franjas y con cupo. Vale para día suelto, paquete e
-- inicio de mensualidad.
--
-- 🔴 **LA IMPONE EL SERVER; la pantalla la refleja.** *Una compuerta que decide
-- el cliente es decorativa* — y ésta protege algo concreto: la recogida de la
-- mañana ya salió, y una reserva de hoy es un animal que nadie va a ir a
-- buscar.
--
-- ⚠️ **FERIADOS: HUECO DECLARADO.** No hay modelo de calendario laboral y
-- **no se inventa uno**. Hoy «opera» = su patrón de franjas + sus excepciones
-- por fecha (que el prestador ya puede declarar a mano). *Un feriado que el
-- sistema adivina es peor que uno que el prestador declara.*
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829020000-paquetes-y-vispera.sql
--          (ABORTA si ya hay paquetes de guardería vendidos)
-- 76(g): 🔴 RIGE — el cinturón escribe paquetes y una reserva real, y los
--        deshace en subtransacción (L-406). Residuo verificado en 0.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ ① LOS PAQUETES ════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_paquetes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  -- El techo vive acá: una lista cerrada que se lee, no cinco `if` repartidos.
  tamano       integer NOT NULL CHECK (tamano IN (5, 10, 15)),
  precio       numeric NOT NULL CHECK (precio > 0),
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_guarderia_paquete UNIQUE (prestador_id, tamano)
);
CREATE TRIGGER trg_guarderia_paquetes_updated BEFORE UPDATE ON public.guarderia_paquetes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.guarderia_paquetes ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_paquetes_public ON public.guarderia_paquetes FOR SELECT TO authenticated
  USING ((activo = true AND public.prestador_activo(prestador_id)) OR public.is_admin());
CREATE POLICY guarderia_paquetes_own ON public.guarderia_paquetes FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id));
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_paquetes FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_paquetes FROM anon;

COMMENT ON TABLE public.guarderia_paquetes IS
  'S107 · Los tres tamaños de paquete (5·10·15 estadías), cada uno con su '
  'precio y su interruptor. El prestador enciende los que quiera — ninguno, '
  'uno, dos o los tres. 🔴 Cada COMPRA nombra su tamaño y congela su precio en '
  'bono_desglose, POR COMPRA: el catálogo puede cambiar, lo vendido no.';

CREATE FUNCTION public.definir_paquete_guarderia(
  p_prestador_id uuid,
  p_tamano       integer,
  p_precio       numeric,
  p_activo       boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_tamano IS NULL OR p_tamano NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'tamano_de_paquete_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_precio IS NULL OR p_precio <= 0 THEN
    RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023';
  END IF;
  INSERT INTO guarderia_paquetes (prestador_id, tamano, precio, activo)
       VALUES (p_prestador_id, p_tamano, p_precio, p_activo)
  ON CONFLICT (prestador_id, tamano)
    DO UPDATE SET precio = EXCLUDED.precio, activo = EXCLUDED.activo, updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'paquete_id', v_id);
END $$;

CREATE FUNCTION public.obtener_paquetes_guarderia(p_prestador_id uuid)
RETURNS TABLE(tamano integer, precio numeric, activo boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT p.tamano, p.precio, p.activo
    FROM guarderia_paquetes p
   WHERE p.prestador_id = p_prestador_id
   ORDER BY p.tamano;
$$;

/* La oferta pierde su precio único de paquete. DROP explícito de la firma
   vieja — `CREATE OR REPLACE` con otra firma deja una sobrecarga zombi
   (L-119). */
DROP FUNCTION IF EXISTS public.definir_oferta_guarderia(uuid, numeric, numeric, numeric, boolean);

CREATE FUNCTION public.definir_oferta_guarderia(
  p_prestador_id   uuid,
  p_precio_dia     numeric,
  p_precio_mensual numeric DEFAULT NULL,
  p_activo         boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid; v_recoge time; v_devuelve time; v_jornada int; v_capacidad int;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_precio_dia IS NULL OR p_precio_dia <= 0 THEN
    RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_precio_mensual IS NOT NULL AND p_precio_mensual <= 0 THEN
    RAISE EXCEPTION 'precio_mensual_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT min(f.desde) FILTER (WHERE f.tipo = 'recogida'),
         max(f.hasta)  FILTER (WHERE f.tipo = 'devolucion')
    INTO v_recoge, v_devuelve
    FROM guarderia_franjas f WHERE f.prestador_id = p_prestador_id AND f.activo;
  IF v_recoge IS NULL OR v_devuelve IS NULL THEN
    RAISE EXCEPTION 'franjas_no_configuradas' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(sum(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e WHERE e.prestador_id = p_prestador_id AND e.activo;
  IF v_capacidad = 0 THEN
    RAISE EXCEPTION 'sin_espacios_configurados' USING ERRCODE = '22023';
  END IF;

  v_jornada := EXTRACT(epoch FROM (v_devuelve - v_recoge))::int / 60;
  IF v_jornada <= 0 THEN RAISE EXCEPTION 'franjas_se_cruzan' USING ERRCODE = '22023'; END IF;

  INSERT INTO prestador_servicios (
    prestador_id, tipo_servicio, precio, precio_mensual_plan,
    duracion_minutos, activo, reservable, atiende_local, atiende_domicilio,
    especies_compatibles
  ) VALUES (
    p_prestador_id, 'guarderia_dia', p_precio_dia, p_precio_mensual,
    v_jornada, p_activo, true, true, false,
    (SELECT COALESCE(ts.especies_elegibles, '["perro","gato"]'::jsonb)
       FROM tipos_servicio ts WHERE ts.codigo = 'guarderia_dia')
  )
  ON CONFLICT (prestador_id) WHERE tipo_servicio = 'guarderia_dia'
    DO UPDATE SET precio              = EXCLUDED.precio,
                  precio_mensual_plan = EXCLUDED.precio_mensual_plan,
                  duracion_minutos    = EXCLUDED.duracion_minutos,
                  activo              = EXCLUDED.activo,
                  /* 🔴 el precio único de paquete MUERE en guardería: los
                     tamaños viven en `guarderia_paquetes`. Se limpia para que
                     nadie lo lea como vigente. */
                  precio_paquete      = NULL
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'prestador_servicio_id', v_id,
                            'jornada_minutos', v_jornada, 'capacidad_dia', v_capacidad);
END $$;

-- 🔴 SIN COMMIT ACÁ, A PROPÓSITO: LA MIGRACIÓN ES **UNA SOLA TRANSACCIÓN**.
--    Partirla en dos hizo que, al fallar el cinturón, la primera mitad quedara
--    APLICADA y el ledger sin registrarla — el estado a medias que obliga a
--    correr la reversa a mano. *Una migración que puede aplicarse a medias no
--    es una migración: son dos, y la segunda no sabe que la primera pasó.*
/* «Opera ese día» = su patrón de franjas lo incluye. **Feriados: hueco
   declarado** — no hay calendario laboral y no se inventa; el prestador cierra
   un día puntual con una excepción de espacio, que ya existe. */
CREATE FUNCTION public._guarderia_dia_operativo(p_prestador_id uuid, p_fecha date)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM guarderia_franjas f
     WHERE f.prestador_id = p_prestador_id AND f.activo
       AND EXTRACT(dow FROM p_fecha)::int = ANY(f.dias_semana)
       AND f.tipo = 'recogida'
  )
  AND (public.cupo_guarderia_del_dia(p_prestador_id, p_fecha)->>'disponible')::int > 0;
$$;

/* El primer día que la familia PUEDE elegir. Mira hasta 60 días adelante: si
   en dos meses el lugar no abre ningún día con cupo, devuelve NULL y la
   pantalla lo dice — jamás un día inventado. */
CREATE FUNCTION public.primer_dia_reservable_guarderia(p_prestador_id uuid)
RETURNS date
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT d::date
    FROM generate_series(public.hoy_local() + 1, public.hoy_local() + 60, interval '1 day') d
   WHERE public._guarderia_dia_operativo(p_prestador_id, d::date)
   ORDER BY d
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(
  p_prestador_id uuid,
  p_mascota_id   uuid,
  p_fecha        date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid();
  v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  /* 🔴 NINGUNA RESERVA ENTRA PARA HOY (firma de mesa, 29-ago). La recogida de
     la mañana ya salió: una reserva de hoy es un animal que nadie va a ir a
     buscar. **Y el ayer y el hoy se distinguen** — dos rebotes, no uno, porque
     la pantalla tiene que poder decir cosas distintas. */
  IF p_fecha < public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023';
  END IF;
  IF p_fecha = public.hoy_local() THEN
    RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE = '22023';
  END IF;
  IF NOT public._guarderia_dia_operativo(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE = '22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'requisitos_sanitarios' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code
    INTO v_ps
    FROM prestador_servicios ps
    JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN
    RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));

  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN
    RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023';
  END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;

  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial',
    v_direccion, COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes',
                            'con_direccion', (v_direccion IS NOT NULL));
END $$;

/* La vitrina tampoco ofrece HOY: la compuerta y el lector dicen lo mismo, o la
   pantalla ofrece lo que el server va a rechazar (Ley 23). */
CREATE OR REPLACE FUNCTION public.obtener_guarderias_disponibles(
  p_fecha date, p_mascota_id uuid,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL
) RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text,
                precio numeric, precio_paquete numeric, precio_mensual numeric,
                jornada_minutos int, direccion text, ciudad text,
                disponible int, sobrevendido boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- 🔴 hoy tampoco: el primer día ofertable es mañana en adelante.
  IF p_fecha <= public.hoy_local() THEN RETURN; END IF;

  RETURN QUERY
  SELECT o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
         o.precio, o.precio_paquete, o.precio_mensual,
         o.jornada_minutos, o.direccion, o.ciudad,
         (c->>'disponible')::int, (c->>'sobrevendido')::boolean
    FROM _guarderia_ofertas_cobrables(p_mascota_id) o
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(o.prestador_id, p_fecha) c
   WHERE (
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
                )) <= geo.radio_cobertura_km))
     AND (c->>'disponible')::int > 0
     AND public._guarderia_dia_operativo(o.prestador_id, p_fecha)
   ORDER BY o.precio, o.prestador_nombre;
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.definir_paquete_guarderia(uuid, integer, numeric, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_paquetes_guarderia(uuid)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, boolean)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.primer_dia_reservable_guarderia(uuid)                       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._guarderia_dia_operativo(uuid, date)                        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.definir_paquete_guarderia(uuid, integer, numeric, boolean) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_paquetes_guarderia(uuid)                            TO authenticated;
GRANT  EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, boolean)   TO authenticated;
GRANT  EXECUTE ON FUNCTION public.primer_dia_reservable_guarderia(uuid)                       TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $c$
DECLARE
  v_rol text := current_user;
  v_prest uuid; v_titular uuid; v_familiar uuid; v_perro uuid;
  v_espacio uuid; v_err text; v_r jsonb; v_n int; v_primer date; v_residuo int;
  v_base int;
BEGIN
  /* 🔴 EL RESIDUO SE MIDE CONTRA UNA LÍNEA BASE, JAMÁS CONTRA CERO. La primera
     versión de este cinturón comparaba con 0 — y era correcto el día que lo
     escribí, porque no había ninguna guardería configurada. **Hoy C tiene una
     viva** (su espacio «Principal», sus dos franjas y su oferta), así que el
     assert dio ROJO acusando de residuo a datos legítimos de otra pista.
     *Un arnés que asume un mundo vacío se rompe el día que el mundo deja de
     estarlo — y su rojo culpa a quien no fue.* */
  SELECT (SELECT count(*) FROM guarderia_espacios) + (SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_paquetes) + (SELECT count(*) FROM guarderia_estadias)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_base;

  /* 🔴 Y el sujeto del arnés NO puede ser un prestador que YA tenga guardería
     configurada: sus franjas y su oferta se pisarían con un upsert, y al
     deshacerse la subtransacción volverían — pero el arnés habría escrito
     sobre datos de otra pista. Se elige uno SIN configurar. */
  SELECT p.id, p.user_id INTO v_prest, v_titular
    FROM prestadores p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.estado='activo' AND p.user_id IS NOT NULL AND cc.estado='activa'
     AND NOT EXISTS (SELECT 1 FROM guarderia_franjas f WHERE f.prestador_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM prestador_servicios ps
                      WHERE ps.prestador_id = p.id AND ps.tipo_servicio = 'guarderia_dia')
   LIMIT 1;
  SELECT fm.user_id, (array_agg(m.id ORDER BY m.id) FILTER (WHERE m.especie='perro'))[1]
    INTO v_familiar, v_perro
    FROM familia_miembro fm JOIN mascotas m ON m.familia_id=fm.familia_id AND m.estado_vida='activa'
   GROUP BY fm.user_id HAVING count(*) FILTER (WHERE m.especie='perro') > 0 LIMIT 1;
  IF v_prest IS NULL OR v_perro IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: falta prestador cobrable o perro de familia.';
  END IF;

  BEGIN
    INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion)
      VALUES (v_prest, '__cint_paq__', 4, ARRAY[0,1,2,3,4,5,6]) RETURNING id INTO v_espacio;
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role','authenticated')::text, true);
    PERFORM public.definir_franja_guarderia(v_prest,'recogida','07:00','09:00',ARRAY[0,1,2,3,4,5,6]);
    PERFORM public.definir_franja_guarderia(v_prest,'devolucion','16:30','18:30',ARRAY[0,1,2,3,4,5,6]);
    PERFORM public.definir_oferta_guarderia(v_prest, 25);

    -- A1 · LOS TRES TAMAÑOS, ENCENDIBLES POR SEPARADO
    PERFORM public.definir_paquete_guarderia(v_prest, 5, 110);
    PERFORM public.definir_paquete_guarderia(v_prest, 15, 300);
    SELECT count(*) INTO v_n FROM public.obtener_paquetes_guarderia(v_prest) WHERE activo;
    IF v_n <> 2 THEN
      RAISE EXCEPTION 'A1 ROJO: el prestador encendio 2 tamanos y se leen %.', v_n;
    END IF;
    -- y el que no encendio NO existe: ninguno se enciende solo
    IF EXISTS (SELECT 1 FROM public.obtener_paquetes_guarderia(v_prest) WHERE tamano = 10) THEN
      RAISE EXCEPTION 'A1 ROJO: aparecio un tamano que nadie encendio.';
    END IF;

    -- A2 · UN TAMAÑO FUERA DE LA LISTA REBOTA
    BEGIN
      PERFORM public.definir_paquete_guarderia(v_prest, 7, 150);
      RAISE EXCEPTION 'A2 ROJO: entro un paquete de 7.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'tamano_de_paquete_invalido' THEN RAISE; END IF;
    END;

    -- A3 · LA VÍSPERA: HOY REBOTA CON SU PROPIO CÓDIGO
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_familiar::text, 'role','authenticated')::text, true);
    BEGIN
      PERFORM public.reservar_dia_guarderia(v_prest, v_perro, public.hoy_local());
      RAISE EXCEPTION 'A3 ROJO: entro una reserva para HOY.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      /* 🔴 El discriminador fino: tiene que rebotar por `reserva_mismo_dia`, NO
         por `fecha_pasada` ni por `requisitos_sanitarios`. Un rebote por la
         razón equivocada da verde y esconde que la compuerta no existe. */
      IF v_err <> 'reserva_mismo_dia' THEN
        RAISE EXCEPTION 'A3 ROJO: rebotó por "%", no por reserva_mismo_dia.', v_err;
      END IF;
    END;

    -- A4 · Y LA VITRINA DICE LO MISMO QUE LA COMPUERTA
    SELECT count(*) INTO v_n FROM public.obtener_guarderias_disponibles(public.hoy_local(), v_perro);
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'A4 ROJO: la vitrina ofrece HOY y el server lo rechaza.';
    END IF;

    -- A5 · EL PRIMER DÍA RESERVABLE ES MAÑANA (el espacio opera los 7 días)
    v_primer := public.primer_dia_reservable_guarderia(v_prest);
    IF v_primer IS DISTINCT FROM public.hoy_local() + 1 THEN
      RAISE EXCEPTION 'A5 ROJO: con un lugar que abre los 7 dias, el primero deberia ser manana. Dio %', v_primer;
    END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_OK::5';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'CINTURON_OK::%' THEN RAISE; END IF;
  END;

  SELECT (SELECT count(*) FROM guarderia_espacios) + (SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_paquetes) + (SELECT count(*) FROM guarderia_estadias)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_residuo;
  IF v_residuo <> v_base THEN
    RAISE EXCEPTION 'CINTURON ROJO: el arnes dejo % fila(s) de residuo (base %, ahora %).',
      v_residuo - v_base, v_base, v_residuo;
  END IF;
  RAISE NOTICE '✅ CINTURON PAQUETES+VISPERA: 5/5 (dos tamanos encendidos y el tercero ausente · el 7 rebota · HOY rebota por su codigo · la vitrina no ofrece hoy · el primero es manana) · residuo 0';
END $c$;

COMMIT;

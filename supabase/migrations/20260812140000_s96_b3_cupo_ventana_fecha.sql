-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B3 — EL CUPO POR RECURSO CONFIRMADO, LA VENTANA POR TURNO Y LA
--               FECHA PROGRAMADA
--
-- Fuente de letra: `LETRA_PANEL_VENDEDOR_S96` §7 (la promesa es una ventana,
-- no una fecha · los cortes son parámetro · 🔴 el cupo del día es la SUMA de
-- la capacidad de los recursos CONFIRMADOS para ese día — ningún número va en
-- el código · el excedente no rompe nada: se promete al turno siguiente) +
-- `LETRA_RECORRIDO_DESPENSA_S96` §6.2 (programar la fecha entra, y el cupo
-- existe POR CADA DÍA FUTURO — un día sin capacidad confirmada no se puede
-- prometer).
--
-- ── QUÉ CONSTRUYE ──────────────────────────────────────────────────────────
-- ① `cat_tipos_servicio_envio` — estándar hoy, urgente MODELADO Y APAGADO
--    (lista que crece, no casillero sí/no).
-- ② `recursos_reparto` — la capacidad es DEL RECURSO, no de la casa: la moto
--    lleva 20; el día que el vendedor use un carro de 40, edita la capacidad
--    y el sistema no se entera de que cambió algo.
-- ③ `recurso_reparto_excepciones` — "confirmado para ese día" = el patrón
--    semanal del recurso (como la jornada del prestador) MENOS la excepción:
--    si el segundo repartidor no puede venir el domingo, se declara y el
--    sistema deja de prometer como si estuviera (L-139).
-- ④ `entrega_turnos` — los cortes como DATO: pedido de la mañana → ventana
--    de la tarde; pedido de la tarde → mañana siguiente. El founder cambia el
--    corte sin que nadie toque una línea.
-- ⑤ `calcular_promesa_despensa` — la promesa nueva: turno siguiente al corte,
--    salteando los días sin cupo; la fecha programada consume el cupo de ESE
--    día futuro o rebota.
-- ⑥ `crear_pedido_despensa` v3 — usa la promesa nueva y acepta fecha
--    programada y tipo de servicio. La promesa por bodega (hora_corte +
--    horas de tránsito) MUERE: describía un courier, no una moto con turnos.
--
-- SEEDS (vendedor de pruebas, único vivo): una moto de capacidad 20 (lun-sáb)
-- y los dos turnos del arranque. Sin recursos confirmados NO HAY PROMESA — un
-- vendedor sin configurar no puede recibir pedidos de despacho, y eso es
-- L-139, no un accidente.
--
-- Reversa: scripts/s96/2026-08-12-s96-m3-REVERSA.sql
--          (+ functiondef-pre-m3.sql con la promesa de bodega capturada)
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón crea pedidos reales para llenar el cupo de
-- un día y verificar el desborde al siguiente, y los deshace por id con
-- residuo 0. Los seeds del vendedor de pruebas QUEDAN (son configuración
-- operativa, no fixture) y se declaran en el NOTICE final.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL TIPO DE SERVICIO — lista que crece
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.cat_tipos_servicio_envio (
  codigo          text PRIMARY KEY,
  nombre          text NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  motivo_inactivo text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cat_tipos_servicio_envio ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_servicio_envio_select ON public.cat_tipos_servicio_envio
  FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.cat_tipos_servicio_envio FROM anon, authenticated;

INSERT INTO cat_tipos_servicio_envio (codigo, nombre, activo, motivo_inactivo) VALUES
  ('estandar', 'Entrega estándar', true, NULL),
  ('urgente', 'Entrega urgente', false,
   'S96: modelado y apagado. El día de la urgencia con cobro adicional, este código se enciende y el campo del precio ya existe (LETRA_PANEL §7.2) — nada se construye de nuevo.');

ALTER TABLE public.pedidos
  ADD COLUMN envio_servicio text NOT NULL DEFAULT 'estandar'
    REFERENCES public.cat_tipos_servicio_envio(codigo),
  ADD COLUMN entrega_fecha_objetivo date;

COMMENT ON COLUMN public.pedidos.entrega_fecha_objetivo IS
  'S96 · El día (en el huso del vendedor) contra el que este pedido consume cupo '
  'de reparto. Lo fija calcular_promesa_despensa al crear; la fecha programada lo '
  'fija directo.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② y ③ EL RECURSO Y SU CONFIRMACIÓN POR DÍA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.recursos_reparto (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  nombre              text NOT NULL CHECK (length(btrim(nombre)) > 0),
  -- 🔴 LA CAPACIDAD ES PARÁMETRO. Jamás un número en el código.
  capacidad_por_dia   integer NOT NULL CHECK (capacidad_por_dia > 0),
  -- Convención de la casa (regla 32): 0=Domingo … 6=Sábado.
  dias_operacion      integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}'
                      CHECK (dias_operacion <@ ARRAY[0,1,2,3,4,5,6]),
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_recurso_nombre UNIQUE (cuenta_comercial_id, nombre)
);
CREATE TRIGGER trg_recursos_reparto_updated BEFORE UPDATE ON public.recursos_reparto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.recursos_reparto ENABLE ROW LEVEL SECURITY;
CREATE POLICY recursos_select ON public.recursos_reparto FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.recursos_reparto FROM anon, authenticated;
REVOKE SELECT ON public.recursos_reparto FROM anon;

CREATE TABLE public.recurso_reparto_excepciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_id  uuid NOT NULL REFERENCES public.recursos_reparto(id) ON DELETE CASCADE,
  fecha       date NOT NULL,
  -- true = viene aunque su patrón diga que no; false = no viene aunque diga
  -- que sí. La excepción GANA al patrón en las dos direcciones.
  disponible  boolean NOT NULL,
  motivo      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_excepcion_dia UNIQUE (recurso_id, fecha)
);
ALTER TABLE public.recurso_reparto_excepciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY excepciones_select ON public.recurso_reparto_excepciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM recursos_reparto r WHERE r.id = recurso_id
                   AND es_vendedor_de(r.cuenta_comercial_id))
         OR is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.recurso_reparto_excepciones FROM anon, authenticated;
REVOKE SELECT ON public.recurso_reparto_excepciones FROM anon;

-- Las puertas de escritura (patrón S95-G2: sin policy de escritura, la única
-- vía es la función que valida).
CREATE FUNCTION public.definir_recurso_reparto(
  p_cuenta_comercial_id uuid,
  p_nombre              text,
  p_capacidad_por_dia   integer,
  p_dias_operacion      integer[] DEFAULT NULL,
  p_activo              boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_capacidad_por_dia IS NULL OR p_capacidad_por_dia <= 0 THEN
    RAISE EXCEPTION 'capacidad_invalida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO recursos_reparto (cuenta_comercial_id, nombre, capacidad_por_dia,
                                dias_operacion, activo)
    VALUES (p_cuenta_comercial_id, btrim(p_nombre), p_capacidad_por_dia,
            COALESCE(p_dias_operacion, '{1,2,3,4,5,6}'), p_activo)
  ON CONFLICT (cuenta_comercial_id, nombre)
    DO UPDATE SET capacidad_por_dia = EXCLUDED.capacidad_por_dia,
                  dias_operacion = EXCLUDED.dias_operacion,
                  activo = EXCLUDED.activo, updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'recurso_id', v_id);
END $$;

CREATE FUNCTION public.declarar_excepcion_recurso(
  p_recurso_id uuid,
  p_fecha      date,
  p_disponible boolean,
  p_motivo     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_cc uuid;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM recursos_reparto WHERE id = p_recurso_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'recurso_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  INSERT INTO recurso_reparto_excepciones (recurso_id, fecha, disponible, motivo)
    VALUES (p_recurso_id, p_fecha, p_disponible, p_motivo)
  ON CONFLICT (recurso_id, fecha)
    DO UPDATE SET disponible = EXCLUDED.disponible, motivo = EXCLUDED.motivo;
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.definir_recurso_reparto(uuid, text, integer, integer[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_recurso_reparto(uuid, text, integer, integer[], boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.declarar_excepcion_recurso(uuid, date, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_excepcion_recurso(uuid, date, boolean, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ LOS TURNOS — los cortes como dato
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.entrega_turnos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  codigo              text NOT NULL,
  -- Un pedido que entra ANTES del corte cae en este turno.
  corte               time NOT NULL,
  entrega_desde       time NOT NULL,
  entrega_hasta       time NOT NULL,
  -- 0 = la ventana es del MISMO día del corte; 1 = del día siguiente.
  dia_offset          integer NOT NULL DEFAULT 0 CHECK (dia_offset IN (0, 1)),
  orden               integer NOT NULL,
  zona_horaria        text NOT NULL DEFAULT 'America/Guayaquil',
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_turno UNIQUE (cuenta_comercial_id, codigo),
  CONSTRAINT chk_ventana CHECK (entrega_desde < entrega_hasta)
);
ALTER TABLE public.entrega_turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY turnos_select ON public.entrega_turnos FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.entrega_turnos FROM anon, authenticated;
REVOKE SELECT ON public.entrega_turnos FROM anon;

CREATE FUNCTION public.definir_turno_entrega(
  p_cuenta_comercial_id uuid,
  p_codigo        text,
  p_corte         time,
  p_entrega_desde time,
  p_entrega_hasta time,
  p_dia_offset    integer DEFAULT 0,
  p_orden         integer DEFAULT 1,
  p_zona_horaria  text DEFAULT 'America/Guayaquil'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  INSERT INTO entrega_turnos (cuenta_comercial_id, codigo, corte, entrega_desde,
                              entrega_hasta, dia_offset, orden, zona_horaria)
    VALUES (p_cuenta_comercial_id, p_codigo, p_corte, p_entrega_desde,
            p_entrega_hasta, p_dia_offset, p_orden, p_zona_horaria)
  ON CONFLICT (cuenta_comercial_id, codigo)
    DO UPDATE SET corte = EXCLUDED.corte, entrega_desde = EXCLUDED.entrega_desde,
                  entrega_hasta = EXCLUDED.entrega_hasta, dia_offset = EXCLUDED.dia_offset,
                  orden = EXCLUDED.orden, zona_horaria = EXCLUDED.zona_horaria,
                  activo = true
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'turno_id', v_id);
END $$;
REVOKE ALL ON FUNCTION public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ EL CUPO DEL DÍA Y LA PROMESA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.cupo_reparto_del_dia(
  p_cuenta_comercial_id uuid,
  p_fecha               date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_capacidad int; v_consumido int; v_dow int := EXTRACT(dow FROM p_fecha)::int;
BEGIN
  -- Confirmado para el día = activo Y (su patrón semanal lo incluye O una
  -- excepción lo trae) Y ninguna excepción lo saca. La excepción GANA.
  SELECT COALESCE(SUM(r.capacidad_por_dia), 0) INTO v_capacidad
  FROM recursos_reparto r
  WHERE r.cuenta_comercial_id = p_cuenta_comercial_id AND r.activo
    AND (
      (v_dow = ANY(r.dias_operacion)
        AND NOT EXISTS (SELECT 1 FROM recurso_reparto_excepciones e
                        WHERE e.recurso_id = r.id AND e.fecha = p_fecha AND NOT e.disponible))
      OR EXISTS (SELECT 1 FROM recurso_reparto_excepciones e
                 WHERE e.recurso_id = r.id AND e.fecha = p_fecha AND e.disponible)
    );

  -- Lo que ya se prometió contra ese día. Un cancelado devuelve su lugar.
  SELECT count(*) INTO v_consumido
  FROM pedidos p
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
    AND p.metodo_entrega = 'despacho'
    AND p.entrega_fecha_objetivo = p_fecha
    AND p.estado NOT IN ('cancelado_cliente','cancelado_vendedor','cancelado_sistema');

  RETURN jsonb_build_object('fecha', p_fecha, 'capacidad', v_capacidad,
                            'consumido', v_consumido,
                            'disponible', GREATEST(v_capacidad - v_consumido, 0));
END $$;
REVOKE ALL ON FUNCTION public.cupo_reparto_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cupo_reparto_del_dia(uuid, date) TO authenticated;

CREATE FUNCTION public.calcular_promesa_despensa(
  p_cuenta_comercial_id uuid,
  p_desde               timestamptz DEFAULT now(),
  p_fecha_programada    date DEFAULT NULL,
  p_servicio            text DEFAULT 'estandar'
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_srv    record;
  v_turno  record;
  v_tz     text;
  v_local  timestamp;
  v_fecha  date;
  v_cupo   jsonb;
  v_saltos int := 0;
BEGIN
  SELECT * INTO v_srv FROM cat_tipos_servicio_envio WHERE codigo = p_servicio;
  IF v_srv.codigo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'servicio_envio_desconocido');
  END IF;
  IF NOT v_srv.activo THEN
    RETURN jsonb_build_object('ok', false, 'error', 'servicio_envio_inactivo',
                              'detalle', v_srv.motivo_inactivo);
  END IF;

  -- Sin turnos declarados no hay promesa: prometer sin corte sería inventar
  -- una ventana (L-139). El vendedor se configura solo (§2.1) — y hasta que
  -- lo haga, esto lo dice.
  SELECT zona_horaria INTO v_tz FROM entrega_turnos
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND activo LIMIT 1;
  IF v_tz IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sin_turnos_de_entrega',
      'detalle', 'El vendedor no declaró sus cortes de entrega todavía.');
  END IF;
  v_local := p_desde AT TIME ZONE v_tz;

  IF p_fecha_programada IS NOT NULL THEN
    -- LA FECHA PROGRAMADA: el cupo existe por cada día futuro, y la promesa
    -- lo consume. Un día sin capacidad confirmada NO se puede prometer.
    IF p_fecha_programada <= v_local::date THEN
      RETURN jsonb_build_object('ok', false, 'error', 'fecha_programada_invalida',
        'detalle', 'La fecha programada tiene que ser un día futuro.');
    END IF;
    v_cupo := cupo_reparto_del_dia(p_cuenta_comercial_id, p_fecha_programada);
    IF (v_cupo->>'disponible')::int <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sin_cupo_ese_dia',
        'detalle', format('El %s no hay capacidad de reparto confirmada.', p_fecha_programada),
        'cupo', v_cupo);
    END IF;
    SELECT * INTO v_turno FROM entrega_turnos
     WHERE cuenta_comercial_id = p_cuenta_comercial_id AND activo
     ORDER BY orden LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'programada', true,
      'fecha', p_fecha_programada, 'turno', v_turno.codigo,
      'desde', ((p_fecha_programada + v_turno.entrega_desde) AT TIME ZONE v_tz),
      'hasta', ((p_fecha_programada + v_turno.entrega_hasta) AT TIME ZONE v_tz),
      'cupo', v_cupo);
  END IF;

  -- EL TURNO SIGUIENTE AL CORTE: el primer turno cuyo corte no pasó decide la
  -- ventana; pasados todos, el primer turno de mañana.
  SELECT * INTO v_turno FROM entrega_turnos
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND activo
     AND corte > v_local::time
   ORDER BY corte LIMIT 1;
  IF v_turno.id IS NULL THEN
    SELECT * INTO v_turno FROM entrega_turnos
     WHERE cuenta_comercial_id = p_cuenta_comercial_id AND activo
     ORDER BY orden LIMIT 1;
    v_fecha := v_local::date + 1 + v_turno.dia_offset;
  ELSE
    v_fecha := v_local::date + v_turno.dia_offset;
  END IF;

  -- EL EXCEDENTE NO ROMPE NADA: si el día está lleno (o sin recursos
  -- confirmados), se corre al día siguiente con capacidad — hasta 14 días,
  -- que es donde "no hay cupo" deja de ser un corrimiento y pasa a ser un
  -- vendedor sin capacidad de reparto.
  LOOP
    v_cupo := cupo_reparto_del_dia(p_cuenta_comercial_id, v_fecha);
    EXIT WHEN (v_cupo->>'disponible')::int > 0;
    v_fecha := v_fecha + 1;
    v_saltos := v_saltos + 1;
    IF v_saltos > 14 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sin_capacidad_de_reparto',
        'detalle', 'Ningún día de las próximas dos semanas tiene capacidad confirmada.');
    END IF;
    -- Al correr de día, la ventana es la del primer turno.
    SELECT * INTO v_turno FROM entrega_turnos
     WHERE cuenta_comercial_id = p_cuenta_comercial_id AND activo
     ORDER BY orden LIMIT 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'programada', false,
    'fecha', v_fecha, 'turno', v_turno.codigo, 'saltos_por_cupo', v_saltos,
    'desde', ((v_fecha + v_turno.entrega_desde) AT TIME ZONE v_tz),
    'hasta', ((v_fecha + v_turno.entrega_hasta) AT TIME ZONE v_tz),
    'cupo', v_cupo);
END $$;
REVOKE ALL ON FUNCTION public.calcular_promesa_despensa(uuid, timestamptz, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calcular_promesa_despensa(uuid, timestamptz, date, text) TO authenticated;

-- La promesa por bodega MUERE (regla 37: código sin caller es código muerto).
-- Su literal vive en scripts/s96/functiondef-pre-m3.sql para la reversa.
DROP FUNCTION public.calcular_promesa_entrega(uuid, integer, timestamptz);

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑥ CREAR v3 — la promesa nueva, la fecha programada y el tipo de servicio
-- ═══════════════════════════════════════════════════════════════════════════
DROP FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text);

CREATE FUNCTION public.crear_pedido_despensa(
  p_cuenta_comercial_id uuid,
  p_items               jsonb,
  p_entrega             jsonb,
  p_clave_idempotencia  text,
  p_bodega_id           uuid DEFAULT NULL,
  p_metodo_entrega      text DEFAULT 'despacho',
  p_fecha_programada    date DEFAULT NULL,
  p_servicio_envio      text DEFAULT 'estandar'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_existente uuid;
  v_ped      uuid;
  v_it       jsonb;
  v_of       record;
  v_tasa     numeric;
  v_sub      numeric := 0;
  v_imp      numeric := 0;
  v_pf       numeric := 0;
  v_pv       numeric := 0;
  v_cot      jsonb;
  v_prom     jsonb;
  v_envio    numeric := 0;
  v_item_id  uuid;
  v_masc     uuid;
  v_don      boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF p_clave_idempotencia IS NULL OR length(trim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_metodo_entrega NOT IN ('despacho','retiro') THEN
    RAISE EXCEPTION 'metodo_entrega_invalido: %', p_metodo_entrega USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existente FROM pedidos WHERE clave_idempotencia = p_clave_idempotencia;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'pedido_id', v_existente, 'ya_existia', true);
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'pedido_sin_items' USING ERRCODE = '22023';
  END IF;

  -- La promesa se resuelve ANTES de escribir nada: un pedido que no se puede
  -- prometer no nace (servicio apagado · fecha sin cupo · vendedor sin
  -- turnos/recursos — cada rebote con su código).
  IF p_metodo_entrega = 'despacho' THEN
    v_prom := calcular_promesa_despensa(p_cuenta_comercial_id, now(),
                                        p_fecha_programada, p_servicio_envio);
    IF NOT COALESCE((v_prom->>'ok')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_prom->>'error','promesa_fallida')
        USING ERRCODE = '22023', DETAIL = COALESCE(v_prom->>'detalle','');
    END IF;
  END IF;

  -- El destino se valida antes de escribir (M2, sin cambios).
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    IF v_don AND v_masc IS NOT NULL THEN
      RAISE EXCEPTION 'destino_contradictorio: un ítem no puede ser donación Y de una mascota'
        USING ERRCODE = '22023';
    END IF;
    IF v_masc IS NOT NULL AND NOT _user_es_familia_de_mascota(v_masc, v_uid) AND NOT is_admin() THEN
      RAISE EXCEPTION 'mascota_sin_acceso: no podés atar una compra a una mascota que no es tuya'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, metodo_entrega, envio_servicio,
                       entrega_nombre_receptor, entrega_telefono,
                       entrega_direccion, entrega_ciudad, entrega_sector,
                       entrega_referencias, entrega_instrucciones,
                       entrega_lat, entrega_lon,
                       promesa_entrega_desde, promesa_entrega_hasta,
                       entrega_fecha_objetivo, entrega_programada)
  VALUES (v_uid, p_cuenta_comercial_id, 0, 0, 0, 0, 0, p_clave_idempotencia,
          'P-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
          p_metodo_entrega, p_servicio_envio,
          p_entrega->>'nombre_receptor', p_entrega->>'telefono',
          CASE WHEN p_metodo_entrega = 'retiro'
               THEN COALESCE(p_entrega->>'direccion', 'Retiro en tienda')
               ELSE p_entrega->>'direccion' END,
          p_entrega->>'ciudad', p_entrega->>'sector',
          p_entrega->>'referencias', p_entrega->>'instrucciones',
          NULLIF(p_entrega->>'lat','')::double precision,
          NULLIF(p_entrega->>'lon','')::double precision,
          NULLIF(v_prom->>'desde','')::timestamptz,
          NULLIF(v_prom->>'hasta','')::timestamptz,
          NULLIF(v_prom->>'fecha','')::date,
          CASE WHEN p_fecha_programada IS NOT NULL
               THEN NULLIF(v_prom->>'desde','')::timestamptz END)
  RETURNING id INTO v_ped;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT o.*, v.impuesto_codigo, v.peso_kg, v.largo_cm, v.ancho_cm, v.alto_cm,
           v.producto_id, p.nombre AS nombre_producto, s.id AS sku
      INTO v_of
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    JOIN productos p ON p.id = v.producto_id
    JOIN vendedor_skus s ON s.id = o.sku_id
    WHERE o.id = (v_it->>'oferta_id')::uuid AND o.estado = 'publicada';

    IF v_of.id IS NULL THEN
      RAISE EXCEPTION 'oferta_no_publicada: %', v_it->>'oferta_id' USING ERRCODE = '22023';
    END IF;

    SELECT pct INTO v_tasa FROM cat_tasas_impuesto WHERE codigo = v_of.impuesto_codigo;

    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                              cuenta_comercial_id, nombre_producto, precio_unitario,
                              cantidad, subtotal, impuesto_codigo, impuesto_pct,
                              impuesto_monto)
    VALUES (v_ped, v_of.producto_id, v_of.variante_id, v_of.id,
            p_cuenta_comercial_id, v_of.nombre_producto, v_of.precio,
            (v_it->>'cantidad')::int,
            round(v_of.precio * (v_it->>'cantidad')::int, 2),
            v_of.impuesto_codigo, v_tasa,
            round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2))
    RETURNING id INTO v_item_id;

    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    IF v_masc IS NOT NULL OR v_don THEN
      INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, atado_en, atado_por)
        VALUES (v_item_id, v_masc, v_don, now(), v_uid);
    END IF;

    v_sub := v_sub + round(v_of.precio * (v_it->>'cantidad')::int, 2);
    v_imp := v_imp + round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2);
    v_pf  := v_pf  + COALESCE(v_of.peso_kg,0) * (v_it->>'cantidad')::int;
    v_pv  := v_pv  + COALESCE(v_of.largo_cm * v_of.ancho_cm * v_of.alto_cm / 6000.0, 0)
                     * (v_it->>'cantidad')::int;
  END LOOP;

  IF p_metodo_entrega = 'despacho' THEN
    v_cot := cotizar_envio_despensa(p_cuenta_comercial_id, v_sub, v_pf, v_pv,
                                    'EC', p_entrega->>'ciudad');
    IF NOT COALESCE((v_cot->>'ok')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_cot->>'error','cotizacion_fallida')
        USING ERRCODE = '22023', DETAIL = COALESCE(v_cot->>'detalle','');
    END IF;
    v_envio := (v_cot->>'costo')::numeric;
  ELSE
    v_cot := jsonb_build_object('ok', true, 'costo', 0, 'metodo', 'retiro');
  END IF;

  UPDATE pedidos SET
    subtotal = v_sub, impuesto_total = v_imp, costo_envio = v_envio,
    total = v_sub + v_imp + v_envio,
    envio_regla_id = NULLIF(v_cot->>'regla_id','')::uuid,
    envio_tipo_regla = v_cot->>'tipo_regla',
    envio_peso_fisico_kg = v_pf,
    envio_peso_volumetrico_kg = v_pv,
    envio_peso_facturable_kg = GREATEST(v_pf, v_pv),
    envio_cotizacion = v_cot || COALESCE(jsonb_build_object('promesa', v_prom), '{}'::jsonb),
    updated_at = now()
  WHERE id = v_ped;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_uid, 'cliente');

  RETURN jsonb_build_object('ok', true, 'pedido_id', v_ped, 'subtotal', v_sub,
                            'impuesto', v_imp, 'envio', v_envio,
                            'total', v_sub + v_imp + v_envio,
                            'metodo_entrega', p_metodo_entrega,
                            'promesa', v_prom,
                            'cotizacion_envio', v_cot);
END $$;

REVOKE ALL ON FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text, date, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEEDS del vendedor de pruebas — configuración operativa, NO fixture
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_cc uuid;
BEGIN
  SELECT cc.id INTO v_cc
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  IF v_cc IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay vendedor de pruebas para sembrar la configuración de reparto.';
  END IF;
  INSERT INTO recursos_reparto (cuenta_comercial_id, nombre, capacidad_por_dia, dias_operacion)
    VALUES (v_cc, 'Moto de pruebas', 20, '{1,2,3,4,5,6}')
    ON CONFLICT (cuenta_comercial_id, nombre) DO NOTHING;
  INSERT INTO entrega_turnos (cuenta_comercial_id, codigo, corte, entrega_desde,
                              entrega_hasta, dia_offset, orden)
    VALUES (v_cc, 'manana', '12:00', '14:00', '18:00', 0, 1),
           (v_cc, 'tarde',  '23:59', '09:00', '13:00', 1, 2)
    ON CONFLICT (cuenta_comercial_id, codigo) DO NOTHING;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · el cupo se llena, el excedente corre, la excepción apaga el día
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_original text := current_user;
  v_cc uuid; v_vend uuid; v_of uuid; v_rec uuid;
  v_ped_antes int; v_prom jsonb; v_cupo jsonb;
  v_f1 date; v_f2 date; v_ped1 uuid; v_ped2 uuid; v_ped3 uuid;
  v_ok boolean; v_msg text; v_n int;
BEGIN
  SELECT count(*) INTO v_ped_antes FROM pedidos;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_vend
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id INTO v_of FROM ofertas o WHERE o.estado='publicada' LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vend, 'role','authenticated')::text, true);

  -- ── A · un recurso chico de 2 SOLO para el fixture — la moto de 20 se
  --        apaga durante la prueba para que el número que se mide sea el
  --        del fixture, no el del seed.
  UPDATE recursos_reparto SET activo = false
   WHERE cuenta_comercial_id = v_cc AND nombre = 'Moto de pruebas';
  v_rec := (definir_recurso_reparto(v_cc, '__cint3 bici', 2, '{0,1,2,3,4,5,6}')->>'recurso_id')::uuid;

  -- ── B · la promesa cae en el turno que corresponde y declara su cupo ─────
  v_prom := calcular_promesa_despensa(v_cc, now());
  IF NOT (v_prom->>'ok')::boolean THEN
    RAISE EXCEPTION 'ABORTA: la promesa no salió (%).', v_prom->>'error';
  END IF;
  v_f1 := (v_prom->>'fecha')::date;
  v_cupo := cupo_reparto_del_dia(v_cc, v_f1);
  IF (v_cupo->>'capacidad')::int <> 2 THEN
    RAISE EXCEPTION 'ABORTA: la capacidad del día es % y el recurso confirmado dice 2.', v_cupo->>'capacidad';
  END IF;

  -- ── C · dos pedidos llenan el día; el tercero CORRE al siguiente ─────────
  v_ped1 := (crear_pedido_despensa(v_cc,
     jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
     '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
     '__cint_s96m3_1')->>'pedido_id')::uuid;
  v_ped2 := (crear_pedido_despensa(v_cc,
     jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
     '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
     '__cint_s96m3_2')->>'pedido_id')::uuid;
  IF (SELECT entrega_fecha_objetivo FROM pedidos WHERE id = v_ped1) <> v_f1
     OR (SELECT entrega_fecha_objetivo FROM pedidos WHERE id = v_ped2) <> v_f1 THEN
    RAISE EXCEPTION 'ABORTA: los dos primeros pedidos no consumieron el día %.', v_f1;
  END IF;
  v_ped3 := (crear_pedido_despensa(v_cc,
     jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
     '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
     '__cint_s96m3_3')->>'pedido_id')::uuid;
  v_f2 := (SELECT entrega_fecha_objetivo FROM pedidos WHERE id = v_ped3);
  IF v_f2 <= v_f1 THEN
    RAISE EXCEPTION 'ABORTA: el excedente NO corrió de día (quedó en % con el día % lleno).', v_f2, v_f1;
  END IF;

  -- ── D · la excepción apaga un día futuro y la fecha programada rebota ────
  PERFORM declarar_excepcion_recurso(v_rec, v_f2 + 1, false, '__cint3 no viene');
  v_prom := calcular_promesa_despensa(v_cc, now(), v_f2 + 1);
  IF (v_prom->>'ok')::boolean OR v_prom->>'error' <> 'sin_cupo_ese_dia' THEN
    RAISE EXCEPTION 'ABORTA: el día apagado por excepción se pudo prometer (%).', v_prom->>'error';
  END IF;
  -- Y un día futuro CON cupo sí se puede programar.
  v_prom := calcular_promesa_despensa(v_cc, now(), v_f2 + 2);
  IF NOT (v_prom->>'ok')::boolean THEN
    RAISE EXCEPTION 'ABORTA: la fecha programada con cupo rebotó (%).', v_prom->>'error';
  END IF;

  -- ── E · el urgente está modelado y APAGADO, y lo dice ────────────────────
  v_prom := calcular_promesa_despensa(v_cc, now(), NULL, 'urgente');
  IF (v_prom->>'ok')::boolean OR v_prom->>'error' <> 'servicio_envio_inactivo' THEN
    RAISE EXCEPTION 'ABORTA: el urgente no rebotó como servicio apagado (%).', v_prom->>'error';
  END IF;

  -- ── F · sin NINGÚN recurso confirmado, el pedido de despacho NO nace ─────
  UPDATE recursos_reparto SET activo = false WHERE id = v_rec;
  v_ok := true;
  BEGIN
    PERFORM crear_pedido_despensa(v_cc,
      jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
      '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"x","ciudad":"Quito"}'::jsonb,
      '__cint_s96m3_4');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'sin_capacidad_de_reparto%' THEN
    RAISE EXCEPTION 'ABORTA L-139: sin recursos confirmados el pedido nació igual (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM pedido_estados WHERE pedido_id IN (v_ped1, v_ped2, v_ped3);
  DELETE FROM pedido_items   WHERE pedido_id IN (v_ped1, v_ped2, v_ped3);
  DELETE FROM pedidos        WHERE clave_idempotencia LIKE '__cint_s96m3%';
  DELETE FROM recurso_reparto_excepciones WHERE recurso_id = v_rec;
  DELETE FROM recursos_reparto WHERE id = v_rec;
  UPDATE recursos_reparto SET activo = true
   WHERE cuenta_comercial_id = v_cc AND nombre = 'Moto de pruebas';

  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN RAISE EXCEPTION 'ABORTA 76(g): pedidos % vs %', v_n, v_ped_antes; END IF;
  IF EXISTS (SELECT 1 FROM recursos_reparto WHERE nombre LIKE '__cint3%') THEN
    RAISE EXCEPTION 'ABORTA 76(g): quedó un recurso del fixture.';
  END IF;

  RAISE NOTICE 'CINTURÓN S96-M3: la capacidad es del recurso confirmado, dos pedidos llenan el día y el tercero corre al siguiente, la excepción apaga la fecha programada, el urgente rebota apagado, y sin recursos confirmados el despacho no nace. Residuo 0. SEEDS QUE QUEDAN (a propósito): Moto de pruebas (20/día) + turnos manana/tarde del vendedor de pruebas.';
END $$;

COMMIT;

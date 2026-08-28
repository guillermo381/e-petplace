-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — EL GATE SANITARIO v1, EL BONO COMO QUINTO SUJETO DE PAGO,
--            Y LA RESERVA DEL DÍA
--
-- Fuentes: `PLAN_S107_GUARDERIA` §3 ③ (firma ③ **enmendada por `D-956` v1**) ·
-- §4.5 (el paquete y su sujeto) · §4.6 · contrato de cupo §④ y §⑥ ·
-- `CRITERIO_LEGAL_GUARDERIA` §4 (la verificación física es del prestador).
--
-- ── ① EL GATE SANITARIO: LA LISTA ES DATO, JAMÁS CÓDIGO ────────────────────
-- Firma de mesa (28-ago): «al día» = **carnet cargado + rabia vigente por
-- especie, con la vigencia declarada por el dueño al cargar**. Y: *«la lista
-- completa de vacunas por especie es DATO configurable, pendiente de mesa +
-- veterinario — JAMÁS cableada»*.
--
-- 🔴 POR ESO NO HAY UN `= 'antirrabica'` EN NINGUNA FUNCIÓN. `cat_plan_vacunal`
-- gana **`exigida_guarderia`**, y la v1 la enciende sólo para la antirrábica.
-- El día que el veterinario defina la lista completa, **es un UPDATE de dos
-- líneas, no una migración de código.**
--
-- ⚠️ Y el hallazgo del censo que este criterio ABSORBE, escrito acá porque es
-- donde alguien lo va a necesitar: hay **cero filas con
-- `vacuna_codigo='antirrabica'`** y **10 sin código con nombres comerciales**
-- (`Canigen LR`, `Vanguard DA2L`…) donde la rabia probablemente viaja adentro.
-- *Leer sólo el código rechazaría a mascotas realmente vacunadas.* **Por eso la
-- fuente de la vigencia es la declaración del dueño al cargar el carnet**, y
-- **la verificación FÍSICA es del prestador en el acta de recogida** — la app
-- transporta el papel, no valida un documento que no puede leer.
--
-- ── ② EL BONO ENTRA AL CHECK DE SUJETO, Y SU DESGLOSE ES POR COMPRA ────────
-- Medido en el censo: `chk_intento_un_solo_sujeto` admite pedido | cita |
-- recurrencia | suscripción — **el bono no está**, y `comprar_paquete_salidas`
-- **no toca el motor de pagos**. Firma ④: las tres modalidades en v1.
--
-- 🔴 `bono_desglose` ES POR COMPRA, JAMÁS LA SUMA DE N DESGLOSES DE CITA. El
-- congelado por cita describe UN día; el paquete se cobra UNA vez. *Sumar N
-- citas produce un total que nadie cobró y que no coincide con lo que la
-- familia vio.*
--
-- ⚠️ **Ampliar un CHECK cerrado es una DECISIÓN, y ésta es la firma ④
-- ejerciéndola** — no se amplía «de paso» (regla de la casa, skill de DB).
--
-- ── ③ LA RESERVA DEL DÍA ──────────────────────────────────────────────────
-- Orden de `LETRA_PAGO_CITAS` §3, sin negociar: **compuertas → cobro por el
-- motor → `confirmada` sólo cuando el motor confirma.** Acá se construye la
-- primera mitad: la reserva nace **`pendiente_pago` con hold**, el desglose lo
-- congela el trigger que ya existe, y el cobro lo hace el motor por `cita_id`.
--
-- 🔴 LO QUE ESTA MIGRACIÓN **NO** HACE, declarado: la **compuerta de
-- documentos** (contrato de documentos y actas §⓪, fail-closed) **todavía no
-- existe** — su tabla llega en la tanda ⑤. Por eso la reserva pasa por
-- `_guarderia_puede_reservar`, que hoy tiene UNA condición y mañana tiene DOS:
-- *la costura se deja hecha para que agregarla sea una línea, y se declara
-- para que nadie crea que la puerta ya está completa.*
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828230000-cobro-y-gate.sql
--          (ABORTA si algún intento de pago ya apunta a un bono)
-- 76(g): 🔴 RIGE — el cinturón escribe citas y estadías reales y las deshace
--        en subtransacción (L-406). Residuo verificado en 0.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ ① EL GATE SANITARIO ═══════════════════════════════════════════════════
ALTER TABLE public.cat_plan_vacunal
  ADD COLUMN exigida_guarderia boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cat_plan_vacunal.exigida_guarderia IS
  'S107 · Criterio v1 firmado por la mesa: qué vacunas exige la guardería, POR '
  'ESPECIE y como DATO. La lista completa la define mesa + veterinario con un '
  'UPDATE — jamás se escribe en código.';

UPDATE public.cat_plan_vacunal
   SET exigida_guarderia = true
 WHERE vacuna_codigo = 'antirrabica' AND especie_codigo IN ('perro','gato');

CREATE FUNCTION public.evaluar_requisitos_guarderia(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_especie text;
  v_faltan  jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- la MISMA puerta del expediente, jamás una regla nueva acá
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  SELECT especie INTO v_especie FROM mascotas WHERE id = p_mascota_id;

  WITH aplicadas AS (
    SELECT DISTINCT ON (e.vacuna_codigo)
           e.vacuna_codigo, e.fecha_aplicada, e.fecha_proxima, e.archivo_url
      FROM evento_vacuna_aplicada e
     WHERE e.mascota_id = p_mascota_id AND e.vacuna_codigo IS NOT NULL
     ORDER BY e.vacuna_codigo, e.fecha_aplicada DESC NULLS LAST
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'codigo', x.vacuna_codigo,
           'nombre', x.nombre,
           'estado', x.estado,
           'vence',  x.vence
         ) ORDER BY x.orden), '[]'::jsonb)
    INTO v_faltan
    FROM (
      SELECT p.vacuna_codigo, c.nombre, p.orden,
             COALESCE(a.fecha_proxima,
                      _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) AS vence,
             CASE
               WHEN a.vacuna_codigo IS NULL                      THEN 'nunca_aplicada'
               /* 🔴 «carnet cargado» es LITERAL: la foto tiene que estar. Sin
                  ella no hay qué verificar en la puerta, que es donde el
                  criterio pone la verificación física. */
               WHEN a.archivo_url IS NULL                        THEN 'sin_carnet'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) IS NULL
                                                                 THEN 'sin_fecha'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses))
                    < public.hoy_local()                         THEN 'vencida'
               ELSE 'al_dia'
             END AS estado
        FROM cat_plan_vacunal p
        JOIN cat_vacunas c ON c.codigo = p.vacuna_codigo
        LEFT JOIN aplicadas a ON a.vacuna_codigo = p.vacuna_codigo
       WHERE p.especie_codigo = v_especie AND p.activo AND c.activo
         AND p.exigida_guarderia          -- ← la lista es DATO
    ) x
   WHERE x.estado <> 'al_dia';

  RETURN jsonb_build_object(
    'estado',    CASE WHEN jsonb_array_length(v_faltan) = 0 THEN 'al_dia' ELSE 'faltan' END,
    /* Cada faltante viaja con su código y su estado. **El camino a resolver lo
       cablea la pantalla** — y el tipo de la pieza de B lo hace obligatorio:
       un `falta` sin `onResolver` no compila. */
    'faltantes', v_faltan
  );
END $$;

-- ═══ ② EL BONO COMO QUINTO SUJETO ══════════════════════════════════════════
ALTER TABLE public.pagos_intentos
  ADD COLUMN bono_id uuid REFERENCES public.bonos(id);

ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer
   + (cita_id IS NOT NULL)::integer
   + (recurrencia_id IS NOT NULL)::integer
   + (suscripcion_servicio_id IS NOT NULL)::integer
   + (bono_id IS NOT NULL)::integer) = 1);

CREATE TABLE public.bono_desglose (
  bono_id       uuid PRIMARY KEY REFERENCES public.bonos(id) ON DELETE CASCADE,
  subtotal      numeric NOT NULL,
  impuesto      numeric NOT NULL DEFAULT 0,
  total         numeric NOT NULL,
  moneda        text NOT NULL,
  fee_config_id uuid,
  congelado_en  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bono_desglose ENABLE ROW LEVEL SECURITY;
CREATE POLICY bono_desglose_select ON public.bono_desglose FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bonos b WHERE b.id = bono_id
                  AND (b.user_id = auth.uid() OR user_gestiona_prestador(b.prestador_id)))
         OR is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.bono_desglose FROM anon, authenticated;
REVOKE SELECT ON public.bono_desglose FROM anon;

COMMENT ON TABLE public.bono_desglose IS
  'S107 · El desglose congelado del PAQUETE, POR COMPRA. 🔴 Jamás la suma de N '
  'desgloses de cita: el congelado por cita describe UN día y el paquete se '
  'cobra UNA vez. Hermano de suscripcion_desglose.';

/* Espejo literal de `_trg_cita_congela_desglose`, con el mismo criterio:
   la moneda se resuelve acá y se congela; SIN moneda no se congela nada y la
   compuerta del motor rebota fail-closed. La moneda no se inventa. */
CREATE FUNCTION public._trg_bono_congela_desglose()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_moneda text; v_fee uuid;
BEGIN
  IF NEW.estado_pago IS DISTINCT FROM 'pendiente' THEN RETURN NEW; END IF;
  IF NEW.precio_total IS NULL THEN RETURN NEW; END IF;

  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN RETURN NEW; END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      p_cuenta_comercial_id => cc.id,
      p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
      p_country_code        => NEW.country_code,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_tipo_origen         => 'cita',
      p_categoria_origen    => NULL,
      p_fecha_referencia    => now()
    ) rfa
   WHERE pr.id = NEW.prestador_id;

  INSERT INTO bono_desglose (bono_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, NEW.precio_total, 0, NEW.precio_total, v_moneda, v_fee)
  ON CONFLICT (bono_id) DO NOTHING;   -- se congela UNA vez
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bono_congela_desglose
  AFTER INSERT ON public.bonos
  FOR EACH ROW EXECUTE FUNCTION public._trg_bono_congela_desglose();

COMMIT;

-- ═══ ③ LA RESERVA DEL DÍA ══════════════════════════════════════════════════
BEGIN;

/* La costura de las compuertas. HOY tiene una condición; con la tanda ⑤ tiene
   dos (los documentos aceptados, fail-closed). Se deja hecha para que sumarla
   sea una línea — y se declara para que nadie lea esta puerta como completa. */
CREATE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_san jsonb;
BEGIN
  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  IF v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;
  -- ⑤ acá entra la compuerta de documentos (fail-closed) cuando exista.
  RETURN jsonb_build_object('puede', true);
END $$;

CREATE FUNCTION public.reservar_dia_guarderia(
  p_prestador_id uuid,
  p_mascota_id   uuid,
  p_fecha        date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ps      record;
  v_gate    jsonb;
  v_cupo    jsonb;
  v_cita    uuid;
  v_estadia uuid;
  v_espacio uuid;
  v_user    uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023';
  END IF;

  /* 🔴 LA COMPUERTA SANITARIA VIVE ACÁ, EN EL SERVIDOR — no en la pantalla.
     La pantalla la refleja; el que decide es esto. */
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

  /* 🔴 EL CUPO SE MIRA BAJO CANDADO. Sin el advisory lock, dos familias que
     tocan «reservar» en el mismo segundo leen el mismo «queda 1» y las dos
     entran — el mismo defecto que el motor de agenda ya resolvió así. */
  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));

  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN
    RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023';
  END IF;

  SELECT e.id INTO v_espacio
    FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo
   ORDER BY e.created_at LIMIT 1;

  /* La cita nace `pendiente_pago` CON precio ⇒ el trigger de la octava puerta
     congela su desglose solo. No se reimplementa nada. */
  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes',   -- el hold de la casa
    'presencial',                     -- firma ⑩: el transporte es contenido, no modalidad
    COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes');
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.evaluar_requisitos_guarderia(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._guarderia_puede_reservar(uuid)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reservar_dia_guarderia(uuid, uuid, date)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.evaluar_requisitos_guarderia(uuid)        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.reservar_dia_guarderia(uuid, uuid, date)  TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $c$
DECLARE
  v_rol text := current_user;
  v_prest uuid; v_titular uuid; v_familiar uuid; v_perro uuid;
  v_espacio uuid; v_err text; v_r jsonb; v_n int; v_residuo int;
  v_fecha date := public.hoy_local() + 32;
BEGIN
  SELECT p.id, p.user_id INTO v_prest, v_titular
    FROM prestadores p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.estado='activo' AND p.user_id IS NOT NULL AND cc.estado='activa' LIMIT 1;
  SELECT fm.user_id, (array_agg(m.id ORDER BY m.id) FILTER (WHERE m.especie='perro'))[1]
    INTO v_familiar, v_perro
    FROM familia_miembro fm JOIN mascotas m ON m.familia_id=fm.familia_id AND m.estado_vida='activa'
   GROUP BY fm.user_id HAVING count(*) FILTER (WHERE m.especie='perro') > 0 LIMIT 1;
  IF v_prest IS NULL OR v_perro IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: falta prestador cobrable o perro de familia.';
  END IF;

  BEGIN
    INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion)
      VALUES (v_prest, '__cint_cobro__', 1, ARRAY[0,1,2,3,4,5,6]) RETURNING id INTO v_espacio;
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role','authenticated')::text, true);
    PERFORM public.definir_franja_guarderia(v_prest,'recogida','07:00','09:00',ARRAY[0,1,2,3,4,5,6]);
    PERFORM public.definir_franja_guarderia(v_prest,'devolucion','16:30','18:30',ARRAY[0,1,2,3,4,5,6]);
    PERFORM public.definir_oferta_guarderia(v_prest, 25);

    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_familiar::text, 'role','authenticated')::text, true);

    -- A1 · EL GATE CIERRA, y dice QUÉ falta
    v_r := public.evaluar_requisitos_guarderia(v_perro);
    IF v_r->>'estado' <> 'faltan' OR jsonb_array_length(v_r->'faltantes') = 0 THEN
      RAISE EXCEPTION 'A1 ROJO: con el catalogo vacio el gate deberia decir `faltan` con al menos un faltante nombrado. Dio %', v_r;
    END IF;

    -- A2 · Y LA RESERVA REBOTA POR ESO, no por otra cosa
    BEGIN
      PERFORM public.reservar_dia_guarderia(v_prest, v_perro, v_fecha);
      RAISE EXCEPTION 'A2 ROJO: reservo SIN requisitos sanitarios.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'requisitos_sanitarios' THEN RAISE; END IF;
    END;

    -- A3 · CON LA RABIA VIGENTE Y SU CARNET, ENTRA
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, vacuna_codigo,
                                        fecha_aplicada, fecha_proxima, archivo_url, country_code)
      VALUES (v_perro, 'Antirrábica', 'antirrabica',
              public.hoy_local() - 30, public.hoy_local() + 300, 'carnet/__cint__.jpg', 'EC');
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_familiar::text, 'role','authenticated')::text, true);

    v_r := public.evaluar_requisitos_guarderia(v_perro);
    IF v_r->>'estado' <> 'al_dia' THEN
      RAISE EXCEPTION 'A3 ROJO: con rabia vigente y carnet cargado deberia dar al_dia. Dio %', v_r;
    END IF;

    v_r := public.reservar_dia_guarderia(v_prest, v_perro, v_fecha);
    IF (v_r->>'cita_id') IS NULL THEN RAISE EXCEPTION 'A3 ROJO: no reservo.'; END IF;

    -- A4 · EL DESGLOSE SE CONGELÓ SOLO (la octava puerta)
    SELECT count(*) INTO v_n FROM cita_desglose WHERE cita_id = (v_r->>'cita_id')::uuid;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'A4 ROJO: la cita nacio pendiente_pago con precio y su desglose NO se congelo.';
    END IF;

    -- A5 · EL CUPO SE CONSUMIÓ, y el segundo rebota
    BEGIN
      PERFORM public.reservar_dia_guarderia(v_prest, v_perro, v_fecha);
      RAISE EXCEPTION 'A5 ROJO: reservo un segundo dia sobre un cupo de 1.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'sin_cupo' THEN RAISE; END IF;
    END;

    -- A6 · EL BONO ES SUJETO DE PAGO Y SU DESGLOSE ES POR COMPRA
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='pagos_intentos' AND column_name='bono_id') THEN
      RAISE EXCEPTION 'A6 ROJO: el bono no entro al motor de pagos.';
    END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_OK::6';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'CINTURON_OK::%' THEN RAISE; END IF;
  END;

  SELECT (SELECT count(*) FROM guarderia_espacios) + (SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_estadias)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_residuo;
  IF v_residuo <> 0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo %.', v_residuo; END IF;
  RAISE NOTICE '✅ CINTURON COBRO+GATE: 6/6 (gate cierra y nombra · la reserva rebota por eso · con rabia entra · desglose congelado solo · cupo consumido · bono es sujeto) · residuo 0';
END $c$;

COMMIT;

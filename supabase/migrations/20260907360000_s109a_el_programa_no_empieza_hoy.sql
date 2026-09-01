-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL PROGRAMA NO EMPIEZA HOY, Y AHORA LO DICE ASÍ
--
-- 76(g) VEDA: **NO RIGE.** Un reemplazo de función. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M35.sql`.
--
-- ═══ EL BORDE, medido por S109-C ══════════════════════════════════════════
-- El founder firmó **quitar el paso del QUÉ** de adiestramiento ⇒ la tira de
-- días arranca HOY (lo permisivo, que es la sesión suelta). Pero
-- `contratar_programa` **rechaza hoy** por §12.2 — el cierre exige aire entre
-- la compra y la sesión 1.
-- ⇒ **La vitrina ofrecería un programa que el motor va a rechazar**, y el
--   rebote llega **con el dedo sobre «pagar»**. C lo cubre en la superficie,
--   derivándolo del guard y sin tocar el motor, que es lo correcto.
--
-- 🔴 **PERO EL CÓDIGO MENTÍA SOBRE LA RAZÓN, y eso es del motor.** Los dos
--    casos —pasado y hoy— rebotaban `slot_en_pasado`, **y HOY no es pasado**:
--    la familia elegía hoy y leía que había elegido una hora que ya pasó.
--    *Un código que miente sobre la razón manda a buscar el problema donde no
--    está.* Es exactamente la cura que `riel_no_declarado` recibió hoy en otro
--    sujeto, y por la misma razón.
--
-- ⚠️ **LA REGLA NO CAMBIA: un programa sigue sin poder empezar hoy.** Cambia
--    lo que se DICE. Y el filtro de la superficie sigue haciendo falta —
--    *que el rebote sea honesto no lo vuelve aceptable con el dedo sobre
--    «pagar»*: la puerta no ofrece lo que va a rechazar (Ley 23), y el código
--    nuevo es la red para la carrera de la medianoche.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.contratar_programa(p_prestador_id uuid, p_servicio_id uuid, p_programa_id uuid, p_mascota_id uuid, p_fecha_inicio date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_programa  record;
  v_cuenta    record;
  v_fee       uuid;
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_pagado_en timestamptz := now();
  v_vigencia  date;
  v_unitario  numeric(14,2);
  v_pc_id     uuid;
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_hora IS NULL OR p_fecha_inicio IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  -- §12.2: todas al comprar — el arranque jamás en el pasado ni hoy
  -- (el gate temporal del cierre exige aire entre compra y sesión 1).
  /* 🔴 DOS RECHAZOS DISTINTOS QUE DECÍAN LO MISMO. La regla de §12.2 es que el
     arranque no puede ser ni pasado NI HOY — pero el rebote era `slot_en_pasado`
     para los dos casos, y **HOY no es pasado**: la familia elegía hoy y leía que
     había elegido una hora que ya pasó. *Un código que miente sobre la razón
     manda a buscar el problema donde no está* — la misma cura que
     `riel_no_declarado` recibió hoy, en otro sujeto.
     ⚠️ La REGLA no cambia: sigue sin poder empezar hoy. Cambia lo que se dice. */
  IF p_fecha_inicio < v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  IF p_fecha_inicio = v_hoy_local THEN
    RAISE EXCEPTION 'programa_no_empieza_hoy' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'adiestramiento' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- §1bis heredado (F3 S57): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  SELECT pp.* INTO v_programa
  FROM prestador_programas pp
  WHERE pp.id = p_programa_id AND pp.prestador_servicio_id = p_servicio_id AND pp.activo;
  IF v_programa.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- una matrícula ACTIVA del mismo programa por mascota
  IF EXISTS (
    SELECT 1 FROM programas_contratados pc
    WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = 'activo'
      /* 🔴 Y PAGADO — la forma del bono. Sin esta línea, un intento que la
         compuerta rebota deja una fila `activo`+`pendiente` que bloquea el
         siguiente intento PARA SIEMPRE. El pendiente sigue existiendo y
         viéndose: lo que deja de hacer es contar. */
      AND pc.estado_pago = 'pagado'
  ) THEN
    RAISE EXCEPTION 'programa_duplicado' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  --    confirmar_cita_pagada): un cobro que el motor rechazará al
  --    cierre es un cobro que promete mentira.
  SELECT cc.id, cc.estado INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = p_prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    (SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id),
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- vigencia congelada A LA FECHA DE COMPRA (decisión founder S63)
  v_vigencia := v_hoy_local + v_programa.vigencia_dias;
  v_unitario := round(v_programa.precio_programa / v_programa.n_sesiones, 2);

  -- UN cobro simulado DECLARADO por el programa entero (jamás el ledger).
  INSERT INTO programas_contratados (
    programa_id, user_id, mascota_id, prestador_id, prestador_servicio_id,
    n_sesiones, precio_total, precio_unitario_efectivo, duracion_minutos,
    vigencia_hasta, estado, estado_pago, country_code, pago_metadata,
    /* 🔴 LA FECHA Y LA HORA SE PERSISTEN, y antes no hacía falta: las sesiones
       nacían en el mismo acto que la compra. Con el cobro real la confirmación
       es ASINCRÓNICA — *quien la aplica no puede preguntarle a nadie cuándo
       empieza el programa.* Mismo criterio que la dirección del mandato. */
    fecha_inicio, hora, pago_expira_en
  ) VALUES (
    p_programa_id, v_auth, p_mascota_id, p_prestador_id, p_servicio_id,
    v_programa.n_sesiones, v_programa.precio_programa, v_unitario,
    v_programa.duracion_minutos_sesion,
    v_vigencia, 'activo', 'pendiente',
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    /* ☠️ MUERE `pago_simulado`: el programa cobra por el riel de verdad. */
    '{}'::jsonb,
    p_fecha_inicio, p_hora, now() + interval '15 minutes'
  ) RETURNING id INTO v_pc_id;

  /* ═══ LAS SESIONES YA NO NACEN ACÁ ══════════════════════════════════════
     🔴 Generarlas al comprar era **dar la agenda antes de cobrar**: N horas de
     un profesional comprometidas por un pago que todavía no ocurrió. Nacen en
     `confirmar_pago_programa`, cuando la plata entró.

     Lo que sí corre acá es el **ENSAYO**: `verificar_compuerta_programa` ejecuta
     la generación REAL en una subtransacción que se deshace. *Una validación que
     reimplementa las razones del acto se separa de él en el tercer cambio; un
     ensayo del acto no puede divergir de él porque ES él.*
     ⚠️ Y el ensayo se repite en la puerta de pago, inmediatamente antes del
     débito: entre esta llamada y el cobro pasa el tiempo que la familia tarda en
     tocar «pagar», y la agenda puede llenarse en el medio. */
  v_generadas := (public.verificar_compuerta_programa(v_pc_id)->>'sesiones')::int;
  IF v_generadas <> v_programa.n_sesiones THEN
    RAISE EXCEPTION 'programa_incompleto' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'programa_contratado_id', v_pc_id,
    'estado_pago', 'pendiente',
    'cobro_pendiente', true,
    'pago_expira_en', now() + interval '15 minutes',
    'n_sesiones', v_programa.n_sesiones,
    'primera_sesion', p_fecha_inicio,
    'ultima_sesion', p_fecha_inicio + ((v_programa.n_sesiones - 1) * 7),
    'vigencia_hasta', v_vigencia,
    'precio_total', v_programa.precio_programa,
    'precio_unitario_efectivo', v_unitario,
    'nota', 'programa registrado — las sesiones se agendan cuando el pago se confirme'
  );
END;
$function$;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cint$
DECLARE d text;
BEGIN
  SELECT regexp_replace(regexp_replace(pg_get_functiondef(p.oid),'/\*.*?\*/','','gs'),'--[^\n]*','','g')
    INTO d FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_programa';

  IF d !~ 'programa_no_empieza_hoy' THEN
    RAISE EXCEPTION 'CINTURON ①: HOY sigue rebotando como slot_en_pasado, y hoy NO es pasado';
  END IF;
  RAISE NOTICE 'CINTURON ① OK - hoy tiene su propio codigo';

  /* ② DISCRIMINADOR: el pasado REAL sigue rebotando slot_en_pasado. La cura de
     la voz no puede haberse llevado puesta la regla. */
  IF d !~ 'slot_en_pasado' THEN
    RAISE EXCEPTION 'CINTURON ②: se perdio el rebote del pasado real';
  END IF;
  IF d !~ 'p_fecha_inicio < v_hoy_local' OR d !~ 'p_fecha_inicio = v_hoy_local' THEN
    RAISE EXCEPTION 'CINTURON ②: los dos brazos no quedaron separados — la regla de 12.2 cambio de alcance';
  END IF;
  RAISE NOTICE 'CINTURON ② OK - el pasado sigue siendo pasado y la regla no se movio';

  RAISE NOTICE 'CINTURON VERDE - 2 brazos';
END $cint$;

COMMIT;

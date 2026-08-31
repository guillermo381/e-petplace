-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL RETORNO DEJA DE PROMETER SALDO — sin romper a su consumidor
--
-- 76(g) VEDA: **NO RIGE.** Un reemplazo. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M28.sql`.
--
-- ═══ LA CLASE QUE MIDIÓ S108-C, Y ES DE MÉTODO ═════════════════════════════
-- 🔴 *Un cambio de motor que QUITA un campo del retorno no rompe el SQL ni la
--    migración — **rompe al validador del consumidor**, que sigue exigiéndolo y
--    convierte un éxito en error.* Ningún typecheck lo ve: el campo era
--    `unknown` de un `jsonb`.
--    Lo cobró mi propio `contratar_programa`: al dejar de devolver `pagado_en`,
--    `contratarPrograma` empezó a caer en `datos_inconsistentes` **sobre
--    programas que sí se creaban**. C lo curó del lado del wrapper.
--
-- ✅ CENSO CORRIDO SOBRE MIS 20 MIGRACIONES, campo por campo, contra los
--    validadores DUROS de `packages/api` (los que rechazan, no los que leen
--    blando): **`pagado_en` de `confirmar_cita_pagada` — función que NO toqué**
--    · **`ultima_sesion` y `precio_unitario_efectivo` de `contratar_programa` —
--    los dos SIGUEN en el retorno**, medido. Cero rupturas más.
--
-- ═══ PERO EL CENSO ENCONTRÓ OTRA COSA, Y ES MÍA ════════════════════════════
-- 🔴 `comprar_paquete_salidas` seguía devolviendo **`saldo_total` y
--    `pagado_en`** sobre un bono que ahora nace `pendiente` y **no otorga una
--    sola salida**. *La pantalla le dice a la familia que tiene saldo, la puerta
--    del día le dice que no, y las dos le parecen ciertas.*
--    Es el mismo verosímil-falso que ya se curó en el paquete de guardería —
--    sobrevivió porque aquella cura tocó su función y ésta no.
--
-- ⇒ **Se corrige SIN QUITAR NINGUNA CLAVE.** `saldo_total` pasa a `0` (que es la
--   verdad), `pagado_en` a `NULL`, y lo que era proyección gana nombre propio al
--   lado. *Cambiar el valor no rompe a nadie; quitar la clave, sí.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE OR REPLACE FUNCTION public.comprar_paquete_salidas(p_prestador_id uuid, p_servicio_id uuid, p_unidades integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_familia     uuid;
  v_country     text;
  v_servicio    record;
  v_cuenta      record;
  v_fee         uuid;
  v_hoy_local   date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_vence       date;
  v_pagado_en   timestamptz := now();
  v_total       numeric(14,2);
  v_bono_id     uuid;
  v_rollover    record;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- El paquete es DEL HOGAR (v1.4): la familia vigente del comprador.
  SELECT fm.familia_id INTO v_familia
  FROM familia_miembro fm
  WHERE fm.user_id = v_auth AND fm.hasta IS NULL
  LIMIT 1;
  IF v_familia IS NULL THEN
    RAISE EXCEPTION 'sin_familia' USING ERRCODE = '22023';
  END IF;
  -- Presets EN LETRA (§6bis.1): 5 · 10 · 15.
  IF p_unidades IS NULL OR p_unidades NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'preset_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio_paquete, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL OR v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.precio_paquete IS NULL OR v_servicio.precio_paquete <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón S54).
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
  -- el país del cobro: el del hogar (fallback prestador — jamás inventado)
  SELECT COALESCE(f.country_code, pr.country_code, 'EC') INTO v_country
  FROM familia f, prestadores pr
  WHERE f.id = v_familia AND pr.id = p_prestador_id;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    v_country, 'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  v_vence := (v_hoy_local + interval '1 month')::date;
  v_total := round(v_servicio.precio_paquete * p_unidades, 2);

  -- ROLLOVER (P16e) — ahora POR HOGAR: lock primero (FOR UPDATE no
  -- convive con agregados), conteo después.
  PERFORM 1
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local
  FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total - unidades_usadas), 0)::int AS salidas
  INTO v_rollover
  FROM bonos b
  WHERE b.familia_id = v_familia
    AND b.prestador_id = p_prestador_id AND b.prestador_servicio_id = p_servicio_id
    AND b.tipo_servicio = 'paseo' AND b.estado = 'activo' AND b.estado_pago = 'pagado'
    AND b.unidades_usadas < b.unidades_total
    AND b.fecha_vencimiento >= v_hoy_local;

  -- UN pago simulado DECLARADO (jamás toca el ledger). COMPRAR NO ES
  -- RESERVAR: este INSERT a bonos es la ÚNICA escritura — cero citas.
  INSERT INTO bonos (
    prestador_id, user_id, familia_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago,
    country_code, prestador_servicio_id, pago_metadata,
    pago_expira_en
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'paseo',
    'Paquete de ' || p_unidades || ' salidas de ' || v_servicio.duracion_minutos || ''' (vigencia mensual, del hogar)',
    p_unidades, 0, v_servicio.duracion_minutos,
    v_total, v_servicio.precio_paquete,
    v_hoy_local, v_vence, 'activo', 'pendiente',
    v_country, p_servicio_id,
    jsonb_build_object('salidas_rollover_proyectadas', v_rollover.salidas),
    /* La misma ventana de 15 minutos que el paquete de guardería y que la
       cita: es la que la familia ya conoce del checkout. */
    now() + interval '15 minutes'
  ) RETURNING id INTO v_bono_id;

  /* ═══ EL ROLLOVER SE MUDÓ A `confirmar_pago_bono` ══════════════════════
     🔴 Vivía acá, en el ACTO DE COMPRAR. Con el bono naciendo `pendiente` eso
     REGALA vigencia por plata que todavía no llegó — y si el pago nunca llega,
     la extensión queda igual. Es el mismo defecto que ya se curó en guardería.
     Su nueva casa lo resuelve POR TIPO: el de paseo filtra además por
     `prestador_servicio_id`, que es la diferencia real entre las dos reglas.
     *Se mudó ANTES de tocar este estado inicial, a propósito: al revés se
     perdía en silencio.* */

  RETURN jsonb_build_object(
    'ok', true,
    'bono_id', v_bono_id,
    'unidades', p_unidades,
    'precio_por_unidad', v_servicio.precio_paquete,
    'total', v_total,
    'vence_el', v_vence,
    /* 🔴 EL RETORNO DEJA DE AFIRMAR SALDO Y PAGO. El bono nace `pendiente` y
       **no otorga una sola salida**: decir `saldo_total` y `pagado_en` acá era
       el mismo verosímil-falso que ya se curó en el paquete de guardería.
       *La pantalla que lea esto va a decirle a la familia que tiene saldo, y la
       puerta del día le va a decir que no — y las dos le van a parecer ciertas.*

       ⚠️ Y LOS TRES CAMPOS SE CONSERVAN CON SU NOMBRE, renombrando sólo lo que
       cambia de significado: quitar una clave de un retorno **no rompe el SQL —
       rompe al validador del consumidor**, que sigue exigiéndola y convierte un
       éxito en error. *Es la clase que S108-C midió sobre `contratar_programa`:
       ninguna migración falla, ninguna pantalla compila mal, y la familia ve un
       error sobre algo que sí se creó.* Por eso `salidas_rollover` sigue
       existiendo y lo que se declara aparte es que es una PROYECCIÓN. */
    'salidas_rollover', v_rollover.salidas,
    'salidas_rollover_proyectadas', v_rollover.salidas,
    'saldo_total', 0,
    'saldo_proyectado', p_unidades + v_rollover.salidas,
    'estado_pago', 'pendiente',
    'cobro_pendiente', true,
    'pago_expira_en', now() + interval '15 minutes',
    'pagado_en', NULL
  );
END;
$function$

;

DO $c$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='comprar_paquete_salidas'
     AND regexp_replace(regexp_replace(p.prosrc,'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         LIKE '%''saldo_total'', 0%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el retorno sigue afirmando saldo'; END IF;

  -- 🔴 Y NINGUNA CLAVE DESAPARECIO — es lo que impide romper al consumidor
  FOREACH v_n IN ARRAY ARRAY[1] LOOP END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='comprar_paquete_salidas'
                    AND p.prosrc LIKE '%''salidas_rollover''%'
                    AND p.prosrc LIKE '%''saldo_total''%'
                    AND p.prosrc LIKE '%''pagado_en''%') THEN
    RAISE EXCEPTION 'cinturon: se QUITO una clave del retorno — rompe al validador';
  END IF;

  RAISE NOTICE 'cinturon M28: 2/2 OK (el retorno dice saldo 0, que es la verdad · CERO claves quitadas)';
END $c$;

COMMIT;

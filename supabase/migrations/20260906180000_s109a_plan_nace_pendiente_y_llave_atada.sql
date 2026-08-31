-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL PLAN DE PASEO NACE PENDIENTE, Y LA LLAVE QUEDA ATADA AL GATE
--
-- 76(g) VEDA: **NO RIGE.** Un reemplazo + una función de guard. **Cero
--   backfill**: la suscripción viva queda `activa`/`pagado` donde está.
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M26.sql`.
-- L-119: la firma gana `p_riel` y `p_tarjeta_id`, los dos con DEFAULT ⇒ los
--   llamadores vivos compilan; igual va DROP explícito de la vieja.
--
-- ═══ ① EL ÚLTIMO SUJETO QUE NACÍA PAGADO ═══════════════════════════════════
-- Con esto los CUATRO comprables nacen `pendiente`: bono de guardería, paquete
-- de paseo, programa y plan. **Ninguno otorga antes de que la plata entre.**
--
-- 🔴 Y las citas del período **dejan de nacer al contratar**: comprometían la
--    agenda del paseador antes de cobrar. Nacen en `confirmar_pago_plan_paseo`.
--    Lo que corre al contratar es el **ENSAYO** del acto real, en subtransacción
--    que se deshace — la pieza de S108-B aplicada al cuarto sujeto.
--
-- ═══ ② LA LLAVE QUEDA ATADA AL GATE DE SELECTORES ══════════════════════════
-- 🔴 Orden del founder: *la condición de muerte del gate rojo de B va al
--    CINTURÓN, no a la memoria de nadie.*
--    `verify-selectores-recurrentes` sale rojo porque
--    `mensualidades_vencidas_pendientes` existe en la base y la edge no lo
--    consume ⇒ **el día que la llave se encienda, el cron suena, la edge corre
--    sus dos de siempre, la mensualidad no se cobra, y el timbre devuelve
--    `ok:true`.** *Hoy ese rojo es honesto sólo mientras alguien lo esté
--    mirando.*
-- ⇒ `guarderia_recurrente_vivo()` deja de leer sólo la clave: **exige también
--   que todo selector de la base tenga consumidor.** Si falta uno, la llave
--   está encendida y el motor **sigue apagado, diciendo por qué**.
--   *Un interruptor que se puede poner en «sí» mientras el circuito está
--   cortado no es un interruptor: es una etiqueta.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.contratar_plan_paseo(uuid,uuid,uuid,smallint[],time without time zone,text,boolean,date);

CREATE OR REPLACE FUNCTION public.contratar_plan_paseo(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_dias smallint[], p_hora time without time zone, p_frecuencia text, p_auto_renovar boolean DEFAULT true, p_fecha_inicio date DEFAULT NULL::date, p_riel text DEFAULT 'tarjeta'::text, p_tarjeta_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_cuenta    record;
  v_fee       uuid;
  v_dias      smallint[];
  v_inicio    date;
  v_fin       date;
  v_n         int;
  v_total     numeric(14,2);
  v_unitario  numeric(14,2);
  v_susc_id   uuid;
  v_pagado_en timestamptz := now();
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_frecuencia IS NULL OR p_frecuencia NOT IN ('semanal','quincenal','mensual') THEN
    RAISE EXCEPTION 'frecuencia_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_hora IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT d ORDER BY d) INTO v_dias
  FROM unnest(COALESCE(p_dias, ARRAY[]::smallint[])) AS d
  WHERE d BETWEEN 0 AND 6;
  IF v_dias IS NULL OR array_length(v_dias, 1) IS NULL THEN
    RAISE EXCEPTION 'dias_invalidos' USING ERRCODE = '22023';
  END IF;

  -- §6.1 v1.5 (founder S59, regla DURA): EL PLAN ES DE LUNES A VIERNES.
  IF EXISTS (SELECT 1 FROM unnest(v_dias) d WHERE d NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'plan_dia_no_laborable' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.precio_mensual_plan, ps.duracion_minutos
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL OR v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0
     OR v_servicio.precio IS NULL OR v_servicio.precio < 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- REFORMA S79 (enmienda ① de mesa): sin precio mensual DECLARADO no
  -- hay plan que contratar — la ley del radio. Muere por omisión el
  -- COALESCE(precio_plan, precio): el per-cita jubilado no revive.
  IF v_servicio.precio_mensual_plan IS NULL THEN
    RAISE EXCEPTION 'plan_no_ofrecido' USING ERRCODE = '22023';
  END IF;

  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- D-657 (b-bis): el motor consulta estado_vida en las DOS bocas del plan
  -- (renovar Y contratar). Un plan nuevo para una mascota no activa es el
  -- mismo cobro con otra puerta. Mismo código de rebote: el wrapper ya lo mapea.
  IF EXISTS (SELECT 1 FROM mascotas m
              WHERE m.id = p_mascota_id AND m.estado_vida IS DISTINCT FROM 'activa') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  IF NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM suscripciones_servicio s
    WHERE s.mascota_id = p_mascota_id AND s.prestador_id = p_prestador_id
      AND s.tipo_servicio = 'paseo_mensual' AND s.estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'plan_duplicado' USING ERRCODE = '22023';
  END IF;

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

  v_inicio := COALESCE(p_fecha_inicio, v_hoy_local + 1);
  IF v_inicio <= v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;
  /* ═══ EL RIEL, y la misma ley que la mensualidad ════════════════════════
     🟢 *El cobro recurrente va sólo con tarjeta; DeUna emite un link cada mes.*
     Un plan de DeUna **no tiene tarjeta que guardar**, y aceptarle una dejaría
     una autorización viva sin acto que la consuma. */
  IF p_riel NOT IN ('tarjeta','deuna') THEN
    RAISE EXCEPTION 'riel_no_valido: %', p_riel USING ERRCODE='22023';
  END IF;
  IF p_riel = 'tarjeta' AND p_tarjeta_id IS NULL THEN
    RAISE EXCEPTION 'plan_de_tarjeta_sin_tarjeta' USING ERRCODE='22023';
  END IF;
  IF p_riel = 'deuna' AND p_tarjeta_id IS NOT NULL THEN
    RAISE EXCEPTION 'deuna_no_lleva_tarjeta' USING ERRCODE='22023';
  END IF;
  IF p_tarjeta_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                      WHERE t.id = p_tarjeta_id AND t.user_id = v_auth AND t.estado='guardada') THEN
    /* La tarjeta tiene que ser de quien autoriza y estar viva: autorizar un
       cobro recurrente sobre la tarjeta de otro es lo que la raíz de
       autorización existe para impedir. */
    RAISE EXCEPTION 'tarjeta_no_utilizable' USING ERRCODE='22023';
  END IF;

  SELECT min(f) INTO v_inicio FROM _fechas_periodo_plan(v_inicio, v_dias, 'semanal') f;
  IF v_inicio IS NULL THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;
  v_fin := (v_inicio + interval '1 month')::date;

  SELECT count(*) INTO v_n FROM _fechas_periodo_plan(v_inicio, v_dias, p_frecuencia);
  IF v_n = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- REFORMA S79: EL MES ES EL MES — total FIJO del período; el unitario
  -- es DERIVADO (mensual/N, base del devengo variante b) y NO estable
  -- entre períodos (N varía con el mes — declarado en letra).
  v_total    := round(v_servicio.precio_mensual_plan, 2);
  v_unitario := round(v_total / v_n, 2);

  INSERT INTO suscripciones_servicio (
    user_id, mascota_id, prestador_id, prestador_servicio_id, empleado_id,
    tipo_servicio, estado, estado_pago, periodo_inicio, periodo_fin,
    precio_mensual, precio_pagado, proximo_cobro_en, auto_renovar,
    dias_semana, hora, duracion_minutos, frecuencia, precio_unitario_efectivo,
    country_code, activado_en, pago_metadata, riel, tarjeta_id, pago_expira_en
  ) VALUES (
    v_auth, p_mascota_id, p_prestador_id, v_servicio.id, NULL,
    'paseo_mensual', 'pendiente', 'pendiente', v_inicio, v_fin,
    v_total, v_total, v_fin, COALESCE(p_auto_renovar, true),
    v_dias, p_hora, v_servicio.duracion_minutos, p_frecuencia, v_unitario,
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    now(),
    '{}'::jsonb,
    /* ☠️ MUERE el cobro simulado: el plan cobra por el riel de verdad. */
    p_riel, p_tarjeta_id, now() + interval '15 minutes'
  ) RETURNING id INTO v_susc_id;

  /* ═══ LAS CITAS YA NO NACEN ACÁ ═════════════════════════════════════════
     🔴 Generarlas al contratar era comprometer la agenda del paseador antes de
     cobrar. Nacen en `confirmar_pago_plan_paseo`. Lo que corre acá es el ENSAYO
     del acto real, en una subtransacción que se deshace. */
  v_generadas := COALESCE((public.verificar_compuerta_plan(v_susc_id)->>'citas')::int, 0);
  IF v_generadas = 0 THEN
    RAISE EXCEPTION 'plan_sin_citas' USING ERRCODE = '22023';
  END IF;

  -- REFORMA S79: si el filtro de pasado descartó fechas, el TOTAL NO
  -- CAMBIA (el mes es el mes) — solo el unitario derivado se recalcula
  -- sobre lo REAL generado, y las citas re-snapshotean.
  IF v_generadas <> v_n THEN
    v_unitario := round(v_total / v_generadas, 2);
    UPDATE suscripciones_servicio
    SET precio_unitario_efectivo = v_unitario
    WHERE id = v_susc_id;
    UPDATE evento_cita_servicio SET precio = v_unitario
    WHERE suscripcion_servicio_id = v_susc_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'estado_pago', 'pendiente',
    'cobro_pendiente', true,
    'riel', p_riel,
    'suscripcion_id', v_susc_id,
    'periodo_inicio', v_inicio,
    'periodo_fin', v_fin,
    'citas_generadas', v_generadas,
    'total_periodo', v_total,
    'precio_unitario_efectivo', v_unitario,
    'auto_renovar', COALESCE(p_auto_renovar, true),
    'pagado_en', v_pagado_en
  );
END;
$function$

;

REVOKE EXECUTE ON FUNCTION public.contratar_plan_paseo(uuid,uuid,uuid,smallint[],time without time zone,text,boolean,date,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratar_plan_paseo(uuid,uuid,uuid,smallint[],time without time zone,text,boolean,date,text,uuid) TO authenticated;

-- ── LA LLAVE, ATADA ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guarderia_recurrente_vivo()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_val text; v_huerfanos int;
BEGIN
  SELECT valor INTO v_val FROM app_config WHERE clave = 'guarderia_recurrente_vivo';
  IF COALESCE(v_val,'false') <> 'true' THEN RETURN false; END IF;

  /* 🔴 LA CONDICIÓN DE MUERTE DEL GATE DE S108-B, EN EL MOTOR Y NO EN UNA NOTA.
     Un selector que la base tiene y ningún consumidor llama hace que el cron
     devuelva `ok:true` **sin cobrar ese sujeto** — y eso se lee igual que «no
     había nada que cobrar». *El rojo de un gate protege mientras alguien lo
     mira; acá el motor se niega solo.* */
  SELECT count(*) INTO v_huerfanos
    FROM cat_sujetos_de_pago c
   WHERE c.codigo IN ('mensualidad_guarderia','suscripcion_servicio','recurrencia')
     AND NOT EXISTS (
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'guarderia_recurrente_consumido'
     )
     AND c.codigo = 'mensualidad_guarderia'
     AND NOT EXISTS (SELECT 1 FROM app_config a
                      WHERE a.clave = 'selector_mensualidad_cableado' AND a.valor = 'true');
  IF v_huerfanos > 0 THEN
    /* Encendida y cortada: el motor lo dice y no corre. */
    RETURN false;
  END IF;

  RETURN true;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.guarderia_recurrente_vivo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guarderia_recurrente_vivo() TO authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_n int;
BEGIN
  -- (a) UNA sola firma
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_plan_paseo';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: quedaron % sobrecargas de contratar_plan_paseo', v_n; END IF;

  -- (b) 🔴 NACE PENDIENTE, medido sobre el cuerpo SIN COMENTARIOS
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_plan_paseo'
     AND regexp_replace(regexp_replace(p.prosrc,'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         LIKE '%''pendiente'', ''pendiente''%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el plan NO nace pendiente'; END IF;

  -- (c) y ya NO genera citas al contratar
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_plan_paseo'
     AND regexp_replace(regexp_replace(p.prosrc,'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         LIKE '%_generar_citas_plan(%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: el plan sigue generando citas al contratar'; END IF;

  -- (d) 🔴 LA LLAVE: apagada da false, y ENCENDIDA CON EL SELECTOR HUERFANO
  --     TAMBIEN da false. Sin el segundo brazo, «atada» seria una palabra.
  IF public.guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon: la llave apagada no lee false';
  END IF;
  UPDATE app_config SET valor='true' WHERE clave='guarderia_recurrente_vivo';
  IF public.guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon: la llave ENCENDIDA corrio con el selector huerfano';
  END IF;
  -- y con el selector declarado cableado, recien ahi enciende
  INSERT INTO app_config (clave, valor) VALUES ('selector_mensualidad_cableado','true')
    ON CONFLICT (clave) DO UPDATE SET valor='true';
  IF public.guarderia_recurrente_vivo() IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: con todo cableado y encendida, sigue apagada';
  END IF;

  RAISE NOTICE 'cinturon M26: 5/5 OK (una firma · nace pendiente · no genera citas · la llave apagada da false · ENCENDIDA con selector huerfano TAMBIEN da false)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M26: fixture deshecho — la llave vuelve a false, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;

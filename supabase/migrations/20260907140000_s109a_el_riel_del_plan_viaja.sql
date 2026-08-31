-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL RIEL DEL PLAN VIAJA, Y EL LINK GANA RELOJ
--
-- 76(g) VEDA: **NO RIGE.** Dos reemplazos de función + un cron. Cero backfill,
--   cero DDL de datos. El único plan vivo NO se toca: su `riel` sigue NULL y
--   eso es el hecho — se contrató antes de que el riel existiera.
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M28.sql`.
-- L-119: las dos conservan su firma exacta ⇒ `CREATE OR REPLACE` sin sobrecarga.
--
-- ═══ LOS DOS HUECOS, medidos contra el objeto ══════════════════════════════
-- 🔴 ① **EL RIEL EXISTE EN LA TABLA Y NO VIAJA AL QUE DECIDE.**
--    `suscripciones_servicio.riel` está desde `20260906120000`, y
--    `planes_vencidos_pendientes` **no lo mira ni lo emite**: barre TODO plan
--    activo con auto-renovación y le estampa un intento
--    `proveedor='nuvei' forma='tokenizacion'`. Un plan de DeUna sale a cobrarse
--    contra una tarjeta que no tiene.
--    *El vecino ya tenía la rama —`mensualidades_vencidas_pendientes` frena con
--    `riel_no_cobrable_por_token`—: el patrón se copia, no se reinventa.*
--    ⚠️ Y el defecto **ya está vivo**: el único plan que existe tiene `riel`
--    NULL y `tarjeta_id` NULL. Con `periodo_fin` = 13-sep, el día que venza el
--    lazo de hoy le arma un cobro por token sin token.
--
-- 🔴 ② **LA MÁQUINA DEL LINK NO TENÍA NI UN LLAMADOR NI UN RELOJ.**
--    Censo: `emitir_link_mensual` con CERO llamadores en la base y CERO en el
--    repo; `vencer_links_mensuales` sin cron. **Construida y desconectada** —
--    `L-318` otra vez, y esta vez sobre la firma más nueva del founder.
--
-- ═══ Y UN TERCERO QUE APARECIÓ AL CURAR EL PRIMERO ═════════════════════════
-- 🔴 **DOS RIELES ESTABAN POR PEDIR DOS PRECIOS DISTINTOS POR EL MISMO MES.**
--    La tarjeta cobra `precio_mensual_plan` de la OFERTA menos el crédito por
--    citas sobrantes, calculado fresco. El emisor del link leía
--    `suscripciones_servicio.precio_mensual`, un snapshot, **sin crédito**.
--    ⇒ la misma renovación salía más cara por link que por tarjeta.
--    **Cura: el monto sale del DESGLOSE, que es donde la casa ya decidió que
--    vive** (`20260904200000`). Y si no hay desglose congelado, **falla cerrado**
--    en vez de inventar: *pedir plata por un número que nadie congeló es pedir
--    un número que puede cambiar entre que se pide y se paga.*
--
-- ═══ DÓNDE VA LA RAMA, y por qué no va primero ═════════════════════════════
-- El vecino pone su rama de riel **al abrir el lazo**. Acá va **después de los
-- fusibles y del desglose**, a propósito: mascota no activa, plan no ofrecido y
-- mes sin citas son razones para **no renovar en absoluto**.
-- *Emitirle un link a un mes que no tiene citas es pedirle plata a una familia
-- por nada.* Los fusibles ganan; el riel decide sólo **cómo** se cobra lo que
-- sí corresponde cobrar.
--
-- ═══ Y UN CUARTO, QUE LO ENCONTRÓ EL PROPIO ARNÉS AL ABORTAR ═══════════════
-- 🔴 **EL RIEL TIENE TRES ESTADOS Y EL TERCERO NO SE ADIVINA.**
--    La primera versión de esta cura hacía `COALESCE(riel,'tarjeta')`. El
--    cinturón abortó contra `chk_susc_riel_valido` y destapó el hecho: el
--    ÚNICO plan vivo tiene **`riel` NULL y `tarjeta_id` NULL** — se contrató
--    antes de que el riel existiera. *Leer «no declarado» como «tarjeta» lo
--    manda a cobrarse por token contra un token que no existe.*
--    ⇒ `riel IS NULL` **frena con nombre** (`riel_no_declarado`), no se cobra
--    por ningún riel. Fail-closed, que es el único lado seguro con plata.
--    ⚠️ **Consecuencia declarada, reversible con una línea:** ese plan deja de
--    renovar hasta que alguien declare su riel. Hoy renovaría **cobrando mal**;
--    dejar de cobrar es estrictamente mejor que cobrar por un riel inventado.
--    **CERO backfill** — no se le rellena el `riel` a nadie (regla del founder).
--
-- ═══ LA FRONTERA QUE NO SE CRUZA ═══════════════════════════════════════════
-- 🔴 **Reactivar un plan pausado por link impago NO SE MODELA ACÁ.** Sigue sin
--    firma si re-ancla el día de cobro. Lo único que esta migración hace en esa
--    dirección es lo YA FIRMADO: el link vence ⇒ **el plan no renueva y queda
--    REACTIVABLE** (se apaga `auto_renovar`, el estado sigue `activa`, el mes
--    pagado corre hasta su fin). `marcar_link_mensual_pagado` sigue **nombrando
--    y no aplicando** `pago_tardio_link_vencido`.
--
-- ═══ LA LLAVE ══════════════════════════════════════════════════════════════
-- `emitir_link_mensual` ya exige `guarderia_recurrente_vivo()` — la misma llave
-- de los tres actos, y **hoy está en `false`**. Por eso el arnés de abajo
-- **NO ejerce la emisión feliz y lo dice**: fabricar la llave en un fixture
-- sería simular el veredicto que la llave existe para dar.
-- ⚠️ `vencer_links_mensuales` **NO se ata a la llave, a propósito**: emitir está
-- gateado, así que sin llave no puede haber links; pero si la llave se enciende
-- y se vuelve a apagar, los links ya emitidos **tienen que poder vencer igual**.
-- *Un vencimiento gateado deja filas `emitido` para siempre.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- ① EL EMISOR TOMA EL MONTO DEL DESGLOSE — una sola cuenta, no dos.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emitir_link_mensual(
  p_sujeto text, p_sujeto_id uuid, p_periodo date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_monto numeric; v_moneda text := 'USD'; v_vence date; v_riel text; v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  /* 🔴 LA LLAVE GOBIERNA TAMBIÉN ESTO. Tres actos, un interruptor: cobro por
     tarjeta, emisión del link, aviso de 3 días. */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', false, 'codigo','recurrente_apagado');
  END IF;

  IF p_sujeto = 'suscripcion_servicio' THEN
    SELECT s.periodo_fin, s.riel INTO v_vence, v_riel
      FROM suscripciones_servicio s WHERE s.id = p_sujeto_id;
    SELECT d.total INTO v_monto FROM suscripcion_desglose d
     WHERE d.suscripcion_servicio_id = p_sujeto_id AND d.periodo = p_periodo;
  ELSIF p_sujeto = 'mensualidad_guarderia' THEN
    SELECT g.periodo_hasta, g.riel INTO v_vence, v_riel
      FROM guarderia_suscripciones g WHERE g.id = p_sujeto_id;
    SELECT d.total INTO v_monto FROM guarderia_suscripcion_desglose d
     WHERE d.guarderia_suscripcion_id = p_sujeto_id AND d.periodo = p_periodo;
  ELSE
    RAISE EXCEPTION 'sujeto_sin_emisor_de_link: %', p_sujeto USING ERRCODE='22023';
  END IF;

  IF v_vence IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','sujeto_no_existe');
  END IF;
  IF v_riel IS DISTINCT FROM 'deuna' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','riel_no_emite_link', 'riel', v_riel);
  END IF;
  /* 🔴 FAIL-CLOSED SOBRE EL MONTO. *El precio del mes lo dice el desglose o no
     lo dice nadie: leerlo de otra columna es la puerta por la que los dos
     rieles empiezan a pedir números distintos.* */
  IF v_monto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','sin_desglose_congelado',
                              'periodo', p_periodo);
  END IF;

  INSERT INTO cobro_link_mensual (suscripcion_servicio_id, guarderia_suscripcion_id,
                                  periodo, monto, moneda, vence_en)
  VALUES (CASE WHEN p_sujeto='suscripcion_servicio' THEN p_sujeto_id END,
          CASE WHEN p_sujeto='mensualidad_guarderia' THEN p_sujeto_id END,
          p_periodo, v_monto, v_moneda, v_vence)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'ya_emitido', true, 'periodo', p_periodo);
  END IF;

  /* ⚠️ ACÁ VA LA LLAMADA AL PROVEEDOR — y sigue siendo el ÚNICO lugar. */
  RETURN jsonb_build_object('ok', true, 'link_id', v_id, 'periodo', p_periodo,
    'monto', v_monto, 'vence_en', v_vence,
    'url_proveedor', NULL,
    'nota', 'pedido registrado — la url del proveedor entra cuando DeUna conteste');
END $function$;

REVOKE EXECUTE ON FUNCTION public.emitir_link_mensual(text,uuid,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.emitir_link_mensual(text,uuid,date) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- ② EL SELECTOR DEL PLAN MIRA EL RIEL — y lo que no puede cobrar por token,
--    lo PIDE por link en vez de intentarlo contra una tarjeta que no hay.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.planes_vencidos_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE
  v_s record; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_oferta record; v_n int; v_total numeric(12,2); v_credito numeric(12,2);
  v_intento uuid; v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_masc boolean; v_riel text; v_link jsonb;
BEGIN
  FOR v_s IN
    SELECT * FROM suscripciones_servicio
     WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
       AND auto_renovar AND periodo_fin <= v_hoy
       AND NOT EXISTS (SELECT 1 FROM pagos_intentos i
                        WHERE i.suscripcion_servicio_id = suscripciones_servicio.id
                          AND i.suscripcion_periodo = suscripciones_servicio.periodo_fin
                          AND i.estado = 'aprobado')
     ORDER BY periodo_fin FOR UPDATE SKIP LOCKED
  LOOP
    /* El fusible del motor de D-657(b): sin mascota activa no se renueva. */
    /* 🔴 EL VALOR SE MIDIÓ, NO SE SUPUSO: `estado_vida` vale **`'activa'`**. */
    SELECT (m.estado_vida = 'activa') INTO v_masc FROM mascotas m WHERE m.id = v_s.mascota_id;
    IF NOT COALESCE(v_masc, false) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'mascota_no_activa');
      CONTINUE;
    END IF;

    SELECT ps.id, ps.precio_mensual_plan INTO v_oferta
      FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id AND ps.activo;
    IF v_oferta.id IS NULL OR v_oferta.precio_mensual_plan IS NULL THEN
      /* REFORMA S79 ①: sin mensual declarado NO se renueva. */
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_no_ofrecido');
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_n
      FROM _fechas_periodo_plan(v_s.periodo_fin, v_s.dias_semana, v_s.frecuencia);
    IF v_n = 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_sin_citas');
      CONTINUE;
    END IF;

    /* EL CRÉDITO POR SOBRANTES SE CALCULA FRESCO — y **NO se suma desde
       metadata**. *El par lo cazó: reembolso 12 donde correspondía 6.* */
    SELECT COALESCE(count(*) * v_s.precio_unitario_efectivo, 0) INTO v_credito
      FROM evento_cita_servicio
     WHERE suscripcion_servicio_id = v_s.id AND estado = 'confirmada' AND fecha >= v_hoy;

    v_total := greatest(round(v_oferta.precio_mensual_plan, 2) - COALESCE(v_credito,0), 0);

    /* 🔴 EL DESGLOSE SE CONGELA ANTES DE ELEGIR RIEL — a propósito. Es la
       ÚNICA cuenta del mes, y los dos rieles la leen de acá. *Si el desglose
       se escribiera sólo en la rama de tarjeta, el link tendría que
       recalcular, y dos cuentas del mismo mes terminan diciendo distinto.* */
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_s.id, v_s.periodo_fin, round(v_oferta.precio_mensual_plan,2), 0,
            greatest(v_total, 0.01), 'USD')
    ON CONFLICT (suscripcion_servicio_id, periodo) DO NOTHING;

    /* ═══ LA RAMA DEL RIEL ═══════════════════════════════════════════════
       🔴 Lo que no se puede cobrar por token **no se intenta**: se PIDE por
       link y se dice. *Estampar `proveedor=nuvei` sobre una suscripción sin
       tarjeta es fabricar una traza que después nadie puede explicar.*
       El plan sin riel declarado cuenta como `tarjeta`: es lo que se contrató
       antes de que el riel existiera, y `COALESCE` lo dice en vez de asumirlo
       en silencio. */
    /* 🔴 TRES ESTADOS, NO DOS — y el tercero NO se adivina.
       `riel` NULL no es «tarjeta»: es **nadie lo declaró**. El CHECK
       `chk_susc_riel_valido` deja pasar NULL justamente porque los planes
       anteriores al riel no lo tienen, y el único plan vivo es uno de ésos:
       `riel` NULL **y `tarjeta_id` NULL**.
       *Tratar lo no declarado como tarjeta lo manda a cobrarse por token
       contra un token que no existe* — que es un `L-439` de manual: un atajo
       que puede producir un valor equivocado no se declara, se hace
       inexpresable. Acá se hace **frenada con nombre**. */
    v_riel := v_s.riel;
    IF v_riel IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','suscripcion_servicio', 'sujeto_id', v_s.id,
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin,
        'motivo','riel_no_declarado');
      CONTINUE;
    END IF;
    IF v_riel <> 'tarjeta' THEN
      v_link := public.emitir_link_mensual('suscripcion_servicio', v_s.id, v_s.periodo_fin);
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','suscripcion_servicio', 'sujeto_id', v_s.id,
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin,
        'motivo','riel_no_cobrable_por_token', 'riel', v_riel,
        /* El veredicto del emisor viaja ENTERO: si no salió, se ve por qué. */
        'link_emitido', COALESCE((v_link->>'ok')::boolean, false),
        'link', v_link);
      CONTINUE;
    END IF;

    INSERT INTO pagos_intentos (
      suscripcion_servicio_id, suscripcion_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_s.periodo_fin, greatest(v_total, 0.01), 'USD', 'iniciado',
            'tokenizacion', 'nuvei', v_s.user_id, 'recurrencia',
            'plan:' || v_s.id::text || ':' || v_s.periodo_fin::text)
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto', 'suscripcion_servicio', 'sujeto_id', v_s.id,
      'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'intento_id', v_intento,
      'user_id', v_s.user_id, 'monto', greatest(v_total, 0.01),
      /* 🔴 EL RIEL VIAJA AL QUE DECIDE. Estaba en la tabla y no salía de ella;
         el que cobra no puede ramificar sobre un dato que nunca ve. */
      'riel', v_riel, 'tarjeta_id', v_s.tarjeta_id,
      'credito_aplicado', COALESCE(v_credito,0),
      'cubierto_por_credito', (v_total <= 0));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

REVOKE EXECUTE ON FUNCTION public.planes_vencidos_pendientes() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.planes_vencidos_pendientes() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- ③ EL RELOJ DEL VENCIMIENTO. Sin él, un link impago queda `emitido` para
--    siempre y el plan renueva como si nada. *La máquina existía entera y no
--    la giraba nadie.*
-- ─────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('vencer-links-mensuales')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vencer-links-mensuales');

SELECT cron.schedule('vencer-links-mensuales', '30 8 * * *',
                     $cron$SELECT public.vencer_links_mensuales();$cron$);

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — ejerce el ACTO REAL sobre el plan vivo, dentro de una
-- subtransacción que se deshace sola. **Exige el código exacto, jamás «rebotó»:**
-- una rama que siempre frena también «rebota», y eso no es una medición.
--
-- ⚠️ LO QUE **NO** SE EJERCE, DECLARADO: la emisión feliz del link. La llave
--    `guarderia_recurrente_vivo` está en `false` y **es del founder**.
--    *Fabricarla en un arnés sería simular el veredicto que la llave existe
--    para dar* — mismo precedente que la consulta de DeUna en S107. Lo que sí
--    se exige es que el emisor sea LLAMADO y que su veredicto EXACTO viaje.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_plan uuid; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_r jsonb; v_f jsonb; v_n_int int; v_auto boolean; v_link uuid;
  v_motivo text; v_codigo text; v_tarj uuid;
BEGIN
  SELECT id INTO v_plan FROM suscripciones_servicio
   WHERE tipo_servicio='paseo_mensual' AND estado='activa' AND auto_renovar
   ORDER BY periodo_fin DESC LIMIT 1;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay plan de paseo vivo contra el cual medir — un arnes que no encuentra caso no prueba nada';
  END IF;

  BEGIN
    -- ── BRAZO A · riel DEUNA: no se estampa token, y el emisor es llamado ──
    UPDATE suscripciones_servicio
       SET periodo_fin = v_hoy - 1, riel = 'deuna'
     WHERE id = v_plan;

    v_r := public.planes_vencidos_pendientes();

    SELECT count(*) INTO v_n_int FROM pagos_intentos
     WHERE suscripcion_servicio_id = v_plan AND suscripcion_periodo = v_hoy - 1;
    IF v_n_int <> 0 THEN
      RAISE EXCEPTION 'CINTURON A: se estampo un intento por token sobre un plan de riel deuna (%). Es EL defecto que esta migracion cura.', v_n_int;
    END IF;

    SELECT e INTO v_f FROM jsonb_array_elements(v_r->'frenadas') e
     WHERE e->>'suscripcion_id' = v_plan::text;
    IF v_f IS NULL THEN
      RAISE EXCEPTION 'CINTURON A: el plan de riel deuna no aparece ni cobrado ni frenado — desaparecio en silencio. r=%', v_r;
    END IF;

    v_motivo := v_f->>'motivo';
    IF v_motivo <> 'riel_no_cobrable_por_token' THEN
      /* 🔴 Si freno por OTRA razon, la rama del riel NUNCA se ejercio y este
         verde seria de otra cosa. Se nombra el motivo real. */
      RAISE EXCEPTION 'CINTURON A: freno por "%" y no por el riel — la rama no se ejercio. f=%', v_motivo, v_f;
    END IF;
    IF (v_f->>'riel') <> 'deuna' THEN
      RAISE EXCEPTION 'CINTURON A: la frenada no lleva el riel. f=%', v_f;
    END IF;

    /* El emisor FUE LLAMADO y su veredicto exacto viaja. Con la llave apagada
       ese veredicto es `recurrente_apagado`, y eso es lo correcto hoy. */
    v_codigo := v_f->'link'->>'codigo';
    IF v_codigo IS DISTINCT FROM 'recurrente_apagado' THEN
      RAISE EXCEPTION 'CINTURON A: el veredicto del emisor no es el esperado con la llave apagada: "%" — si dice otra cosa, o la llave se encendio o el emisor no fue llamado. f=%', v_codigo, v_f;
    END IF;

    RAISE NOTICE 'CINTURON A OK · sin intento por token · motivo=% · riel=% · emisor=%',
      v_motivo, v_f->>'riel', v_codigo;

    -- ── BRAZO B · DISCRIMINADOR, riel TARJETA: el camino sano sigue vivo ──
    /* La tarjeta es REAL: el dueno de este plan tiene dos guardadas. El CHECK
       exige `tarjeta => hay tarjeta`, asi que declarar el riel sin tarjeta es
       inexpresable — y esa es justamente la razon por la que el NULL no puede
       leerse como tarjeta. */
    SELECT id INTO v_tarj FROM tarjetas_guardadas
     WHERE user_id = (SELECT user_id FROM suscripciones_servicio WHERE id = v_plan)
     LIMIT 1;
    IF v_tarj IS NULL THEN
      RAISE EXCEPTION 'CINTURON B: el dueno del plan no tiene tarjeta — sin ella el brazo del token no se puede ejercer y su verde seria de otra cosa';
    END IF;
    UPDATE suscripciones_servicio SET riel = 'tarjeta', tarjeta_id = v_tarj WHERE id = v_plan;
    v_r := public.planes_vencidos_pendientes();

    SELECT count(*) INTO v_n_int FROM pagos_intentos
     WHERE suscripcion_servicio_id = v_plan AND suscripcion_periodo = v_hoy - 1;
    IF v_n_int <> 1 THEN
      RAISE EXCEPTION 'CINTURON B: el plan de tarjeta NO produjo su intento (%) — la cura rompio el camino sano', v_n_int;
    END IF;

    SELECT e INTO v_f FROM jsonb_array_elements(v_r->'para_cobrar') e
     WHERE e->>'suscripcion_id' = v_plan::text;
    IF v_f IS NULL THEN
      RAISE EXCEPTION 'CINTURON B: el plan de tarjeta no salio en para_cobrar. r=%', v_r;
    END IF;
    IF (v_f->>'riel') <> 'tarjeta' THEN
      RAISE EXCEPTION 'CINTURON B: el riel NO viaja al que decide — es el hueco que se vino a cerrar. f=%', v_f;
    END IF;
    RAISE NOTICE 'CINTURON B OK · intento estampado · riel viaja = %', v_f->>'riel';

    -- ── BRAZO C · el reloj del link pausa el plan y NO lo cancela ──────────
    INSERT INTO cobro_link_mensual (suscripcion_servicio_id, periodo, monto, moneda,
                                    vence_en, estado)
    VALUES (v_plan, v_hoy - 1, 10.00, 'USD', v_hoy - 1, 'emitido')
    RETURNING id INTO v_link;

    PERFORM public.vencer_links_mensuales();

    SELECT auto_renovar INTO v_auto FROM suscripciones_servicio WHERE id = v_plan;
    IF v_auto IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON C: el link vencio y el plan sigue auto-renovando — la firma dice que NO renueva';
    END IF;
    IF (SELECT estado FROM suscripciones_servicio WHERE id = v_plan) <> 'activa' THEN
      RAISE EXCEPTION 'CINTURON C: el plan se cancelo. La firma dice REACTIVABLE: se pausa la renovacion, jamas el servicio en curso';
    END IF;
    IF (SELECT estado FROM cobro_link_mensual WHERE id = v_link) <> 'vencido' THEN
      RAISE EXCEPTION 'CINTURON C: el link no vencio';
    END IF;
    RAISE NOTICE 'CINTURON C OK · link vencido · auto_renovar=false · estado sigue activa (REACTIVABLE)';

    -- ── BRAZO D · riel NO DECLARADO: no se cobra por ninguno, y se dice ──
    UPDATE suscripciones_servicio SET riel = NULL, tarjeta_id = NULL, auto_renovar = true
     WHERE id = v_plan;
    DELETE FROM pagos_intentos
     WHERE suscripcion_servicio_id = v_plan AND suscripcion_periodo = v_hoy - 1;
    v_r := public.planes_vencidos_pendientes();

    SELECT count(*) INTO v_n_int FROM pagos_intentos
     WHERE suscripcion_servicio_id = v_plan AND suscripcion_periodo = v_hoy - 1;
    IF v_n_int <> 0 THEN
      RAISE EXCEPTION 'CINTURON D: se cobro por token un plan cuyo riel nadie declaro (%)', v_n_int;
    END IF;
    SELECT e INTO v_f FROM jsonb_array_elements(v_r->'frenadas') e
     WHERE e->>'suscripcion_id' = v_plan::text;
    IF v_f IS NULL OR (v_f->>'motivo') <> 'riel_no_declarado' THEN
      RAISE EXCEPTION 'CINTURON D: el plan sin riel no freno por riel_no_declarado. f=%', v_f;
    END IF;
    RAISE NOTICE 'CINTURON D OK · riel no declarado · sin intento · motivo=%', v_f->>'motivo';

    RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'FIXTURE_ROLLBACK_OK' THEN RAISE; END IF;
  END;

  -- ── El reloj existe de verdad ────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vencer-links-mensuales') THEN
    RAISE EXCEPTION 'CINTURON: el cron vencer-links-mensuales no quedo agendado';
  END IF;

  RAISE NOTICE 'CINTURON VERDE · 4 brazos + el reloj · la emision feliz NO se ejercio (la llave es del founder)';
END $cint$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL ÍNDICE DE IDEMPOTENCIA DEJA PASAR AL MUERTO
--
-- 76(g) VEDA: **NO RIGE.** Un índice y cuatro reemplazos de función.
--   **Cero backfill.** Medido antes de tocar: **0 claves duplicadas entre los
--   no terminales** (12 de 107 filas), así que el índice parcial entra limpio.
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M31.sql`.
--
-- ═══ POR QUÉ, Y ES LA MITAD QUE SALVA UNA FIRMA ════════════════════════════
-- 🔴 `clave_idempotencia` tenía un **UNIQUE TOTAL**. Medido por S109-B al ir a
--    escribir la clave por sujeto:
--
--    **con clave por sujeto e índice total, un intento TERMINAL se queda con la
--    clave para siempre** ⇒ una familia cuyo primer código fue **rechazado**
--    **no podría reintentar NUNCA**.
--
-- 🔴 **Y eso da vuelta una firma del founder sin que nadie lo note.** Él firmó
--    *«frenar en la puerta si ya hay un pedido EN CURSO»* — un freno temporal,
--    sobre algo que está andando. **Con índice total, «frenar» deja de ser un
--    freno y pasa a ser un bloqueo permanente**, que es el reverso de lo
--    firmado. *La letra decía «en curso» y el índice no sabe leer esa palabra.*
--
-- ⇒ El índice pasa a ser **PARCIAL sobre los no terminales**. Lo vivo es único;
--   lo muerto suelta la clave. Es lo que la letra ya decía y el esquema no.
--
-- ═══ Y NO SE MUEVE SOLO — la mitad que casi se me pasa ═════════════════════
-- 🔴 **CUATRO funciones hacen `ON CONFLICT (clave_idempotencia)`** y **todas
--    dejarían de compilar en runtime** con un índice parcial: la inferencia de
--    `ON CONFLICT` **no acepta un índice parcial sin repetir su predicado**.
--    ⇒ Las cuatro se mueven en esta misma migración, o esto rompe el cobro
--    recurrente entero. *Cambiar un índice es cambiar el contrato de todo el
--    que lo infiere, y ninguno de los cuatro lo nombra en su texto.*
--
-- 🟢 **Y de paso corrige un defecto latente que nadie había nombrado:** con el
--    índice total, un intento **rechazado** de un período era RESUCITADO por el
--    `DO UPDATE` del mes siguiente en vez de nacer uno nuevo. Con el parcial,
--    un rechazo terminal deja lugar a un intento nuevo. *La cura del bloqueo
--    trajo puesta la cura de la resurrección.*
--
-- ⚠️ **ESTO NO HABILITA LA CLAVE POR SUJETO POR SÍ SOLO.** Las edges siguen con
--    su clave vieja, a propósito y por acuerdo con B: **las dos piezas viajan
--    juntas o ninguna.** Este índice es la precondición, no el permiso.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $pre$
BEGIN
  IF EXISTS (SELECT 1 FROM (
        SELECT clave_idempotencia FROM pagos_intentos
         WHERE estado IN ('iniciado','pendiente')
         GROUP BY 1 HAVING count(*) > 1) x) THEN
    RAISE EXCEPTION 'hay claves duplicadas entre los no terminales — el indice parcial no entra a ciegas, revisar a mano';
  END IF;
END $pre$;

ALTER TABLE public.pagos_intentos
  DROP CONSTRAINT IF EXISTS pagos_intentos_clave_idempotencia_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_intento_clave_no_terminal
  ON public.pagos_intentos (clave_idempotencia)
  WHERE estado IN ('iniciado','pendiente');

COMMENT ON INDEX public.uq_intento_clave_no_terminal IS
  'PARCIAL a proposito: lo vivo es unico, lo muerto suelta la clave. Con un '
  'UNIQUE total, una clave por sujeto dejaria a una familia cuyo primer intento '
  'fue rechazado sin poder reintentar nunca — el freno «si hay un pedido en '
  'curso» se volveria un bloqueo permanente. Todo ON CONFLICT sobre esta clave '
  'DEBE repetir el predicado: WHERE estado IN (''iniciado'',''pendiente'').';

-- ─── LOS CUATRO `ON CONFLICT` REPITEN EL PREDICADO DEL ÍNDICE ───────────
-- Los cuerpos se toman del OBJETO y se les cambia SÓLO esa línea.
-- *Transcribir a mano un cuerpo largo es cómo se restaura algo que no era.*

CREATE OR REPLACE FUNCTION public.emitir_link_mensual(p_sujeto text, p_sujeto_id uuid, p_periodo date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_monto numeric; v_moneda text := 'USD'; v_vence date; v_riel text;
        v_id uuid; v_intento uuid; v_pagador uuid; v_clave text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', false, 'codigo','recurrente_apagado');
  END IF;

  IF p_sujeto = 'suscripcion_servicio' THEN
    SELECT s.periodo_fin, s.riel, s.user_id INTO v_vence, v_riel, v_pagador
      FROM suscripciones_servicio s WHERE s.id = p_sujeto_id;
    SELECT d.total INTO v_monto FROM suscripcion_desglose d
     WHERE d.suscripcion_servicio_id = p_sujeto_id AND d.periodo = p_periodo;
  ELSIF p_sujeto = 'mensualidad_guarderia' THEN
    SELECT g.periodo_hasta, g.riel, g.autorizada_por INTO v_vence, v_riel, v_pagador
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
  IF v_monto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','sin_desglose_congelado',
                              'periodo', p_periodo);
  END IF;

  /* 🔴 EL INTENTO PRIMERO. Es lo que hace que el mes pagado por link sea, para
     todo el resto del motor, un cobro más: el webhook lo resuelve, el trigger
     mueve el sujeto, el barrido lo ve y **el reverso lo puede deshacer**.
     `forma='redireccion'` no es una etiqueta elegida: es el valor que el
     vocabulario cerrado ya tenía para esto. */
  v_clave := 'link:' || p_sujeto || ':' || p_sujeto_id::text || ':' || p_periodo::text;

  INSERT INTO pagos_intentos (
    suscripcion_servicio_id, suscripcion_periodo,
    guarderia_suscripcion_id, guarderia_suscripcion_periodo,
    monto, moneda, estado, forma, proveedor,
    pagador_user_id, pagador_origen, clave_idempotencia)
  VALUES (
    CASE WHEN p_sujeto='suscripcion_servicio'  THEN p_sujeto_id END,
    CASE WHEN p_sujeto='suscripcion_servicio'  THEN p_periodo   END,
    CASE WHEN p_sujeto='mensualidad_guarderia' THEN p_sujeto_id END,
    CASE WHEN p_sujeto='mensualidad_guarderia' THEN p_periodo   END,
    v_monto, v_moneda, 'iniciado', 'redireccion', 'deuna',
    v_pagador, 'recurrencia', v_clave)
  ON CONFLICT (clave_idempotencia) WHERE estado IN ('iniciado','pendiente') DO UPDATE SET actualizado_en = now()
  RETURNING id INTO v_intento;

  INSERT INTO cobro_link_mensual (suscripcion_servicio_id, guarderia_suscripcion_id,
                                  periodo, monto, moneda, vence_en, intento_id)
  VALUES (CASE WHEN p_sujeto='suscripcion_servicio' THEN p_sujeto_id END,
          CASE WHEN p_sujeto='mensualidad_guarderia' THEN p_sujeto_id END,
          p_periodo, v_monto, v_moneda, v_vence, v_intento)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'ya_emitido', true, 'periodo', p_periodo,
                              'intento_id', v_intento);
  END IF;

  /* ⚠️ ACÁ VA LA LLAMADA AL PROVEEDOR — y sigue siendo el ÚNICO lugar. La url
     se escribe en `cobro_link_mensual.url_proveedor` **y** en
     `pagos_intentos.url_redireccion`, que es donde el CHECK de la casa la
     espera cuando el intento deja de estar `iniciado`. */
  RETURN jsonb_build_object('ok', true, 'link_id', v_id, 'intento_id', v_intento,
    'periodo', p_periodo, 'monto', v_monto, 'vence_en', v_vence,
    'url_proveedor', NULL,
    'nota', 'pedido registrado — la url del proveedor entra cuando DeUna conteste');
END $function$;

CREATE OR REPLACE FUNCTION public.mensualidades_vencidas_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_hoy date := public.hoy_local(); v_periodo date;
  v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_intento uuid; v_cong jsonb; v_total numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;

  FOR v_s IN
    SELECT * FROM guarderia_suscripciones s
     WHERE s.estado = 'activa'
       /* Sólo RENUEVA: un mandato que nunca cobró arranca por el checkout
          —«pagar es arrancar»—, no por el reloj. */
       AND s.periodo_desde IS NOT NULL AND s.periodo_hasta IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
       AND s.periodo_hasta < v_hoy
     ORDER BY s.periodo_hasta
  LOOP
    v_periodo := public.proximo_cobro_mensual(v_s.dia_de_cobro, v_s.periodo_desde);

    /* 🔴 EL RIEL DECIDE QUIÉN PUEDE COBRAR POR ACÁ. Un mandato de DeUna se paga
       por LINK, no por token: este lazo no puede cobrarlo y **lo dice** en vez
       de intentarlo. *Frenar con nombre es lo que permite que alguien lo mire;
       frenar en silencio es lo que hizo falta curar acá.* */
    IF COALESCE(v_s.riel,'tarjeta') <> 'tarjeta' THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','riel_no_cobrable_por_token', 'riel', v_s.riel);
      CONTINUE;
    END IF;
    IF v_s.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','sin_medio_autorizado');
      CONTINUE;
    END IF;

    /* Ya cobrado o en vuelo: no se propone dos veces el mismo período. */
    IF EXISTS (SELECT 1 FROM pagos_intentos i
                WHERE i.guarderia_suscripcion_id = v_s.id
                  AND i.guarderia_suscripcion_periodo = v_periodo
                  AND i.estado IN ('iniciado','pendiente','aprobado')) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','periodo_ya_en_curso');
      CONTINUE;
    END IF;

    /* 🔴 SE CONGELA ANTES DE PROPONER, y se LEE el veredicto. *El `PERFORM` que
       descartaba este mismo retorno fue el único caso real del censo de
       llamadores de S109-B.* */
    v_cong := public.congelar_desglose_mensualidad_guarderia(v_s.id, v_periodo);
    IF COALESCE((v_cong->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','desglose_no_congelado', 'causa', v_cong->>'codigo');
      CONTINUE;
    END IF;
    SELECT d.total INTO v_total FROM guarderia_suscripcion_desglose d
     WHERE d.guarderia_suscripcion_id = v_s.id AND d.periodo = v_periodo;

    /* 🔴 EL TECHO DEL MANDATO, otra vez y acá. *Exceder la autorización con la
       plata ya movida obliga a reversar; descubrirlo antes es no cobrar de más.* */
    IF v_total > v_s.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'sujeto','mensualidad_guarderia','sujeto_id', v_s.id, 'periodo', v_periodo,
        'motivo','monto_excede_mandato', 'total', v_total, 'techo', v_s.monto_esperado);
      CONTINUE;
    END IF;

    INSERT INTO pagos_intentos (
      guarderia_suscripcion_id, guarderia_suscripcion_periodo, monto, moneda,
      estado, forma, proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_periodo, v_total, 'USD', 'iniciado', 'tokenizacion', 'nuvei',
            v_s.autorizada_por, 'recurrencia',
            'mensualidad:' || v_s.id::text || ':' || v_periodo::text)
    ON CONFLICT (clave_idempotencia) WHERE estado IN ('iniciado','pendiente') DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto','mensualidad_guarderia', 'sujeto_id', v_s.id,
      'periodo', v_periodo, 'intento_id', v_intento,
      'user_id', v_s.autorizada_por, 'tarjeta_id', v_s.tarjeta_id,
      'monto', v_total, 'moneda', 'USD',
      'autorizada_en', v_s.autorizada_en, 'reintentos', 0,
      /* La mensualidad no tiene pedido: su IVA sale del desglose, no de ítems. */
      'pedido_id', NULL);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

CREATE OR REPLACE FUNCTION public.planes_vencidos_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
    ON CONFLICT (clave_idempotencia) WHERE estado IN ('iniciado','pendiente') DO UPDATE SET actualizado_en = now()
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

CREATE OR REPLACE FUNCTION public.recurrencias_vencidas_pendientes()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r          record;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_compuertas jsonb;
  v_total      numeric(12,2);
  v_subtotal   numeric(12,2);
  v_impuesto   numeric(12,2);
  v_envio      numeric(12,2);
  v_intento    uuid;
  v_listas     jsonb := '[]'::jsonb;
  v_frenadas   jsonb := '[]'::jsonb;
BEGIN
  /* 🔴 EL RELOJ ES DE GUAYAQUIL Y NO DE UTC. *Una serie que vence «el 13» vence
     el 13 donde vive la familia. Con UTC, un cobro de las 20:00 locales cae al
     día siguiente y el aviso de 48 h se corre solo.* */

  FOR v_r IN
    SELECT r.*
      FROM pedidos_recurrencias r
     WHERE r.estado = 'activa'
       AND r.proximo_pedido_fecha <= v_hoy
       /* 🔴 EL CANDADO CONTRA EL CRON QUE CORRE DOS VECES, en el SELECT y no
          solo en el índice: si ya hay un intento APROBADO de este período, la
          fila no vuelve a entrar. *El UNIQUE parcial es el piso; esto evita
          que siquiera se intente y se llene el buzón de rechazos por
          duplicado.* */
       AND NOT EXISTS (
             SELECT 1 FROM pagos_intentos i
              WHERE i.recurrencia_id = r.id
                AND i.recurrencia_periodo = r.proximo_pedido_fecha
                AND i.estado = 'aprobado')
     ORDER BY r.proximo_pedido_fecha, r.id
     FOR UPDATE OF r SKIP LOCKED
  LOOP
    /* ── ⓐ LA RAÍZ DE AUTORIZACIÓN, verificada fila por fila ───────────────
       §2: la autorización nombra QUIÉN, CUÁNDO y SOBRE QUÉ MEDIO. Las tres
       viven en la fila; si falta una, **no se cobra y se dice cuál falta**.
       🔴 *«Si ese medio muere, la serie no salta a otro por su cuenta: jamás
       se cobra a una tarjeta que el cliente no eligió para esto.»* Por eso se
       verifica que la tarjeta siga siendo SUYA y siga GUARDADA — no alcanza
       con que el id no sea nulo. */
    IF v_r.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_medio_autorizado');
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                    WHERE t.id = v_r.tarjeta_id
                      AND t.user_id = v_r.user_id
                      AND t.estado = 'guardada') THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'medio_no_disponible');
      CONTINUE;
    END IF;

    /* ── ⓑ↔ⓒ 🔴 EL ORDEN LO CORRIGIÓ EL ARNÉS, NO LA LECTURA ─────────────
       **Estaban al revés: la compuerta 2 verifica el monto CONTRA EL DESGLOSE
       CONGELADO, y el desglose se congelaba DESPUÉS.** ⇒ toda serie salía
       frenada con `desglose_incompleto`, **siempre**.
       *Leído, el cuerpo se ve correcto —«primero se verifica, después se
       congela» suena bien—; corrido, no cobra jamás.* **Y su modo de falla es
       de los que se archivan: un freno con nombre propio, prolijo, que parece
       una compuerta funcionando.** (`L-372`)
       ⇒ **CONGELAR y después VERIFICAR.** La compuerta necesita el número
       para poder compararlo. */

    /* ── ⓒ EL DESGLOSE DEL PERÍODO, CONGELADO AL PRECIO DE HOY ─────────────
       §5: **precio VIGENTE al momento del cobro**, no el del día en que el
       cliente se suscribió. Por eso la PK lleva el período adentro.
       ⚠️ El cálculo sale del catálogo VIVO, y si no da un total > 0 **no se
       inventa**: se frena. *Un total cero que se cobra es un cobro sin
       concepto; uno que se estima es un número que nosotros elegimos.* */
    SELECT
      COALESCE(SUM((it->>'cantidad')::int * o.precio), 0)
      INTO v_subtotal
      FROM jsonb_array_elements(v_r.items) it
      JOIN ofertas o ON o.id = (it->>'oferta_id')::uuid
     WHERE o.estado = 'publicada';

    v_impuesto := ROUND(v_subtotal * COALESCE(
                    /* 🔴 La columna es `pct`, NO `tasa` — medido. *Escribirla
                       de memoria habría hecho fallar el cálculo entero, y el
                       cuerpo se ve igual de correcto leyéndolo.* */
                    (SELECT pct FROM cat_tasas_impuesto
                      WHERE codigo = 'EC_IVA_0' AND activo
                        AND (vigencia_hasta IS NULL OR vigencia_hasta > now())
                      LIMIT 1), 0), 2);
    v_envio    := 0;   -- §7.2(4): hoy vale cero y lo paga el vendedor
    v_total    := v_subtotal + v_impuesto + v_envio;

    IF v_total IS NULL OR v_total <= 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_total_calculable');
      CONTINUE;
    END IF;

    /* 🔴 Y EL MONTO ESPERADO ES UN FRENO, NO UN ADORNO. §2: la autorización
       nombra un monto. Si el precio de hoy se fue muy por encima del que el
       cliente autorizó, **no se cobra: se avisa**. *Cobrar «lo que salga» es
       exactamente lo que una autorización recurrente no autoriza.* */
    IF v_r.monto_esperado IS NOT NULL AND v_total > v_r.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'monto_supera_lo_autorizado',
        'autorizado', v_r.monto_esperado, 'calculado', v_total);
      CONTINUE;
    END IF;

    INSERT INTO recurrencia_desglose
      (recurrencia_id, periodo, subtotal, impuesto, envio, total, moneda)
    VALUES (v_r.id, v_r.proximo_pedido_fecha, v_subtotal, v_impuesto, v_envio, v_total, 'USD')
    ON CONFLICT (recurrencia_id, periodo) DO NOTHING;
    /* `DO NOTHING` y no `DO UPDATE`, a propósito: **el desglose de un período
       se congela UNA vez.** *Si un reintento lo recalculara, el segundo intento
       podría cobrar un monto distinto del que el primero rechazó — y el
       cliente vería dos números para el mismo mes.* */

    /* ── ⓑ LAS COMPUERTAS ───────────────────────────────────────────────────
       🔴 **ACÁ HAY UNA DECISIÓN DE MESA PENDIENTE, Y NO LA TOMO SOLO.**

       La mesa firmó *«compuertas E3 enteras»*. **Medido contra el objeto:
       `verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text)` es
       COMPRA-ONLY** — lee `compras`, `pedidos` e `inventario_reservas`, y **una
       recurrencia no tiene ninguna de las tres.** *Llamarla pasando el
       `recurrencia_id` como `compra_id` habría devuelto `compra_no_existe` en
       el 100 % de los casos: un freno que se ve como una compuerta funcionando.*

       **Y no es que falte adaptarla: DOS DE SUS COMPUERTAS NO APLICAN, con su
       razón:**
         · **1 · reserva de stock** — no hay pedido todavía. **§6 firma que
           primero se cobra y DESPUÉS sale la entrega**; exigir reserva antes
           del cobro invertiría esa firma.
         · **compra sin pedidos** — por lo mismo: el pedido nace después.
       **Y DOS SÍ, con el mismo espíritu y otro sujeto:**
         · **0 · intento en vuelo** — íntegra. *Protege la tarjeta del cliente
           del segundo débito, que es lo caro.*
         · **monto contra desglose congelado** — construida arriba, en ⓒ.

       ⚖️ **LAS DOS SALIDAS, servidas para la mesa:**
       **(a) ensanchar `verificar_compuertas_pre_cobro` a tres sujetos** — es
       cirugía sobre la función que HOY cobra plata real de Nuvei, exactamente
       lo que S103-D se negó a hacer por el mismo motivo.
       **(b) `verificar_compuertas_recurrencia(uuid, date)` propia**, con cada
       predicado **extraído del cuerpo vivo** y con las dos que no aplican
       **declaradas por nombre**. ⚠️ Riesgo declarado: `L-375` — reimplementar
       es medir el propio eco; se mitiga extrayendo, no reescribiendo.
       **Voto de A: (b)**, porque la mitad que no aplica no se puede parametrizar
       sin volver la compuerta de compras más difícil de leer, *y porque una
       firma que no se puede cumplir literalmente se declara, no se fuerza.*

       ✅ **RESUELTO por (b), y el mapeo completo vive en ④ al pie de este
       archivo: CUATRO evaluadas + cobertura declarada no-evaluable + reserva
       declarada no-aplica.** *Mi propio conteo de arriba decía «dos» — estaba
       hecho sobre medio cuerpo leído.* */
    v_compuertas := verificar_compuertas_recurrencia(v_r.id, v_r.proximo_pedido_fecha);
    IF COALESCE((v_compuertas->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', COALESCE(v_compuertas->>'codigo', 'compuerta_sin_codigo'),
        'compuertas', v_compuertas);
      CONTINUE;
    END IF;

    /* ── ⓓ EL INTENTO, CON PAGADOR EXPLÍCITO ───────────────────────────────
       🔴 `pagador_user_id` NO se deriva: se escribe. *El defecto que S102 curó
       era exactamente éste en la cita — un intento sin pagador declarado
       obliga a adivinar de quién era la plata cuando hay que devolverla.*
       Y `pagador_origen = 'recurrencia'` distingue este cobro de uno que la
       persona hizo con el dedo: **no hubo nadie mirando la pantalla**, y eso
       cambia qué se le puede reclamar y cómo se le avisa. */
    INSERT INTO pagos_intentos (
      recurrencia_id, recurrencia_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia
    ) VALUES (
      v_r.id, v_r.proximo_pedido_fecha, v_total, 'USD', 'iniciado', 'tokenizacion',
      'nuvei', v_r.user_id, 'recurrencia',
      'rec:' || v_r.id::text || ':' || v_r.proximo_pedido_fecha::text
    )
    ON CONFLICT (clave_idempotencia) WHERE estado IN ('iniciado','pendiente') DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'sujeto', 'recurrencia', 'sujeto_id', v_r.id,

      'recurrencia_id', v_r.id,
      'periodo',        v_r.proximo_pedido_fecha,
      'intento_id',     v_intento,
      'user_id',        v_r.user_id,
      'tarjeta_id',     v_r.tarjeta_id,
      'monto',          v_total,
      'moneda',         'USD',
      'autorizada_en',  v_r.autorizada_en,
      'reintentos',     v_r.reintentos);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'fecha', v_hoy,
    'para_cobrar', v_listas,
    'frenadas', v_frenadas,
    /* 🔴 LOS DOS NÚMEROS VAN SIEMPRE, incluso en cero. *Un `para_cobrar` vacío
       sin su `frenadas` al lado es indistinguible de «no había nada que
       cobrar» — y son dos hechos muy distintos.* (`L-364`) */
    'cuantas_listas',   jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — se prueba EL CASO QUE ESTABA ROTO, no que el índice exista.
-- *Un índice que existe no dice nada; lo que hay que exigir es que el muerto
-- suelte la clave y que el vivo la siga reteniendo.*
-- ═══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_u uuid; v_b uuid; v_c text := 'cinturon:m31:' || gen_random_uuid()::text; v_bloqueo boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE tablename='pagos_intentos' AND indexname='uq_intento_clave_no_terminal'
                    AND indexdef ~ 'WHERE') THEN
    RAISE EXCEPTION 'CINTURON: el indice no quedo PARCIAL — con uno total el freno es un bloqueo permanente';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint
              WHERE conrelid='public.pagos_intentos'::regclass
                AND conname='pagos_intentos_clave_idempotencia_key') THEN
    RAISE EXCEPTION 'CINTURON: el UNIQUE total sigue vivo — convive con el parcial y gana el mas duro';
  END IF;

  /* El XOR exige UN sujeto: el fixture no puede insertar un intento huerfano.
     Se toma un bono real — la fila entera se deshace igual. */
  SELECT b.id, b.user_id INTO v_b, v_u FROM bonos b ORDER BY b.id LIMIT 1;
  IF v_b IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay bono contra el cual fabricar el caso'; END IF;

  BEGIN
    -- ① EL CASO QUE ESTABA ROTO: terminal + reintento con la MISMA clave
    INSERT INTO pagos_intentos (bono_id, monto, moneda, estado, forma, proveedor,
                                pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_b, 1.00,'USD','rechazado','tokenizacion','nuvei', v_u,'sesion', v_c);

    BEGIN
      INSERT INTO pagos_intentos (bono_id, monto, moneda, estado, forma, proveedor,
                                  pagador_user_id, pagador_origen, clave_idempotencia)
      VALUES (v_b, 1.00,'USD','iniciado','tokenizacion','nuvei', v_u,'sesion', v_c);
      RAISE NOTICE 'CINTURON ① OK - tras un RECHAZADO la familia puede reintentar con la misma clave';
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'CINTURON ①: el muerto NO solto la clave — una familia cuyo primer intento fue rechazado no podria reintentar NUNCA. Es el bloqueo permanente que esta migracion viene a cerrar.';
    END;

    -- ② DISCRIMINADOR: dos NO TERMINALES con la misma clave siguen bloqueados
    v_bloqueo := false;
    BEGIN
      INSERT INTO pagos_intentos (bono_id, monto, moneda, estado, forma, proveedor,
                                  pagador_user_id, pagador_origen, clave_idempotencia)
      VALUES (v_b, 1.00,'USD','pendiente','tokenizacion','nuvei', v_u,'sesion', v_c);
    EXCEPTION WHEN unique_violation THEN v_bloqueo := true;
    END;
    IF NOT v_bloqueo THEN
      RAISE EXCEPTION 'CINTURON ②: DOS intentos vivos con la misma clave — el indice dejo de proteger lo que importa, y dos vivos son DOS DEBITOS';
    END IF;
    RAISE NOTICE 'CINTURON ② OK - dos vivos con la misma clave siguen siendo imposibles';

    RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'FIXTURE_ROLLBACK_OK' THEN RAISE; END IF;
  END;

  -- ③ Los cuatro `ON CONFLICT` siguen resolviendo contra el indice parcial
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public'
         AND regexp_replace(regexp_replace(pg_get_functiondef(p.oid),'/\*.*?\*/','','gs'),'--[^\n]*','','g')
             ~ 'ON CONFLICT \(clave_idempotencia\) WHERE estado IN') <> 4 THEN
    RAISE EXCEPTION 'CINTURON ③: no son cuatro las funciones con el predicado — la inferencia de ON CONFLICT no acepta un indice parcial sin repetirlo, y la que falte revienta en runtime';
  END IF;
  RAISE NOTICE 'CINTURON ③ OK - las cuatro repiten el predicado';

  RAISE NOTICE 'CINTURON VERDE - 3 brazos';
END $cint$;

COMMIT;

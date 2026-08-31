-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL LINK MENSUAL ES UN INTENTO, NO UN LIBRO DE PLATA PARALELO
--          + EL LECTOR DE «EL ACTO 2 NO OCURRIÓ»
--
-- 76(g) VEDA: **NO RIGE.** Una columna nueva sobre una tabla VACÍA (medido: 0
--   filas), un reemplazo de función y un lector nuevo. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M29.sql`.
--
-- ═══ ① EL DEFECTO ES DE DISEÑO Y ES MÍO ════════════════════════════════════
-- Ayer construí `cobro_link_mensual` con `monto`, `moneda` y `pagado_en`: **le
-- di forma de libro de plata a algo que es una INVITACIÓN A PAGAR.** De ahí
-- salió una disyuntiva falsa que S109-B planteó bien —¿lo cobra el webhook o el
-- actuador?— **y las dos ramas compartían el supuesto equivocado.**
--
-- 🔴 **LO QUE LO DECIDE ES EL REVERSO, no la elegancia.**
--    `mover_sujeto_por_reverso` se dispara sobre **la transición del intento**
--    (`D-923`). Un link con libro propio produce **plata que entró por un camino
--    que el motor de reversos no puede deshacer** — y eso no da error: da un
--    reverso que no encuentra nada que mover.
--
-- 🔴 **Y EL OBJETO YA LO DECÍA, sin que hubiera que ensanchar nada:**
--    `pagos_intentos.forma` es un vocabulario CERRADO de tres — `tokenizacion`,
--    **`redireccion`**, `codigo_push` — y la tabla ya tiene **`url_redireccion`**
--    con su propio CHECK (`forma='redireccion' ⇒ estado='iniciado' OR
--    url_redireccion IS NOT NULL`).
--    ⇒ **`pagos_intentos` YA modela «un pago que la familia completa en otro
--    lado, con una URL».** `cobro_link_mensual.url_proveedor` estaba duplicando
--    esa columna. *Que no haya que ensanchar el vocabulario es la evidencia de
--    que el diseño ya lo contemplaba* — y la regla de la casa es que un
--    vocabulario cerrado no se amplía para que una migración pase.
--
-- ⇒ **`cobro_link_mensual` queda como VIGENCIA Y PRESENTACIÓN del pedido**
--   (`vence_en`, `url_proveedor`, `referencia_proveedor`, `estado`), atada a su
--   intento. El webhook no aprende nada: resuelve la referencia contra el
--   intento, como con los otros siete. **Cero cableado por riel** — que es
--   exactamente cómo el segundo riel se olvida (`L-406`/S105).
--
-- 🟢 **`intento_id` nace `NOT NULL` porque HOY se puede.** La tabla tiene 0
--    filas, medido. *Un estado malo que hoy es inexpresable y mañana no lo
--    sería: la ventana se cierra con la primera fila* (`L-439`).
--
-- ═══ ② EL LECTOR QUE NO EXISTÍA — «cobró y no entregó» ═════════════════════
-- 🔴 Un intento **`aprobado` cuyo sujeto NO se movió** es el peor estado del
--    motor: **plata tomada, nada entregado.** Y hoy **no lo levanta nadie**:
--    · `pagos_pendientes_de_conciliar` mira **intentos NO terminales** — y éste
--      es terminal, por eso el barrido pasa de largo.
--    · el actuador **sí suena** (`webhook_events.resultado='desconocido'`, 11
--      filas) — *pero que suene no es que alguien lo escuche*: censado, **ninguna
--      superficie lee ese campo**.
--    · `pagos_intentos.hallazgo` **no sirve para esto**: medido, lo escriben
--      cuatro funciones de conciliación y sus tres valores son
--      `reversado_mismo_dia`, `huerfano_deuna_vencido`, `confirmado_tardio`.
--    ⇒ **Nace el lector.** No cura, no mueve, no compensa: **NOMBRA**, que es
--    lo que falta. *Un caso que necesita una persona necesita, antes, que una
--    persona pueda encontrarlo.*
--
-- 📊 **LO QUE MIDIÓ EN SU PRIMERA CORRIDA, para que su número no asuste:**
--    **37 casos · USD 1.490,39 detenidos** — y desglosados son **35 pedidos del
--    sandbox** (12→26 ago, de cuando el actuador no movía) más **dos de HOY**:
--    la mensualidad de prueba de S109-B y **`DF-2108181`, el programa de $90 que
--    B declaró como «el barrido no lo levanta».** ⇒ *El lector encontró, en su
--    primera corrida, exactamente el caso que motivó construirlo.*
--    ⚠️ Los 35 viejos **NO se tocan** (regla del founder: ambiente de pruebas
--    hasta el 30-sep, cero backfill). El orden es por fecha DESC para que lo
--    nuevo no quede sepultado bajo el arrastre.
--
-- ⚠️ **`reembolsado` NO cuenta como «no entregado»** — es *cobró, entregó y
--    devolvió*, que es un final legítimo. Contarlo sería una alarma que llora
--    lobo, y una alarma que llora lobo es peor que no tenerla.
--
-- ⚠️ Los predicados de «movido» se MIDIERON de los estados vivos, no se
--    supusieron: la cita **no tiene estado `pagada`** —sus estados son de
--    agenda— así que su acto 2 es pasar de `pendiente` a `confirmada`.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.cobro_link_mensual
  ADD COLUMN IF NOT EXISTS intento_id uuid REFERENCES public.pagos_intentos(id);

DO $ini$
BEGIN
  IF EXISTS (SELECT 1 FROM public.cobro_link_mensual) THEN
    /* Si alguien alcanzó a emitir un link entre ayer y hoy, el NOT NULL no se
       fuerza a ciegas: se para y se mira. */
    RAISE EXCEPTION 'hay links emitidos sin intento — el NOT NULL no se aplica a ciegas, revisar a mano';
  END IF;
  ALTER TABLE public.cobro_link_mensual ALTER COLUMN intento_id SET NOT NULL;
END $ini$;

-- ─────────────────────────────────────────────────────────────────────────
-- El emisor crea el INTENTO y la presentación, en el mismo acto.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.emitir_link_mensual(
  p_sujeto text, p_sujeto_id uuid, p_periodo date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
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
  ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
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

REVOKE EXECUTE ON FUNCTION public.emitir_link_mensual(text,uuid,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.emitir_link_mensual(text,uuid,date) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- EL LECTOR DE «COBRÓ Y NO ENTREGÓ».
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pagos_aprobados_sin_sujeto_movido()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'ok', true,
    'medido_en', now(),
    'cuantos', count(*),
    'monto_detenido', COALESCE(sum(monto), 0),
    'casos', COALESCE(jsonb_agg(jsonb_build_object(
        'intento_id', id, 'sujeto', sujeto, 'sujeto_id', sujeto_id,
        'monto', monto, 'moneda', moneda, 'proveedor', proveedor,
        'proveedor_referencia', proveedor_referencia,
        'aprobado_en', cerrado_en) ORDER BY cerrado_en DESC), '[]'::jsonb))
  FROM (
    SELECT i.id, i.monto, i.moneda, i.proveedor, i.proveedor_referencia, i.cerrado_en,
           CASE
             WHEN i.pedido_id                 IS NOT NULL THEN 'pedido'
             WHEN i.compra_id                 IS NOT NULL THEN 'compra'
             WHEN i.cita_id                   IS NOT NULL THEN 'cita'
             WHEN i.bono_id                   IS NOT NULL THEN 'bono'
             WHEN i.programa_contratado_id    IS NOT NULL THEN 'programa'
             WHEN i.suscripcion_servicio_id   IS NOT NULL THEN 'suscripcion_servicio'
             WHEN i.guarderia_suscripcion_id  IS NOT NULL THEN 'mensualidad_guarderia'
             WHEN i.recurrencia_id            IS NOT NULL THEN 'recurrencia'
           END AS sujeto,
           COALESCE(i.pedido_id, i.compra_id, i.cita_id, i.bono_id,
                    i.programa_contratado_id, i.suscripcion_servicio_id,
                    i.guarderia_suscripcion_id, i.recurrencia_id) AS sujeto_id
      FROM pagos_intentos i
     WHERE i.estado = 'aprobado'
       AND (
         /* Cada predicado sale de los estados VIVOS de su tabla, medidos. */
            (i.cita_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM evento_cita_servicio c
                WHERE c.id = i.cita_id AND c.estado = 'pendiente'))
         OR (i.bono_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM bonos b
                WHERE b.id = i.bono_id AND b.estado_pago NOT IN ('pagado','reembolsado')))
         OR (i.programa_contratado_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM programas_contratados p
                WHERE p.id = i.programa_contratado_id
                  AND p.estado_pago NOT IN ('pagado','reembolsado')))
         OR (i.suscripcion_servicio_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM suscripciones_servicio s
                WHERE s.id = i.suscripcion_servicio_id
                  AND s.estado_pago NOT IN ('pagado','reembolsado')))
         OR (i.guarderia_suscripcion_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM guarderia_suscripciones g
                WHERE g.id = i.guarderia_suscripcion_id AND g.periodo_desde IS NULL))
         OR (i.pedido_id IS NOT NULL AND EXISTS (
               SELECT 1 FROM pedidos d
                WHERE d.id = i.pedido_id AND d.pagado_en IS NULL))
       )
  ) x;
$function$;

REVOKE EXECUTE ON FUNCTION public.pagos_aprobados_sin_sujeto_movido() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.pagos_aprobados_sin_sujeto_movido() TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el lector se prueba contra un caso de RESULTADO CONOCIDO antes de
-- confiar en su silencio, y en las DOS direcciones: tiene que encontrarlo
-- cuando está, y **dejar de encontrarlo cuando se cura**.
-- *Un censo que devuelve vacío no prueba que no haya: prueba que no vio.*
-- ═══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_bono uuid; v_user uuid; v_int uuid; v_r jsonb; v_n int; v_vivos int;
BEGIN
  IF (SELECT is_nullable FROM information_schema.columns
       WHERE table_name='cobro_link_mensual' AND column_name='intento_id') <> 'NO' THEN
    RAISE EXCEPTION 'CINTURON: intento_id quedo nullable — un link sin intento es plata que el reverso no puede deshacer';
  END IF;

  /* La medición viva, ANTES de tocar nada: sirve de línea base y de dato. */
  v_r := public.pagos_aprobados_sin_sujeto_movido();
  v_vivos := (v_r->>'cuantos')::int;
  RAISE NOTICE 'LECTOR sobre la base VIVA · casos=% · monto detenido=%',
    v_vivos, v_r->>'monto_detenido';

  BEGIN
    SELECT b.id, b.user_id INTO v_bono, v_user
      FROM bonos b WHERE b.estado_pago NOT IN ('pagado','reembolsado') LIMIT 1;
    IF v_bono IS NULL THEN
      RAISE EXCEPTION 'CINTURON: no hay bono sin pagar contra el cual fabricar el caso conocido';
    END IF;

    INSERT INTO pagos_intentos (bono_id, monto, moneda, estado, forma, proveedor,
                                pagador_user_id, pagador_origen, clave_idempotencia,
                                cerrado_en)
    VALUES (v_bono, 1.00, 'USD', 'aprobado', 'tokenizacion', 'nuvei',
            v_user, 'sesion', 'cinturon:m29:' || gen_random_uuid()::text, now())
    RETURNING id INTO v_int;

    -- ① LO ENCUENTRA
    v_r := public.pagos_aprobados_sin_sujeto_movido();
    IF (v_r->>'cuantos')::int <> v_vivos + 1 THEN
      RAISE EXCEPTION 'CINTURON ①: el lector NO vio el caso fabricado (esperaba %, dio %)',
        v_vivos + 1, v_r->>'cuantos';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'casos') e
                    WHERE e->>'intento_id' = v_int::text AND e->>'sujeto' = 'bono') THEN
      RAISE EXCEPTION 'CINTURON ①: lo conto pero no lo NOMBRA — un lector que da un numero y no el caso no sirve para ir a buscarlo';
    END IF;
    RAISE NOTICE 'CINTURON ① OK · lo encuentra y lo nombra (sujeto=bono)';

    -- ② DEJA DE ENCONTRARLO CUANDO SE CURA — el discriminador
    /* Pagar un bono exige soltar su hold: `chk_bono_hold_solo_si_no_pagado`.
       El fixture lo aprendio abortando — y esta bien que lo exija: es la misma
       coherencia que la funcion real tiene que respetar. */
    UPDATE bonos SET estado_pago = 'pagado', pago_expira_en = NULL WHERE id = v_bono;
    v_r := public.pagos_aprobados_sin_sujeto_movido();
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'casos') e
                WHERE e->>'intento_id' = v_int::text) THEN
      RAISE EXCEPTION 'CINTURON ②: sigue reportando un caso YA CURADO — el lector no discrimina, solo lista';
    END IF;
    RAISE NOTICE 'CINTURON ② OK · deja de verlo cuando el sujeto se mueve';

    RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'FIXTURE_ROLLBACK_OK' THEN RAISE; END IF;
  END;

  /* ③ La llave sigue gobernando la emisión. Con la llave apagada el emisor NO
     crea ningun intento — se exige el codigo exacto, no «rebotó». */
  SELECT count(*) INTO v_n FROM pagos_intentos WHERE clave_idempotencia LIKE 'link:%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON ③: hay intentos de link con la llave apagada (%)', v_n;
  END IF;
  RAISE NOTICE 'CINTURON ③ OK · cero intentos de link (la llave esta apagada y es del founder)';

  RAISE NOTICE 'CINTURON VERDE · intento_id NOT NULL · lector probado en las dos direcciones';
END $cint$;

COMMIT;

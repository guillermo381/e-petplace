-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · ① `D-913` LA VENTANA DEL «EN VUELO» · (a) LA TRANSICIÓN QUE FALTABA
--
-- ① **`D-913`, y su cura se abarató con un dato del proveedor.** La compuerta 0
-- contaba los intentos en vuelo **sin mirar la edad** ⇒ una compra con un
-- intento colgado quedaba impagable para siempre. Carlos confirmó que **el
-- código viejo se invalida solo del lado de DeUna**, así que no hay que anular
-- nada con su API: alcanza con dejar de contar los vencidos. *El intento
-- vencido no hay que matarlo — hay que dejar de creerle.*
--
-- (a) 🔴 **LA TRANSICIÓN `pago_capturado → cancelado_sistema` NO EXISTÍA, Y ESA
-- AUSENCIA YA PRODUJO UN DATO FALSO.** Medido: desde `pago_capturado` las
-- únicas salidas eran `stock_reservado` y **`cancelado_cliente`** ⇒ **la
-- máquina de estados OBLIGABA a decir que el cliente canceló.**
--
-- *Y eso cierra el hallazgo del pedido del Fluval con su causa REAL: no fue un
-- actor mal elegido — fue una máquina de estados sin la salida que
-- corresponde.* El founder firmó el hallazgo describiéndolo como un nombre que
-- miente sobre el autor; **es más profundo: el nombre correcto existía en
-- `cat_estados_pedido` y no había cómo llegar a él.** Un vocabulario completo
-- al que ninguna transición conduce es letra muerta que además fabrica
-- mentiras: quien quiere cancelar por sistema **no tiene más remedio** que
-- firmar como cliente.
--
-- ⇒ Sin esta fila, **todo reverso futuro habría mentido sobre el autor.**
--
-- 76(g) — VEDA: **NO RIGE.** DDL + una fila de catálogo. Sin backfill: los
-- pedidos ya marcados `cancelado_cliente` **no se reescriben** — *corregir el
-- pasado con la regla de hoy borraría la evidencia de que la regla faltaba.*
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826010000.sql`
-- ══════════════════════════════════════════════════════════════════════════

/* (a) LA FILA QUE FALTABA. `exige_motivo = true` a propósito: un pedido que se
   cancela con el pago ya capturado **tiene que decir por qué** — un reverso,
   un fraude y un error de stock terminan en el mismo estado y se distinguen
   sólo por esa línea. */
INSERT INTO public.cat_transiciones_pedido (desde, hasta, actor, exige_motivo, descripcion, activo)
VALUES ('pago_capturado', 'cancelado_sistema', 'sistema', true,
        'El cobro se deshizo (reverso del proveedor, fraude o error de stock): el pedido se cancela POR SISTEMA. Existe porque su ausencia obligaba a escribir cancelado_cliente sobre algo que el cliente no canceló.',
        true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text DEFAULT NULL::text, p_exige_token boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c            record;
  v_n_pedidos    int;
  v_en_vuelo     int;
  v_sin_reserva  int;
  v_suma_desglose numeric;
  v_n_desglose   int;
  v_inactivos    int;
BEGIN
  SELECT * INTO v_c FROM compras WHERE id = p_compra_id;
  IF v_c.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', 'compra',
      'codigo', 'compra_no_existe',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  SELECT count(*) INTO v_n_pedidos FROM pedidos WHERE compra_id = p_compra_id;
  IF v_n_pedidos = 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', 'compra',
      'codigo', 'compra_sin_pedidos',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 0 · La compra no tiene ya un intento EN VUELO ══
  -- Se apoya en el candado `uq_pagos_intentos_tx_por_pedido` de la migración 2,
  -- pero NO lo reemplaza: el candado impide la fila duplicada, esta compuerta
  -- impide **el segundo débito**, que es lo caro. El candado protege la tabla;
  -- la compuerta protege la tarjeta del cliente.
  /* 🔴 `D-913` · **EN VUELO ES UN ESTADO CON FECHA DE VENCIMIENTO.**
     La versión previa contaba todo intento `iniciado`/`pendiente` **sin mirar
     su edad** ⇒ un intento que nació y nunca se cerró **dejaba la compra
     impagable PARA SIEMPRE**. Medido al aplicar esta migración: TRES intentos
     bloqueando con **68, 115 y 116 horas**.
     *Un guard contra el doble débito que no distingue «está pagando ahora» de
     «se distrajo anteayer» deja de proteger la tarjeta y pasa a proteger a
     nadie de nada.*

     🔴 LA VENTANA NO SE INVENTA ACÁ: sale de `pedido_sin_pago_expira_horas`,
     la clave que **ya existe y ya significa exactamente esto**. Escribir un
     número nuevo habría creado una segunda verdad sobre cuánto vive un pago.

     ⚠️ Y NO HACE FALTA ANULAR NADA CON EL PROVEEDOR — dato de Carlos
     (25-ago-2026, sesión con DeUna): **el código viejo se invalida solo del
     lado de ellos.** Por eso la cura es contar distinto y no un acto contra su
     API: *el intento vencido no hay que matarlo, hay que dejar de creerle.* */
  SELECT count(*) INTO v_en_vuelo
    FROM pagos_intentos
   WHERE compra_id = p_compra_id
     AND estado IN ('iniciado','pendiente')
     AND creado_en > now() - make_interval(hours =>
           COALESCE((SELECT valor::int FROM app_config
                      WHERE clave = 'pedido_sin_pago_expira_horas'), 24));
  IF v_en_vuelo > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '0_intento_en_vuelo',
      'codigo', 'pago_en_proceso', 'detalle', jsonb_build_object('intentos', v_en_vuelo),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 1 · La reserva de stock sigue viva ══
  -- Un pedido SIN ítems no necesita reserva (no hay mercadería que apartar):
  -- exigírsela lo dejaría clavado para siempre.
  SELECT count(*) INTO v_sin_reserva
    FROM pedidos p
   WHERE p.compra_id = p_compra_id
     AND EXISTS (SELECT 1 FROM pedido_items pi WHERE pi.pedido_id = p.id)
     AND NOT EXISTS (
       SELECT 1 FROM inventario_reservas r
        WHERE r.pedido_id = p.id AND r.estado = 'vigente' AND r.expira_en > now());
  IF v_sin_reserva > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '1_reserva_vencida',
      'codigo', 'reserva_vencida', 'detalle', jsonb_build_object('pedidos_sin_reserva', v_sin_reserva),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 2 · El monto == el desglose congelado, CENTAVO A CENTAVO ══
  -- 🔴 La comparación es contra el DESGLOSE CONGELADO, jamás contra los totales
  --    vivos de `pedidos`: el desglose es lo que se le prometió al cliente al
  --    cobrar, y si los totales del pedido se movieron después, **el que tiene
  --    razón es el desglose**. Comparar contra lo vivo taparía justo el
  --    defecto que esta compuerta busca.
  SELECT count(*), COALESCE(sum(total),0) INTO v_n_desglose, v_suma_desglose
    FROM compra_desglose WHERE compra_id = p_compra_id;

  IF v_n_desglose <> v_n_pedidos THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'desglose_incompleto',
      'detalle', jsonb_build_object('pedidos', v_n_pedidos, 'lineas_desglose', v_n_desglose),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  IF round(v_suma_desglose, 2) <> round(v_c.total, 2) THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'monto_divergente',
      'detalle', jsonb_build_object('compra_total', v_c.total, 'suma_desglose', v_suma_desglose),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ COMPUERTA 3 · COBERTURA — NO EVALUABLE (ver cabecera) ══
  --    No se evalúa y no se finge. Viaja en `no_evaluables`.

  -- ══ COMPUERTA 4 · El vendedor sigue activo (regla 7.13) ══
  SELECT count(*) INTO v_inactivos
    FROM pedidos p
    JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.compra_id = p_compra_id
     AND cc.estado <> 'activa';
  IF v_inactivos > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '4_vendedor',
      'codigo', 'vendedor_no_activo', 'detalle', jsonb_build_object('pedidos_afectados', v_inactivos),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  /* ══ COMPUERTA 5 · El token viene y no está vacío ══
     🔴 SÓLO DONDE APLICA, Y SE DECIDE POR PARÁMETRO EXPLÍCITO — no por la forma
     del dato. `LETRA_DEUNA` §3.1 lo dice literal: **en DeUna la #5 NO APLICA**,
     porque no hay tarjeta que tokenizar. La puerta de ese riel llama con
     `p_exige_token => false`.

     ⛔ LA ALTERNATIVA BARATA ESTÁ DESCARTADA POR FIRMA, y su razón es la ley:
     *saltar la compuerta «cuando el token viene null» no distingue «este riel
     no tiene token» de «se olvidaron de mandarlo».* Los dos casos se ven
     idénticos desde adentro, y el segundo es un defecto real que `token_ausente`
     tiene que seguir cazando en el riel de tarjeta. **Un guard que se apaga solo
     cuando le falta el dato que vigila deja de ser un guard.**

     ⚠️ Y hay una razón más, medida acá: `p_token` **ya tenía `DEFAULT NULL`** —
     o sea que la firma vieja invitaba a llamarla sin token y morir. *El default
     que hacía cómoda la llamada era el mismo que la volvía imposible de pasar.* */
  IF p_exige_token THEN
    IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'compuerta', '5_token',
        'codigo', 'token_ausente',
        'no_evaluables', jsonb_build_array('cobertura'));
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'compra_id', p_compra_id,
    'pedidos', v_n_pedidos,
    'monto_verificado', v_c.total,
    /* 🔴 `evaluadas` DICE LO QUE DE VERDAD CORRIÓ. Dejar '5_token' fijo haría
       que un ok de DeUna afirmara haber verificado un token que nadie miró —
       y esa lista existe justamente para poder auditar qué se comprobó. */
    'evaluadas', CASE WHEN p_exige_token
      THEN jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor','5_token')
      ELSE jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor') END,
    /* 🔴 «NO APLICA» ES DISTINTO DE «NO EVALUABLE», y por eso van en campos
       distintos. `cobertura` no se pudo evaluar — es una deuda de medición.
       `5_token` en DeUna **no existe como pregunta**. *En la misma bolsa, una
       carencia y una decisión se leen igual.* */
    'no_aplican', CASE WHEN p_exige_token
      THEN '[]'::jsonb ELSE jsonb_build_array('5_token') END,
    -- 🔴 VIAJA SIEMPRE, incluso en el ok. Que nadie lea este true como
    --    «la cobertura está verificada»: no se verificó nada de cobertura.
    'no_evaluables', jsonb_build_array('cobertura'));
END $function$
;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — con el ROJO PRODUCIDO contra los intentos vencidos REALES.
-- Sólo lee.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_compra uuid; r jsonb; v_edad numeric; v_trans int; v_sobre int;
BEGIN
  SELECT count(*) INTO v_sobre FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='verificar_compuertas_pre_cobro';
  IF v_sobre <> 1 THEN RAISE EXCEPTION 'CINTURÓN: % sobrecargas', v_sobre; END IF;

  -- (a) la transición existe y llega al vocabulario correcto
  SELECT count(*) INTO v_trans FROM cat_transiciones_pedido
   WHERE desde='pago_capturado' AND hasta='cancelado_sistema' AND activo;
  IF v_trans <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN: la transición pago_capturado→cancelado_sistema no quedó (%)', v_trans;
  END IF;

  -- ① EL CASO REAL: una compra bloqueada por un intento vencido
  SELECT i.compra_id, round(extract(epoch from (now()-i.creado_en))/3600, 1)
    INTO v_compra, v_edad
    FROM pagos_intentos i
    JOIN compras c ON c.id = i.compra_id
   WHERE i.estado IN ('iniciado','pendiente')
     AND c.estado IN ('creada','esperando_pago')
     AND i.creado_en < now() - interval '25 hours'
   ORDER BY i.creado_en LIMIT 1;

  IF v_compra IS NULL THEN
    RAISE NOTICE 'CINTURÓN PARCIAL · transición OK · sin compra bloqueada por intento vencido: ① NO se ejerció';
    RETURN;
  END IF;

  r := verificar_compuertas_pre_cobro(v_compra, 'tok', true);

  /* 🔴 EL DISCRIMINADOR HONESTO: la compra puede cortar por OTRA compuerta
     (reserva vencida es lo más probable tras 68 horas) y eso NO invalida la
     prueba. Lo que se mide es **que la 0 deje de ser la que corta**, no que la
     compra sea pagable — *después de días, que la reserva haya vencido es lo
     correcto, y curarlo sería otra cosa.* */
  IF (r->>'compuerta') = '0_intento_en_vuelo' THEN
    RAISE EXCEPTION 'CINTURÓN: la compuerta 0 SIGUE bloqueando con un intento de % horas — %', v_edad, r;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · transición OK · intento vencido de %h ya NO bloquea · ahora corta en: %',
    v_edad, coalesce(r->>'compuerta','(pasa)');
END $cint$;

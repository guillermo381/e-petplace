-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · LA COMPUERTA DEL TOKEN, POR RIEL  (bloqueante de la sesión con DeUna)
--
-- EL DEFECTO, medido por la pista D: `verificar_compuertas_pre_cobro` corre la
-- **compuerta 5 (token de tarjeta) SIEMPRE**, y `pagos-deuna-solicitud` la llama
-- con `p_token: null` — **el valor exacto que la compuerta rechaza.**
-- `LETRA_DEUNA` §3.1 dice literal que la #5 **NO APLICA** a DeUna: no hay
-- tarjeta que tokenizar.
--
-- 🔴 Y ES LA EXPLICACIÓN DE UN NÚMERO QUE YA HABÍAMOS MEDIDO SIN ENTENDER:
-- **cero intentos de DeUna en toda la base.** *No falla desde hoy — nunca pudo
-- funcionar.* Los frenos anteriores del riel lo venían tapando: el primero que
-- llegó hasta acá se encontró con una puerta cerrada por una pregunta que en su
-- riel no tiene sentido.
--
-- LA CURA, FIRMADA POR EL FOUNDER: **parámetro explícito**, `DEFAULT true` ⇒
-- ninguna llamada existente cambia de comportamiento (único llamador SQL:
-- `recurrencias_vencidas_pendientes`, que no se toca).
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro, sin backfill, sin tocar una fila.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260825230000.sql`
-- ⛔ Su nota es dura: revertir vuelve a dejar DeUna impagable.
--
-- ⚠️ ESTA MIGRACIÓN NO ALCANZA SOLA: la edge `pagos-deuna-solicitud` tiene que
-- pasar `p_exige_token => false`. Es territorio D. **Hasta que lo haga, el
-- comportamiento es exactamente el de antes** — que es lo correcto para un
-- cambio de firma con default: *nada mejora solo, y nada empeora solo.*
-- ══════════════════════════════════════════════════════════════════════════

/* 🔴 EL DROP NO ES PROLIJIDAD — lo pidió el primer intento, que ABORTÓ.
   `CREATE OR REPLACE` con un argumento MÁS **no reemplaza: crea una segunda
   función.** Con las dos vivas y las dos con defaults, una llamada de dos
   argumentos se vuelve `function ... is not unique` (42725) — y la que llama
   así es la edge del riel de tarjeta, o sea que la cura de DeUna habría roto
   el cobro que hoy funciona.
   *Una firma nueva no desplaza a la vieja: convive con ella, y el que elige es
   el resolvedor de sobrecargas, no nosotros.* (`L-119`) */
DROP FUNCTION IF EXISTS public.verificar_compuertas_pre_cobro(uuid, text);

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
  SELECT count(*) INTO v_en_vuelo
    FROM pagos_intentos
   WHERE compra_id = p_compra_id
     AND estado IN ('iniciado','pendiente');
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
-- CINTURÓN — TRES brazos, y el del medio es el que importa: el guard **sigue
-- cazando** el token ausente donde sí aplica. Sólo lee; no escribe una fila.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_compra uuid;
  r_deuna jsonb; r_sin_token jsonb; r_con_token jsonb;
BEGIN
  SELECT id INTO v_compra FROM compras
   WHERE estado IN ('esperando_pago','creada') ORDER BY created_at DESC LIMIT 1;
  IF v_compra IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no hay compra sin pagar contra la cual medir';
  END IF;

  r_deuna     := verificar_compuertas_pre_cobro(v_compra, NULL, false);
  r_sin_token := verificar_compuertas_pre_cobro(v_compra, NULL);           -- tarjeta
  r_con_token := verificar_compuertas_pre_cobro(v_compra, 'tok_cinturon'); -- tarjeta

  -- ① EL ROJO QUE TIENE QUE SEGUIR ROJO
  IF NOT ((r_sin_token->>'codigo') = 'token_ausente'
          OR (r_sin_token->>'compuerta') <> '5_token') THEN
    RAISE EXCEPTION 'CINTURÓN: el riel de tarjeta dejó de cazar el token ausente — %', r_sin_token;
  END IF;

  -- ② DEUNA YA NO MUERE AHÍ
  IF (r_deuna->>'compuerta') = '5_token' THEN
    RAISE EXCEPTION 'CINTURÓN: DeUna SIGUE muriendo en la compuerta del token — %', r_deuna;
  END IF;

  -- ③ y cuando pasa, lo DICE
  IF coalesce((r_deuna->>'ok')::boolean,false)
     AND NOT (r_deuna->'no_aplican' @> '["5_token"]'::jsonb) THEN
    RAISE EXCEPTION 'CINTURÓN: el ok de DeUna no declara que la 5 no aplica — %', r_deuna;
  END IF;

  /* 🔴 DISCRIMINADOR HONESTO: esta compra puede cortar ANTES por otra compuerta
     (reserva, monto, vendedor) y eso NO invalida la prueba — lo que se mide es
     **que la 5 deje de ser la que corta en DeUna y siga siendo la que corta en
     tarjeta**, no que esta compra en particular sea pagable. */
  RAISE NOTICE 'CINTURÓN VERDE · deuna_corta_en=% · tarjeta_sin_token=% · tarjeta_con_token=%',
    coalesce(r_deuna->>'compuerta','(pasa)'),
    coalesce(r_sin_token->>'codigo','(pasa)'),
    coalesce(r_con_token->>'compuerta','(pasa)');
END $cint$;

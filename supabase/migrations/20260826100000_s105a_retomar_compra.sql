-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · RETOMAR LA COMPRA — el pago que quedó a medias
--
-- EL CONTEXTO, medido y no estimado: **37 compras abandonadas vivas con
-- $4.617,92 detenidos.** No es una comodidad de producto — *es plata que hoy
-- nadie puede completar.*
--
-- 🔴 Y LO QUE LAS FRENA NO ES LO QUE SE CREÍA. Corrida la compuerta real sobre
-- las 37: **36 cortan en `1_reserva_vencida`** y una sola en
-- `0_intento_en_vuelo` —y esa tiene 0 horas, o sea un pago en curso legítimo—.
-- **NINGUNA corta por un intento vencido**: eso lo destrabó `20260826010000`.
-- ⇒ *el botón «pagar» no nacía muerto por `D-913`: nacía muerto por el stock.*
-- Y esa compuerta **no es un defecto**: es el inventario diciendo la verdad —
-- pasadas unas horas el producto volvió y no está apartado para nadie.
--
-- LAS DOS FIRMAS DEL FOUNDER QUE ESTO EJECUTA:
--   ① **RETOMAR, no re-armar el carrito** — conserva lo que la familia dejó.
--      · re-apartar el stock **es parte del acto**: si falla, no se retoma y
--        se dice por qué;
--      · si un ítem ya no está, **NO se retoma a medias** — *una compra que se
--        completa sin uno de sus productos es una compra distinta de la que la
--        familia dejó, y nadie se lo dijo.*
--   ② **EL PRECIO: EL MENOR DE LOS DOS.** *Nunca cobramos más de lo que el
--      producto vale hoy; si bajó, la persona se entera de algo bueno.*
--
-- ══════════════════════════════════════════════════════════════════════════
-- 🔴 DÓNDE VIVE CADA NÚMERO — la consecuencia que el founder pidió DECLARADA
--    Y NO DESCUBIERTA. Son dos y hay que saber cuál manda en cada lugar.
--
-- La tensión es real y la produce la compuerta 2, cuyo propio comentario dice:
-- *«el desglose es lo que se le prometió al cliente al cobrar… el que tiene
-- razón es el desglose»*. Si el cobro tomara el menor y el desglose siguiera
-- diciendo el viejo, **la compuerta 2 rebotaría el cobro que acabamos de
-- autorizar.**
--
-- LA RESOLUCIÓN, y se apoya en leer bien esa frase: el desglose es lo que se
-- prometió **AL COBRAR**. Si la familia retoma y el precio bajó, **lo que se
-- le promete ahora ES el nuevo** ⇒ re-congelar no viola el congelado: lo
-- cumple. *Lo que no se puede perder es el rastro del número anterior.*
--
--   · `compra_desglose` + `compras.total` + `pedidos.total` → **LO QUE SE
--     COBRA**. Se re-congelan juntos, o la compuerta 2 rebota y con razón.
--   · `pedido_items.precio_unitario_prometido` (nace acá) → **LO QUE SE
--     PROMETIÓ AQUEL DÍA**. Sólo se llena si hubo ajuste; `NULL` significa
--     «nunca se ajustó», que es distinto de «se ajustó a lo mismo».
--
-- ⇒ **el congelado sigue siendo el registro de la promesa vigente; el precio
-- histórico vive al lado, en la línea del ítem, y ningún lector de plata lo
-- suma por accidente.**
-- ══════════════════════════════════════════════════════════════════════════
--
-- 76(g) — VEDA: 🔴 **RIGE.** `ALTER TABLE` sobre una tabla de plata con
-- escritura viva. La columna nace NULLABLE y sin backfill: **ninguna fila
-- existente cambia de valor.**
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826100000.sql`
-- ⛔ Su nota es dura: dropear la columna BORRA el registro de lo prometido.
-- ══════════════════════════════════════════════════════════════════════════

/* ① EL REGISTRO DE LA PROMESA. NULL = nunca se ajustó — que **no** es lo mismo
   que «se ajustó al mismo precio». *Un default de 0 o una copia del precio
   actual harían indistinguibles esos dos casos, y el segundo es el que un
   contador va a querer explicar.* */
ALTER TABLE public.pedido_items
  ADD COLUMN IF NOT EXISTS precio_unitario_prometido numeric;

COMMENT ON COLUMN public.pedido_items.precio_unitario_prometido IS
  'S105-A · El precio que se le prometió a la familia el día que armó la compra, '
  'conservado cuando `retomar_compra` lo ajustó a la baja. NULL = nunca se ajustó. '
  'NO es el precio que se cobra: ese es `precio_unitario`.';


CREATE OR REPLACE FUNCTION public.retomar_compra(p_compra_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_c        compras;
  v_it       record;
  v_ped      record;
  v_retirados jsonb := '[]'::jsonb;
  v_ajustes   jsonb := '[]'::jsonb;
  v_res      jsonb;
  v_ahora    timestamptz := now();
  v_nuevo_sub numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF NOT FOUND OR v_c.user_id <> v_uid THEN
    /* Mismo código para «no existe» y «es de otro»: la diferencia le
       confirmaría a un tercero que esa compra existe. */
    RETURN jsonb_build_object('ok', false, 'codigo', 'compra_no_existe');
  END IF;

  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_pagada', 'retomada', false);
  END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'compra_no_retomable',
                              'estado', v_c.estado);
  END IF;

  /* ══ ② ¿SIGUE EXISTIENDO TODO? — SE PREGUNTA ANTES DE TOCAR NADA ══
     🔴 El censo va COMPLETO antes de la primera escritura, a propósito: si se
     fuera item por item apartando y abortara en el tercero, quedarían dos
     reservas tomadas para una compra que no se va a completar. *Apartar stock
     para algo que ya sabemos que no puede terminar es peor que no apartarlo.* */
  FOR v_it IN
    SELECT pi.id, pi.nombre_producto, pi.cantidad, pi.precio_unitario,
           o.id AS oferta_id, o.precio AS precio_hoy, o.estado AS oferta_estado,
           o.retirado_en, o.hay_stock
      FROM pedido_items pi
      JOIN pedidos p ON p.id = pi.pedido_id
      LEFT JOIN ofertas o ON o.id = pi.oferta_id
     WHERE p.compra_id = p_compra_id
  LOOP
    IF v_it.oferta_id IS NULL
       OR v_it.retirado_en IS NOT NULL
       OR v_it.oferta_estado IS DISTINCT FROM 'publicada'
       OR v_it.hay_stock IS NOT TRUE
    THEN
      v_retirados := v_retirados || jsonb_build_object(
        'item', v_it.id, 'producto', v_it.nombre_producto,
        'razon', CASE
          WHEN v_it.oferta_id IS NULL          THEN 'sin_oferta'
          WHEN v_it.retirado_en IS NOT NULL    THEN 'retirado'
          WHEN v_it.hay_stock IS NOT TRUE      THEN 'sin_stock'
          ELSE 'no_publicada' END);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_retirados) > 0 THEN
    /* 🔴 NO SE RETOMA A MEDIAS — firma del founder. Y **se nombra qué falta**:
       *«no se puede completar» sin decir cuál producto obliga a la familia a
       adivinar, y a nosotros a no poder ayudarla.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'producto_no_disponible',
      'retomada', false, 'faltantes', v_retirados);
  END IF;

  /* ══ ③ EL PRECIO: EL MENOR DE LOS DOS ══ */
  FOR v_it IN
    SELECT pi.id, pi.pedido_id, pi.nombre_producto, pi.cantidad,
           pi.precio_unitario, pi.impuesto_pct, o.precio AS precio_hoy
      FROM pedido_items pi
      JOIN pedidos p ON p.id = pi.pedido_id
      JOIN ofertas o ON o.id = pi.oferta_id
     WHERE p.compra_id = p_compra_id
       AND o.precio < pi.precio_unitario          -- SÓLO a la baja
  LOOP
    v_nuevo_sub := round(v_it.precio_hoy * v_it.cantidad, 2);
    UPDATE pedido_items
       SET /* el registro de la promesa, sólo la PRIMERA vez: un segundo retome
              no debe pisar el precio original con el del primer ajuste. */
           precio_unitario_prometido = COALESCE(precio_unitario_prometido, precio_unitario),
           precio_unitario = v_it.precio_hoy,
           subtotal        = v_nuevo_sub,
           impuesto_monto  = round(v_nuevo_sub * COALESCE(v_it.impuesto_pct,0) / 100, 2),
           updated_at      = v_ahora
     WHERE id = v_it.id;

    v_ajustes := v_ajustes || jsonb_build_object(
      'producto', v_it.nombre_producto,
      'antes', v_it.precio_unitario, 'ahora', v_it.precio_hoy);
  END LOOP;

  /* ══ ④ RE-CONGELAR LOS TRES NIVELES, O LA COMPUERTA 2 REBOTA ══
     *Actualizar el ítem y no el desglose dejaría el cobro autorizado por un
     lado y rechazado por el otro.* */
  IF jsonb_array_length(v_ajustes) > 0 THEN
    UPDATE pedidos p SET
      subtotal       = s.sub,
      impuesto_total = s.imp,
      total          = s.sub + s.imp + COALESCE(p.costo_envio,0),
      updated_at     = v_ahora
    FROM (SELECT pi.pedido_id, sum(pi.subtotal) sub, sum(COALESCE(pi.impuesto_monto,0)) imp
            FROM pedido_items pi JOIN pedidos pp ON pp.id = pi.pedido_id
           WHERE pp.compra_id = p_compra_id GROUP BY pi.pedido_id) s
    WHERE p.id = s.pedido_id;

    UPDATE compra_desglose d SET
      subtotal = p.subtotal, impuesto = p.impuesto_total,
      total    = p.total,    congelado_en = v_ahora
    FROM pedidos p
    WHERE d.pedido_id = p.id AND d.compra_id = p_compra_id;

    UPDATE compras c SET
      subtotal = s.sub, impuesto_total = s.imp, envio_total = s.env,
      total = s.tot, updated_at = v_ahora
    FROM (SELECT sum(subtotal) sub, sum(impuesto) imp,
                 sum(COALESCE(envio,0)) env, sum(total) tot
            FROM compra_desglose WHERE compra_id = p_compra_id) s
    WHERE c.id = p_compra_id;
  END IF;

  /* ══ ⑤ RE-APARTAR EL STOCK — **ES PARTE DEL ACTO, NO UN PASO APARTE** ══
     Si falla, la excepción sube y **toda la función se deshace**: los precios
     ajustados se revierten con ella. *Una compra con el precio nuevo y sin
     stock apartado sería exactamente el botón que promete lo que no puede.* */
  FOR v_ped IN SELECT id FROM pedidos WHERE compra_id = p_compra_id
                AND estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
  LOOP
    BEGIN
      PERFORM reservar_stock_pedido(v_ped.id, 180);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'stock_insuficiente',
        'retomada', false, 'pedido', v_ped.id, 'causa', SQLERRM);
    END;
  END LOOP;

  UPDATE compras SET estado = 'esperando_pago', updated_at = v_ahora
   WHERE id = p_compra_id AND estado = 'creada';

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'retomada', 'retomada', true,
    'compra_id', p_compra_id,
    'total', (SELECT total FROM compras WHERE id = p_compra_id),
    /* 🔴 LOS AJUSTES VIAJAN PARA QUE LA PANTALLA LOS DIGA — firma del founder:
       *el precio menor «se dice en pantalla»*. Si esto no viajara, la familia
       vería un total distinto del que dejó **sin explicación**, que se lee
       peor que el precio viejo. */
    'ajustes_de_precio', v_ajustes,
    'bajo_de_precio', (jsonb_array_length(v_ajustes) > 0));
END $$;

REVOKE ALL ON FUNCTION public.retomar_compra(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retomar_compra(uuid) TO authenticated, service_role;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — 🔴 EJERCE EL CAMINO DE VERDAD sobre una compra abandonada REAL,
-- en subtransacción que se deshace sola (`L-406`).
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_compra uuid; v_dueno uuid; v_estado text; v_total numeric;
  v_item uuid; v_of uuid; v_precio numeric; v_pu numeric;
  r_baja jsonb; r_retirado jsonb; r_ajeno jsonb; v_ajeno uuid;
  v_compuerta jsonb;
BEGIN
  SELECT c.id, c.user_id, c.estado, c.total INTO v_compra, v_dueno, v_estado, v_total
    FROM compras c
   WHERE c.estado IN ('creada','esperando_pago')
     AND EXISTS (SELECT 1 FROM pedidos p JOIN pedido_items pi ON pi.pedido_id=p.id
                  JOIN ofertas o ON o.id=pi.oferta_id
                 WHERE p.compra_id=c.id AND o.estado='publicada' AND o.hay_stock)
   ORDER BY c.created_at DESC LIMIT 1;

  IF v_compra IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: sin compra abandonada con oferta viva contra la cual medir';
  END IF;

  SELECT pi.id, pi.oferta_id, pi.precio_unitario, o.precio
    INTO v_item, v_of, v_pu, v_precio
    FROM pedido_items pi JOIN pedidos p ON p.id=pi.pedido_id
    JOIN ofertas o ON o.id=pi.oferta_id
   WHERE p.compra_id = v_compra LIMIT 1;

  /* 🔴 El usuario ajeno se resuelve ACÁ, todavía como `postgres`: leer
     `auth.users` con el rol `authenticated` da `permission denied` — y eso
     haría fallar el cinturón por el instrumento, no por la cura. */
  SELECT u.id INTO v_ajeno FROM auth.users u WHERE u.id <> v_dueno LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno::text,'role','authenticated')::text, true);
  PERFORM set_config('role','authenticated', true);

  -- ① EL PRECIO BAJÓ: se ajusta, se registra la promesa, y el desglose sigue
  PERFORM set_config('role','postgres', true);
  UPDATE ofertas SET precio = round(v_pu / 2, 2) WHERE id = v_of;
  PERFORM set_config('role','authenticated', true);

  r_baja := retomar_compra(v_compra);

  PERFORM set_config('role','postgres', true);
  -- 🔴 LA COMPUERTA 2 TIENE QUE SEGUIR PASANDO tras el re-congelado
  v_compuerta := verificar_compuertas_pre_cobro(v_compra, 'tok', true);

  -- ② PRODUCTO RETIRADO: no se retoma a medias
  UPDATE ofertas SET estado='retirada', retirado_en=now() WHERE id = v_of;
  PERFORM set_config('role','authenticated', true);
  r_retirado := retomar_compra(v_compra);

  -- ③ EL GATE: un tercero no puede retomar la compra de otro
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ajeno::text,'role','authenticated')::text, true);
  r_ajeno := retomar_compra(v_compra);

  -- ④ SE DESHACE TODO ANTES DE DECIDIR
  PERFORM set_config('role','postgres', true);
  UPDATE ofertas SET precio = v_precio, estado='publicada', retirado_en=NULL WHERE id = v_of;
  UPDATE pedido_items SET precio_unitario = precio_unitario_prometido,
         precio_unitario_prometido = NULL
   WHERE precio_unitario_prometido IS NOT NULL;
  UPDATE compras SET estado = v_estado, total = v_total WHERE id = v_compra;

  IF NOT COALESCE((r_baja->>'ok')::boolean,false) THEN
    RAISE EXCEPTION 'CINTURÓN: no retomó con precio a la baja — %', r_baja;
  END IF;
  IF (r_baja->>'bajo_de_precio')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURÓN: no detectó la baja de precio — %', r_baja;
  END IF;
  IF jsonb_array_length(r_baja->'ajustes_de_precio') = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: los ajustes no viajan y la pantalla no podría decirlos';
  END IF;
  /* 🔴 EL BRAZO QUE JUSTIFICA EL RE-CONGELADO DE LOS TRES NIVELES */
  IF (v_compuerta->>'compuerta') = '2_monto' THEN
    RAISE EXCEPTION 'CINTURÓN: tras el ajuste la compuerta del MONTO rebota — el desglose quedó desincronizado: %', v_compuerta;
  END IF;
  IF (r_retirado->>'codigo') <> 'producto_no_disponible' THEN
    RAISE EXCEPTION 'CINTURÓN: retomó con un producto retirado — %', r_retirado;
  END IF;
  IF (r_ajeno->>'codigo') <> 'compra_no_existe' THEN
    RAISE EXCEPTION 'CINTURÓN: un tercero pudo retomar la compra — %', r_ajeno;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · baja=% ajustes=% · compuerta tras ajuste=% · retirado=% · ajeno=%',
    r_baja->>'bajo_de_precio', jsonb_array_length(r_baja->'ajustes_de_precio'),
    coalesce(v_compuerta->>'compuerta','(pasa)'),
    r_retirado->>'codigo', r_ajeno->>'codigo';
END $cint$;

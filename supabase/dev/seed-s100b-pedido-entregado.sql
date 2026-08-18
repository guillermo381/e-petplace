-- ═══════════════════════════════════════════════════════════════════════════
-- SIEMBRA S100b · UN PEDIDO ENTREGADO PARA PODER MIRAR LA CEREMONIA
--
-- PEDIDA POR D CON EL CASO · FIRMADA POR EL FOUNDER (17-ago-2026).
--
-- POR QUÉ EXISTE: la ceremonia de entrega que S100 construyó (`897e6f19`)
-- NUNCA PUDO ABRIRSE. Medido por D: los dos únicos pedidos `entregado` de la
-- base son de la cuenta demo **y son cabeceras huérfanas** — 0 ítems y sin
-- `entregado_en` (H-113, la forma que S94 ya había censado en 137 filas).
-- ⇒ no es que el founder no tenga uno: **no existe ninguno completo en la
-- base**, ni real ni demo. La siembra es necesaria, medido y no supuesto.
--
-- 🔴 EL PAR ES LO QUE LA VUELVE DEMOSTRATIVA, y no es decoración:
--    · alimento de perro  → Thor  · `entra_al_expediente = true`  ⇒ SEDIMENTA
--    · higiene de gato    → Jack  · `entra_al_expediente = false` ⇒ NO sedimenta
--    Con un solo alimento la pantalla se ve bien y NO PRUEBA NADA: el tercer
--    acto existe justamente para distinguir esos dos casos.
--
-- ⚠️ EL PAR SE CORRIGIÓ CONTRA LA BASE, y se declara: D pidió «un juguete»
--    para el lado `false`. **No hay una sola oferta de `juguete` publicada**
--    (medido: 0 en toda la base), y **ninguna familia `false` tiene producto
--    aplicable a perro**. Se usa `higiene` de gato → Jack, que es real, es de
--    la familia del founder y cumple exactamente la misma función: probar que
--    el tercer acto DISCRIMINA. *Sembrar un juguete inventado para calzar con
--    el pedido habría sido fabricar la evidencia que la siembra viene a dar.*
--
-- TODO SE HACE POR EL CAMINO REAL — crear → pagar → preparar → empacar →
-- despachar → entregar, con los JWT de cada actor. Cero UPDATE a mano sobre
-- `envios`: las estampas (`entregado_en`, `verificado_en`,
-- `entregado_por_nombre`, foto) las pone `entregar_pedido`, que es lo que
-- sostiene una disputa (H-10). *Una estampa escrita a mano prueba que sé
-- escribir en una columna, no que el camino funciona.*
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ☠️ RETIRO — SE CORRE ANTES DE LEER EL RESTO, no después de necesitarlo
-- ═══════════════════════════════════════════════════════════════════════════
-- El pedido queda marcado con la clave de idempotencia `S100B-SIEMBRA-GATE`,
-- que es lo que lo hace hallable sin depender de fechas ni de ojo:
--
-- ✅ ESTE RETIRO ESTÁ **PROBADO**, no solo escrito: se corrió entero con
--    ROLLBACK contra la siembra real y dejó `quedan_pedidos = 0` y
--    `quedan_eventos = 0`, con la siembra intacta después. *Un retiro sin
--    probar es peor que no tener retiro: se escribe una vez, se guarda, y el
--    día que hace falta nadie se acuerda de que nunca corrió.*
--
-- ⚠️ Y LAS DOS VECES QUE FALLÓ ANTES DE QUEDAR ASÍ, porque son la razón de
--    probarlo: ① borraba por `eventos_mascota.metadata->>'pedido_item_id'`, y
--    **esa columna no existe** — el enlace real es
--    `evento_producto_asignacion.pedido_item_id → evento_id`; ② borraba el
--    PADRE antes que el HIJO y la FK es RESTRICT. Ninguna de las dos la
--    encontró leyendo: las encontró correrlo.
--    El orden sale del censo de FKs (`pg_constraint`), no de intuición: OCHO
--    tablas apuntan a `pedidos` con RESTRICT y cualquiera de ellas lo bloquea.
--
--   BEGIN;
--     CREATE TEMP TABLE _p(id uuid) ON COMMIT DROP;
--     INSERT INTO _p SELECT id FROM pedidos WHERE clave_idempotencia='S100B-SIEMBRA-GATE';
--     CREATE TEMP TABLE _ev(id uuid) ON COMMIT DROP;
--     INSERT INTO _ev SELECT epa.evento_id FROM evento_producto_asignacion epa
--       JOIN pedido_items pi ON pi.id=epa.pedido_item_id WHERE pi.pedido_id IN (SELECT id FROM _p);
--     DELETE FROM evento_producto_asignacion WHERE evento_id IN (SELECT id FROM _ev);
--     DELETE FROM eventos_mascota           WHERE id IN (SELECT id FROM _ev);
--     DELETE FROM pedido_item_destinos WHERE pedido_item_id IN (SELECT id FROM pedido_items WHERE pedido_id IN (SELECT id FROM _p));
--     DELETE FROM pagos_eventos   WHERE intento_id IN (SELECT id FROM pagos_intentos WHERE pedido_id IN (SELECT id FROM _p));
--     DELETE FROM pagos_intentos      WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM inventario_reservas WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM facturas            WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM compra_desglose     WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM devoluciones        WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM pedido_descuentos   WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM envios              WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM pedido_estados      WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM pedido_items        WHERE pedido_id IN (SELECT id FROM _p);
--     DELETE FROM pedidos             WHERE id IN (SELECT id FROM _p);
--   COMMIT;
--
-- ⚠️ EL RETIRO NO DESHACE TODO Y SE DICE: los movimientos de inventario
--    (`inventario_movimientos` tipo `consumo`) que la entrega generó son un
--    ledger y **no se borran** — igual que el ledger de S95 no se corrige
--    borrando filas. Si molestan, se compensan con un movimiento inverso, que
--    es una decisión de operación y no de esta siembra.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ CORRIDA · 17-ago-2026 · pedido `21fb1284-032c-41eb-8aa2-a8c9fdb15544`
-- ═══════════════════════════════════════════════════════════════════════════
--   estado `entregado` · 2 ítems · total $28.21 · envío `entregado`
--   entregado_en 2026-08-18 03:13 · verificado_en ✓ · foto ✓
--   entregado_por «Repartidor de Pruebas» · código de puerta `7361`
--
-- 🔴 EL NÚMERO QUE JUSTIFICA LA SIEMBRA — `eventos_expediente = 1`, con DOS
--    ítems y los DOS con mascota. Verificado después ítem por ítem:
--      alimento → Thor · entra_al_expediente=true  · depósitos = 1
--      higiene  → Jack · entra_al_expediente=false · depósitos = 0
--    *El tercer acto de la ceremonia tiene, por primera vez, un caso donde
--    puede equivocarse — y no se equivocó.* Con un solo alimento la pantalla
--    se habría visto igual de bien sin probar nada.
--
-- ⚠️ Y LO QUE ESTA CORRIDA DEJÓ MEDIDO DE PASO: la escalera real tiene más
--    escalones que la letra. `preparado` no existe en el motor (`cat_estados_
--    pedido` tiene once estados internos bajo la narrativa `preparando`), el
--    empaque EXIGE lote —*sin lote no se puede responder un retiro de
--    fabricante*— y `empacado → documentado` **lo da la factura**, no un
--    cambio de estado. Los tres me rebotaron y los tres tenían razón.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LOS ACTORES, medidos contra la base (no de memoria)
--   cliente     dd024680-3d1c-4465-b38b-dedab45da037  guillo381+8@gmail.com
--   familia     ce057f90-82d8-40f8-a816-796c0f2b5b2a
--   Thor perro  d2e31d70-54fc-4d47-b425-1617239257eb
--   Jack gato   590b53a7-35e7-4fab-8c56-bb58888b7199
--   vendedor cc eec12ef3-2c0c-41e7-a45e-81559fdf62a8  «Despensa de Pruebas (borrable)»
--   su owner    da83d6d8-f090-414c-98e0-7fae644f52df  guillo381+nuevotest2@gmail.com
--   repartidor  664e9695-f6c8-424c-b50c-79765d8135c4  «Repartidor de Pruebas» (activo)
--   oferta true 1b88d7d2-2600-48e2-bec0-e2424ac29f4a  ADULTO SMALL BREED 3kg  $20.50 (perro)
--   oferta false 8924a49c-62fa-432a-8af8-7022efc174d9 CANADA LITTER          $6.70  (gato)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_cliente    uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_vendedor   uuid := 'da83d6d8-f090-414c-98e0-7fae644f52df';
  v_cc         uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_repartidor uuid := '664e9695-f6c8-424c-b50c-79765d8135c4';
  v_thor       uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_jack       uuid := '590b53a7-35e7-4fab-8c56-bb58888b7199';
  v_of_true    uuid := '1b88d7d2-2600-48e2-bec0-e2424ac29f4a';
  v_of_false   uuid := '8924a49c-62fa-432a-8af8-7022efc174d9';
  v_ped        uuid;
  v_codigo     text;
  v_r          jsonb;
  v_eventos    int;
  v_items      int;
  v_estado     text;
  v_entregado  timestamptz;
BEGIN
  -- ── 1 · EL CLIENTE ARMA Y PAGA ───────────────────────────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_cliente, 'role', 'authenticated')::text, true);

  v_r := crear_pedido_despensa(
    v_cc,
    jsonb_build_array(
      jsonb_build_object('oferta_id', v_of_true,  'cantidad', 1, 'mascota_id', v_thor),
      jsonb_build_object('oferta_id', v_of_false, 'cantidad', 1, 'mascota_id', v_jack)
    ),
    jsonb_build_object(
      'nombre_receptor', 'Guillermo',
      'telefono', '+593 99 123 4567',
      'direccion', 'Av. Shyris N35-52 y Portugal',
      'ciudad', 'Quito',
      'sector', 'La Carolina',
      'referencias', 'Edificio Metropolitan, piso 4',
      'instrucciones', 'Dejar en portería si no hay nadie'
    ),
    'S100B-SIEMBRA-GATE',
    NULL, 'despacho', NULL, 'estandar');

  v_ped := (v_r->>'pedido_id')::uuid;
  IF v_ped IS NULL THEN RAISE EXCEPTION 'la siembra no creó pedido: %', v_r; END IF;
  RAISE NOTICE '① pedido creado: %', v_ped;

  PERFORM iniciar_pago_pedido(v_ped, 30);

  -- 🔴 LA CONFIRMACIÓN DE PAGO **NO** ES DEL CLIENTE, y la siembra lo respeta.
  -- `confirmar_pago_pedido` rebota con sesión de persona: *«este camino es del
  -- webhook de la pasarela»* — es la cura de S95 (la puerta por la que
  -- cualquier usuario logueado marcaba como pagado el pedido de otro).
  -- Se limpia la sesión para entrar por la rama del webhook, que es el actor
  -- real de este paso. *Firmar como el cliente habría exigido saltear el
  -- gate, y saltear un gate de plata para poder mirar una pantalla es
  -- exactamente lo que no se hace.*
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM confirmar_pago_pedido(v_ped, 'siembra', 'S100B-SIEMBRA-GATE',
                                'S100B-SIEMBRA-GATE-PAGO', '{"siembra":true}'::jsonb);
  RAISE NOTICE '② pagado (simulado, por la rama del webhook — proveedor «siembra»)';

  -- ── 2 · LA ESCALERA REAL HASTA EL DESPACHO ───────────────────────────────
  -- 🔴 LOS NOMBRES DE ESTADO SALIERON DE `cat_estados_pedido`, NO DE MI CABEZA.
  -- La primera versión de esta siembra decía `preparado` —que es la palabra que
  -- usa la LETRA— y el motor la rebotó con `estado_no_existe`. *La letra habla
  -- en narrativas (`preparando`); el motor tiene once estados internos debajo.*
  -- Cada paso se da SOLO si el pedido está donde ese paso empieza: así la
  -- siembra no depende de cuánto avanzó `confirmar_pago_pedido` por su cuenta.

  -- Los pasos del SISTEMA van sin sesión (`_mover_estado_pedido` exige
  -- `auth.uid() IS NULL` para admitir el actor 'sistema'), y la sesión ya está
  -- limpia desde la confirmación del pago.
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado = 'pago_capturado' THEN
    PERFORM mover_estado_pedido(v_ped, 'stock_reservado', 'sistema', NULL);
    SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  END IF;
  IF v_estado = 'stock_reservado' THEN
    PERFORM mover_estado_pedido(v_ped, 'vendedor_notificado', 'sistema', NULL);
    SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  END IF;
  IF v_estado = 'vendedor_notificado' THEN
    PERFORM mover_estado_pedido(v_ped, 'liberado_preparacion', 'sistema', NULL);
    SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  END IF;
  RAISE NOTICE '③ escalera del sistema hasta: %', v_estado;

  -- Y los del VENDEDOR con su sesión.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_vendedor, 'role', 'authenticated')::text, true);

  IF v_estado = 'liberado_preparacion' THEN
    PERFORM mover_estado_pedido(v_ped, 'picking', 'vendedor', NULL);
  END IF;

  -- 🔴 EL LOTE NO ES RELLENO: `empacar_pedido` rebota sin él —*«sin lote no se
  -- puede responder un retiro de fabricante»*—, que es exactamente la razón por
  -- la que la letra de S96 metió el empaque como escalón propio. La siembra lo
  -- respeta en vez de esquivarlo, y por eso el lote se arma de los ítems REALES
  -- del pedido y no de una lista tecleada: un `item_id` inventado pasaría el
  -- UPDATE sin tocar ninguna fila y el rebote llegaría igual, dos pasos después.
  SELECT jsonb_agg(jsonb_build_object(
           'item_id', pi.id,
           'lote', 'SIEMBRA-S100B',
           'fecha_vencimiento', (current_date + interval '18 months')::date))
    INTO v_r
    FROM pedido_items pi WHERE pi.pedido_id = v_ped;

  PERFORM empacar_pedido(v_ped, v_r, 3.4);
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  RAISE NOTICE '④ empacado con lote · estado: %', v_estado;

  -- 🔴 `empacado → documentado` LO DA LA FACTURA, y esto es la letra hecha
  -- motor. Probé antes con `mover_estado_pedido(..., 'sistema')` y el motor lo
  -- rebotó bien: *«sistema» no es un actor que se pueda declarar desde afuera*.
  -- El paso real es `registrar_factura_pedido` — §6 de la letra de S96: *el
  -- despacho necesita la factura del vendedor, porque en Ecuador la electrónica
  -- falla y la factura se REGISTRA, no se emite.*
  -- *El escalón que parecía burocrático era el que faltaba, y el motor no me
  -- dejó saltearlo.*
  IF v_estado = 'empacado' THEN
    PERFORM registrar_factura_pedido(
      v_ped, 'SIEMBRA-001-001-000000001', 'SIEMBRA-CLAVE-ACCESO',
      NULL, NULL, 'autorizada');
    SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
    RAISE NOTICE '④bis factura registrada · estado: %', v_estado;
  END IF;

  PERFORM despachar_pedido(v_ped, v_repartidor);
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  RAISE NOTICE '⑤ despachado a «Repartidor de Pruebas» · estado: %', v_estado;

  -- ── 3 · EL REPARTIDOR ENTREGA, con el código de la puerta ────────────────
  SELECT codigo_verificacion INTO v_codigo FROM envios WHERE pedido_id = v_ped;
  IF v_codigo IS NULL THEN RAISE EXCEPTION 'el envío no tiene código de verificación'; END IF;

  v_r := entregar_pedido(v_ped, v_codigo, 'siembra/s100b/entrega.jpg');
  v_eventos := COALESCE((v_r->>'eventos_expediente')::int, -1);
  RAISE NOTICE '⑥ entregado · código % · eventos_expediente = %', v_codigo, v_eventos;

  -- ═══════════════════════════════════════════════════════════════════════
  -- LAS VERIFICACIONES **SON** EL TEST (L-063). Éxito de ejecución ≠ dato bueno.
  -- ═══════════════════════════════════════════════════════════════════════

  -- 🔴 EL ASSERT QUE JUSTIFICA LA SIEMBRA ENTERA. `entregar_pedido` cuenta los
  --    ítems que DEPOSITARON. Con dos ítems, ambos con mascota, el resultado
  --    tiene que ser EXACTAMENTE 1: el alimento sedimenta, la higiene no.
  --    · 2 ⇒ `entra_al_expediente` no se está honrando y el tercer acto MIENTE.
  --    · 0 ⇒ no depositó nada y el tercer acto quedaría mudo por la razón
  --          equivocada — que es justo lo que D no podía distinguir.
  IF v_eventos <> 1 THEN
    RAISE EXCEPTION 'ASSERT ROTO · eventos_expediente = % (esperado 1). El par true/false no discriminó.', v_eventos;
  END IF;

  SELECT count(*) INTO v_items FROM pedido_items WHERE pedido_id = v_ped;
  IF v_items <> 2 THEN
    RAISE EXCEPTION 'ASSERT ROTO · el pedido tiene % ítems (esperado 2) — sería una cabecera huérfana como las de H-113', v_items;
  END IF;

  SELECT estado, entregado_en INTO v_estado, v_entregado FROM envios WHERE pedido_id = v_ped;
  IF v_estado <> 'entregado' OR v_entregado IS NULL THEN
    RAISE EXCEPTION 'ASSERT ROTO · envío estado=% entregado_en=% — sin estampa no hay evidencia de entrega', v_estado, v_entregado;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM envios WHERE pedido_id = v_ped
                   AND verificado_en IS NOT NULL AND entregado_por_nombre IS NOT NULL
                   AND foto_entrega_path IS NOT NULL) THEN
    RAISE EXCEPTION 'ASSERT ROTO · faltan estampas de la entrega (verificado_en · entregado_por_nombre · foto)';
  END IF;

  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'entregado' THEN
    RAISE EXCEPTION 'ASSERT ROTO · el pedido quedó en % y no en entregado', v_estado;
  END IF;

  RAISE NOTICE '✅ SIEMBRA VERDE · pedido % · 2 ítems · 1 evento de expediente · envío entregado con sus estampas', v_ped;
END $$;

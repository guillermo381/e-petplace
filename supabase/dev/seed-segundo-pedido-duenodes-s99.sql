-- ═══════════════════════════════════════════════════════════════════════════
-- SEGUNDO PEDIDO PAGADO EN duenodes — S99 (pedido de D, 18-ago)
-- «un orden de un elemento siempre está bien ordenado»: su guard del FIFO
-- no puede dar verde con uno solo, y las cuentas con ≥2 no son suyas.
-- D frenó bien: no cambia la clave de pago de una cuenta que no creó.
--
-- POR LAS PUERTAS REALES, jamás INSERT directo: `crear_pedido_despensa`
-- (que reserva stock) → `confirmar_pago_pedido` (que estampa
-- `pagos_intentos.cerrado_en`, LA LLAVE DEL FIFO). El pago es SIMULADO y
-- se declara en el payload — la casa lo exige desde S54.
--
-- MOLDE MEDIDO del pedido que ya existe en esa cuenta (comprador, ciudad y
-- dirección reales de la siembra previa) — cero dato inventado.
--
-- D-838 SE EXTIENDE: la marca contable viaja en la clave de idempotencia y
-- en la referencia del pago (`SIEMBRA-S99-*`), mismo cierre por
-- conteo-cero, misma muerte antes del primer vendedor real.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta   uuid := '054f23aa-c453-4a41-9d7f-1668eac6ff5f';  -- DESPENSA DE PRUEBAS S97 (duenodes)
  v_uid   uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';  -- el comprador del pedido molde
  -- ⚠️ El contrato pide `oferta_id`, NO `sku_id` — leído del CUERPO vivo
  -- (la firma decía `p_items jsonb` y no alcanza: regla 40. Mi primer
  -- intento rebotó `oferta_no_publicada` por eso).
  v_of    uuid := '8c126528-ac8d-485c-bab6-2fa5705b5d58';  -- oferta publicada de duenodes, sku con stock
  v_r     jsonb;
  v_ped   uuid;
  v_clave text := 'SIEMBRA-S99-FIFO-2';
BEGIN
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', v_uid), true);
  SET LOCAL ROLE authenticated;

  v_r := public.crear_pedido_despensa(
    v_cta,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
    jsonb_build_object(
      'nombre_receptor', 'Siembra S99 (borrable)',
      'telefono', '+593999999999',
      'direccion', 'Av. de los Shyris N34-40',
      'ciudad', 'Quito',
      'referencias', 'SIEMBRA S99 — segundo pedido para el guard del FIFO (D-838)'
    ),
    v_clave, NULL, 'despacho', NULL, 'estandar'
  );
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'SIEMBRA: el pedido no se creó — %', v_r;
  END IF;
  v_ped := (v_r ->> 'pedido_id')::uuid;

  -- EL PAGO — la puerta que estampa la llave del FIFO.
  -- 🔴 EL CLAIM SE LIMPIA ANTES, y su razón está en el rebote que me dio:
  -- «confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de
  -- la pasarela, no de una sesión de persona». Volver al rol de la
  -- migración NO alcanza — `request.jwt.claims` sigue puesto en la
  -- transacción y `auth.uid()` la delata. **El gate está bien y es fuerte:
  -- la siembra se adapta a él, jamás al revés.**
  -- LA RESERVA VA ANTES DEL PAGO — y no es un paso más: el motor lo EXIGE
  -- («pago_sin_reserva: confirmarlo lo dejaría listo para preparar sin
  -- mercadería apartada» — el orden que S95-K curó). La siembra recorre el
  -- camino real COMPLETO, no un atajo.
  v_r := public.reservar_stock_pedido(v_ped);
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'SIEMBRA: la reserva falló — %', v_r;
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- Y EL PASO A `esperando_pago` — la máquina de estados manda: el camino
  -- es `creado → esperando_pago → pago_capturado` (leído de
  -- `cat_transiciones_pedido`, que es DATO). `confirmar_pago_pedido` hace
  -- el segundo tramo; el primero es del cliente cuando va a pagar.
  -- ⚠️ EL ACTOR ES `cliente`, medido de `cat_transiciones_pedido`: desde
  -- `creado`, el sistema SOLO puede cancelar — ir a pagar es acto de la
  -- persona. La siembra no elige el actor que le conviene: usa el que la
  -- máquina permite (tercera corrección del motor en esta siembra, y las
  -- tres fueron gates haciendo bien su trabajo).
  PERFORM public._mover_estado_pedido(v_ped, 'esperando_pago', 'cliente');

  PERFORM set_config('request.jwt.claims', '', true);
  v_r := public.confirmar_pago_pedido(
    v_ped, 'simulado', 'SIEMBRA-S99-REF-2', v_clave || '-pago',
    jsonb_build_object('pago_simulado', true,
                       'motivo', 'SIEMBRA S99: segundo pedido para el guard del FIFO de D (D-838)')
  );
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'SIEMBRA: el pago no se confirmó — %', v_r;
  END IF;

  -- VERIFICACIÓN POR EL CAMINO QUE D CONSUME: la vista tiene que traer DOS
  -- pedidos vivos con `pago_confirmado_en` NO NULO y con horas DISTINTAS
  -- (un FIFO con dos timestamps iguales tampoco discrimina).
  IF (SELECT count(*) FROM public.v_pedidos_narrativa v
      WHERE v.cuenta_comercial_id = v_cta AND NOT v.es_terminal
        AND v.pago_confirmado_en IS NOT NULL) < 2 THEN
    RAISE EXCEPTION 'SIEMBRA: la vista no trae 2 pedidos vivos con pago — el guard de D seguiría sin poder ordenar';
  END IF;
  IF (SELECT count(DISTINCT v.pago_confirmado_en) FROM public.v_pedidos_narrativa v
      WHERE v.cuenta_comercial_id = v_cta AND NOT v.es_terminal
        AND v.pago_confirmado_en IS NOT NULL) < 2 THEN
    RAISE EXCEPTION 'SIEMBRA: los dos pagos tienen la MISMA hora — el orden no discriminaría';
  END IF;

  RAISE NOTICE 'SIEMBRA FIFO: pedido % creado y pagado — duenodes ya tiene 2 vivos con pago y horas distintas', v_ped;
END $$;

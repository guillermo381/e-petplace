-- ═══════════════════════════════════════════════════════════════════════════
-- DOS PEDIDOS PAGADOS EN EL MISMO INSTANTE — S99 (pedido de D)
--
-- PARA QUÉ: el comparador del FIFO de D está curado y probado en la pieza,
-- pero **su guard de integración no puede cerrar sin un empate real** en una
-- cuenta suya. Las dos cuentas que hoy tienen empates (`vendedorpuro`,
-- `nuevotest2`) no son de D, y frenó bien: *no cambia la clave de una cuenta
-- que no creó* — y antes verificó que la clave SÍ abre `duenodes`, para no
-- acusar al llavero de un problema que no era suyo.
--
-- 🔴 CÓMO SE FABRICA EL EMPATE, Y ES LA PROPIEDAD QUE ESTA SESIÓN MIDIÓ:
-- **`now()` NO AVANZA DENTRO DE UNA TRANSACCIÓN** (L-122a). Los dos pagos
-- ocurren en ESTE bloque, o sea en una sola transacción ⇒ los dos
-- `pago_confirmado_en` salen **idénticos por construcción**, no por suerte ni
-- por correr rápido. *El mismo mecanismo que produjo el defecto es el que
-- ahora fabrica su caso de prueba.*
--
-- POR LAS PUERTAS REALES, con las TRES correcciones que el motor ya cobró en
-- la siembra anterior: la reserva ANTES del pago · el paso a `esperando_pago`
-- con actor `cliente` · y el claim LIMPIO antes de `confirmar_pago_pedido`
-- (ese camino es del webhook, no de una sesión de persona).
--
-- D-838: marca `SIEMBRA-S99-*` en clave de idempotencia y referencia; muere
-- con el resto de la siembra antes del primer vendedor real.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta  uuid := '054f23aa-c453-4a41-9d7f-1668eac6ff5f';  -- DESPENSA DE PRUEBAS S97 (duenodes)
  v_uid  uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';  -- el comprador del molde
  v_ofertas uuid[] := ARRAY['559fd349-f1f7-4614-9bc4-7a7341884c7c'::uuid,
                            'c1dd5831-1112-4a26-8c8e-0ebab76980d6'::uuid];
  v_of uuid; v_r jsonb; v_ped uuid; v_i int := 0;
  v_peds uuid[] := ARRAY[]::uuid[];
  v_instantes int;
BEGIN
  FOREACH v_of IN ARRAY v_ofertas LOOP
    v_i := v_i + 1;

    PERFORM set_config('request.jwt.claims',
      format('{"sub":"%s","role":"authenticated"}', v_uid), true);
    SET LOCAL ROLE authenticated;

    v_r := public.crear_pedido_despensa(
      v_cta,
      jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
      jsonb_build_object(
        'nombre_receptor', 'Siembra S99 empate (borrable)',
        'telefono', '+593999999999',
        'direccion', 'Av. de los Shyris N34-40',
        'ciudad', 'Quito',
        -- 🔴 S100 (H-03 de D): NULL A PROPÓSITO. `referencias` NO es un campo de
        -- notas internas: es copy OPERATIVO que la pantalla de la familia pinta
        -- y que el repartidor lee EN LA PUERTA. Un ticket («guard del FIFO,
        -- D-838») ahí no es una marca de siembra: es vocabulario de ingeniería
        -- puesto donde alguien busca «casa azul, portón negro».
        -- La marca DEMO que la casa sí exige vive arriba, en `nombre_receptor`.
        'referencias', NULL
      ),
      'SIEMBRA-S99-EMPATE-' || v_i, NULL, 'despacho', NULL, 'estandar');
    IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'SIEMBRA: pedido % no se creó — %', v_i, v_r;
    END IF;
    v_ped := (v_r ->> 'pedido_id')::uuid;
    v_peds := v_peds || v_ped;

    v_r := public.reservar_stock_pedido(v_ped);
    IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'SIEMBRA: reserva % falló — %', v_i, v_r;
    END IF;
    -- `_mover_estado_pedido` es interna: `authenticated` no la ejecuta, y eso
    -- está bien — la máquina de estados no es una puerta pública. Se vuelve al
    -- rol de la migración ANTES de llamarla.
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    PERFORM public._mover_estado_pedido(v_ped, 'esperando_pago', 'cliente');

    -- El claim se limpia: `confirmar_pago_pedido` es camino de webhook y
    -- rebota si detecta una sesión de persona.
    PERFORM set_config('request.jwt.claims', '', true);
    v_r := public.confirmar_pago_pedido(
      v_ped, 'simulado', 'SIEMBRA-S99-EMPATE-REF-' || v_i,
      'SIEMBRA-S99-EMPATE-' || v_i || '-pago',
      jsonb_build_object('pago_simulado', true,
        'motivo', 'SIEMBRA S99: empate de instante de pago para el guard del FIFO de D (D-838)'));
    IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'SIEMBRA: pago % no se confirmó — %', v_i, v_r;
    END IF;
  END LOOP;

  -- 🔴 LA VERIFICACIÓN ES EL EMPATE, no el conteo: dos pedidos pagados con
  -- instantes DISTINTOS no le sirven a D para nada — es justo el caso que su
  -- guard ya probaba.
  SELECT count(DISTINCT pago_confirmado_en) INTO v_instantes
    FROM v_pedidos_narrativa WHERE pedido_id = ANY(v_peds);
  IF v_instantes <> 1 THEN
    RAISE EXCEPTION 'SIEMBRA: los dos pagos NO empataron (% instantes) — sin empate el guard de D no prueba nada', v_instantes;
  END IF;

  RAISE NOTICE 'SIEMBRA EMPATE: pedidos % y % pagados en UN MISMO instante — el guard del FIFO ya tiene su caso',
    v_peds[1], v_peds[2];
END $$;

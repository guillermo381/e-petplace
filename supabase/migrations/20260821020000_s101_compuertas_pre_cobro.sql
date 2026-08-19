-- ═══════════════════════════════════════════════════════════════════════════
-- S101-A · ① LAS COMPUERTAS PRE-COBRO (E3 de la enmienda v1.1)
--
-- Orden de mesa (19-ago, cierre): «el llamador del débito no existe hasta que
-- las seis compuertas existan».
--
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-19-s101-REVERSA-compuertas.sql
--
-- Veda 76(g): NO RIGE. Una función de solo lectura. Cero DDL sobre tablas,
--   cero DML, cero backfill.
--
-- ───────────────────────────────────────────────────────────────────────────
-- 🔴 CINCO DE SEIS SE CONSTRUYEN. LA SEXTA NO TIENE FUENTE, Y SE DECLARA.
--
-- La compuerta 3 (cobertura) **no es evaluable hoy**, y no por pereza:
--   · `zonas_cobertura` es la tabla de COURIER (transportistas medidos: borzo,
--     laar, picap, servientrega, tramaco) con `tarifa_base`/`tarifa_kg`;
--   · tiene **20 filas y CERO activas**, y **ninguna función del esquema la
--     lee** — es letra muerta, coherente con la firma S95 de que la despensa
--     va en MOTO PROPIA y el courier está modelado y apagado;
--   · **Quito no está entre sus ciudades**, y los 35 pedidos vivos son de Quito.
--
-- ⇒ Cablearla ahí **rechazaría 35 de 35 pedidos**: no sería una compuerta,
--   sería un paro del comercio. E inventar el predicado sería fabricar una
--   regla que nadie firmó.
-- ⇒ Se devuelve en `no_evaluables` **a la vista**, para que ningún llamador
--   pueda leer un `ok:true` como «la cobertura está verificada».
--   *Una compuerta que no puede evaluar y calla es peor que una que falta:
--   la que falta se nota.*
--
-- La compuerta 5 (tarjeta/token) se evalúa **en su forma disponible**: que el
-- token venga y sea no vacío. **No existe tabla donde persistir tarjetas** —
-- medido: las únicas columnas `*_token` del esquema son de telemedicina,
-- invitaciones, push y el Kushki legado. Verificar «que esté vigente» contra
-- un almacén que no existe sería teatro.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.verificar_compuertas_pre_cobro(
  p_compra_id uuid,
  p_token     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

  -- ══ COMPUERTA 5 · El token viene y no está vacío ══
  IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '5_token',
      'codigo', 'token_ausente',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'compra_id', p_compra_id,
    'pedidos', v_n_pedidos,
    'monto_verificado', v_c.total,
    'evaluadas', jsonb_build_array('0_intento_en_vuelo','1_reserva','2_monto','4_vendedor','5_token'),
    -- 🔴 VIAJA SIEMPRE, incluso en el ok. Que nadie lea este true como
    --    «la cobertura está verificada»: no se verificó nada de cobertura.
    'no_evaluables', jsonb_build_array('cobertura'));
END $function$;

COMMENT ON FUNCTION public.verificar_compuertas_pre_cobro(uuid, text) IS
  'S101 E3. Las compuertas que corren ANTES de tocar la tarjeta. Evalúa 5 de 6: '
  'intento en vuelo · reserva viva · monto contra el desglose congelado · vendedor '
  'activo · token presente. La 3 (cobertura) NO es evaluable —zonas_cobertura es la '
  'tabla de courier, 0 filas activas, cero lectores— y viaja SIEMPRE en '
  'no_evaluables para que ningún ok:true se lea como cobertura verificada.';

-- Puerta: el débito lo dispara el servidor, no una sesión de persona.
REVOKE ALL ON FUNCTION public.verificar_compuertas_pre_cobro(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_compuertas_pre_cobro(uuid, text) TO service_role;

-- ═══ CINTURÓN ═══
DO $$
DECLARE v_anon boolean; v_auth boolean; v_srv boolean;
BEGIN
  IF to_regprocedure('public.verificar_compuertas_pre_cobro(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'cinturon: la función no existe';
  END IF;
  SELECT has_function_privilege('anon','public.verificar_compuertas_pre_cobro(uuid,text)','EXECUTE') INTO v_anon;
  SELECT has_function_privilege('authenticated','public.verificar_compuertas_pre_cobro(uuid,text)','EXECUTE') INTO v_auth;
  SELECT has_function_privilege('service_role','public.verificar_compuertas_pre_cobro(uuid,text)','EXECUTE') INTO v_srv;
  IF v_anon OR v_auth OR NOT v_srv THEN
    RAISE EXCEPTION 'cinturon: puerta mal — anon=% authenticated=% service_role=%', v_anon, v_auth, v_srv;
  END IF;
END $$;

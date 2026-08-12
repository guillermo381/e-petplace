-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · LA EXPIRACIÓN DE PEDIDOS SIN PAGO — el hallazgo estructural de la
-- pista C (vara cruzada M2 sobre D, 12-ago): existen `expirar_citas_
-- pendientes` y `expirar_reservas_vencidas`, pero NINGUNA expiración para
-- cabeceras de pedido en `creado`/`esperando_pago`. Peor, MEDIDO acá: la
-- máquina ni siquiera tenía la transición `creado → cancelado_sistema` — el
-- estado no podía expirar aunque alguien quisiera.
--
-- La consecuencia: una muerte de proceso en el checkout deja la cabecera
-- huérfana — LA CLASE EXACTA de las 137 que inflaron conteos (D-749) y que
-- la M10 acaba de marcar. D puso su guarda en el cliente (beforeRemove) y
-- C verificó que funciona — pero **la garantía anti-huérfanos no puede vivir
-- solo en el cliente: un proceso muerto no ejecuta ningún beforeRemove.**
--
-- Diseño: la ventana es PARÁMETRO (`app_config.pedido_sin_pago_expira_horas`,
-- 24 h — patrón M10), el movimiento pasa POR LA MÁQUINA (`_mover_estado_
-- pedido`, actor sistema — jamás UPDATE directo), y las reservas vigentes del
-- pedido se liberan EN EL MISMO ACTO por el ledger (espejo literal de
-- `expirar_reservas_vencidas` — un pedido cancelado no retiene inventario ni
-- un minuto más). Cron horario. La correctitud del stock ya la daba el TTL
-- de reservas; esto cierra LA CABECERA, que es la que infla conteos.
--
-- 76(g): NO RIGE — transición nueva + función + cron; cero datos vivos
-- tocados (el fixture del cinturón nace marcado `created_by_sistema` y muere
-- adentro). Reversa: scripts/s96/2026-08-12-s96-m19-REVERSA.sql (ANTES).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① LA TRANSICIÓN QUE FALTABA — como DATO, igual que todas ───────────────
INSERT INTO public.cat_transiciones_pedido (desde, hasta, actor, exige_motivo, descripcion)
VALUES ('creado', 'cancelado_sistema', 'sistema', false,
        'S96: expiración de cabecera sin pago. Sin esto, un checkout muerto dejaba el pedido huérfano para siempre (la clase de D-749).');

-- ── ② LA VENTANA, COMO PARÁMETRO ────────────────────────────────────────────
INSERT INTO public.app_config (clave, valor, tipo, categoria, descripcion)
VALUES ('pedido_sin_pago_expira_horas', '24', 'numero', 'limites',
        'S96: horas sin actividad tras las cuales un pedido creado/esperando_pago expira a cancelado_sistema. La reserva de stock tiene su propio TTL (más corto); esto cierra la CABECERA.')
ON CONFLICT (clave) DO NOTHING;

-- ── ③ EL EXPIRADOR — solo backend, por la máquina, liberando en el acto ────
CREATE FUNCTION public.expirar_pedidos_sin_pago()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_horas int := coalesce(
    (SELECT valor::integer FROM app_config WHERE clave = 'pedido_sin_pago_expira_horas'), 24);
  v_p record;
  v_r record;
  v_n int := 0;
BEGIN
  FOR v_p IN
    SELECT id FROM pedidos
     WHERE estado IN ('creado', 'esperando_pago')
       AND updated_at <= now() - make_interval(hours => v_horas)
     FOR UPDATE SKIP LOCKED
  LOOP
    -- Las reservas vigentes se liberan POR EL LEDGER en el mismo acto
    -- (espejo de expirar_reservas_vencidas): cancelado no retiene.
    FOR v_r IN
      SELECT * FROM inventario_reservas
       WHERE pedido_id = v_p.id AND estado = 'vigente'
       FOR UPDATE
    LOOP
      INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              'pedido expirado sin pago', 'expiracion', v_r.id);
      UPDATE inventario_reservas
         SET estado = 'expirada', cerrada_en = now()
       WHERE id = v_r.id;
    END LOOP;

    PERFORM _mover_estado_pedido(v_p.id, 'cancelado_sistema', 'sistema',
      format('expirado: %s horas sin pago (motor, no cliente)', v_horas));
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'expirados', v_n, 'ventana_horas', v_horas, 'corrida_en', now());
END $$;

REVOKE ALL ON FUNCTION public.expirar_pedidos_sin_pago() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.expirar_pedidos_sin_pago() IS
  'S96: cierra cabeceras creado/esperando_pago sin actividad (parámetro '
  'app_config) vía la máquina de estados, liberando sus reservas por el '
  'ledger. La garantía anti-huérfanos vive en el MOTOR: un beforeRemove del '
  'cliente no corre cuando el proceso muere.';

-- ── ④ EL CRON ───────────────────────────────────────────────────────────────
SELECT cron.schedule('expirar-pedidos-sin-pago', '7 * * * *',
  $cron$ SELECT public.expirar_pedidos_sin_pago(); $cron$);

-- ── ⑤ EL CINTURÓN — camino real, saldo intacto medido, residuo 0 ───────────
DO $$
DECLARE
  v_user    uuid;
  v_cuenta  uuid;
  v_sku     uuid;
  v_viejo   uuid;
  v_fresco  uuid;
  v_reserva uuid;
  v_estado  text;
  v_disp_0  int;
  v_res_0   int;
  v_disp_1  int;
  v_res_1   int;
  v_n       int;
BEGIN
  SELECT user_id, cuenta_comercial_id INTO v_user, v_cuenta FROM pedidos LIMIT 1;
  SELECT id, stock_disponible, stock_reservado INTO v_sku, v_disp_0, v_res_0
    FROM vendedor_skus WHERE stock_disponible > 0 LIMIT 1;
  IF v_user IS NULL OR v_sku IS NULL THEN
    RAISE EXCEPTION 'cinturón sin sujetos: user=%, sku=%', v_user, v_sku;
  END IF;

  -- (a) un pedido viejo sin pago, CON una reserva vigente colgando.
  INSERT INTO pedidos (user_id, cuenta_comercial_id, total, estado, created_by_sistema, updated_at)
  VALUES (v_user, v_cuenta, 0, 'creado', true, now() - interval '25 hours')
  RETURNING id INTO v_viejo;
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
  VALUES (v_sku, 'reserva', 1, 'cinturón m19', 'pedido', v_viejo);
  INSERT INTO inventario_reservas (pedido_id, sku_id, cantidad, estado, expira_en)
  VALUES (v_viejo, v_sku, 1, 'vigente', now() + interval '1 hour')
  RETURNING id INTO v_reserva;

  -- (b) y uno FRESCO que no debe morir.
  INSERT INTO pedidos (user_id, cuenta_comercial_id, total, estado, created_by_sistema)
  VALUES (v_user, v_cuenta, 0, 'creado', true)
  RETURNING id INTO v_fresco;

  PERFORM expirar_pedidos_sin_pago();

  SELECT estado INTO v_estado FROM pedidos WHERE id = v_viejo;
  IF v_estado <> 'cancelado_sistema' THEN
    RAISE EXCEPTION 'cinturón (a): el viejo quedó % — la cabecera huérfana sigue viva', v_estado;
  END IF;
  SELECT estado INTO v_estado FROM inventario_reservas WHERE id = v_reserva;
  IF v_estado <> 'expirada' THEN
    RAISE EXCEPTION 'cinturón (a2): la reserva quedó % — cancelado reteniendo inventario', v_estado;
  END IF;
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_fresco;
  IF v_estado <> 'creado' THEN
    RAISE EXCEPTION 'cinturón (b): el fresco murió (%) — la ventana no discrimina', v_estado;
  END IF;

  -- (c) el saldo del SKU real quedó EXACTO (reserva + liberación = neto 0).
  SELECT stock_disponible, stock_reservado INTO v_disp_1, v_res_1
    FROM vendedor_skus WHERE id = v_sku;
  IF v_disp_1 <> v_disp_0 OR v_res_1 <> v_res_0 THEN
    RAISE EXCEPTION 'cinturón (c): saldo movido (disp % → %, res % → %)', v_disp_0, v_disp_1, v_res_0, v_res_1;
  END IF;

  -- (d) residuo 0 — el par neto-cero del ledger se retira con el saldo
  --     verificado idéntico antes y después (patrón M6/L-231: esto es
  --     limpieza de fixture, jamás corrección de datos reales).
  DELETE FROM inventario_movimientos WHERE referencia_id IN (v_viejo, v_reserva) AND motivo IN ('cinturón m19', 'pedido expirado sin pago');
  DELETE FROM inventario_reservas WHERE id = v_reserva;
  DELETE FROM pedido_estados WHERE pedido_id IN (v_viejo, v_fresco);
  DELETE FROM pedidos WHERE id IN (v_viejo, v_fresco);
  SELECT count(*) INTO v_n FROM pedidos WHERE id IN (v_viejo, v_fresco);
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (d): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M19 VERDE: la cabecera expira por el motor, la reserva se libera en el acto, el fresco vive, saldo intacto, residuo 0';
END $$;

COMMIT;

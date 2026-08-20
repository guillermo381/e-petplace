-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ REVERSA de 20260821080000 — la reserva se puede rearmar (D-851)         ║
-- ║ ESCRITA ANTES DE APLICAR.                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: vuelve el UNIQUE total y el reservador que inserta a ciegas.
--
-- 🔴 QUÉ **NO** DESHACE — y es lo que hay que pensar antes de correrla:
--
-- ① **El UNIQUE total puede NO poder recrearse.** Si después de la cura algún
--    pedido acumuló más de una reserva del mismo sku (una expirada + una
--    vigente — que es exactamente lo que la cura permite), el
--    `ADD CONSTRAINT` **va a fallar**. La reversa lo DICE en vez de romperse
--    a medias: aborta con un mensaje que nombra las filas.
--    *Revertir esto no es apretar un botón: es volver a un mundo donde esas
--    filas no podían existir, y algunas ya existen.*
--
-- ② **Las liberaciones ya emitidas NO se deshacen.** El stock devuelto por un
--    `liberacion_reserva` es un hecho del ledger de inventario, y el ledger no
--    se reescribe. Revertir el código no vuelve a apartar esa mercadería.

DO $$
DECLARE v_dup int;
BEGIN
  SELECT count(*) INTO v_dup FROM (
    SELECT pedido_id, sku_id FROM inventario_reservas
     GROUP BY pedido_id, sku_id HAVING count(*) > 1
  ) x;
  IF v_dup > 0 THEN
    RAISE EXCEPTION
      'NO SE PUEDE REVERTIR: % pares (pedido, sku) tienen más de una reserva. '
      'El UNIQUE total ya no es cierto en los datos. Decidir qué se hace con '
      'esas filas ANTES de revertir.', v_dup;
  END IF;
END $$;

DROP INDEX IF EXISTS public.uq_reserva_vigente_por_pedido_sku;
ALTER TABLE public.inventario_reservas
  ADD CONSTRAINT inventario_reservas_pedido_id_sku_id_key UNIQUE (pedido_id, sku_id);

-- El reservador vuelve a insertar a ciegas (con el defecto de D-851 adentro).
CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(
  p_pedido_id uuid, p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE v_it record; v_n int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
              WHERE pi.pedido_id = p_pedido_id AND o.sku_id IS NULL) THEN
    RAISE EXCEPTION 'item_sin_sku' USING ERRCODE = '22023';
  END IF;
  FOR v_it IN
    SELECT o.sku_id, SUM(pi.cantidad)::int AS cantidad
      FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
     WHERE pi.pedido_id = p_pedido_id GROUP BY o.sku_id
  LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
      VALUES (v_it.sku_id, 'reserva', v_it.cantidad, 'pedido', p_pedido_id);
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_it.sku_id, p_pedido_id, v_it.cantidad,
              now() + (p_minutos_vigencia || ' minutes')::interval);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'reservas', v_n, 'expira_en',
                            now() + (p_minutos_vigencia || ' minutes')::interval);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260819000000_s99a_dos_bocas_un_inventario.sql`
-- Escrita ANTES de aplicar (regla de la casa). Declara qué NO deshace.
--
-- ⚠️ QUÉ NO DESHACE, y es lo importante:
--   · La RECONCILIACIÓN de los dos SKU de prueba NO se revierte sola. Sus
--     valores previos quedan guardados fila por fila en
--     `inventario_reconciliaciones` — el bloque de abajo los restaura DESDE
--     ESA TABLA, que es la única fuente que los conserva. Si se borra la
--     tabla, los números viejos se pierden y esta reversa queda muda.
--   · Revertir el gate de `expirar_reservas_vencidas` REARMA EL ARMA: la
--     función vuelve a poder liberar la reserva de un pedido PAGADO. Medido
--     el 16-ago: 13 reservas vigentes, las 13 de pedidos pagados, 12 con su
--     `expira_en` ya pasado ⇒ una sola corrida devolvería 15 unidades
--     vendidas al disponible, y el mostrador podría venderlas de nuevo.
--     **Esa es la razón de la migración: no se revierte por prolijidad.**
-- ═══════════════════════════════════════════════════════════════════════════

-- ① El gate vuelve a la forma vieja (⚠️ ver advertencia de arriba).
CREATE OR REPLACE FUNCTION public.expirar_reservas_vencidas()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_r record; v_n int := 0;
BEGIN
  FOR v_r IN
    SELECT * FROM inventario_reservas
     WHERE estado = 'vigente' AND expira_en <= now()
     FOR UPDATE
  LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              'reserva vencida sin pago', 'expiracion', v_r.id);
    UPDATE inventario_reservas SET estado = 'expirada', cerrada_en = now() WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'expiradas', v_n, 'corrida_en', now());
END $$;

-- ② Restaurar los saldos previos DESDE la tabla de auditoría (última fila
--    por SKU). Si la tabla no existe o está vacía, no hay nada que restaurar
--    y hay que decirlo, no fallar en silencio.
DO $$
DECLARE v_n int := 0; v_r record;
BEGIN
  IF to_regclass('public.inventario_reconciliaciones') IS NULL THEN
    RAISE NOTICE 'REVERSA: no existe inventario_reconciliaciones — los saldos previos NO son recuperables.';
    RETURN;
  END IF;
  FOR v_r IN
    SELECT DISTINCT ON (sku_id) sku_id, antes_disponible, antes_reservado
    FROM public.inventario_reconciliaciones ORDER BY sku_id, creada_en DESC
  LOOP
    UPDATE public.vendedor_skus
       SET stock_disponible = v_r.antes_disponible,
           stock_reservado  = v_r.antes_reservado
     WHERE id = v_r.sku_id;
    v_n := v_n + 1;
  END LOOP;
  RAISE NOTICE 'REVERSA: % saldo(s) restaurado(s) a su valor previo.', v_n;
END $$;

-- ③ Las piezas nuevas mueren.
DROP FUNCTION IF EXISTS public.reconciliar_inventario_sku(uuid, text);
DROP FUNCTION IF EXISTS public.verificar_coherencia_inventario();
DROP TABLE IF EXISTS public.inventario_reconciliaciones;

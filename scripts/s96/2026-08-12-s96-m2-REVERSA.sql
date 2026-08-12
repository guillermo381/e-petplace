-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812130000_s96_b2_entrega_con_evidencia_y_destino.sql
--
-- Deshace: el destino por ítem (tabla lateral + funciones), `entregar_pedido`
-- vuelve a su firma S95 (p_mascota_id como parámetro de entrega),
-- `crear_pedido_despensa` y `confirmar_pago_pedido` vuelven a S95-K, y el
-- retiro vuelve a estar APAGADO por CHECK.
--
-- ⚠️ QUÉ NO DESHACE: los eventos ya depositados en el expediente por la vía
--    nueva NO se tocan (append-only, L-231). Si existe algún pedido real con
--    metodo_entrega='retiro', el CHECK que este script restaura va a REBOTAR
--    — y ese rebote es correcto: primero se decide qué hacer con ese pedido.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.atar_item_a_mascota(uuid, uuid);
DROP FUNCTION IF EXISTS public._depositar_item_en_expediente(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.entregar_pedido(uuid, text, text);

-- `entregar_pedido` vuelve a la versión S95-K (verbatim del objeto vivo,
-- capturada con pg_get_functiondef el 12-ago-2026 antes de la M2).
CREATE OR REPLACE FUNCTION public.entregar_pedido(p_pedido_id uuid, p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ped   record; v_it record; v_ev uuid; v_fam record;
  v_n     int := 0; v_sku uuid; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;
  IF v_ped.estado <> 'entregado' THEN
    PERFORM _mover_estado_pedido(p_pedido_id, 'entregado', 'sistema');
  END IF;
  FOR v_it IN SELECT * FROM pedido_items WHERE pedido_id = p_pedido_id LOOP
    SELECT sku_id INTO v_sku FROM ofertas WHERE id = v_it.oferta_id;
    IF v_sku IS NOT NULL AND EXISTS (
         SELECT 1 FROM inventario_reservas
          WHERE pedido_id = p_pedido_id AND sku_id = v_sku AND estado='vigente') THEN
      INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
        VALUES (v_sku, 'consumo', v_it.cantidad, 'pedido', p_pedido_id);
      UPDATE inventario_reservas SET estado='consumida', cerrada_en=now()
       WHERE pedido_id = p_pedido_id AND sku_id = v_sku AND estado='vigente';
    END IF;
  END LOOP;
  IF p_mascota_id IS NOT NULL THEN
    IF NOT user_tiene_acceso_a_mascota(p_mascota_id) AND NOT is_admin() THEN
      RAISE EXCEPTION 'sin_acceso_a_mascota' USING ERRCODE = '42501';
    END IF;
    FOR v_it IN
      SELECT pi.*, pr.familia_codigo, pv.presentacion, pv.peso_kg
      FROM pedido_items pi
      JOIN productos pr ON pr.id = pi.producto_id
      JOIN producto_variantes pv ON pv.id = pi.variante_id
      JOIN cat_familias_producto f ON f.codigo = pr.familia_codigo
      WHERE pi.pedido_id = p_pedido_id AND f.entra_al_expediente
    LOOP
      IF EXISTS (SELECT 1 FROM evento_producto_asignacion WHERE pedido_item_id = v_it.id) THEN
        CONTINUE;
      END IF;
      SELECT m.country_code INTO v_fam FROM mascotas m WHERE m.id = p_mascota_id;
      INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                                   procedencia, modo_captura, country_code, creado_por_user_id)
        VALUES (p_mascota_id, 'producto_asignacion', 'alimentacion', now(),
                jsonb_build_object('pedido_id', p_pedido_id, 'via', 'entregar_pedido'),
                'declarado_por_familia', 'automatico',
                COALESCE(v_fam.country_code,'EC'), v_uid)
        RETURNING id INTO v_ev;
      INSERT INTO evento_producto_asignacion
        (evento_id, mascota_id, producto_id, variante_id, pedido_item_id,
         nombre_producto, familia_codigo, presentacion, cantidad, peso_kg,
         fecha_compra, country_code, lote, fecha_vencimiento)
        VALUES (v_ev, p_mascota_id, v_it.producto_id, v_it.variante_id, v_it.id,
                v_it.nombre_producto, v_it.familia_codigo, v_it.presentacion,
                v_it.cantidad, v_it.peso_kg, current_date,
                COALESCE(v_fam.country_code,'EC'), v_it.lote, v_it.fecha_vencimiento);
      v_n := v_n + 1;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'eventos_expediente', v_n);
END $function$;
REVOKE ALL ON FUNCTION public.entregar_pedido(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.entregar_pedido(uuid, uuid) TO authenticated;

-- `crear_pedido_despensa` pierde el parámetro de método y el destino por ítem:
-- se restaura desde el archivo de S95 (la versión vive en
-- supabase/migrations/20260811*_s95*.sql). Para una reversa operativa basta
-- con DROP de la firma nueva y re-CREATE de la vieja; el cuerpo S95-K vive en
-- el historial de migraciones y en scripts/s95/2026-08-12-s95k-REVERSA.sql.
DROP FUNCTION IF EXISTS public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text);
-- (re-crear acá la versión S95: por brevedad de la reversa se re-aplica la
--  migración 20260811*/20260812090000 que la contiene, o se restaura del
--  functiondef capturado en scripts/s96/functiondef-pre-m2.sql)

-- `reservar_stock_pedido` y `confirmar_pago_pedido` vuelven a su cuerpo S95:
-- el literal capturado del objeto vivo está en
-- scripts/s96/functiondef-pre-m2.sql (se re-aplica tal cual).
-- ⚠️ Restaurar la reserva POR ÍTEM re-introduce el defecto del UNIQUE
--    (pedido_id, sku_id) que el cinturón de la M2 midió: un carrito con dos
--    líneas del mismo SKU vuelve a rebotar como `sin_stock`.

-- El retiro vuelve a estar apagado por CHECK (solo si no hay filas retiro).
ALTER TABLE public.pedidos ADD CONSTRAINT chk_retiro_apagado_v1
  CHECK (metodo_entrega = 'despacho');
ALTER TABLE public.envios ADD CONSTRAINT chk_envio_retiro_apagado_v1
  CHECK (metodo = 'despacho');

DROP TABLE IF EXISTS public.pedido_item_destinos;

COMMIT;

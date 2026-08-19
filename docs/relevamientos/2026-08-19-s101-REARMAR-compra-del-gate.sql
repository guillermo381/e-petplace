-- S101-A · REARMAR LA RESERVA DE LA COMPRA DEL GATE
--
-- La reserva de stock dura 30 minutos. Si el disparo tarda más, la compuerta 1
-- rebota `reserva_vencida` — **y eso es CORRECTO, no un defecto**: la compuerta
-- está haciendo exactamente su trabajo.
--
-- `crear_intento_pago` es idempotente (el desglose se congela por PK, no se
-- re-escribe), así que esto se puede correr las veces que haga falta.
--
-- Uso: npx supabase --experimental db query --linked --file <este archivo>

CREATE TEMP TABLE _o(k text, v text) ON COMMIT DROP;
GRANT ALL ON _o TO authenticated;

DO $$
DECLARE v_user uuid; v_r jsonb;
DECLARE v_compra uuid := 'a2efd9b7-eac4-4e6e-baed-956554e7215c';
BEGIN
  SELECT user_id INTO v_user FROM compras WHERE id = v_compra;
  IF v_user IS NULL THEN RAISE EXCEPTION 'la compra del gate no existe: %', v_compra; END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_r := crear_intento_pago(v_compra, 'nuvei');
  INSERT INTO _o VALUES ('1_rearmado', v_r::text);
  RESET ROLE;
END $$;

INSERT INTO _o SELECT '2_compuertas',
  verificar_compuertas_pre_cobro('a2efd9b7-eac4-4e6e-baed-956554e7215c'::uuid, 'tok_de_prueba')::text;

INSERT INTO _o SELECT '3_reserva',
  'vigentes='||count(*) FILTER (WHERE r.estado='vigente' AND r.expira_en>now())::text
  ||' · vence='||COALESCE(max(r.expira_en)::text,'—')||' · ahora='||now()::text
 FROM inventario_reservas r JOIN pedidos p ON p.id=r.pedido_id
 WHERE p.compra_id='a2efd9b7-eac4-4e6e-baed-956554e7215c';

SELECT k, v FROM _o ORDER BY k;

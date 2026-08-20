-- ═══════════════════════════════════════════════════════════════════════════
-- S101-B · MATRIZ DE LAS COMPUERTAS PRE-COBRO
--
-- Corre dentro de BEGIN…ROLLBACK: **no deja residuo**.
--
-- 🔴 DOS COSAS QUE ESTA MATRIZ APRENDIÓ A LOS GOLPES Y QUE HAY QUE CONSERVAR:
--
--  ① **LA COLUMNA `esperado` vs `obtenido` ES OBLIGATORIA.** Salvó la medición
--     TRES veces: sin ella, dos casos cortocircuitados por la compuerta 1 y
--     uno contaminado por el caso anterior habrían salido como verdes.
--     *Una matriz que solo dice «pasó» no distingue pasar de pasar por otro
--     motivo.*
--
--  ② **EL ESCENARIO SE PREPARA ANTES DE MEDIR** — hace falta una reserva
--     VIGENTE, o la compuerta 1 corta y todo devuelve `reserva_vencida`.
--     Y **el orden de los casos importa**: el caso del desglose MUTA la compra
--     (le mueve el pedido), así que va ÚLTIMO. *Una matriz con dependencia de
--     orden entre casos no mide casos: mide la secuencia.*
--
-- Uso:
--   npx supabase --experimental db query --linked --file scripts/s101b/matriz-compuertas.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE TEMP TABLE _m(caso text, esperado text, obtenido text, veredicto text) ON COMMIT DROP;
DO $t$
DECLARE
  v_uid uuid; v_compra uuid; v_ped uuid; v_sku uuid; v_cc uuid; v_r jsonb; v_cod text;
  v_ped2 uuid;
BEGIN
  -- ═══ EL ESCENARIO: una compra con pedido, desglose Y RESERVA VIGENTE ═══
  -- Sin esto la compuerta 1 cortocircuita y la matriz mide otra cosa
  -- (tropiezo de S101-A, repetido por mi en la tanda anterior).
  SELECT c.id, c.user_id INTO v_compra, v_uid
    FROM public.compras c JOIN public.compra_desglose d ON d.compra_id=c.id
   ORDER BY c.created_at DESC LIMIT 1;
  SELECT id INTO v_ped FROM public.pedidos WHERE compra_id=v_compra LIMIT 1;

  -- Reserva VIGENTE para todos los pedidos de esa compra (fixture in-txn).
  SELECT sku_id INTO v_sku FROM public.inventario_reservas LIMIT 1;
  INSERT INTO public.inventario_reservas (sku_id, pedido_id, cantidad, estado, expira_en)
  SELECT v_sku, p.id, 1, 'vigente', now() + interval '30 minutes'
    FROM public.pedidos p WHERE p.compra_id = v_compra
  ON CONFLICT (pedido_id, sku_id) DO UPDATE
     SET estado='vigente', expira_en = now() + interval '30 minutes';

  -- ── 1 · CAMINO FELIZ (con token) ────────────────────────────────────────
  v_r := public.verificar_compuertas_pre_cobro(v_compra,'tok-matriz');
  INSERT INTO _m VALUES ('ok (camino feliz)','ok=true',
    'ok='||(v_r->>'ok')||' no_evaluables='||coalesce(v_r->>'no_evaluables','-'),
    CASE WHEN (v_r->>'ok')='true' THEN 'VERDE' ELSE 'ROJO' END);

  -- ── 2 · 🔴 token_ausente — AHORA SÍ, sin cortocircuito ──────────────────
  v_r := public.verificar_compuertas_pre_cobro(v_compra, NULL);
  v_cod := v_r->>'codigo';
  INSERT INTO _m VALUES ('token_ausente','token_ausente', v_cod,
    CASE WHEN v_cod='token_ausente' THEN 'VERDE' ELSE 'ROJO' END);

  -- ── 3 · compra_no_existe ────────────────────────────────────────────────
  v_r := public.verificar_compuertas_pre_cobro('00000000-0000-4000-8000-000000000000','t');
  v_cod := v_r->>'codigo';
  INSERT INTO _m VALUES ('compra_no_existe','compra_no_existe', v_cod,
    CASE WHEN v_cod='compra_no_existe' THEN 'VERDE' ELSE 'ROJO' END);

  -- ── 4 · compra_sin_pedidos (defecto NUESTRO) ────────────────────────────
  INSERT INTO public.compras (user_id, subtotal, impuesto_total, envio_total, total, moneda, estado, clave_idempotencia)
  VALUES (v_uid,10,0,0,10,'USD','creada','mtz-sp-'||gen_random_uuid()::text) RETURNING id INTO v_cc;
  v_r := public.verificar_compuertas_pre_cobro(v_cc,'t'); v_cod := v_r->>'codigo';
  INSERT INTO _m VALUES ('compra_sin_pedidos (NUESTRO)','compra_sin_pedidos', v_cod,
    CASE WHEN v_cod='compra_sin_pedidos' THEN 'VERDE' ELSE 'ROJO' END);

  -- ── 5 · reserva_vencida — VA ANTES: el caso del desglose MUTA la compra
  --      (mueve su pedido) y contaminaba a este. *Una matriz con dependencia
  --      de orden entre casos no mide casos: mide la secuencia.*
  UPDATE public.inventario_reservas SET expira_en = now() - interval '1 minute'
   WHERE pedido_id IN (SELECT id FROM public.pedidos WHERE compra_id = v_compra);
  v_r := public.verificar_compuertas_pre_cobro(v_compra,'t'); v_cod := v_r->>'codigo';
  INSERT INTO _m VALUES ('reserva_vencida','reserva_vencida', v_cod,
    CASE WHEN v_cod='reserva_vencida' THEN 'VERDE' ELSE 'ROJO' END);
  -- ── 6 · 🔴 desglose_incompleto (defecto NUESTRO) — con reserva VIGENTE ──
  INSERT INTO public.compras (user_id, subtotal, impuesto_total, envio_total, total, moneda, estado, clave_idempotencia)
  VALUES (v_uid,10,0,0,10,'USD','creada','mtz-sd-'||gen_random_uuid()::text) RETURNING id INTO v_cc;
  UPDATE public.pedidos SET compra_id = v_cc WHERE id = v_ped;   -- mueve el pedido, SIN desglose
  INSERT INTO public.inventario_reservas (sku_id, pedido_id, cantidad, estado, expira_en)
  VALUES (v_sku, v_ped, 1, 'vigente', now() + interval '30 minutes')
  ON CONFLICT (pedido_id, sku_id) DO UPDATE SET estado='vigente', expira_en=now()+interval '30 minutes';
  v_r := public.verificar_compuertas_pre_cobro(v_cc,'t'); v_cod := v_r->>'codigo';
  INSERT INTO _m VALUES ('desglose_incompleto (NUESTRO)','desglose_incompleto', v_cod,
    CASE WHEN v_cod='desglose_incompleto' THEN 'VERDE' ELSE 'ROJO' END);

END;
$t$;
SELECT caso, esperado, obtenido, veredicto FROM _m;
ROLLBACK;

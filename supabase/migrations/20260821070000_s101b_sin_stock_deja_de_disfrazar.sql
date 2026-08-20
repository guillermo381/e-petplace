-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · `sin_stock` DEJA DE SER UN DISFRAZ                             ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821070000.sql ║
-- ║ (escrita ANTES, con su nota de qué reintroduce)                         ║
-- ║ Regla 76(g): NO RIGE — cambia el cuerpo de una función, sin backfill.   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 EL DEFECTO, MEDIDO EN EL APARATO (20-ago) ═══════════════════════════
--
-- `iniciar_pago_pedido` envolvía al reservador en `EXCEPTION WHEN OTHERS` y
-- re-lanzaba **cualquier** error como:
--
--     sin_stock: no queda suficiente de algún producto del pedido
--
-- **Medido**: el SKU tenía `stock_disponible = 31`, `stock_reservado = 0`, y el
-- pedido pedía **1**. La causa real era
-- `duplicate key … inventario_reservas_pedido_id_sku_id_key` (`D-851`).
--
-- ⇒ La app le decía a la familia **que no quedaba mercadería habiendo 31**, y la
--   mandaba a reintentar algo que iba a fallar igual para siempre.
--
-- **Es la misma familia que las dos curas de voz de hoy** (`OperationNotAllowed`
-- disfrazado de «el banco no autorizó»), ahora en el motor: *un error técnico
-- vestido de veredicto, que además le pide a quien no puede hacer nada que haga
-- algo.*
--
-- 🔴 **Y había una confesión adentro del propio código:** el
-- `COALESCE(v_falta, 'algún producto del pedido')` existe **porque el autor sabía
-- que `v_falta` podía venir NULL** — es decir, que podía no faltar ningún
-- producto. *El fallback no era prudencia: era la prueba de que el nombre estaba
-- mal.* Cuando un mensaje necesita un genérico para el caso en que su premisa no
-- se cumple, la premisa no es la que el mensaje dice.
--
-- ═══ LA CURA ════════════════════════════════════════════════════════════════
--
-- **`sin_stock` solo habla cuando el stock opinó.** Se conserva su traducción
-- —porque es una voz buena y la familia la entiende— pero **solo si hay un
-- producto que realmente falta**. Todo lo demás **sale con su código real**, sin
-- renombrar y sin tragarse.
--
-- *Un manejador que renombra todo lo que atrapa no es manejo de errores: es
-- pérdida de información con buena presentación.*

CREATE OR REPLACE FUNCTION public.iniciar_pago_pedido(
  p_pedido_id        uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped   record;
  v_res   jsonb;
  v_falta text;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN
    RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT _puede_operar_pedido(p_pedido_id) THEN
    RAISE EXCEPTION 'no_podes_operar_este_pedido' USING ERRCODE = '42501';
  END IF;

  -- 🔴 PRIMERO SE APARTA LA MERCADERÍA, DESPUÉS SE PIDE LA TARJETA.
  --    Si esto rebota, la persona ve la mala noticia ANTES de pagar — que es
  --    una mala noticia, pero no es un cobro que hay que devolver.
  --
  -- 🔴 EL PRE-CHEQUEO VA **ANTES** DEL INTENTO, no en el manejador.
  --    Así `sin_stock` se dice porque el stock lo dijo, y no porque algo falló
  --    y no supimos qué era. *La verdad se mide antes de necesitarla; buscarla
  --    dentro del catch es preguntarle a la causa equivocada.*
  SELECT string_agg(DISTINCT pi.nombre_producto, ', ') INTO v_falta
    FROM pedido_items pi
    JOIN ofertas o ON o.id = pi.oferta_id
    JOIN vendedor_skus vs ON vs.id = o.sku_id
   WHERE pi.pedido_id = p_pedido_id
     AND vs.stock_disponible < pi.cantidad;

  IF v_falta IS NOT NULL THEN
    RAISE EXCEPTION 'sin_stock: no queda suficiente de %', v_falta
      USING ERRCODE = '22023';
  END IF;

  -- 🔴 SIN MANEJADOR ATRAPA-TODO. Lo que el reservador lance sale **con su
  --    código y su mensaje**.
  --    (La frase literal del manejador **no se escribe acá a propósito**: el
  --     cinturón de abajo lee `pg_get_functiondef`, que **devuelve también los
  --     comentarios**, y se disparó contra su propia advertencia. Es **L-170**,
  --     ya escrita en la casa, cobrada de nuevo — *un censo que lee comentarios
  --     como código no distingue una prohibición de una infracción*.) Si mañana aparece una causa nueva, la vamos a ver por su
  --    nombre en vez de descubrirla ocho días después midiendo stock a mano.
  v_res := reservar_stock_pedido(p_pedido_id, p_minutos_vigencia);

  PERFORM _mover_estado_pedido(p_pedido_id, 'esperando_pago', 'cliente');

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
    'narrativa', 'pagando', 'reserva', v_res,
    'reserva_expira_en', v_res->>'expira_en');
END $$;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
-- No basta con que la función exista: se verifica que el disfraz **se fue**.
DO $$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'iniciar_pago_pedido';

  IF v_def ILIKE '%WHEN OTHERS%' THEN
    RAISE EXCEPTION 'CINTURÓN: el manejador que disfrazaba sigue vivo';
  END IF;
  IF v_def ILIKE '%algún producto del pedido%' THEN
    RAISE EXCEPTION 'CINTURÓN: el genérico que probaba el defecto sigue vivo';
  END IF;
  IF v_def NOT ILIKE '%sin_stock%' THEN
    RAISE EXCEPTION 'CINTURÓN: se perdió la voz buena de sin_stock';
  END IF;
  RAISE NOTICE 'cinturón verde · sin_stock solo habla cuando el stock opinó';
END $$;

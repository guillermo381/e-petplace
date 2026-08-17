-- S100-A · UN ÍTEM DE PEDIDO ES DE SU VENDEDOR — y ahora es INEXPRESABLE que no lo sea.
--
-- ── EL DEFECTO, MEDIDO ANTES DE CURARLO ──────────────────────────────────────
-- `crear_pedido_despensa` busca la oferta con
--     WHERE o.id = <oferta_id> AND o.estado = 'publicada'
-- **sin filtrar por dueño**, y después estampa el ítem con
--     cuenta_comercial_id := p_cuenta_comercial_id      -- el PARÁMETRO
-- o sea el vendedor que le pasaron, no el dueño real de la oferta.
--
-- Del otro lado, `apps/cliente/.../despensa/checkout.tsx` resuelve el vendedor
-- del pedido como `items[0]?.cuentaComercialId` y se lo aplica AL PEDIDO
-- ENTERO. Las dos mitades componen el defecto: **un carrito con dos vendedores
-- crea UN pedido a nombre del primero, con mercadería del segundo, cobrada al
-- precio del segundo y ACREDITADA AL PRIMERO.** Sin error, sin traza.
--
-- Alcanzable hoy, no teórico: 563 ofertas publicadas de 5 vendedores, y 25
-- variantes con más de una oferta publicada (la misma bolsa, dos vendedores).
--
-- ── LO QUE EL CENSO DIJO, Y POR QUÉ IMPORTA QUE SE ESCRIBA ACÁ ───────────────
-- Ítems ya mal atribuidos al aplicar esta migración: **0. Plata mal acreditada:
-- $0.** El arma estaba cargada y no se había disparado. ⇒ **esta migración es
-- PREVENTIVA: no repara nada, impide.** Y llega justo cuando la firma F5 («un
-- carrito, N pedidos independientes») vuelve probable el carrito multi-vendedor
-- que hasta hoy nadie armaba.
--
-- ── POR QUÉ UN TRIGGER Y NO EL GUARD ADENTRO DE LA FUNCIÓN ───────────────────
-- ① `crear_pedido_despensa` no es el único escritor de `pedido_items`
--    (`configurar_recurrencia` también arma ítems), y un guard en una puerta
--    deja las otras abiertas. **La tabla se defiende sola.**
-- ② Reemplazar la función exigía transcribir ~8.000 caracteres de cuerpo para
--    cambiar dos líneas — y una transcripción es una superficie de error nueva
--    a cambio de nada.
-- ③ Es el molde que la casa ya usa para esto (D-389 / D-526: el trigger que
--    protege columnas y deja pasar a los DEFINER legítimos), y la ley que lo
--    ordena: *el estado malo no se detecta, se vuelve inexpresable* (L-222).
--
-- ── VEDA 76(g): **NO RIGE.** ─────────────────────────────────────────────────
-- Esta migración no hace backfill, no reescribe filas y no ancla nada: crea una
-- función y un trigger. Su fixture corre EN TRANSACCIÓN y termina en ROLLBACK.
--
-- ── REVERSA ──────────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar, en
-- `docs/relevamientos/2026-08-17-s100a-REVERSA-pedido-item-vendedor.sql`,
-- **declarando que revertirla REABRE el defecto de plata.**

BEGIN;

CREATE OR REPLACE FUNCTION public._pedido_item_es_de_su_vendedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_dueno_oferta uuid;
  v_dueno_pedido uuid;
BEGIN
  SELECT o.cuenta_comercial_id INTO v_dueno_oferta
    FROM ofertas o WHERE o.id = NEW.oferta_id;

  -- Un ítem sin oferta resoluble no es asunto de este trigger: de eso ya habla
  -- `oferta_no_publicada` en la puerta. No se inventa un rechazo por otra causa.
  IF v_dueno_oferta IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.cuenta_comercial_id INTO v_dueno_pedido
    FROM pedidos p WHERE p.id = NEW.pedido_id;

  IF v_dueno_pedido IS NOT NULL AND v_dueno_oferta <> v_dueno_pedido THEN
    -- 🔴 EL RECHAZO HABLADO. Dice los dos vendedores porque el modo de falla es
    --    silencioso: sin los ids, quien lo reciba no sabe cuál de los dos está
    --    de más.
    RAISE EXCEPTION
      'oferta_de_otro_vendedor: la oferta % es del vendedor %, y el pedido es del vendedor %',
      NEW.oferta_id, v_dueno_oferta, v_dueno_pedido
      USING ERRCODE = '22023';
  END IF;

  -- 🔴 EL ESTAMPADO SALE DE LA OFERTA, JAMÁS DEL PARÁMETRO.
  -- Con el rechazo de arriba los dos valores coinciden siempre, así que esto
  -- es redundante *hoy*. Se pone igual porque vuelve la fila **auto-consistente
  -- por construcción**: si algún día alguien afloja el rechazo, el ítem sigue
  -- diciendo de quién es la mercadería. *La segunda cuenta no se calcula: se
  -- deriva de la primera* — que es la ley que esta casa cobró cuatro veces.
  NEW.cuenta_comercial_id := v_dueno_oferta;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pedido_item_es_de_su_vendedor ON public.pedido_items;
CREATE TRIGGER trg_pedido_item_es_de_su_vendedor
  BEFORE INSERT OR UPDATE OF oferta_id, cuenta_comercial_id, pedido_id
  ON public.pedido_items
  FOR EACH ROW EXECUTE FUNCTION public._pedido_item_es_de_su_vendedor();

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
-- No basta con que el trigger exista: se verifica que ESTÉ ENGANCHADO y que su
-- función sea la nuestra. Un `CREATE TRIGGER` que quedó sobre otra tabla existe
-- igual y no protege nada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc  p ON p.oid = t.tgfoid
    WHERE c.relname = 'pedido_items'
      AND t.tgname  = 'trg_pedido_item_es_de_su_vendedor'
      AND p.proname = '_pedido_item_es_de_su_vendedor'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'CINTURÓN: el trigger no quedó enganchado a pedido_items';
  END IF;
END $$;

-- ── FIXTURE CON DISCRIMINADOR, EN TRANSACCIÓN Y CON ROLLBACK ────────────────
-- 🔴 El brazo que hace que esto pruebe algo NO es «el ajeno rebota»: es que
--    **el propio PASA**. Un trigger que rechazara todo también haría rebotar al
--    ajeno, y dejaría la despensa entera sin poder vender.
DO $$
DECLARE
  v_ped uuid; v_of_propia uuid; v_of_ajena uuid;
  v_cta_a uuid; v_cta_b uuid; v_uid uuid;
  v_prop_id uuid; v_var_id uuid; v_imp text; v_pct numeric;
  v_prop_b uuid; v_var_b uuid; v_imp_b text; v_pct_b numeric;
  v_rebote text := '(no rebotó)';
  v_propio_ok boolean := false;
BEGIN
  -- Dos vendedores DISTINTOS que tengan oferta publicada. Si el universo no
  -- contiene el caso, el fixture lo DICE en vez de pasar en falso.
  SELECT o.cuenta_comercial_id, o.id INTO v_cta_a, v_of_propia
    FROM ofertas o WHERE o.estado = 'publicada' LIMIT 1;
  SELECT o.cuenta_comercial_id, o.id INTO v_cta_b, v_of_ajena
    FROM ofertas o WHERE o.estado = 'publicada'
      AND o.cuenta_comercial_id <> v_cta_a LIMIT 1;

  IF v_cta_b IS NULL THEN
    RAISE EXCEPTION 'FIXTURE SIN SUJETO: no hay dos vendedores con oferta publicada — el discriminador no se puede correr';
  END IF;

  SELECT user_id INTO v_uid FROM pedidos LIMIT 1;

  -- Los datos de cada ítem salen de SU oferta — `ofertas` no tiene
  -- `producto_id`: vive en `producto_variantes`, igual que en la función real.
  SELECT v.producto_id, v.id, v.impuesto_codigo, COALESCE(t.pct, 0)
    INTO v_prop_id, v_var_id, v_imp, v_pct
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    LEFT JOIN cat_tasas_impuesto t ON t.codigo = v.impuesto_codigo
   WHERE o.id = v_of_propia;

  SELECT v.producto_id, v.id, v.impuesto_codigo, COALESCE(t.pct, 0)
    INTO v_prop_b, v_var_b, v_imp_b, v_pct_b
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    LEFT JOIN cat_tasas_impuesto t ON t.codigo = v.impuesto_codigo
   WHERE o.id = v_of_ajena;

  -- 🔴 SUBTRANSACCIÓN QUE SE DESHACE SIEMPRE. Este bloque escribe un pedido y
  --    dos ítems de prueba; el `RAISE` del final los revierte por completo
  --    (en PL/pgSQL un BEGIN…EXCEPTION es una subtransacción: al salir por
  --    excepción, los DATOS vuelven atrás). **Las VARIABLES no se revierten**,
  --    y por eso los asserts de abajo pueden leer el resultado sobre una base
  --    que quedó sin residuo.
  --    *Sin esto la migración COMMITEA su propio fixture: un pedido fantasma
  --    en producción, que es exactamente la clase de los 137 huérfanos.*
  BEGIN
    INSERT INTO pedidos (user_id, cuenta_comercial_id, estado, total, country_code)
    VALUES (v_uid, v_cta_a, 'creado', 0, 'EC')
    RETURNING id INTO v_ped;

    -- ① EL PROPIO PASA (el brazo que impide un trigger que rechaza todo).
    BEGIN
      INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                                cuenta_comercial_id, nombre_producto,
                                precio_unitario, cantidad, subtotal,
                                impuesto_codigo, impuesto_pct, impuesto_monto)
      VALUES (v_ped, v_prop_id, v_var_id, v_of_propia, v_cta_a, 'fixture', 1, 1, 1,
              v_imp, v_pct, 0);
      v_propio_ok := true;
    EXCEPTION WHEN OTHERS THEN
      v_propio_ok := false;
    END;

    -- ② EL AJENO REBOTA.
    BEGIN
      INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                                cuenta_comercial_id, nombre_producto,
                                precio_unitario, cantidad, subtotal,
                                impuesto_codigo, impuesto_pct, impuesto_monto)
      VALUES (v_ped, v_prop_b, v_var_b, v_of_ajena, v_cta_a, 'fixture ajeno', 1, 1, 1,
              v_imp_b, v_pct_b, 0);
    EXCEPTION WHEN OTHERS THEN
      v_rebote := SQLERRM;
    END;

    RAISE EXCEPTION 'FIXTURE_ROLLBACK_SENTINELA';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'FIXTURE_ROLLBACK_SENTINELA' THEN RAISE; END IF;
  END;

  IF NOT v_propio_ok THEN
    RAISE EXCEPTION 'FIXTURE ①: el ítem PROPIO fue rechazado — el trigger rechaza de más';
  END IF;
  IF v_rebote NOT LIKE 'oferta_de_otro_vendedor%' THEN
    RAISE EXCEPTION 'FIXTURE ②: el ítem AJENO no rebotó como se esperaba — salió: %', v_rebote;
  END IF;

  -- RESIDUO 0, MEDIDO Y NO SUPUESTO. Que el sentinela exista no prueba que
  -- haya revertido: se pregunta por las filas.
  IF EXISTS (SELECT 1 FROM pedido_items WHERE nombre_producto IN ('fixture','fixture ajeno'))
     OR (v_ped IS NOT NULL AND EXISTS (SELECT 1 FROM pedidos WHERE id = v_ped)) THEN
    RAISE EXCEPTION 'RESIDUO: el fixture dejó filas vivas — la subtransacción no revirtió';
  END IF;

  RAISE NOTICE 'FIXTURE VERDE — ① el propio entra · ② el ajeno rebota (%) · residuo 0', v_rebote;
END $$;

COMMIT;

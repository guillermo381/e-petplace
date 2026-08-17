-- REVERSA de `20260820030000_s100a_la_compra.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ── QUÉ DESHACE ──────────────────────────────────────────────────────────────
-- Retira las dos RPC, la columna `pedidos.compra_id`, y las tablas
-- `compra_desglose` y `compras`.
--
-- ── 🔴 QUÉ **NO** DESHACE, Y ES LO CARO ──────────────────────────────────────
-- **BORRA DATO.** `compras` y `compra_desglose` son tablas nuevas: revertir
-- **destruye toda compra creada y todo desglose congelado** desde que se
-- aplicó. Y el desglose es exactamente lo que existe para poder calcular un
-- reembolso parcial: *sin él, en S101 no se puede ni saber cuánto devolver.*
--
-- ⇒ **NO SE CORRE ESTA REVERSA CON COMPRAS VIVAS.** Si las hay, primero se
-- decide qué pasa con ellas — y esa es una decisión de plata, no de esquema.
-- El bloque de abajo ABORTA solo si encuentra alguna, en vez de borrarlas.
--
-- Los pedidos NO se pierden: `compra_id` es una columna añadida y su borrado
-- deja las filas intactas. Lo que se pierde es **la agrupación** y, con ella,
-- la única forma de saber qué pedidos se cobraron juntos.

BEGIN;

DO $$
DECLARE v_n bigint;
BEGIN
  SELECT count(*) INTO v_n FROM public.compras;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: hay % compra(s) viva(s) — revertir las borra, y con ellas el desglose que S101 necesita para reembolsar. Decidí qué pasa con ellas primero.', v_n;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.crear_intento_pago(uuid, text);
DROP FUNCTION IF EXISTS public.crear_compra_desde_pedidos(uuid[], text);

ALTER TABLE public.pedidos DROP COLUMN IF EXISTS compra_id;

DROP TABLE IF EXISTS public.compra_desglose;
DROP TABLE IF EXISTS public.compras;

COMMIT;

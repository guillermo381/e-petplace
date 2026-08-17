-- REVERSA de `20260820010000_s100a_item_del_pedido_es_de_su_vendedor.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- ── QUÉ DESHACE ──────────────────────────────────────────────────────────────
-- Retira el trigger y su función. Después de esto, `pedido_items` vuelve a
-- aceptar un ítem cuya oferta pertenece a un vendedor DISTINTO del pedido.
--
-- ── 🔴 QUÉ **NO** DESHACE, Y HAY QUE LEERLO ANTES DE CORRERLA ────────────────
-- Revertir esto **REABRE el defecto de plata**: la mercadería del vendedor #2
-- vuelve a poder venderse bajo la cuenta del #1, sin error y sin traza.
-- Medido al aplicar la migración: el daño histórico era **0 ítems / $0** — o
-- sea que el trigger nació ANTES del primer caso real. Revertirlo no repara
-- nada; solo vuelve a permitirlo.
--
-- Tampoco toca datos: el trigger nunca escribió filas, solo rechazó. No hay
-- nada que restaurar.
--
-- ── SI SE REVIERTE, QUÉ QUEDA COMO ÚNICA DEFENSA ─────────────────────────────
-- Nada en la base. Quedaría solo la disciplina de la superficie
-- (`checkout.tsx`), que es exactamente la que produjo el defecto: `items[0]`
-- aplicado al pedido entero.

BEGIN;

DROP TRIGGER IF EXISTS trg_pedido_item_es_de_su_vendedor ON public.pedido_items;
DROP FUNCTION IF EXISTS public._pedido_item_es_de_su_vendedor();

COMMIT;

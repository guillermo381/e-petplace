-- REVERSA de 20260826023000_s105d_registrar_reverso_deuna.sql
-- Escrita ANTES de aplicar. S105-D · 25-ago-2026.
--
-- DESHACE: borra `registrar_reverso_deuna`. Nada más — sin tablas, sin
--          vocabulario nuevo (`'reversado'`, `'reverso_fallido'` y
--          `'reversado_mismo_dia'` ya existían).
--
-- 🔴 NO DESHACE:
--   1. **LOS REVERSOS YA HECHOS ANTE DEUNA NO VUELVEN.** La plata devuelta,
--      devuelta está. Esto borra la capacidad de REGISTRARLOS, no el hecho.
--   2. Los datos quedan: todo intento en `'reversado'` sigue ahí con su
--      `proveedor_reverso_id`. Describen algo que pasó.
--   3. 🔴 **REVERTIR SIN REVERTIR LA EDGE ES PEOR QUE NO REVERTIR.**
--      `pagos-reverso-deuna` llama a esta RPC; sin ella **ya habrá pedido el
--      refund** y fallará al registrarlo ⇒ plata devuelta y cero rastro.
--      ⇒ **ORDEN: primero se retira la edge, después esta función.**

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_reverso_deuna(uuid, text, numeric, text, jsonb);

COMMIT;

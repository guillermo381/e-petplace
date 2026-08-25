-- REVERSA de 20260825201500_s105d_registrar_reverso_nuvei.sql
-- Escrita ANTES de aplicar (regla de la casa). S105-D · 25-ago-2026.
--
-- ⚠️ QUÉ DESHACE Y QUÉ NO
--
-- DESHACE: borra `registrar_reverso_nuvei`. Nada más — la migración no crea
--          tablas, no toca vocabulario (`'reversado'`, `'reverso_fallido'`,
--          `'reversado_mismo_dia'` YA existían en sus CHECK) y no altera
--          ninguna función previa.
--
-- 🔴 NO DESHACE — y esto es lo importante de leer antes de correrla:
--
--   1. **LOS REVERSOS YA HECHOS ANTE EL PROVEEDOR NO VUELVEN.** La plata que
--      Nuvei devolvió, devuelta está. Esta reversa borra nuestra capacidad de
--      REGISTRARLOS, no el hecho.
--
--   2. **LOS DATOS QUEDAN.** Todo intento que esta función haya llevado a
--      `'reversado'` **se queda en `'reversado'`**, con su `proveedor_reverso_id`
--      y su `hallazgo`. Es correcto: describen algo que pasó de verdad.
--
--   3. 🔴 **REVERTIR SIN REVERTIR LA EDGE DEJA UN AGUJERO PEOR QUE EL ORIGINAL.**
--      `pagos-reverso` llama a esta RPC. Sin ella, la edge **ya habrá pedido el
--      refund al proveedor** y fallará al registrarlo ⇒ **plata devuelta y cero
--      rastro nuestro.** *Exactamente el estado que esta tanda existe para
--      evitar.*
--      ⇒ **ORDEN OBLIGATORIO: primero se retira la edge, después esta función.**
--
--   4. No revierte `D-923`: el sujeto sigue sin moverse con o sin esto, porque
--      **esta función nunca lo movió** (ver la cabecera de la migración).

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_reverso_nuvei(uuid, text, text, numeric, text);

COMMIT;

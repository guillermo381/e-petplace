-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DEL BLOQUE 4 · S95-D — el ledger comercial
--   supabase/migrations/20260811230000_s95_m12_ledger_comercial.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace entera: las dos tablas nacieron vacías (el cinturón ④
--      lo verifica) y nada más se tocó.
--
--   ❌ 🔴 **DEJA DE SERVIR CON LA PRIMERA SEÑAL CAPTURADA, y por una razón que
--      no tiene otra tabla: estos eventos NO SE PUEDEN REHACER.** Un reporte
--      se rehace desde eventos; los eventos no se rehacen desde un reporte.
--      Una búsqueda sin resultado que no se guardó no dejó rastro en ningún
--      otro lado — no hay pedido, no hay pago, no hay nada. **Borrarla es
--      borrar demanda que nadie va a poder volver a ver.**
--
--   ⇒ Con señales vivas, esta reversa NO se ejecuta. Si el modelo cambia, se
--     sube `version_esquema` — que es exactamente para lo que esa columna
--     existe.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 ANTES DE EJECUTAR: si esto devuelve > 0, PARAR.
--    SELECT count(*) FROM senales_comerciales;
DROP TABLE IF EXISTS public.senales_comerciales;
DROP TABLE IF EXISTS public.cat_senales_comerciales;

COMMIT;

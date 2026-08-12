-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA · S95-G3 — la activación de la cuenta del vendedor
--   supabase/migrations/20260812080000_s95g3_activar_cuenta_vendedor.sql
--
-- 🔴 REVERTIR VUELVE A DEJAR AL VENDEDOR SIN CAMINO. Es el callejón que H
--    midió: la cuenta nace en `pendiente_validacion`, `otorgar_rol_vendedor`
--    exige que esté activa, y sin esta migración **lo único que activa una
--    cuenta comercial es `activar_prestador`, que exige título profesional y
--    registro SENESCYT**. Con la despensa viva, revertir esto significa que
--    ningún vendedor nuevo se puede dar de alta.
--
-- ⚠️ LA COLUMNA `activado_por` NO SE BORRA. Es nullable, no molesta, y borrarla
--    perdería el rastro de quién activó las cuentas ya activadas — que es
--    justamente lo que esta migración vino a que exista. *Las columnas muertas
--    no se pudren.* Si alguien de verdad la quiere fuera, el DROP está escrito
--    abajo y comentado a propósito.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.otorgar_rol_vendedor(uuid, text);

-- `otorgar_rol_vendedor` vuelve a su cuerpo de S95-G2: exige cuenta activa y
-- NO la activa. Se restaura re-aplicando su migración, no copiando el cuerpo
-- acá — una copia envejece contra su fuente.
--   \i supabase/migrations/20260812030000_s95g2_puertas_vendedor.sql

-- `activar_prestador` vuelve a no escribir `activado_por`.
--   \i supabase/migrations/<la que lo definió por última vez>
-- (Su cuerpo no cambia de comportamiento: solo deja de anotar quién activó.)

-- ⚠️ NO se ejecuta. Ver la advertencia de la cabecera.
-- ALTER TABLE public.cuentas_comerciales DROP COLUMN IF EXISTS activado_por;

COMMIT;

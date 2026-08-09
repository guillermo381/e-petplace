-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260808200000_s92_tablas_sin_rls_y_auditoria.sql` (S92-A)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN.
--
-- ⚠️ ADVERTENCIA MÁS FUERTE DE TODAS LAS REVERSAS DE ESTA SESIÓN:
--
--   Correr esto **vuelve a exponer 14 filas con teléfonos E.164 REALES** de
--   personas, legibles y BORRABLES por cualquiera con la anon key —que viaja
--   en el bundle de las dos apps—. También devuelve a `anon` la capacidad de
--   DELETE sobre `cat_bancos` (17 filas) y UPDATE sobre `cat_paises` (23), y
--   de borrar la bitácora de auditoría.
--
--   Esto NO se corre para «volver al estado anterior por las dudas». Se corre
--   únicamente si se midió que la migración rompió algo concreto, y en ese caso
--   conviene revertir SOLO el objeto que rompió, no la tanda.
--
-- QUÉ NO DESHACE: nada de lo que haya pasado mientras tanto. Si alguien leyó la
-- traza en la ventana en que estuvo abierta, eso ya ocurrió — por eso el orden
-- de S90 puso esta tabla PRIMERA: *es el único hallazgo donde el dato ya está
-- afuera.*
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① la traza de teléfonos ───────────────────────────────────────────────
ALTER TABLE public._traza_promocion_e164 DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public._traza_promocion_e164 TO anon, authenticated;

-- ── ⑤ los tres catálogos (la escritura vuelve; el SELECT nunca se tocó) ───
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_bancos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_paises TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_tipos_documento_titular TO anon, authenticated;

-- ── ⑥ consentimientos (vuelven UPDATE/DELETE/TRUNCATE) ───────────────────
GRANT UPDATE, DELETE, TRUNCATE ON public.consentimientos TO anon, authenticated;

-- ── ⑨ audit_log (vuelve la escritura de los roles de cliente) ────────────
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_log TO anon, authenticated;

COMMIT;

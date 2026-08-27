-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827040000_s106a_diagnostico_invariante.sql`
--
-- QUÉ DESHACE: saca el CHECK y devuelve `diagnostico_principal` a NOT NULL.
--
-- 🔴 SI HAY CONSULTAS DERIVADAS SIN DIAGNÓSTICO, **EL NOT NULL VA A REBOTAR**.
--    Se mide antes:
--      SELECT count(*) FROM evento_historia_clinica_registrada
--      WHERE diagnostico_principal IS NULL;
--    Si da > 0, revertir exige decidir qué hacer con esas consultas — y eso es
--    una decisión clínica, no una de esquema.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.evento_historia_clinica_registrada
  DROP CONSTRAINT IF EXISTS chk_hc_diagnostico_o_derivacion;
ALTER TABLE public.evento_historia_clinica_registrada
  ALTER COLUMN diagnostico_principal SET NOT NULL;

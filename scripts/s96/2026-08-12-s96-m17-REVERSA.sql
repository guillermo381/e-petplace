-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813001000_s96_composicion_no_aplica.sql
--
-- Deshace: el cuarto estado `no_aplica` — el CHECK vuelve a tres valores y el
-- trigger/la puerta vuelven a la forma de M14 (cuerpos en
-- functiondef-pre-m17.sql, capturados ANTES).
--
-- ⚠️ QUÉ NO DESHACE: si alguna fila ya dice `no_aplica` (las seis arenas),
--    el CHECK de tres valores REBOTA al re-crearse — hay que decidir a qué
--    estado bajan esas filas ANTES de revertir (bajarlas a 'ausente' vuelve a
--    la mentira que la firma vino a matar: la app pidiéndole ingredientes a
--    una bolsa de arena).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ① Las filas no_aplica se listan y la reversa ABORTA si existen (decisión
--   humana, no default):
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM productos WHERE composicion_estado = 'no_aplica';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'hay % productos en no_aplica — decidir su destino antes de revertir', v_n;
  END IF;
END $$;

ALTER TABLE public.productos DROP CONSTRAINT chk_composicion_estado;
ALTER TABLE public.productos ADD CONSTRAINT chk_composicion_estado
  CHECK (composicion_estado IN ('verificada','declarada_sin_verificar','ausente'));

-- ② El trigger y la puerta: re-aplicar los cuerpos de
--    scripts/s96/functiondef-pre-m17.sql (capturados del objeto vivo).

COMMIT;

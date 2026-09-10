-- REVERSA de 20260912560000 · escrita ANTES. Cero datos que perder (lector + config).
-- ⚠️ Revertir apaga la ÚNICA vigilancia del cupo: desde ahí, que la facturación
--    se detenga por cupo agotado se descubre cuando una familia reclama su factura.
DROP FUNCTION IF EXISTS public.fiscal_salud_emision();
DELETE FROM public.app_config WHERE clave IN
  ('fiscal_cupo_documentos','fiscal_cupo_periodo','fiscal_cupo_alerta_pcts',
   'fiscal_simular_cupo_agotado');

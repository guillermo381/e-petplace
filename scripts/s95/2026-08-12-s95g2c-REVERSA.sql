-- REVERSA · S95-G2c — la puerta única del alta
--   supabase/migrations/20260812050000_s95g2_puerta_unica_alta.sql
--
-- 🔴 REVERTIR REABRE LA PUERTA DE SERVICIO: con estas policies vivas,
--    `definir_regla_envio_vendedor()` y `crear_bodega_vendedor()` vuelven a ser
--    OPCIONALES — se puede escribir la fila directo y saltearse el gate, la
--    validación del tipo apagado y la idempotencia. Una puerta única que
--    convive con una puerta de servicio no es una puerta única.
BEGIN;
CREATE POLICY reglas_envio_insert ON public.reglas_envio FOR INSERT TO authenticated
  WITH CHECK (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY reglas_envio_update ON public.reglas_envio FOR UPDATE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_insert ON public.vendedor_bodegas FOR INSERT TO authenticated
  WITH CHECK (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_update ON public.vendedor_bodegas FOR UPDATE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY reglas_envio_delete ON public.reglas_envio FOR DELETE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_delete ON public.vendedor_bodegas FOR DELETE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
COMMIT;

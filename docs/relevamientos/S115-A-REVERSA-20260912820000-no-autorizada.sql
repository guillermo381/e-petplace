-- REVERSA de 20260912820000. Vuelve el CHECK a NO admitir no_autorizada sin número.
-- ⚠️ Revertir reintroduce el defecto exacto: un documento rechazado por el
--    proveedor ANTES de numerar queda sin estado legal, atrapado en emitiendo,
--    y su motivo se pierde porque escribirlo viola el CHECK.
ALTER TABLE public.documentos_fiscales DROP CONSTRAINT IF EXISTS chk_documento_fiscal_emitido_declara_secuencial;
ALTER TABLE public.documentos_fiscales ADD CONSTRAINT chk_documento_fiscal_emitido_declara_secuencial
  CHECK (sentido <> 'emitido' OR estado = ANY (ARRAY['borrador','esperando_receptor','pendiente_manual','anulada']::fiscal_estado_enum[])
      OR (numeracion_origen='proveedor' AND estado='emitiendo')
      OR (establecimiento IS NOT NULL AND punto_emision IS NOT NULL AND secuencial IS NOT NULL));

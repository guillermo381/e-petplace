-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260912620000_s115a_numeracion_ajena.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ QUÉ NO DESHACE: si algún documento se emitió con `numeracion_origen =
--    'proveedor'`, su clave NO es derivable desde la fila — revertir el CHECK a
--    la forma estricta lo deja en un estado que el CHECK viejo rechaza. La
--    reversa NO borra esos documentos (son comprobantes fiscales reales): los
--    LISTA y aborta. Quien revierta decide qué hacer con ellos ANTES.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.documentos_fiscales
   WHERE numeracion_origen = 'proveedor';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'reversa_abortada: % documento(s) con numeracion ajena viva', v_n
      USING DETAIL = 'Su clave no reconstruye desde la fila. Decidir antes de revertir.';
  END IF;
END $$;

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_clave_reconstruible;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_clave_reconstruible CHECK (
    clave_acceso IS NULL
    OR (sentido = 'emitido' AND clave_acceso = public.fiscal_clave_acceso(
          fecha_emision, tipo, ruc_emisor, sri_ambiente,
          establecimiento, punto_emision, secuencial))
    OR (sentido = 'recibido' AND clave_acceso ~ '^[0-9]{49}$'
        AND public._fiscal_dv_modulo11(left(clave_acceso, 48)) = right(clave_acceso, 1)::integer)
  );

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_emitido_declara_secuencial;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_emitido_declara_secuencial CHECK (
    sentido <> 'emitido'
    OR estado = ANY (ARRAY['borrador','esperando_receptor','pendiente_manual','anulada']::fiscal_estado_enum[])
    OR (establecimiento IS NOT NULL AND punto_emision IS NOT NULL AND secuencial IS NOT NULL)
  );

DROP FUNCTION IF EXISTS public.fiscal_anotar_numero_ajeno(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric, text);
ALTER TABLE public.documentos_fiscales DROP COLUMN IF EXISTS numeracion_origen;
-- ⚠️ La firma vieja de fiscal_reservar_numero (8 args) hay que recrearla desde
--    la migración 20260912600000 — esta reversa no la reconstruye sola.

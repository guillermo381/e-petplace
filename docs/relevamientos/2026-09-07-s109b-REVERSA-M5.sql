-- REVERSA de 20260907120000_s109b_el_concepto_del_programa.sql
-- ESCRITA ANTES DE APLICAR.
-- ⚠️ Los comprobantes YA EMITIDOS conservan su texto: `notificacion_intencion.datos`
--    es un snapshot, no una vista. Revertir cambia los PRÓXIMOS, y devuelve el
--    comprobante del programa a «Pago en e-PetPlace» — el defecto de §10.1 otra vez.
--    El cuerpo previo vive en `20260903240000`; revertir es re-aplicar ESE.
BEGIN;
-- re-aplicar `_concepto_de_pago` de 20260903240000.
COMMIT;

-- REVERSA de 20260905260000_s109b_el_congelador_se_lee.sql
-- ESCRITA ANTES DE APLICAR.
-- ⚠️ Revertir devuelve el `PERFORM` que descarta el veredicto del congelador:
--    el mes se comprometería aunque el desglose no se haya congelado, y el
--    comprobante saldría sin subtotal ni impuesto. Hoy no es alcanzable
--    (cero cuentas comerciales sin moneda) — pero la columna lo admite, y ése
--    es exactamente el modo de falla que no da síntoma.
BEGIN;
-- re-aplicar el cuerpo de `cobrar_periodo_mensualidad_guarderia` de 20260903180000.
COMMIT;

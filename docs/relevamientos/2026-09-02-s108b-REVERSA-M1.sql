-- REVERSA de 20260902100000_s108b_desglose_de_la_mensualidad.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE, declarado y medido antes de revertir:
--    `guarderia_suscripcion_desglose` guarda DESGLOSES CONGELADOS — o sea, lo
--    que se le prometió a una familia por un período y lo que se le cobró.
--    Dropear la tabla borra esa prueba. NO es un artefacto reversible como una
--    función: es evidencia.
--
--    SELECT count(*) FROM guarderia_suscripcion_desglose;
--    -- si > 0: NO revertir sin volcar esas filas a algún lado primero.
--
--    Y si algún `pagos_intentos` ya cobró contra uno de esos desgloses, revertir
--    deja el intento apuntando a un monto que ya no se puede reconstruir.

BEGIN;

DROP FUNCTION IF EXISTS public.congelar_desglose_mensualidad_guarderia(uuid, date);
DROP TABLE IF EXISTS public.guarderia_suscripcion_desglose;

COMMIT;

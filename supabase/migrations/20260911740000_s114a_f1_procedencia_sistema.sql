-- S114-A · F1 · el caso del RELOJ tiene procedencia 'sistema'
-- Un no_ejecutado lo abre el reloj, no la familia ni la IA. El CHECK de
-- procedencia sólo admitía 'familia'/'ia_intake', así que _abrir_caso_no_ejecutado
-- rebotaba (23514). Se agrega 'sistema' — y la distinción le sirve a E para
-- separar los casos que abrió el reloj de los que abrió una persona.
-- 76(g): NO RIGE — aditivo al CHECK.
-- Reversa: ALTER ... CHECK (procedencia IN ('familia','ia_intake'));  (sólo si no
--   hay casos con procedencia='sistema', que este mismo motor produce).
BEGIN;
ALTER TABLE casos_postventa DROP CONSTRAINT chk_caso_procedencia;
ALTER TABLE casos_postventa ADD CONSTRAINT chk_caso_procedencia
  CHECK (procedencia = ANY (ARRAY['familia','ia_intake','sistema']));
COMMIT;

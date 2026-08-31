-- REVERSA de 20260907160000_s109a_el_link_es_un_intento.sql
--
-- ⚠️ QUÉ NO DESHACE: los intentos que `emitir_link_mensual` haya creado quedan
--    en `pagos_intentos`. Son filas de plata: NO se borran acá. Si hay que
--    retirarlas, se hace a mano y con la lista a la vista.
--
-- ⚠️ Y LO QUE REVERTIR REABRE: sin `intento_id`, un mes pagado por link vuelve
--    a ser plata que el motor de reversos NO PUEDE DESHACER —
--    `mover_sujeto_por_reverso` se dispara sobre la transición del intento, y
--    un link sin intento no tiene ninguna.

BEGIN;

DROP FUNCTION IF EXISTS public.pagos_aprobados_sin_sujeto_movido();

ALTER TABLE public.cobro_link_mensual DROP CONSTRAINT IF EXISTS cobro_link_mensual_intento_id_fkey;
ALTER TABLE public.cobro_link_mensual DROP COLUMN IF EXISTS intento_id;

-- `emitir_link_mensual` vuelve a su cuerpo previo: ver 20260907140000.
-- No se transcribe: `pg_get_functiondef` lo da del objeto y copiar un cuerpo
-- largo a mano es cómo una reversa restaura algo que no era.

COMMIT;

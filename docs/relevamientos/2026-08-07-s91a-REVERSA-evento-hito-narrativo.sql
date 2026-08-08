-- REVERSA de 20260807180000_s91a_evento_hito_narrativo.sql (escrita ANTES de aplicar)
-- ⚠️ Nota de datos: revertir BORRA los hitos narrativos sedimentados (si los
-- hubiera — al aplicar, el motor nace SIN emisor, así que la tabla nace y
-- se mantiene vacía hasta que el alta S91 emita). Antes de correr:
--   SELECT count(*) FROM evento_hito_narrativo;
-- Los eventos padre en eventos_mascota NO se borran acá (regla 41: se
-- relevan sus FKs y se decide con el dato a la vista, no en una reversa
-- genérica).

BEGIN;

UPDATE public.cat_tipos_evento
   SET tabla_tipada = NULL, updated_at = now()
 WHERE codigo = 'hito_narrativo';

DROP TABLE IF EXISTS public.evento_hito_narrativo;
DROP TABLE IF EXISTS public.cat_hitos_narrativos;

COMMIT;

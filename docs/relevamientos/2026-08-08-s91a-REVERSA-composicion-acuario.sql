-- REVERSA de `20260808110000_s91a_composicion_acuario.sql`
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- ⚠️ LA NOTA DE DATOS, que es lo que importa acá: revertir el CÓDIGO no
-- revierte el DATO. Esta tabla es APPEND-ONLY: cada fila es una declaración
-- del dueño («hoy hay 5 neones»), y el censo vigente se DERIVA de la última
-- por especie. Un DROP se lleva **la historia entera de la composición**, y
-- esa historia no se puede reconstruir de ninguna otra parte del expediente:
-- no hay evento espejo, no hay snapshot en `mascotas`. Si hay filas y la
-- reversa se corre igual, se pierde para siempre cuántos peces había y cuándo
-- cambió.
--
-- ⇒ ANTES de revertir con datos vivos, volcar:
--     \copy (SELECT * FROM public.acuario_composicion ORDER BY mascota_id, declarado_en)
--       TO 'composicion-acuario-<fecha>.csv' CSV HEADER
--
-- Lo que la reversa NO toca a propósito: `cat_razas` (las 10 razas de pez son
-- de D-379 y viven aunque el censo muera) y `mascotas.sujeto`/`tipo_agua` (son
-- de la cláusula del pez, migración `20260807173000`).

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_composicion_acuario(uuid);
DROP FUNCTION IF EXISTS public.declarar_composicion_acuario(uuid, integer, text, text);

DROP TRIGGER IF EXISTS trg_acuario_composicion_solo_acuario ON public.acuario_composicion;
DROP FUNCTION IF EXISTS public._acuario_composicion_solo_acuario();

DROP TABLE IF EXISTS public.acuario_composicion;

COMMIT;

-- REVERSA de 20260826240000_s106a_jubilar_acepta_telemedicina.sql — ANTES.
--
-- QUÉ DESHACE: devuelve la columna `prestadores.acepta_telemedicina`, la
-- vista con la columna, y el cuerpo de `crear_prestador_inicial` que la
-- sembraba.
--
-- ⚠️ QUÉ **NO** DESHACE: los VALORES. La columna vuelve con su default
-- (`false`) para las 11 filas. Medido antes de dropear: **11 de 11 estaban
-- en `false` y CERO en `true`**, así que la reversa restaura exactamente el
-- estado que había — pero eso es cierto HOY y no lo será si alguien la
-- resucita y la usa. *Una reversa que restaura el default solo es fiel
-- mientras el default sea la verdad.*

BEGIN;

ALTER TABLE public.prestadores ADD COLUMN IF NOT EXISTS acepta_telemedicina boolean DEFAULT false;
GRANT SELECT (acepta_telemedicina) ON public.prestadores TO authenticated;

-- La vista vuelve con la columna (definición capturada del objeto ANTES).
\echo 'Restaurar v_prestadores_publicos desde la sección 2 de la migración,'
\echo 'agregando de nuevo `acepta_telemedicina,` después de `acepta_emergencias,`.'

-- Y `crear_prestador_inicial` vuelve a sembrarla: reponer en su INSERT
-- `acepta_telemedicina,` en la lista de columnas y
-- `COALESCE(p_acepta_telemedicina, false),` en la de valores.

COMMIT;

-- REVERSA de `20260805280000_lector_campana.sql`. Escrita ANTES.
--
-- ⚠️ LO QUE REVERTIR **NO** DESHACE: los avisos ya marcados leídos siguen en
--    `estado='leida'`. Quitar el verbo no devuelve nada a no-leído — y está
--    bien: alguien los leyó de verdad.
-- ⚠️ La columna `leida_en` se conserva a propósito (drop de columna = pérdida
--    de dato). Si hay que sacarla, es un acto aparte y deliberado.
BEGIN;
DROP FUNCTION IF EXISTS public.marcar_aviso_leido(uuid);
DROP FUNCTION IF EXISTS public.obtener_mis_avisos(integer);
-- ALTER TABLE public.notificacion_intencion DROP COLUMN leida_en;  ← NO se corre solo.
COMMIT;

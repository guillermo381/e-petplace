-- REVERSA de 20260908380000_s112a_acta_y_memorial.sql — ESCRITA ANTES.
--
-- 🔴 QUE NO DESHACE:
--   · Las solicitudes en `no_concretada_fallecimiento` VIOLAN el CHECK viejo ⇒
--     la reversa las lleva a `declinada`, que dice algo FALSO: declinar es un
--     acto del publicador, y acá el animal murió. Perdida de informacion
--     declarada, sobre el desenlace mas doloroso del vertical.
--   · Revertir esto **permite firmar el acta de un animal muerto**, que es lo
--     que el founder prohibio por firma el 2-sep. No se revierte sin su palabra.
BEGIN;
DROP TRIGGER IF EXISTS trg_mascotas_cierra_solicitudes_memorial ON public.mascotas;
DROP FUNCTION IF EXISTS public._trg_mascotas_cierra_solicitudes_memorial();
UPDATE public.adopcion_solicitud SET estado='declinada'
 WHERE estado='no_concretada_fallecimiento';
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS chk_cierre_coherente;
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada','desistida']));
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente
  CHECK ((estado = ANY (ARRAY['recibida','en_conversacion']) AND cerrada_en IS NULL)
      OR (estado = ANY (ARRAY['aceptada','declinada','desistida']) AND cerrada_en IS NOT NULL));
COMMIT;

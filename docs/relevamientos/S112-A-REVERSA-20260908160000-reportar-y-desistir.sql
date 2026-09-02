-- REVERSA de 20260908160000_s112a_reportar_y_desistir.sql — ESCRITA ANTES.
-- 🔴 QUE NO DESHACE:
--   · Los REPORTES ya hechos se pierden con la tabla. Son denuncias de personas
--     sobre publicaciones, y no viven en ningun otro lado.
--   · Las solicitudes en `desistida` **violan el CHECK viejo** ⇒ la reversa las
--     lleva a `declinada`, que dice algo FALSO: declinar es del publicador,
--     desistir es de la familia. Es perdida de informacion declarada.
--   · Y con eso vuelven a caer en la purga de 90 dias por la puerta equivocada.
BEGIN;
DROP FUNCTION IF EXISTS public.reportar_publicacion(uuid, text, text);
DROP FUNCTION IF EXISTS public.desistir_solicitud_adopcion(uuid);
DROP TABLE IF EXISTS public.adopcion_reporte;
UPDATE public.adopcion_solicitud SET estado='declinada' WHERE estado='desistida';
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS chk_cierre_coherente;
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada']));
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente
  CHECK ((estado = ANY (ARRAY['recibida','en_conversacion']) AND cerrada_en IS NULL)
      OR (estado = ANY (ARRAY['aceptada','declinada']) AND cerrada_en IS NOT NULL));
COMMIT;

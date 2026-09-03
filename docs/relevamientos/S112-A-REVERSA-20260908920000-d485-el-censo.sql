-- REVERSA de 20260908920000 · D-485, el censo de las 81 tablas colgadas de
-- mascota_id y la cura de los cinco huecos que compartían la misma clase.
--
-- Las cinco son POLICIES NUEVAS, aditivas (el patrón de la casa: cada rol
-- de acceso es su propia policy, Postgres las OR-ea). Revertir es DROP puro,
-- sin tocar las policies viejas.
--
-- Revertir esto REABRE el hueco: la familia vuelve a poder editar (donde ya
-- podía) sin poder leer las mismas cinco clases de registro de su mascota.
-- Sin backfill que perder — son policies, no datos.

DROP POLICY IF EXISTS estadias_pet_parent_familia ON public.estadias;
DROP POLICY IF EXISTS pc_pet_parent_familia ON public.programas_contratados;
DROP POLICY IF EXISTS suscr_servicio_pet_parent_familia ON public.suscripciones_servicio;
DROP POLICY IF EXISTS accion_destructiva_select_familia ON public.accion_destructiva_pendiente;
DROP POLICY IF EXISTS map_select_familia ON public.mascota_acceso_prestador;

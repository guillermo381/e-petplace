DROP POLICY IF EXISTS bonos_prestador_own ON public.bonos;
CREATE POLICY bonos_prestador_own ON public.bonos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS bonos_prestador_update ON public.bonos;
CREATE POLICY bonos_prestador_update ON public.bonos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))))
  WITH CHECK ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS cert_prestador ON public.certificaciones;
CREATE POLICY cert_prestador ON public.certificaciones
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))) OR is_admin()));

DROP POLICY IF EXISTS estadias_prestador_own ON public.estadias;
CREATE POLICY estadias_prestador_own ON public.estadias
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS estadias_prestador_update ON public.estadias;
CREATE POLICY estadias_prestador_update ON public.estadias
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))))
  WITH CHECK ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS prestador_fotos_delete_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_delete_titular ON public.prestador_fotos
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM prestadores p
  WHERE ((p.id = prestador_fotos.prestador_id) AND (p.user_id = auth.uid())))));

DROP POLICY IF EXISTS prestador_fotos_insert_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_insert_titular ON public.prestador_fotos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM prestadores p
  WHERE ((p.id = prestador_fotos.prestador_id) AND (p.user_id = auth.uid())))));

DROP POLICY IF EXISTS prestador_fotos_update_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_update_titular ON public.prestador_fotos
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM prestadores p
  WHERE ((p.id = prestador_fotos.prestador_id) AND (p.user_id = auth.uid())))));

DROP POLICY IF EXISTS pc_prestador_own ON public.programas_contratados;
CREATE POLICY pc_prestador_own ON public.programas_contratados
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS emergencia_prestador ON public.solicitudes_emergencia;
CREATE POLICY emergencia_prestador ON public.solicitudes_emergencia
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))) OR is_admin()));

DROP POLICY IF EXISTS suscr_servicio_prestador_own ON public.suscripciones_servicio;
CREATE POLICY suscr_servicio_prestador_own ON public.suscripciones_servicio
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));

DROP POLICY IF EXISTS suscr_servicio_prestador_update ON public.suscripciones_servicio;
CREATE POLICY suscr_servicio_prestador_update ON public.suscripciones_servicio
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))))
  WITH CHECK ((prestador_id IN ( SELECT prestadores.id
   FROM prestadores
  WHERE (prestadores.user_id = auth.uid()))));
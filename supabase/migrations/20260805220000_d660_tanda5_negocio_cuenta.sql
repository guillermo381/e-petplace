-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ⑤ — la identidad del negocio y la cuenta comercial
--
-- TRES PRECISIONES, y las tres son «abrir de más es peor» (ley de la ④):
--
-- ① `prestador_own_profile` era FOR ALL. Se PARTE POR VERBO:
--    · SELECT y UPDATE → helper (identidad, vitrina, configuración = gestión)
--    · DELETE → TITULAR (o admin de plataforma). **Borrar el negocio no es
--      gestión corriente.** Migrarlo entero le habría dado a un administrador
--      la capacidad de borrar la empresa — el ejemplo más caro de abrir de más.
--    · INSERT ya lo cubren `prestador_insert_self` y `prestadores_insert`
--      (auto-servicio, intactas).
--
-- ② `cuentas_comerciales` INSERT **NO SE ABRE** — es auto-servicio, y es la
--    casa de [[D-656]]: crear la cuenta propia es un acto de la persona, y ahí
--    vive el defecto de la irreversibilidad. Un administrador no crea cuentas.
--
-- ③ `cuentas_comerciales` SELECT/UPDATE ganan la pata del NEGOCIO YA VINCULADO
--    (letra del founder): no «el que la creó», sino **quien gestiona un
--    prestador colgado de esa cuenta**. La condición de `owner_profile_id`
--    QUEDA — nadie que pasaba deja de pasar.
--
-- VEDA 76(g): NO RIGE. Cinturón sin efectos laterales; par en el fixture.
-- ============================================================================

BEGIN;

DROP POLICY prestador_own_profile ON public.prestadores;

CREATE POLICY prestador_ve_lo_suyo ON public.prestadores
  FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(id));

CREATE POLICY prestador_gestiona_lo_suyo ON public.prestadores
  FOR UPDATE TO authenticated
  USING (public.user_gestiona_prestador(id))
  WITH CHECK (public.user_gestiona_prestador(id));

-- El DELETE se queda como estaba: titular o admin de plataforma. A propósito.
CREATE POLICY prestador_borra_solo_el_titular ON public.prestadores
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ── ② y ③: la cuenta comercial ──────────────────────────────────────────────
DROP POLICY owner_select_own_cuentas ON public.cuentas_comerciales;
CREATE POLICY owner_select_own_cuentas ON public.cuentas_comerciales
  FOR SELECT TO authenticated
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.prestadores p
                WHERE p.cuenta_comercial_id = cuentas_comerciales.id
                  AND public.user_gestiona_prestador(p.id))
  );

DROP POLICY owner_update_own_cuentas_data ON public.cuentas_comerciales;
CREATE POLICY owner_update_own_cuentas_data ON public.cuentas_comerciales
  FOR UPDATE TO authenticated
  USING (
    owner_profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.prestadores p
                WHERE p.cuenta_comercial_id = cuentas_comerciales.id
                  AND public.user_gestiona_prestador(p.id))
  )
  WITH CHECK (
    owner_profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.prestadores p
                WHERE p.cuenta_comercial_id = cuentas_comerciales.id
                  AND public.user_gestiona_prestador(p.id))
  );
-- `owner_insert_own_cuentas` NO SE TOCA (ver ② en la cabecera).

DO $$
DECLARE v_n int;
BEGIN
  -- el INSERT de cuentas sigue siendo auto-servicio puro
  SELECT count(*) INTO v_n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
   WHERE c.relname='cuentas_comerciales' AND p.polname='owner_insert_own_cuentas'
     AND pg_get_expr(p.polwithcheck,p.polrelid) !~* 'user_gestiona_prestador';
  IF v_n <> 1 THEN RAISE EXCEPTION 'el_insert_de_cuentas_se_abrio_D656'; END IF;

  -- borrar el negocio sigue siendo del titular
  SELECT count(*) INTO v_n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
   WHERE c.relname='prestadores' AND p.polcmd='d'
     AND pg_get_expr(p.polqual,p.polrelid) !~* 'user_gestiona_prestador';
  IF v_n <> 1 THEN RAISE EXCEPTION 'el_delete_del_negocio_se_abrio'; END IF;

  RAISE NOTICE 'tanda ⑤ OK · insert de cuentas y delete del negocio siguen cerrados';
END $$;

COMMIT;

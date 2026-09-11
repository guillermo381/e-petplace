-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `donaciones` SE CIERRA — firma del founder sobre `D-1059`
--
-- 🔴 LO QUE HABÍA, y son DOS policies, no una: `donaciones_insert` Y
--    `donaciones_select`, las dos `TO public` y las dos con el mismo
--    `OR (user_id IS NULL)`. Con `anon`, `auth.uid()` es NULL, así que la
--    primera rama da NULL y **la segunda decide sola**.
--    Probado por camino real antes de tocar nada (`SET LOCAL ROLE anon`, en
--    transacción con ROLLBACK): **el INSERT PASÓ.** Y la lectura también:
--    cualquiera con la anon key —que viaja en el bundle y es pública— podía
--    escribir y leer donaciones sin cuenta.
--
-- LA FIRMA: el `OR` sale. *No deja pasar donaciones anónimas: deja pasar
-- cualquier fila sin dueño, y funciona por cómo SQL trata los nulos, no por
-- diseño.* Si el producto necesita donar sin cuenta, se resuelve con una
-- función SECURITY DEFINER con su propio guard, jamás relajando una policy.
--
-- ⚠️ EL CENSO, ANTES DE CERRAR (porque revocar de más rompe un camino legítimo
--    y ningún typecheck lo dice — el precedente de los tres catálogos en S92):
--      · monorepo: **0** consumidores de código (sólo prosa, i18n y tipos)
--      · `e-petplace-v2`, `e-petplace-admin`, `e-petplace-prestadores`,
--        `epetplace-web`: **0** lecturas o escrituras
--      · la tabla tiene **0 filas**
--    Y un hallazgo que refuerza la firma en vez de sólo permitirla: el propio
--    `chat-ayuda` del legado le dice a la gente *«las donaciones también
--    requieren cuenta»*. **La policy no sólo acertaba por accidente:
--    contradecía la letra que el producto ya publica.**
--
-- Las otras cuatro policies del censo de `D-1059` (`profiles`,
-- `solicitudes_adopcion`, `evento_cita_servicio`, `prestador_empleado_servicios`)
-- QUEDAN COMO ESTÁN, con su nota: aciertan por accidente y son deuda declarada,
-- no cura de esta tanda.
--
-- 76(g) — VEDA: NO RIGE (policies; 0 filas).
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS donaciones_insert ON public.donaciones;
DROP POLICY IF EXISTS donaciones_select ON public.donaciones;

CREATE POLICY donaciones_insert ON public.donaciones
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY donaciones_select ON public.donaciones
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

/* El grant de escritura a `anon` sobre esta tabla también sale — es de los 651
   heredados de `D-1059`. Se cierra el que la ficha probó abierto; los otros van
   en su pasada, que es la ficha entera. */
REVOKE INSERT, UPDATE, DELETE ON public.donaciones FROM anon;

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — EL ROJO ES QUE `anon` YA NO PUEDA, y se ejerce, no se lee.
-- *«La policy está cerrada» es una lectura; «rebotó con 42501» es un hecho.*
-- ─────────────────────────────────────────────────────────────────────────
DO $c$
DECLARE v_paso boolean; v_id uuid; v_n int; v_user uuid; v_rol_mig text;
BEGIN
  /* 🔴 `RESET ROLE` bajo `db push` NO vuelve al rol de la migración: vuelve al
     rol de LOGIN del tool, y de ahí en adelante todo rebota con un
     «permission denied» que parece del objeto y es del rol. Está escrito en la
     skill de la casa y me lo cobró igual: se captura y se restaura por nombre. */
  v_rol_mig := current_user;
  SELECT id INTO v_user FROM auth.users LIMIT 1;

  -- (a) 🔴 anon ya NO escribe
  BEGIN
    SET LOCAL ROLE anon;
    INSERT INTO public.donaciones (user_id, monto) VALUES (NULL, 1.00) RETURNING id INTO v_id;
    v_paso := true;
  EXCEPTION WHEN OTHERS THEN v_paso := false;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: anon TODAVIA escribe donaciones. La puerta sigue abierta.';
  END IF;

  -- (b) 🔴 anon ya NO lee
  BEGIN
    SET LOCAL ROLE anon;
    SELECT count(*) INTO v_n FROM public.donaciones;
    v_paso := true;
  EXCEPTION WHEN OTHERS THEN v_paso := false; v_n := -1;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF v_paso AND v_n > 0 THEN
    RAISE EXCEPTION 'cinturon 🔴: anon leyo % fila(s) de donaciones.', v_n;
  END IF;

  -- (c) EL DISCRIMINADOR: el camino legítimo sigue vivo. *Sin esto el rojo de
  --     arriba sólo probaría que la tabla quedó cerrada para todos, que es un
  --     verde por la razón equivocada.*
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_user, 'role','authenticated')::text, true);
    INSERT INTO public.donaciones (user_id, monto) VALUES (v_user, 2.00) RETURNING id INTO v_id;
    v_paso := true;
  EXCEPTION WHEN OTHERS THEN v_paso := false;
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  PERFORM set_config('request.jwt.claims', NULL, true);
  IF NOT v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: el DUEÑO tampoco puede donar. Se cerro de mas.';
  END IF;
  DELETE FROM public.donaciones WHERE id = v_id;

  IF (SELECT count(*) FROM public.donaciones) <> 0 THEN
    RAISE EXCEPTION 'cinturon: residuo en donaciones';
  END IF;

  RAISE NOTICE 'cinturon VERDE: anon no escribe · anon no lee · el dueño SI dona · residuo 0';
END $c$;

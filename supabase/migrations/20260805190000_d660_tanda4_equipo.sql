-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ④ — EQUIPO: la tanda donde la distinción muerde
--
-- LEY DE ESTA TANDA (advertencia propia, ratificada por el founder):
--   **`self_actualiza` y `accept_invitation` son ACTOS DE LA PERSONA SOBRE SÍ
--   MISMA y NO SE ABREN.** Acá el error no da cero filas: da un administrador
--   ACEPTANDO INVITACIONES AJENAS. *En las tandas anteriores abrir de más era
--   ruido; en ésta es suplantación.*
--
-- MIGRAN (seis) — gatean por `prestadores.user_id`, o sea gestión del negocio:
--   empleado_invitaciones: dueño_crea · dueño_actualiza · dueño_ve
--   prestador_empleados:   dueño_crea · dueño_actualiza · dueño_ve_todos
--
-- NO MIGRAN (cuatro) — su predicado es `auth.uid()` o `mi_email()`, o sea la
-- persona sobre sí misma:
--   invitaciones_aceptar_self · empleados_accept_invitation ·
--   empleados_self · empleados_self_actualiza
--   *La clasificación sale del TEXTO del predicado, no del nombre.*
--
-- ✅ EL LÍMITE INTOCABLE YA ESTÁ DONDE DEBE, y esta tanda NO LO TOCA:
-- `empleado_roles` (donde vive el rol `administrador`) gatea con
-- `empleado_tiene_rol(prestador, ['dueño'])` — o sea, **crear y quitar roles
-- ya era del TITULAR y sigue siéndolo**. Un administrador que ahora puede
-- crear EMPLEADOS sigue sin poder nombrar ADMINISTRADORES. *Se verificó antes
-- de escribir una línea, porque era el borde donde esta tanda podía romper la
-- letra de S74 sin que nadie lo notara.*
--
-- VEDA 76(g): NO RIGE. Cinturón sin efectos laterales; el par con el admin en
-- el fixture (lecciones ①②③ de las tandas anteriores, ya aplicadas).
-- ============================================================================

BEGIN;

DROP POLICY invitaciones_dueño_crea ON public.empleado_invitaciones;
CREATE POLICY invitaciones_dueño_crea ON public.empleado_invitaciones
  FOR INSERT TO authenticated
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY invitaciones_dueño_actualiza ON public.empleado_invitaciones;
CREATE POLICY invitaciones_dueño_actualiza ON public.empleado_invitaciones
  FOR UPDATE TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY invitaciones_dueño_ve ON public.empleado_invitaciones;
CREATE POLICY invitaciones_dueño_ve ON public.empleado_invitaciones
  FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id));

DROP POLICY empleados_dueño_crea ON public.prestador_empleados;
CREATE POLICY empleados_dueño_crea ON public.prestador_empleados
  FOR INSERT TO authenticated
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY empleados_dueño_actualiza ON public.prestador_empleados;
CREATE POLICY empleados_dueño_actualiza ON public.prestador_empleados
  FOR UPDATE TO authenticated
  USING (public.user_gestiona_prestador(prestador_id))
  WITH CHECK (public.user_gestiona_prestador(prestador_id));

DROP POLICY empleados_dueño_ve_todos ON public.prestador_empleados;
CREATE POLICY empleados_dueño_ve_todos ON public.prestador_empleados
  FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id));

-- ── CINTURÓN: que las CUATRO de self sigan EXACTAMENTE como estaban ─────────
-- No mide permisos (eso es del fixture): mide que esta migración no las tocó.
-- *El riesgo de esta tanda no es que falte abrir — es haber abierto de más.*
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
   WHERE c.relname IN ('prestador_empleados','empleado_invitaciones')
     AND p.polname IN ('empleados_self','empleados_self_actualiza',
                       'empleados_accept_invitation','invitaciones_aceptar_self')
     AND pg_get_expr(coalesce(p.polqual,p.polwithcheck), p.polrelid) ~* 'auth\.uid\(\)|mi_email\(\)';
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'las_cuatro_de_self_no_estan_intactas: %', v_n;
  END IF;

  -- y el límite: `empleado_roles` sigue gateando por dueño, no por gestión
  SELECT count(*) INTO v_n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
   WHERE c.relname='empleado_roles'
     AND pg_get_expr(coalesce(p.polqual,p.polwithcheck), p.polrelid) ~* 'user_gestiona_prestador';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'el_limite_intocable_se_abrio: % policies de empleado_roles usan el helper', v_n;
  END IF;

  RAISE NOTICE 'tanda ④ OK · las 4 de self intactas · el limite intocable cerrado';
END $$;

COMMIT;

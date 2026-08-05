-- ============================================================================
-- S88-A · LOTE D-660 — EL HELPER ÚNICO DE GESTIÓN
--
-- La letra de S74 dice «administrador = dueño menos crear admins» y el censo
-- con dedos midió que NO PUEDE ESCRIBIR NADA (servicios 0, horarios 0,
-- identidad 0, vitrina 0, cuenta 0). El patrón: todos los gates se escribieron
-- cuando «prestador = titular» era verdad — la premisa caducada de D-651, un
-- piso más abajo.
--
-- ⚠️ ESTA MIGRACIÓN SOLO CREA EL HELPER Y LO PRUEBA. Las policies y RPCs se
-- migran a él SITIO POR SITIO, cada uno con su par — porque cada sitio decide
-- algo distinto y abrir de más es peor que no abrir.
--
-- EL LÍMITE INTOCABLE, escrito adentro del helper para que no se pierda:
-- CREAR Y QUITAR ADMINISTRADORES ES DEL TITULAR. El helper NO lo cubre.
--
-- VEDA 76(g): NO RIGE. REVERSA: docs/relevamientos/2026-08-05-s88a-REVERSA-d660.sql
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.user_gestiona_prestador(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT
    -- ① el TITULAR, siempre
    EXISTS (SELECT 1 FROM public.prestadores p
             WHERE p.id = p_prestador_id AND p.user_id = auth.uid())
    -- ② el ADMINISTRADOR de ese negocio (la letra de S74, por fin con motor)
    OR public.empleado_tiene_rol(p_prestador_id, ARRAY['administrador'])
    -- ③ el admin de PLATAFORMA, que ya pasaba por las policies viejas
    OR public.is_admin();
$$;

COMMENT ON FUNCTION public.user_gestiona_prestador(uuid) IS
  'LA PUERTA UNICA DE LA GESTION (D-660). titular OR administrador-de-ese-'
  'negocio OR admin-de-plataforma. Las policies y RPC la consultan EN VEZ de '
  'comparar user_id a mano: curar sitio por sitio garantiza olvidar uno, y el '
  'olvidado no falla -- da 0 filas en silencio. '
  'LIMITE INTOCABLE: crear/quitar ADMINISTRADORES es del TITULAR; este helper '
  'NO cubre ese acto (letra S74). Quien lo escriba compara user_id a proposito.';

REVOKE EXECUTE ON FUNCTION public.user_gestiona_prestador(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_gestiona_prestador(uuid) TO authenticated;

-- ── EL PAR DEL HELPER, adentro de la migración (L-199) ──────────────────────
DO $$
DECLARE
  v_aur uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_admin uuid := '29cd91e2-7f31-47d2-ab16-166ce100e3bd';  -- +s88admin
  v_recep uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';  -- +s87recep
  v_prof  uuid := 'a16ac32c-80fe-45a0-bfbf-cebc69b82a20';  -- +s87prof
  v_tit   uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';  -- titular de Aurora
  v_r text := '';
BEGIN
  -- ⚠️ El admin de prueba es TAMBIÉN admin de plataforma: para medir el ROL
  -- hay que apagar esa pata, o el par no discrimina (la trampa medida en el
  -- censo de D-660, que dio TODO VERDE y era falsa).
  UPDATE admin_users SET activo = false WHERE id = v_admin;

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  v_r := v_r || 'admin=' || public.user_gestiona_prestador(v_aur)::text || ' | ';
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_prof,'role','authenticated')::text, true);
  v_r := v_r || 'profesional=' || public.user_gestiona_prestador(v_aur)::text || ' | ';
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_recep,'role','authenticated')::text, true);
  v_r := v_r || 'recepcion=' || public.user_gestiona_prestador(v_aur)::text || ' | ';
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_tit,'role','authenticated')::text, true);
  v_r := v_r || 'titular=' || public.user_gestiona_prestador(v_aur)::text;

  UPDATE admin_users SET activo = true WHERE id = v_admin;   -- se restaura

  IF v_r <> 'admin=true | profesional=false | recepcion=false | titular=true' THEN
    RAISE EXCEPTION 'el_par_del_helper_no_discrimina: %', v_r;
  END IF;
  RAISE NOTICE 'par OK · %', v_r;
END $$;

COMMIT;

-- ============================================================================
-- S74-A · D-495 — LA CURA EN UN SOLO MOVIMIENTO (autorización founder S74):
--   (1) las 8 policies {public} de eventos_mascota_paseo y
--       evento_paseo_novedades pasan a TO authenticated (herencia S44,
--       pre-estándar: nunca debieron ser {public});
--   (2) REVOKE EXECUTE FROM PUBLIC, anon de DOS de los tres helpers
--       enfermos (user_tiene_acceso_a_mascota · user_puede_acceder_
--       prestador) — L-140.
--
-- IS_ADMIN QUEDA FUERA — DECLARADO, NO OLVIDADO: el cinturón del primer
-- intento (rollback limpio, nada aplicado) atrapó 10 policies alcanzables
-- por anon que citan is_admin y que el censo T2 NO vio (verosímil-falso
-- del propio censo, L-158): 5 admin legacy {public} (solicitudes_adopcion
-- · mascotas_adopcion · productos · profiles · pedidos) + 2 de
-- storage.objects (productos-fotos admin) + las 3 caso_*_select de las
-- tipadas de caso (también {public}, misma enfermedad pre-estándar).
-- Revocar is_admin hoy convertiría esas vías en 42501; exige su propio
-- censo y decisión de mesa (candidata a deuda, número en mesa).
--
-- CONDICIÓN DEL FOUNDER, CUMPLIDA ANTES DE ESTE ARCHIVO (S74-A):
--   verificación de que ningún caller lee estas tablas SIN sesión —
--   e-petplace-prestadores / e-petplace-admin / e-petplace-v2 /
--   e-petplace-sistema-pruebas: los únicos usos son SQL server-side
--   (migraciones y simulador); cero lecturas de cliente anónimo. Los
--   wrappers del monorepo van autenticados. Censo completo:
--   docs/relevamientos/2026-07-22-s74a-censo-d495-policies-anon.md
--   (66 policies citan el helper; estas 8 eran las únicas vías de anon).
--
-- Semántica preservada: anon sobre estas tablas veía VACÍO (qual false o
-- helper que rebota); post-cura ve VACÍO (cero policy aplicable). El
-- assert final lo PRUEBA — vacío, jamás 42501.
--
-- 76(g): NO RIGE — cero anclas computadas sobre datos vivos; seguridad
-- pura, cero filas tocadas.
-- ============================================================================

-- (1) Las ocho policies, de {public} a authenticated -------------------------
ALTER POLICY paseo_select     ON public.eventos_mascota_paseo  TO authenticated;
ALTER POLICY paseo_insert     ON public.eventos_mascota_paseo  TO authenticated;
ALTER POLICY paseo_update     ON public.eventos_mascota_paseo  TO authenticated;
ALTER POLICY paseo_delete     ON public.eventos_mascota_paseo  TO authenticated;
ALTER POLICY paseo_nov_select ON public.evento_paseo_novedades TO authenticated;
ALTER POLICY paseo_nov_insert ON public.evento_paseo_novedades TO authenticated;
ALTER POLICY paseo_nov_update ON public.evento_paseo_novedades TO authenticated;
ALTER POLICY paseo_nov_delete ON public.evento_paseo_novedades TO authenticated;

-- CINTURÓN: tras el (1), NINGUNA policy alcanzable por anon puede citar a
-- ninguno de los tres helpers — si queda una, la migración ABORTA entera
-- (el REVOKE convertiría un vacío en 42501 y eso es exactamente lo que no
-- se permite: L-157, lo invisible no tiene stack trace).
DO $$
DECLARE
  v_n int;
  v_lista text;
BEGIN
  SELECT count(*), string_agg(schemaname || '.' || tablename || '/' || policyname, ' · ')
    INTO v_n, v_lista
  FROM pg_policies
  WHERE (roles::text[] && ARRAY['public', 'anon'])
    AND (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
        ~ '(user_tiene_acceso_a_mascota|user_puede_acceder_prestador)';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'D-495 aborta: % policies alcanzables por anon aún citan los DOS helpers a revocar: %', v_n, v_lista;
  END IF;
END $$;

-- (2) Los DOS helpers pierden anon/PUBLIC (L-140); is_admin espera su censo --
REVOKE EXECUTE ON FUNCTION public.user_tiene_acceso_a_mascota(uuid)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_puede_acceder_prestador(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_tiene_acceso_a_mascota(uuid)  TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.user_puede_acceder_prestador(uuid) TO authenticated, service_role;

-- SONDA L-140: proacl real, no catálogo de intenciones -----------------------
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.user_tiene_acceso_a_mascota(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon aún ejecuta user_tiene_acceso_a_mascota';
  END IF;
  IF has_function_privilege('anon', 'public.user_puede_acceder_prestador(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon aún ejecuta user_puede_acceder_prestador';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.user_tiene_acceso_a_mascota(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated perdió EXECUTE de user_tiene_acceso_a_mascota — eso NO era la cura';
  END IF;
END $$;

-- ASSERTS DE COMPORTAMIENTO (un solo DO; el rol de partida se captura y se
-- restaura por nombre — RESET ROLE devuelve al login role de la CLI, sin
-- privilegios, y eso rompió el primer intento):
--   1) anon: vacío, JAMÁS 42501 (la semántica que la cura prometió preservar);
--   2) el dueño REAL sigue viendo lo suyo (L-151: JWT del actor real sobre
--      data real, jamás solo fixtures).
DO $$
DECLARE
  v_rol text := current_user;
  v_uid uuid;
  v int;
BEGIN
  -- capturar el dueño real ANTES de cualquier cambio de rol
  SELECT m.user_id INTO v_uid
  FROM public.eventos_mascota_paseo p
  JOIN public.mascotas m ON m.id = p.mascota_id
  WHERE m.user_id IS NOT NULL
  LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'assert: no hay fila de paseo con dueño real para probar';
  END IF;

  -- (1) anon: vacío, sin error
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v FROM public.eventos_mascota_paseo;
  IF v <> 0 THEN RAISE EXCEPTION 'anon ve % filas de eventos_mascota_paseo', v; END IF;
  SELECT count(*) INTO v FROM public.evento_paseo_novedades;
  IF v <> 0 THEN RAISE EXCEPTION 'anon ve % filas de evento_paseo_novedades', v; END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  -- (2) el dueño real, con su JWT
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v FROM public.eventos_mascota_paseo;
  IF v = 0 THEN
    RAISE EXCEPTION 'el dueño real dejó de ver sus paseos — la cura rompió el camino authenticated';
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
END $$;

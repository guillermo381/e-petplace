-- 🔴 P0-C · ¿DÓNDE ESTÁ EL MINUTO? — cronometraje eslabón por eslabón.
--
-- Se mide DENTRO de la base, con el rol y los claims del founder, para que la
-- RLS se evalúe igual que en la app. Lo que NO mide: la red y el arranque de
-- PostgREST — así que si acá todo sale en milisegundos, el minuto vive fuera y
-- eso también es un dato.
--
-- ⚠️ NO TOCA NADA: solo lee y cronometra. Sin escrituras, sin DDL.
DO $$
DECLARE
  v_uid    uuid;
  v_fam    uuid;
  t0       timestamptz;
  ms_est   numeric;
  ms_masc  numeric;
  ms_sin   numeric;
  n        int;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'guillo381+8@gmail.com';
  IF v_uid IS NULL THEN
    RAISE NOTICE 'FOUNDER NO ENCONTRADO — se aborta (no se inventa un usuario)';
    RETURN;
  END IF;

  -- ── ESLABÓN 0 · SIN RLS (como owner): el piso de la consulta ──────────────
  SELECT familia_id INTO v_fam
  FROM familia_miembro WHERE user_id = v_uid LIMIT 1;

  t0 := clock_timestamp();
  PERFORM id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje,
          estado_vida, sujeto, tipo_agua, raza
  FROM mascotas WHERE familia_id = v_fam;
  ms_sin := EXTRACT(EPOCH FROM (clock_timestamp() - t0)) * 1000;

  SELECT count(*) INTO n FROM mascotas WHERE familia_id = v_fam;

  -- ── AHORA CON EL ROL Y LOS CLAIMS DEL FOUNDER (la RLS se enciende) ────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- ESLABÓN 1 · getEstadoOnboardingDueno
  t0 := clock_timestamp();
  PERFORM get_estado_onboarding_dueno();
  ms_est := EXTRACT(EPOCH FROM (clock_timestamp() - t0)) * 1000;

  -- ESLABÓN 2 · obtenerMascotasDeFamilia (el SELECT literal del wrapper)
  t0 := clock_timestamp();
  PERFORM id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje,
          estado_vida, sujeto, tipo_agua, raza
  FROM mascotas WHERE familia_id = v_fam ORDER BY fecha_alta;
  ms_masc := EXTRACT(EPOCH FROM (clock_timestamp() - t0)) * 1000;

  RESET ROLE;

  RAISE NOTICE '── mascotas de la familia: %', n;
  RAISE NOTICE '── SIN RLS (owner) ................ % ms', round(ms_sin, 1);
  RAISE NOTICE '── get_estado_onboarding_dueno .... % ms', round(ms_est, 1);
  RAISE NOTICE '── SELECT mascotas CON RLS ........ % ms', round(ms_masc, 1);
  RAISE NOTICE '── factor RLS ..................... %x', round(ms_masc / GREATEST(ms_sin, 0.01), 1);
END $$;

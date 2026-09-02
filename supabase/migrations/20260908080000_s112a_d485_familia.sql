/* ═══════════════════════════════════════════════════════════════════════════
   S112-A8 · `D-485` · LOS HELPERS APRENDEN QUE EXISTE LA FAMILIA
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Se recrean helpers; el UPDATE de `user_id` toca
   SOLO las mascotas que el traspaso mueva de ahora en adelante.

   ── LA ASIMETRIA, Y ES LO QUE HACE QUE NADIE LA VEA ────────────────────────
      El UPDATE de `mascotas` **SI** lee familia (`user_es_familiar_adulto_de_
      mascota`). El SELECT **NO**: `user_tiene_acceso_a_mascota_como` mira
      `mascotas.user_id` —el dueño directo— y ahi termina.

      ⇒ una familia puede EDITAR una mascota que no puede VER. Nadie choca con
      eso en el uso normal porque hoy el titular suele ser tambien `user_id`.
      **Se descubre el dia del primer traspaso**, que es lo que E midio por
      camino real: la familia destino ve **0 filas** de Luna y **0 eventos** de
      su expediente — incluida la vacuna que el refugio le cargo antes de la
      entrega. Es la promesa del §0 paso 15 al reves.

   ── LA CURA SON DOS HELPERS, NO 81 PUERTAS. Censo de E: de las 81 tablas
      colgadas de `mascota_id`, **~45 gatean por SOLO DOS** helpers, y **ninguno
      de los cuatro leia familia**. *Curar puerta por puerta habria sido 81
      oportunidades de olvidarse de una.*

   ── 🔴 Y LA SEGUNDA MITAD, que sin la primera no se ve: EL TRASPASO DEJABA
      `user_id` APUNTANDO AL REFUGIO. Mover `familia_id` sin mover `user_id`
      hace que **el refugio siga viendo al animal como dueño para siempre**, y
      que la familia dependa entera del branch nuevo. Se reapunta al titular
      destino — no se pone en NULL, porque `user_id` es la via legacy que otras
      partes de la casa siguen leyendo. *Curar la lectura y dejar el dato
      apuntando al lugar viejo es media cura mirando a la otra.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* El predicado de familia, **parametrizado por usuario**. No se puede reusar
   `user_es_familiar_adulto_de_mascota`: esa lee `auth.uid()` y estos helpers
   reciben el usuario como argumento. Se extrae para que las dos ramas de abajo
   consulten LA MISMA definicion — dos copias divergen el dia que una cambie. */
CREATE OR REPLACE FUNCTION public._user_es_de_la_familia_de(p_user_id uuid, p_mascota_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT p_user_id IS NOT NULL AND EXISTS (
    SELECT 1
      FROM mascotas m
      JOIN familia_miembro fm ON fm.familia_id = m.familia_id
     WHERE m.id = p_mascota_id
       AND fm.user_id = p_user_id
       /* Los TRES roles, no solo los adultos: un menor de la familia ve a su
          propia mascota. La escritura sigue siendo de los adultos — ese guard
          vive en `user_es_familiar_adulto_de_mascota` y no se toca. */
       AND fm.hasta IS NULL);
$fn$;
REVOKE ALL ON FUNCTION public._user_es_de_la_familia_de(uuid,uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._user_es_de_la_familia_de(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_tiene_acceso_a_mascota_como(p_user_id uuid, p_mascota_id uuid)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_user_id uuid := p_user_id; v_caducidad_meses integer;
BEGIN
  IF v_user_id IS NULL THEN RETURN false; END IF;
  IF is_admin() THEN RETURN true; END IF;

  -- Dueño directo (legacy / walk-in sin familia armada).
  IF EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id AND user_id = v_user_id)
  THEN RETURN true; END IF;

  /* 🔴 `D-485` · LA FAMILIA. Faltaba, y su ausencia no tenia sintoma en el uso
     normal porque el titular suele ser tambien `user_id`. */
  IF public._user_es_de_la_familia_de(v_user_id, p_mascota_id) THEN RETURN true; END IF;

  SELECT COALESCE((SELECT valor::integer FROM app_config
    WHERE clave = 'acceso_prestador_caducidad_meses'), 6) INTO v_caducidad_meses;

  IF EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
      AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true)
      AND (map.metodo_otorgamiento <> 'cita_automatica' OR EXISTS (
          SELECT 1 FROM evento_cita_servicio ecs
          JOIN prestadores p2 ON p2.id = ecs.prestador_id
          WHERE ecs.mascota_id = map.mascota_id
            AND p2.cuenta_comercial_id = map.cuenta_comercial_id
            AND ecs.fecha >= (now() - make_interval(months => v_caducidad_meses))::date))
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$function$;

/* El clinico, con la MISMA rama. Sin esto, la familia veria a su mascota y no
   su expediente — que es exactamente el paso 15 a medias. */
DO $clin$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='user_acceso_clinico_a_mascota';
  IF v_def IS NULL THEN RAISE EXCEPTION 'CLINICO: la funcion no existe'; END IF;
  IF position('_user_es_de_la_familia_de' in v_def) > 0 THEN
    RAISE NOTICE 'CLINICO: ya tenia la rama de familia'; RETURN;
  END IF;
  v_nueva := regexp_replace(v_def,
    '(WHERE id = p_mascota_id AND user_id = v_user_id\s*\)\s*THEN\s*RETURN true;\s*END IF;)',
    '\1' || chr(10) || chr(10) ||
    '  -- D-485 · LA FAMILIA. La misma rama que el helper general: sin esto la' || chr(10) ||
    '  -- familia ve a su mascota y NO su expediente — el paso 15 a medias.' || chr(10) ||
    '  IF public._user_es_de_la_familia_de(v_user_id, p_mascota_id) THEN RETURN true; END IF;');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'CLINICO: no encontre la rama del dueño — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $clin$;

/* ── LA SEGUNDA MITAD: EL TRASPASO REAPUNTA `user_id` ───────────────────── */
DO $tras$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='traspasar_mascota_a_familia';
  IF position('__d485__' in v_def) > 0 THEN RAISE NOTICE 'TRASPASO: ya curado'; RETURN; END IF;

  v_nueva := regexp_replace(v_def,
    '(UPDATE mascotas\s*\n\s*SET familia_id = p_familia_destino_id)',
    'UPDATE mascotas  -- __d485__' || chr(10) ||
    '     SET familia_id = p_familia_destino_id,' || chr(10) ||
    '         /* 🔴 D-485 · `user_id` seguia apuntando al REFUGIO, asi que el' || chr(10) ||
    '            refugio veia al animal como dueño PARA SIEMPRE. Se reapunta al' || chr(10) ||
    '            titular destino y no a NULL: `user_id` es la via legacy que' || chr(10) ||
    '            otras partes de la casa siguen leyendo. */' || chr(10) ||
    '         user_id = COALESCE((SELECT fm.user_id FROM familia_miembro fm' || chr(10) ||
    '                              WHERE fm.familia_id = p_familia_destino_id' || chr(10) ||
    '                                AND fm.rol = ''adulto_titular'' AND fm.hasta IS NULL' || chr(10) ||
    '                              LIMIT 1), mascotas.user_id)');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'TRASPASO: no encontre el UPDATE de familia — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $tras$;

/* ═══ CINTURON — EL ANTES Y EL DESPUES, SOBRE UNA FAMILIA SEMBRADA ════════ */
DO $cint$
DECLARE v_fam uuid; v_m uuid; v_otro uuid; v_titular uuid; v_n int;
BEGIN
  /* Se siembra: mutar una familia real para medir es lo que el cinturon de A3
     ya casi hace con Thor (`L-406`). */
  SELECT fm.user_id INTO v_titular FROM familia_miembro fm
   WHERE fm.rol='adulto_titular' AND fm.hasta IS NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id = v_titular LIMIT 1;
  SELECT u.id INTO v_otro FROM auth.users u WHERE u.id <> v_titular
    AND NOT EXISTS (SELECT 1 FROM familia_miembro f2 WHERE f2.user_id=u.id AND f2.familia_id=v_fam)
   LIMIT 1;
  IF v_titular IS NULL OR v_fam IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta titular, familia o tercero para medir';
  END IF;

  /* La mascota tiene familia y **`user_id` NULL**: es exactamente la forma que
     queda despues de un traspaso, y la unica en la que el defecto se ve. */
  INSERT INTO mascotas (nombre, especie, sexo, country_code, familia_id, origen,
                        fecha_nacimiento, fecha_nacimiento_precision, estado_vida, user_id)
  VALUES ('__cinturon_d485__', 'perro', 'macho', 'EC', v_fam, 'adoptado',
          current_date - 400, 'estimada', 'activa', NULL)
  RETURNING id INTO v_m;

  -- ① ✅ EL DESPUES: el titular de la familia SI la ve, con `user_id` NULL.
  IF NOT public.user_tiene_acceso_a_mascota_como(v_titular, v_m) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la familia NO ve a su mascota — D-485 sigue vivo';
  END IF;

  -- ①b ✅ y su expediente tambien.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_titular::text, 'role','authenticated')::text, true);
  IF NOT public.user_acceso_clinico_a_mascota(v_m) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: la familia ve la mascota y NO su expediente';
  END IF;

  -- ② 🔴 EL CONTROL QUE HACE QUE ① VALGA: un tercero **no** la ve.
  --    Sin este brazo, un helper que devolviera `true` siempre pasaria ①.
  IF public.user_tiene_acceso_a_mascota_como(v_otro, v_m) THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: un tercero ve una mascota ajena — la cura abrio de mas';
  END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro::text, 'role','authenticated')::text, true);
  IF public.user_acceso_clinico_a_mascota(v_m) THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: un tercero ve el expediente ajeno';
  END IF;

  -- ③ 🔴 Sin usuario, no.
  IF public.user_tiene_acceso_a_mascota_como(NULL, v_m) THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: sin usuario devolvio true';
  END IF;

  -- ④ El traspaso quedo reapuntando `user_id`.
  IF (SELECT position('__d485__' in pg_get_functiondef(p.oid))
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='traspasar_mascota_a_familia') = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: el traspaso sigue dejando user_id en el refugio';
  END IF;

  RAISE NOTICE 'CINTURON A8: 4 brazos verdes (3 rojos producidos, 2 controles positivos)';

  DELETE FROM mascotas WHERE id = v_m;
  SELECT count(*) INTO v_n FROM mascotas WHERE nombre = '__cinturon_d485__';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % mascota(s)', v_n; END IF;
END $cint$;

COMMIT;

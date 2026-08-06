-- S88-A · D-664 — EL LECTOR DE POSICIÓN: el servidor dice quién sos
--
-- Mata la derivación `esDueno = leí ≥1 fila de empleado_roles`, que medida da
-- **TRUE PARA LOS CUATRO ROLES** (titular 13 filas · admin 2 · recepción 1 ·
-- profesional 2). La causa: el wrapper pide los roles de TODOS los empleados
-- del negocio y esa lista incluye la fila del propio lector; el primer brazo
-- de la policy —*mis propias filas*— se la devuelve.
--
-- *Un rol que se deduce de «poder leer algo» es frágil por construcción.*
--
-- 76(g) — VEDA: **NO RIGE.** Función de lectura, aditiva pura.
--
-- ─────────────────────────────────────────────────────────────────────────
-- POR QUÉ DEVUELVE TRES VERDADES Y NO SOLO `es_titular`
--
-- La orden pedía el lector de TITULARIDAD, y `es_titular` es su titular. Pero
-- las cuatro superficies que hoy gatean por `esDueno` **no quieren todas la
-- misma pregunta**, y darles una sola las obliga a elegir entre equivocarse y
-- adivinar:
--
--   · `equipo.tsx` — **D-660 le dio al ADMINISTRADOR poder sobre el equipo**, y
--     el founder lo gateó VERDE hoy. Gatearla por `es_titular` estricto le
--     quitaría al admin la superficie que acaba de ganar.
--   · `seccion-horarios` · `mascotas` · `negocio` — cada una decide con la
--     suya, y ahora tienen las tres a mano sin un viaje más.
--
-- **Un lector que obliga a elegir mal es la clase de D-664 otra vez**: no
-- fallaría — acertaría al revés en la superficie equivocada.
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mi_posicion_en_prestador(p_prestador_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT jsonb_build_object(
    -- ① EL TITULAR — el dueño de la empresa. Es un HECHO de `prestadores`,
    --    no una inferencia: la fila dice `user_id` y se acabó.
    'es_titular', EXISTS (
      SELECT 1 FROM prestadores p
      WHERE p.id = p_prestador_id AND p.user_id = auth.uid()
    ),
    -- ② LA GESTIÓN — titular · administrador del negocio · admin de plataforma.
    --    Es la puerta de D-660: quien puede escribir el negocio.
    'gestiona', public.user_gestiona_prestador(p_prestador_id),
    -- ③ EL MOSTRADOR — gestión O recepción derivada por AUSENCIA DE CHIPS.
    --    Es quien ve la plata y reparte citas (§4ter, S88).
    'es_mostrador_o_gestion', public.empleado_es_mostrador_o_gestion(p_prestador_id)
  );
$$;

COMMENT ON FUNCTION public.obtener_mi_posicion_en_prestador(uuid) IS
  'S88/D-664: las TRES posiciones del llamante en un negocio, dichas por el '
  'servidor. Reemplaza la derivación `esDueno = leí ≥1 fila`, que daba true '
  'para todos los miembros desde que S76 concede la fila `recepcion` al '
  'entrar. Cada superficie gatea con la que le corresponde — darles una sola '
  'las obligaría a elegir mal.';

REVOKE EXECUTE ON FUNCTION public.obtener_mi_posicion_en_prestador(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mi_posicion_en_prestador(uuid) TO authenticated;

DO $belt$
DECLARE v_anon int;
BEGIN
  IF to_regprocedure('public.obtener_mi_posicion_en_prestador(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: la función no quedó creada';
  END IF;
  SELECT count(*) INTO v_anon FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mi_posicion_en_prestador'
     AND array_to_string(COALESCE(p.proacl,'{}'), ',') LIKE '%anon=%';
  IF v_anon <> 0 THEN RAISE EXCEPTION 'CINTURON (L-140): anon en proacl'; END IF;
  RAISE NOTICE 'CINTURON VERDE: lector de posición creado, 0 anon.';
END
$belt$;

COMMIT;

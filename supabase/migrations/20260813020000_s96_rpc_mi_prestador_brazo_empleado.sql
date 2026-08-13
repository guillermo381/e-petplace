-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · 🔴 CURA DEL HALLAZGO BLOQUEANTE DEL GATE (12-ago, founder en
-- dispositivo, reproducido en web con la cuenta real y el error LITERAL):
--
--   GET /rest/v1/prestadores?select=...direccion... →
--   403 {"code":"42501","message":"permission denied for table prestadores"}
--
-- LA CADENA, medida: ① `obtener_mi_prestador()` gatea por
-- `user_gestiona_prestador` — cuyo cuerpo es titular OR administrador OR
-- is_admin (medido S92) — así que el EMPLEADO RASO da 0 filas... mientras el
-- comentario de la propia RPC afirmaba «titular Y equipo activo entran»
-- (el comentario mentía contra el cuerpo del helper — la clase L-166) ·
-- ② el wrapper caía entonces al brazo (2): SELECT directo de `prestadores`
-- con columnas (`direccion`, `lat`, `email_contacto`…) que S91 dejó SIN
-- grant al cerrar la fuga — 42501 → `error_desconocido` → la raíz en error
-- con reintento (y en dispositivo, blanco) · ③ `invitacion.tsx` sin
-- invitación redirige a la raíz rota ⇒ el loop «probar de nuevo → blanco».
--
-- ES L-215 EN SU FORMA EXACTA: S91 revocó columnas y nada avisó que el brazo
-- del empleado de `obtenerMiPrestador` las leía — ningún empleado raso entró
-- desde entonces, y lo destapó el gate porque la cuenta del vendedor de
-- pruebas arrastra un vínculo del legado (prestador 2052f109).
--
-- LA CURA: la RPC gana el brazo del VÍNCULO ACTIVO — en LA RPC, jamás en
-- `user_gestiona_prestador` (S92: ensanchar el helper ampliaría el acceso en
-- sus 239 policies — un helper de seguridad que ensancha en silencio es peor
-- que el predicado crudo). Titularidad primero en el ORDER (quien es titular
-- Y empleado de otro ve LO SUYO). No es exposición nueva: es el arco de
-- equipo de S75 restaurado — el empleado activo veía exactamente estas
-- columnas por el brazo de tabla hasta que S91 lo rompió sin verlo.
--
-- 76(g): NO RIGE — una función. Reversa: scripts/s96/2026-08-12-s96-m22-
-- REVERSA.sql (ANTES; cuerpo viejo en functiondef-pre-m22.sql).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mi_prestador()
 RETURNS TABLE(id uuid, nombre_comercial text, tipo text, country_code text, cuenta_comercial_id uuid, direccion text, ciudad text, sector text, lat double precision, lon double precision, radio_cobertura_km integer, grooming_extra_pelaje_largo numeric, grooming_recargo_domicilio numeric, descripcion text, telefono text, whatsapp text, email_contacto text, sitio_web text, estado text, foto_url text, clip_url text, expone_personas boolean, cohorte text, cohorte_anio integer, zona_lat double precision, zona_lon double precision, zona_radio_m integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Gate: titular/admin por `user_gestiona_prestador` **más el brazo del
  -- EMPLEADO ACTIVO, escrito ACÁ y no en el helper** (S92: ensancharlo
  -- tocaría 239 policies). S96: este brazo repara el arco de equipo que S91
  -- rompió al revocar columnas — el fallback de tabla del wrapper murió con
  -- esos grants y ningún empleado raso pudo entrar desde entonces.
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.tipo, p.country_code,
         p.cuenta_comercial_id, p.direccion, p.ciudad, p.sector,
         p.lat, p.lon, p.radio_cobertura_km,
         p.grooming_extra_pelaje_largo, p.grooming_recargo_domicilio,
         p.descripcion, p.telefono, p.whatsapp, p.email_contacto,
         p.sitio_web, p.estado, p.foto_url, p.clip_url,
         p.expone_personas, p.cohorte, p.cohorte_anio,
         -- LEFT JOIN contra la vista, JAMÁS la fórmula copiada (S94-PERF):
         -- el ofuscado de S84 tiene UNA implementación y su filtro
         -- `estado='activo'` viaja con ella.
         v.zona_lat, v.zona_lon, v.zona_radio_m
    FROM prestadores p
    LEFT JOIN v_prestadores_publicos v ON v.id = p.id
   WHERE public.user_gestiona_prestador(p.id)
      OR EXISTS (SELECT 1 FROM prestador_empleados pe
                  WHERE pe.prestador_id = p.id
                    AND pe.user_id = v_uid
                    AND pe.activo)
   -- La titularidad manda: quien es titular de lo suyo Y empleado de otro
   -- ve SU negocio (el orden del wrapper viejo, ahora en la fuente).
   ORDER BY public.user_gestiona_prestador(p.id) DESC, p.created_at ASC
   LIMIT 1;
END;
$function$;

-- ── CINTURÓN — con los TRES actores reales, camino real ─────────────────────
DO $$
DECLARE
  v_empleado uuid := 'da83d6d8-f090-414c-98e0-7fae644f52df'; -- nuevo_test2: vínculo activo, 0 titularidad
  v_titular  uuid;
  v_ajeno    uuid;
  v_n        int;
  v_id       uuid;
BEGIN
  SELECT user_id INTO v_titular FROM prestadores WHERE estado = 'activo' AND user_id IS NOT NULL LIMIT 1;
  SELECT p.id INTO v_ajeno FROM profiles p
   WHERE NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.user_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM prestador_empleados pe WHERE pe.user_id = p.id AND pe.activo)
     AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo)
   LIMIT 1;

  -- (a) EL CASO DEL GATE: el empleado raso AHORA resuelve su negocio.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_empleado, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM obtener_mi_prestador();
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturón (a): el empleado sigue sin entrar (% filas) — el gate sigue bloqueado', v_n; END IF;
  SELECT omp.id INTO v_id FROM obtener_mi_prestador() omp;
  IF v_id <> '2052f109-143a-41d1-b338-de8973d8fb20' THEN
    RAISE EXCEPTION 'cinturón (a2): resolvió OTRO negocio (%)', v_id;
  END IF;

  -- (b) el titular sigue viendo LO SUYO (cero regresión del camino de siempre).
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM obtener_mi_prestador();
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturón (b): el titular perdió su fila (%)', v_n; END IF;
  SELECT omp.id INTO v_id FROM obtener_mi_prestador() omp;
  IF NOT EXISTS (SELECT 1 FROM prestadores WHERE id = v_id AND user_id = v_titular) THEN
    RAISE EXCEPTION 'cinturón (b2): al titular le resolvió un negocio ajeno';
  END IF;

  -- (c) el ajeno (ni titular ni vínculo ni admin) sigue en CERO.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ajeno, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_n FROM obtener_mi_prestador();
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (c): un ajeno recibió % filas — el brazo abrió de más', v_n; END IF;

  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE 'CINTURÓN M22 VERDE: el empleado entra, el titular conserva lo suyo, el ajeno en cero';
END $$;

COMMIT;

-- S85-A · EL EMBLEMA DE COHORTE — el dato que B y C tienen dibujado y no existe
--
-- REGLA FIRMADA (founder, 3-ago-2026), literal:
--   · alta ≤ 2027-03-30  → 'fundador'
--   · alta ≥ 2027-03-31  → 'pionero'
--   · año = el del ALTA
--   · estampado al alta, INMUTABLE en motor — ni el prestador ni el admin
--   · expuesto en el lector propio Y en `v_prestadores_publicos`
--   · los prestadores YA existentes quedan fundadores (están en la ventana)
--
-- ⚠️ EL 1 DE OCTUBRE ES EL LANZAMIENTO OFICIAL, **NO** EL INICIO DE LA VENTANA.
-- **Las altas previas TAMBIÉN son fundadoras.** *Se escribe con esta claridad
-- porque es justo lo que alguien va a "corregir" después creyendo que es un
-- error de fecha: ver `fundador` en un prestador de agosto de 2026 parece un
-- bug, y es la regla.* (`PORTAL_PRESTADOR` §4.4bis.)
--
-- ── POR QUÉ UN TRIGGER Y NO LAS RPCs DE ALTA ────────────────────────────────
-- Las puertas de alta son VARIAS (`crear_prestador_inicial`,
-- `invitar_prestador`, `activar_prestador`, y el `service_role` del admin).
-- **Una puerta que se olvide deja una fila SIN emblema** — y un emblema
-- faltante no da error: da un hueco que la vitrina pinta como "sin insignia".
-- *El trigger no puede olvidarse: no hay puerta que lo esquive.*
--
-- ── LA INMUTABILIDAD NO TIENE ESCAPE DE ADMIN, Y ESO ES LA FIRMA ────────────
-- `_prestadores_protege_columnas` (D-389) exime a `is_admin()` y a los DEFINER
-- (`current_user <> 'authenticated'`). **Esta cláusula va AFUERA de esa
-- exención**, porque la firma dice *"ni el prestador ni el admin"*.
--
-- > **Su valor entero es que no se puede fabricar.** *Un emblema que alguien
-- > con permisos puede escribirse deja de ser un emblema y pasa a ser un campo
-- > de texto.* **Consecuencia declarada y aceptada: corregir un emblema mal
-- > estampado exige una MIGRACIÓN** — un acto versionado y revisado, no un
-- > click. Para algo que dice *"desde cuándo estás"*, es el precio correcto.
--
-- ── PRIVILEGIO POR COLUMNA (regla de la casa, skill `epetplace-db`) ─────────
-- En `prestadores` **toda columna nueva nace SIN grant** y PostgREST la rebota
-- (§3bis de `LETRA_PERFIL_S79`). Estas DOS se conceden explícitamente: **son
-- públicas por firma** — el emblema se ve en la página pública del prestador.
--
-- ── ORDEN INTERNO, y no es cosmético ───────────────────────────────────────
-- El BACKFILL corre **ANTES** de activar la cláusula de inmutabilidad. Al revés
-- **la migración se bloquearía a sí misma**.
--
-- 76(g) — DECLARADA: NO RIGE. `ADD COLUMN` nullable sin DEFAULT (instantáneo),
-- backfill de 7 filas keyed por id, cero anclas sobre datos móviles.
-- REVERSA escrita ANTES: docs/relevamientos/2026-08-04-s85a-REVERSA-cohorte.sql

BEGIN;

-- ① LAS COLUMNAS
ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS cohorte      text,
  ADD COLUMN IF NOT EXISTS cohorte_anio integer;

ALTER TABLE public.prestadores
  DROP CONSTRAINT IF EXISTS chk_prestadores_cohorte;
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_cohorte
  CHECK (cohorte IS NULL OR cohorte IN ('fundador', 'pionero'));

-- ② EL SEMBRADOR — la fecha decide, y la fecha es del SERVIDOR
CREATE OR REPLACE FUNCTION public._prestadores_sella_cohorte()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
BEGIN
  /* Se estampa SIEMPRE desde el servidor, ignorando lo que venga en el INSERT:
     un emblema que el caller puede proponer es un emblema que el caller puede
     elegir. La ventana fundacional cierra el 30-mar-2027 INCLUSIVE. */
  NEW.cohorte      := CASE WHEN v_hoy <= DATE '2027-03-30' THEN 'fundador' ELSE 'pionero' END;
  NEW.cohorte_anio := EXTRACT(YEAR FROM v_hoy)::integer;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prestadores_sella_cohorte ON public.prestadores;
CREATE TRIGGER trg_prestadores_sella_cohorte
  BEFORE INSERT ON public.prestadores
  FOR EACH ROW EXECUTE FUNCTION public._prestadores_sella_cohorte();

-- ③ BACKFILL — ANTES del guard. El año sale de SU created_at, no de hoy.
UPDATE public.prestadores
   SET cohorte = CASE WHEN created_at::date <= DATE '2027-03-30' THEN 'fundador' ELSE 'pionero' END,
       cohorte_anio = EXTRACT(YEAR FROM created_at)::integer
 WHERE cohorte IS NULL;

-- ④ LA INMUTABILIDAD — sin escape de admin (la firma)
CREATE OR REPLACE FUNCTION public._prestadores_protege_columnas()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  /* ⚠️ ESTA CLÁUSULA VA PRIMERO Y **SIN** EXENCIÓN — ni `is_admin()`, ni los
     DEFINER. Es la firma del emblema: "ni el prestador ni el admin lo editan".
     Corregirlo exige una migración, que es un acto versionado. */
  IF TG_OP = 'UPDATE'
     AND (NEW.cohorte IS DISTINCT FROM OLD.cohorte
          OR NEW.cohorte_anio IS DISTINCT FROM OLD.cohorte_anio) THEN
    RAISE EXCEPTION 'cohorte_inmutable' USING ERRCODE = '42501';
  END IF;

  IF current_user = 'authenticated' AND NOT is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.cuenta_comercial_id IS DISTINCT FROM OLD.cuenta_comercial_id
       OR NEW.country_code IS DISTINCT FROM OLD.country_code
       OR NEW.estado IS DISTINCT FROM OLD.estado
       OR NEW.aprobado_por IS DISTINCT FROM OLD.aprobado_por
       OR NEW.aprobado_en IS DISTINCT FROM OLD.aprobado_en
       OR NEW.motivo_rechazo IS DISTINCT FROM OLD.motivo_rechazo
       OR NEW.calificacion_promedio IS DISTINCT FROM OLD.calificacion_promedio
       OR NEW.total_citas IS DISTINCT FROM OLD.total_citas
       OR NEW.total_resenas IS DISTINCT FROM OLD.total_resenas
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'columna_protegida' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ⑤ EL GRANT POR COLUMNA — públicas por firma
GRANT SELECT (cohorte, cohorte_anio) ON public.prestadores TO authenticated;

-- ⑥ LA VISTA PÚBLICA — el emblema se ve en la página pública del prestador
DROP VIEW IF EXISTS public.v_prestadores_publicos;
CREATE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
SELECT p.id, p.user_id, p.tipo, p.nombre_comercial, p.descripcion, p.foto_url,
       p.ciudad, p.sector,
       CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
            ELSE p.lat + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * cos(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / 111320::double precision
       END AS zona_lat,
       CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::double precision
            ELSE p.lon + (500::numeric * (0.30 + (abs(hashtext(p.id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * sin(((abs(hashtext(p.id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / (111320::double precision * GREATEST(cos(radians(p.lat)), 0.01::double precision))
       END AS zona_lon,
       CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL::integer ELSE 500 END AS zona_radio_m,
       p.calificacion_promedio, p.total_resenas, p.total_citas,
       p.acepta_emergencias, p.acepta_telemedicina, p.radio_cobertura_km, p.country_code,
       p.cohorte, p.cohorte_anio,   -- ← S85: el emblema, público por firma
       COALESCE(jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos)) FILTER (WHERE ps.id IS NOT NULL AND ps.activo = true), '[]'::jsonb) AS servicios
  FROM prestadores p
  LEFT JOIN prestador_servicios ps ON ps.prestador_id = p.id
 WHERE p.estado = 'activo'::text
 GROUP BY p.id;

/* D-621 al pie: al recrear una vista, S84 midió que NACIÓ CON SEIS PRIVILEGIOS
   DE ESCRITURA que ninguna migración concedió. Acá se concede SOLO lectura, y
   la verificación de abajo lo comprueba en vez de suponerlo. */
REVOKE ALL ON public.v_prestadores_publicos FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_prestadores_publicos TO authenticated;

-- ── VERIFICACIÓN IMPERATIVA con su PAR (L-063 · L-192) ──
DO $$
DECLARE
  v_sin integer; v_acl text; v_reboto boolean := false; v_pid uuid; v_uid uuid;
  v_c text; v_a integer; v_esc integer;
BEGIN
  -- ① backfill completo
  SELECT count(*) INTO v_sin FROM prestadores WHERE cohorte IS NULL;
  IF v_sin > 0 THEN RAISE EXCEPTION 'BACKFILL INCOMPLETO: % sin cohorte.', v_sin; END IF;

  -- ② los 7 quedan fundadores (están en la ventana)
  SELECT count(*) INTO v_sin FROM prestadores WHERE cohorte <> 'fundador';
  IF v_sin > 0 THEN RAISE EXCEPTION 'esperaba 7 fundadores; % quedaron fuera.', v_sin; END IF;

  -- ③ el trigger SELLA en un INSERT real (in-txn, se deshace)
  /* Los NOT NULL sin default de `prestadores`, MEDIDOS antes de sondear
     (el primer intento rebotó por `whatsapp`): user_id · tipo ·
     nombre_comercial · whatsapp · cuenta_comercial_id. El whatsapp va en
     E.164 ENTERO con su `+` — la regla 28 derogada el 2-ago; sin el `+` el
     CHECK `chk_prestadores_whatsapp_e164` lo rebota. */
  INSERT INTO prestadores (user_id, nombre_comercial, tipo, estado, country_code, whatsapp, cuenta_comercial_id)
  VALUES ((SELECT id FROM auth.users LIMIT 1), 'SONDA COHORTE S85', 'paseador', 'en_revision', 'EC',
          '+593999999999', (SELECT id FROM cuentas_comerciales LIMIT 1))
  RETURNING id, cohorte, cohorte_anio INTO v_pid, v_c, v_a;
  IF v_c <> 'fundador' OR v_a <> EXTRACT(YEAR FROM now())::integer THEN
    RAISE EXCEPTION 'el trigger no selló bien: % / %', v_c, v_a;
  END IF;

  -- ④ CONTRA-CASO: el UPDATE rebota AUNQUE seamos superuser (sin escape)
  BEGIN
    UPDATE prestadores SET cohorte = 'pionero' WHERE id = v_pid;
  EXCEPTION WHEN insufficient_privilege THEN v_reboto := true;
  END;
  IF NOT v_reboto THEN
    RAISE EXCEPTION 'INMUTABILIDAD DECORATIVA: se pudo cambiar la cohorte.';
  END IF;

  DELETE FROM prestadores WHERE id = v_pid;

  -- ⑤ el grant por columna existe
  IF NOT has_column_privilege('authenticated','public.prestadores','cohorte','SELECT') THEN
    RAISE EXCEPTION 'sin GRANT por columna: authenticated no lee cohorte.';
  END IF;

  -- ⑥ D-621: la vista NO nació con privilegios de escritura
  SELECT count(*) INTO v_esc FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND privilege_type <> 'SELECT' AND grantee IN ('authenticated','anon','PUBLIC');
  IF v_esc > 0 THEN
    RAISE EXCEPTION 'D-621: la vista nació con % privilegio(s) de ESCRITURA.', v_esc;
  END IF;

  RAISE NOTICE 'S85 OK — 7 fundadores · el trigger sella · el UPDATE rebota sin escape · grant por columna · vista solo-lectura · residuo 0.';
END $$;

COMMIT;

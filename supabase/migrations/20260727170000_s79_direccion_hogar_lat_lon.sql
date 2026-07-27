-- ═════════════════════════════════════════════════════════════════════
-- S79-A · A4 (motor) — guardar_direccion_hogar gana p_lat/p_lon.
--
-- La captura del hogar con Places (A4, apps/cliente sobre el contrato
-- A2) necesita PERSISTIR las coordenadas que resuelve. Las columnas
-- lat/lon existen desde S56 (D-339) y NADIE las escribía (medido
-- Tanda 1: 0 de 2 filas) — esta migración les da su primer escritor.
-- CERO columnas nuevas: el gate de la letra (LETRA_PERFIL_S79) queda
-- intacto; lo que acá se aplica es la mecánica de captura del lado
-- HOGAR, cuyo corolario de honestidad viene de la letra §2.2:
--
--   LA COORDENADA MUERE CON EL TEXTO QUE LA PARIÓ — un guardado sin
--   Places escribe lat/lon NULL (pisa lo viejo): una coordenada vieja
--   pegada a un texto nuevo describe OTRA puerta (L-139 al revés).
--
-- Cambio de FIRMA ⇒ DROP explícito de la vieja (L-119) + ACL
-- re-establecida (L-140). Los 2 callers del monorepo (wrapper
-- direcciones.ts) pasan por nombre — los parámetros nuevos tienen
-- DEFAULT NULL y el caller viejo sigue legal.
--
-- 76(g), DECLARADA: NO RIGE — DDL de función, cero backfill, cero
-- anclas sobre datos vivos, cero filas tocadas.
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-07-27-s79a-REVERSA-direccion-hogar.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

DROP FUNCTION public.guardar_direccion_hogar(text, text, text, text, text);

CREATE FUNCTION public.guardar_direccion_hogar(
  p_direccion text,
  p_ciudad text,
  p_sector text DEFAULT NULL,
  p_referencias text DEFAULT NULL,
  p_telefono text DEFAULT NULL,
  p_lat double precision DEFAULT NULL,
  p_lon double precision DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  -- Espejo tipado del CHECK direcciones_guardadas_telefono_sin_plus
  -- (regla 28: E.164 sin '+'; el error tipado gana al constraint crudo).
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;
  -- Las coordenadas van en PAR y en rango, o no van (L-139: media
  -- coordenada es relleno plausible).
  IF (p_lat IS NULL) <> (p_lon IS NULL) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;
  IF p_lat IS NOT NULL AND (abs(p_lat) > 90 OR abs(p_lon) > 180) THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;

  INSERT INTO direcciones_guardadas AS d
    (user_id, alias, direccion, ciudad, sector, referencias, telefono, lat, lon, es_principal)
  VALUES
    (v_auth, 'Hogar', btrim(p_direccion), btrim(p_ciudad),
     NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
     NULLIF(btrim(p_telefono), ''), p_lat, p_lon, true)
  ON CONFLICT (user_id) WHERE es_principal
  DO UPDATE SET
    direccion   = EXCLUDED.direccion,
    ciudad      = EXCLUDED.ciudad,
    sector      = EXCLUDED.sector,
    referencias = EXCLUDED.referencias,
    telefono    = EXCLUDED.telefono,
    -- §2.2: NULL PISA — la coordenada muere con el texto que la parió.
    lat         = EXCLUDED.lat,
    lon         = EXCLUDED.lon
  RETURNING d.id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'direccion_id', v_id,
    'snapshot', _direccion_hogar_snapshot(v_auth)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_hogar(text, text, text, text, text, double precision, double precision) TO authenticated;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE
  v_sobrecargas int;
  v_anon int;
BEGIN
  SELECT count(*) INTO v_sobrecargas
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'guardar_direccion_hogar';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'verificacion A4 (L-119): % sobrecargas de guardar_direccion_hogar', v_sobrecargas;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname = 'public' AND p.proname = 'guardar_direccion_hogar'
    AND r.rolname = 'anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion A4 (L-140): anon con % grants', v_anon;
  END IF;
END $$;

commit;

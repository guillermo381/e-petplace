-- S82-A · EL ENCUADRE DE LA FOTO DE MASCOTA
-- Lámina-acuerdo: docs/laminas/2026-07-29-s82-foto-onboarding.html
-- (criterio, no evidencia — §10: la calibración visual vive en RN).
--
-- Aditiva pura: tres columnas con DEFAULT (cero backfill — el default ES
-- el encuadre canónico de la lámina: centro 0.5/0.42, zoom 1.3) + la
-- puerta declarar_foto_mascota (molde P19 / declarar_talla_pelaje,
-- verificado con pg_get_functiondef antes de clonar — regla 40).
--
-- Semántica de cx/cy/z (la de la lámina, normalizada a la foto):
--   cx, cy ∈ [0,1] — centro del recorte como fracción del ancho/alto.
--   z ∈ [1,3]      — zoom sobre el lado base min(iw,ih); lado = base/z.
--   El AIRE por superficie (perfil 1.75, resto 1) NO vive en la base:
--   es constante de CÓDIGO (mandato S82 — apps/cliente foto-encuadre.ts).
--
-- 76(g): NO RIGE — DDL aditivo sin backfill, sin anclas de escritura.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-29-s82a-REVERSA-foto-encuadre.sql

ALTER TABLE public.mascotas
  ADD COLUMN foto_cx numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN foto_cy numeric NOT NULL DEFAULT 0.42,
  ADD COLUMN foto_z  numeric NOT NULL DEFAULT 1.3;

ALTER TABLE public.mascotas
  ADD CONSTRAINT mascotas_foto_cx_rango CHECK (foto_cx >= 0 AND foto_cx <= 1),
  ADD CONSTRAINT mascotas_foto_cy_rango CHECK (foto_cy >= 0 AND foto_cy <= 1),
  ADD CONSTRAINT mascotas_foto_z_rango  CHECK (foto_z >= 1 AND foto_z <= 3);

-- ── La puerta: declarar (o editar) el encuadre — y opcionalmente la foto ──
-- Sirve las dos superficies del mandato: el cierre del alta (encuadre de
-- la foto que la RPC de alta ya subió) y EDITAR desde el perfil (foto
-- nueva + encuadre en el mismo acto). p_foto_url NULL = la foto no cambia.
CREATE OR REPLACE FUNCTION public.declarar_foto_mascota(
  p_mascota_id uuid,
  p_cx numeric,
  p_cy numeric,
  p_z numeric,
  p_foto_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- espejo de los CHECKs de rango con error TIPADO
  IF p_cx IS NULL OR p_cx < 0 OR p_cx > 1
     OR p_cy IS NULL OR p_cy < 0 OR p_cy > 1
     OR p_z IS NULL OR p_z < 1 OR p_z > 3 THEN
    RAISE EXCEPTION 'encuadre_invalido' USING ERRCODE = '22023';
  END IF;
  -- espejo del CHECK mascotas_foto_url_es_path (S47): la foto viaja como
  -- PATH del bucket, jamás URL — acá con error tipado.
  IF p_foto_url IS NOT NULL AND p_foto_url ~* '^https?://' THEN
    RAISE EXCEPTION 'foto_url_no_es_path' USING ERRCODE = '22023';
  END IF;

  UPDATE mascotas
  SET foto_cx = p_cx,
      foto_cy = p_cy,
      foto_z  = p_z,
      foto_url = COALESCE(p_foto_url, foto_url),
      updated_at = now()
  WHERE id = p_mascota_id;

  RETURN jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'cx', p_cx,
    'cy', p_cy,
    'z', p_z
  );
END;
$function$;

-- L-140: la función nace con EXECUTE para anon por default privileges —
-- se revoca EXPLÍCITO y se verifica abajo por proacl.
REVOKE EXECUTE ON FUNCTION public.declarar_foto_mascota(uuid, numeric, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_foto_mascota(uuid, numeric, numeric, numeric, text) TO authenticated;

-- ── Verificación imperativa (los rojos PRODUCIDOS — L-192: un guard cuyo
--    modo de falla es el silencio no es una verificación) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_id uuid;
  n int;
BEGIN
  -- 1 · las tres columnas existen
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'mascotas'
     AND column_name IN ('foto_cx', 'foto_cy', 'foto_z');
  IF n <> 3 THEN RAISE EXCEPTION 'faltan columnas de encuadre (hay %)', n; END IF;

  SELECT id INTO v_id FROM mascotas LIMIT 1;
  IF v_id IS NULL THEN RAISE EXCEPTION 'sin mascota para producir el rojo del CHECK'; END IF;

  -- 2 · EL ROJO DEL CHECK: z=5 REBOTA (el guard no es decorativo)
  v_ok := false;
  BEGIN
    UPDATE mascotas SET foto_z = 5 WHERE id = v_id;
    RAISE EXCEPTION 'EL CHECK NO REBOTO z=5 — guard decorativo';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de z sin rojo'; END IF;

  -- 3 · el rojo de cx fuera de rango
  v_ok := false;
  BEGIN
    UPDATE mascotas SET foto_cx = 1.5 WHERE id = v_id;
    RAISE EXCEPTION 'EL CHECK NO REBOTO cx=1.5 — guard decorativo';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de cx sin rojo'; END IF;

  -- 4 · la puerta sin sesión rebota auth_required (42501)
  v_ok := false;
  BEGIN
    PERFORM public.declarar_foto_mascota(v_id, 0.5, 0.42, 1.3, NULL);
    RAISE EXCEPTION 'la puerta dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 5 · L-140: proacl de la función SIN anon
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'declarar_foto_mascota'
      AND proacl::text LIKE '%anon=%'
  ) THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en declarar_foto_mascota';
  END IF;

  RAISE NOTICE 'S82 encuadre: columnas 3/3 · rojos z/cx/auth PRODUCIDOS · proacl sin anon';
END;
$verif$;

-- S82-A r4 · HISTORIA DE PESO: la puerta del dueño (mandato 3, ACHICADO
-- por la medición — bloque de auditoría): la SERIE ya existe entera
-- (evento_peso_medicion + trg_peso_crear_evento que fabrica el padre +
-- trg_peso_propagar_perfil que actualiza el snapshot). Lo que falta es
-- el PRODUCTOR de la familia (la RLS de INSERT gatea por
-- mascotas.user_id LEGACY — clase D-485 — y no hay puerta) y el lector
-- en el contrato (packages/api, misma tanda).
--
-- El techo de rango vive en LA PUERTA (0 < peso ≤ 150 kg — las especies
-- F1 no pasan de un gran danés) con error TIPADO; la tabla conserva su
-- CHECK de piso pre-existente (> 0). Vocabulario de método = espejo del
-- CHECK vivo chk_peso_medicion_metodo (leído del literal).
--
-- 76(g): NO RIGE — solo función nueva, cero DDL de tabla, cero backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-REVERSA-peso-productor.sql

CREATE OR REPLACE FUNCTION public.registrar_peso_mascota(
  p_mascota_id uuid,
  p_peso_kg numeric,
  p_metodo text DEFAULT 'bascula_casa',
  p_fecha timestamptz DEFAULT now(),
  p_notas text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id uuid;
  v_country text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_peso_kg IS NULL OR p_peso_kg <= 0 OR p_peso_kg > 150 THEN
    RAISE EXCEPTION 'peso_invalido' USING ERRCODE = '22023';
  END IF;
  -- espejo TIPADO del CHECK vivo de la tabla (chk_peso_medicion_metodo)
  IF p_metodo IS NULL OR p_metodo NOT IN ('bascula_clinica', 'bascula_casa', 'estimacion') THEN
    RAISE EXCEPTION 'metodo_invalido' USING ERRCODE = '22023';
  END IF;
  -- una medición es un hecho PASADO
  IF p_fecha IS NULL OR p_fecha > now() THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE = '22023';
  END IF;

  -- eventos_mascota.country_code es NOT NULL: el país del evento es el
  -- de la MASCOTA, derivado (mismo hallazgo que desparasitación).
  SELECT country_code INTO v_country FROM mascotas WHERE id = p_mascota_id;

  -- sin prestador_id: el trigger del padre estampa declarado_por_familia
  -- (S69) y trg_peso_propagar_perfil actualiza el snapshot solo.
  INSERT INTO evento_peso_medicion (mascota_id, country_code, peso_kg, metodo_medicion, fecha_medicion, notas)
  VALUES (p_mascota_id, v_country, p_peso_kg, p_metodo, p_fecha, p_notas)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'mascota_id', p_mascota_id, 'peso_kg', p_peso_kg);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_peso_mascota(uuid, numeric, text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_peso_mascota(uuid, numeric, text, timestamptz, text) TO authenticated;

-- ── Verificación imperativa: LOS ROJOS PRODUCIDOS (L-192) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_id uuid;
  v_country text;
BEGIN
  SELECT id, country_code INTO v_id, v_country FROM mascotas LIMIT 1;

  -- 1 · el CHECK de piso de la TABLA sigue vivo (peso 0 rebota)
  v_ok := false;
  BEGIN
    INSERT INTO evento_peso_medicion (mascota_id, country_code, peso_kg, metodo_medicion, fecha_medicion)
    VALUES (v_id, v_country, 0, 'bascula_casa', now());
    RAISE EXCEPTION 'EL CHECK DE TABLA NO REBOTO peso 0';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de piso sin rojo'; END IF;

  -- 2 · la puerta sin sesión rebota 42501 (el resto de rojos tipados —
  --     peso>150, metodo, fecha futura — exige JWT: van en el E2E
  --     post-migración con el adulto real)
  v_ok := false;
  BEGIN
    PERFORM registrar_peso_mascota(v_id, 12.5);
    RAISE EXCEPTION 'la puerta dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 3 · L-140
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='registrar_peso_mascota' AND proacl::text LIKE '%anon=%') THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en registrar_peso_mascota';
  END IF;

  RAISE NOTICE 'peso: rojos piso-de-tabla/auth PRODUCIDOS · proacl sin anon';
END;
$verif$;

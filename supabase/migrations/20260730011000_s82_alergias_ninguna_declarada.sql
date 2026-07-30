-- S82-A r4 · ALERGIAS: "sin registro" ≠ "ninguna conocida" (mandato: la
-- distinción ES la decisión de diseño de datos).
--
-- LO MEDIDO ANTES (bloque de auditoría — la fuente achicó la orden): el
-- motor de alergias YA EXISTE (evento_alergia_diagnosticada con
-- productores clínicos vivos + snapshot mascota_perfil_vigente.alergias).
-- Lo ÚNICO que falta es poder declarar el hecho clínico "ninguna
-- conocida": hoy NULL/vacío significa las dos cosas y la pantalla miente.
--
-- EL MODELO: dos columnas en el snapshot (fecha + quién declaró) + la
-- puerta de la familia. PRECEDENCIA DE LECTURA (declarada, la consumen
-- los wrappers): alergias jsonb NO VACÍO **GANA** a la declaración — un
-- diagnóstico real posterior no necesita "desdeclarar" (el sedimento
-- clínico manda); la declaración queda como historia de qué se sabía.
--   · alergias no vacío                → CON alergias
--   · vacío/null + declarada_en NO nulo → NINGUNA CONOCIDA (con fecha)
--   · vacío/null + declarada_en nulo    → SIN REGISTRO
--
-- 76(g): NO RIGE — aditiva, sin backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-REVERSA-alergias-ninguna.sql

ALTER TABLE public.mascota_perfil_vigente
  ADD COLUMN alergias_ninguna_declarada_en timestamptz,
  ADD COLUMN alergias_ninguna_declarada_por uuid;

-- fecha y autor viajan JUNTOS o ninguno (guard de coherencia)
ALTER TABLE public.mascota_perfil_vigente
  ADD CONSTRAINT chk_alergias_ninguna_coherente
  CHECK ((alergias_ninguna_declarada_en IS NULL) = (alergias_ninguna_declarada_por IS NULL));

-- ── LA PUERTA (molde P19): la familia declara "ninguna conocida" ──
-- Idempotente: re-declarar refresca fecha y autor (lo dicho hoy pesa
-- más que lo dicho hace un año). UPSERT: el snapshot puede no tener
-- fila todavía (nace perezoso).
CREATE OR REPLACE FUNCTION public.declarar_sin_alergias_conocidas(
  p_mascota_id uuid
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

  INSERT INTO mascota_perfil_vigente (mascota_id, alergias_ninguna_declarada_en, alergias_ninguna_declarada_por)
  VALUES (p_mascota_id, now(), v_auth)
  ON CONFLICT (mascota_id) DO UPDATE
    SET alergias_ninguna_declarada_en = now(),
        alergias_ninguna_declarada_por = v_auth,
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'mascota_id', p_mascota_id, 'declarada_en', now());
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.declarar_sin_alergias_conocidas(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_sin_alergias_conocidas(uuid) TO authenticated;

-- ── Verificación imperativa: LOS ROJOS PRODUCIDOS (L-192) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_id uuid;
BEGIN
  -- 1 · columnas nacieron
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='mascota_perfil_vigente'
         AND column_name LIKE 'alergias_ninguna%') <> 2 THEN
    RAISE EXCEPTION 'faltan columnas de la declaracion';
  END IF;

  -- 2 · EL ROJO de coherencia: fecha sin autor rebota
  SELECT mascota_id INTO v_id FROM mascota_perfil_vigente LIMIT 1;
  IF v_id IS NOT NULL THEN
    v_ok := false;
    BEGIN
      UPDATE mascota_perfil_vigente SET alergias_ninguna_declarada_en = now() WHERE mascota_id = v_id;
      RAISE EXCEPTION 'EL CHECK NO REBOTO fecha sin autor';
    EXCEPTION WHEN check_violation THEN v_ok := true;
    END;
    IF NOT v_ok THEN RAISE EXCEPTION 'guard de coherencia sin rojo'; END IF;
  ELSE
    RAISE NOTICE 'sin fila de perfil vigente para el rojo de coherencia — cubierto por el E2E post-migracion';
  END IF;

  -- 3 · la puerta sin sesión rebota 42501
  v_ok := false;
  BEGIN
    PERFORM declarar_sin_alergias_conocidas((SELECT id FROM mascotas LIMIT 1));
    RAISE EXCEPTION 'la puerta dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 4 · L-140
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='declarar_sin_alergias_conocidas' AND proacl::text LIKE '%anon=%') THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en declarar_sin_alergias_conocidas';
  END IF;

  RAISE NOTICE 'alergias-ninguna: rojos coherencia/auth PRODUCIDOS · proacl sin anon';
END;
$verif$;

-- ============================================================================
-- S106-A tanda 2 · EL ORIGEN DEL ADJUNTO, EN SU PROPIO EJE
--
-- Firma del founder, 26-ago-2026, sobre una medición de D:
-- `evento_archivo_adjunto` tiene `categoria` (QUÉ ES) y `descripcion` (texto
-- libre), y **nada dice CÓMO SE CAPTURÓ**.
--
-- 🔴 EL ORIGEN VA EN SU PROPIO EJE, JAMÁS DENTRO DE `categoria`.
--    *Meter «videoconsulta» en la categoría funde dos cosas distintas: una foto
--    clínica sigue siendo una foto clínica venga de donde venga. Un código
--    combinado haría que quien filtre «todas las fotos clínicas» **se pierda
--    justo las de teleconsulta** — y una marca que esconde datos al buscarlos
--    es peor que no tener marca.*
--
-- ── LA DECISIÓN DE NOMBRE, con su doble check ──────────────────────────────
--    Se llama **`origen_captura`** y NO `procedencia`, aunque el encargo citaba
--    «el mismo patrón que la procedencia de eventos clínicos».
--
--    Se sigue el PATRÓN —columna propia, `CHECK` de vocabulario cerrado,
--    nullable, sin default— pero **no el nombre**, porque
--    `eventos_mascota.procedencia` contesta **QUIÉN LO DECLARÓ**
--    (`declarado_por_familia` · `declarado_por_prestador` ·
--    `verificado_por_prestador`) y esto contesta **CÓMO SE CAPTURÓ**.
--    *Dos columnas con el mismo nombre y distinta pregunta es la forma más
--    barata de que alguien las cruce dentro de seis meses — y sería el mismo
--    error que la firma vino a evitar, una capa más arriba.*
--
-- ── POR QUÉ NULLABLE, y por qué NO se hace backfill ────────────────────────
--    Las filas existentes **no saben** cómo se capturaron. `NULL` dice
--    exactamente eso. *Rellenarlas con `carga_profesional` «porque es lo más
--    probable» convertiría una ausencia honesta en un dato inventado, y nadie
--    volvería a poder distinguir cuáles se midieron de cuáles se supusieron.*
--
-- ── TIMING: por eso entra HOY ──────────────────────────────────────────────
--    Hoy es una columna sobre una tabla chica. Con miles de eventos vivos es
--    una migración con backfill. **Y entra ANTES de que el cuadro congelado
--    funcione, no después** — si llegara después, su primera cosecha de
--    imágenes nacería sin marca.
--
-- ── VEDA 76(g): NO RIGE. Columna aditiva nullable. CERO backfill. ──────────
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-origen-captura.sql
-- ============================================================================

ALTER TABLE public.evento_archivo_adjunto
  ADD COLUMN IF NOT EXISTS origen_captura text;

ALTER TABLE public.evento_archivo_adjunto
  DROP CONSTRAINT IF EXISTS evento_archivo_adjunto_origen_captura_check;

ALTER TABLE public.evento_archivo_adjunto
  ADD CONSTRAINT evento_archivo_adjunto_origen_captura_check
  CHECK (origen_captura IS NULL OR origen_captura = ANY (ARRAY[
    'videoconsulta',       -- cuadro congelado durante una teleconsulta
    'carga_dueno',         -- la familia subió el archivo
    'carga_profesional'    -- el profesional lo subió desde su app
  ]));

COMMENT ON COLUMN public.evento_archivo_adjunto.origen_captura IS
  'S106 · COMO se capturo el adjunto. Eje PROPIO: no se mezcla con categoria (QUE es) '
  'ni con eventos_mascota.procedencia (QUIEN lo declaro). NULL = no se declaro, y eso se dice.';

-- ── El productor del cuadro congelado lo estampa. ───────────────────────────
--    *Una columna sin productor es letra muerta: nace vacía y sigue vacía.*
CREATE OR REPLACE FUNCTION public.adjuntar_cuadro_teleconsulta(
  p_cita_id       uuid,
  p_bucket        text,
  p_storage_path  text,
  p_mime_type     text   DEFAULT NULL,
  p_tamano_bytes  bigint DEFAULT NULL,
  p_descripcion   text   DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  k_categoria constant text := 'foto_consulta';
  k_origen    constant text := 'videoconsulta';
  v_uid       uuid := auth.uid();
  v_cita      record;
  v_empleado  uuid;
  v_activo    boolean;
  v_adjunto   uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'sin_sesion' USING ERRCODE = '42501'; END IF;
  IF p_bucket IS NULL OR btrim(p_bucket) = '' THEN RAISE EXCEPTION 'bucket_requerido' USING ERRCODE = '22023'; END IF;
  IF p_storage_path IS NULL OR btrim(p_storage_path) = '' THEN RAISE EXCEPTION 'storage_path_requerido' USING ERRCODE = '22023'; END IF;

  SELECT c.id, c.mascota_id, c.prestador_id, c.country_code, c.evento_id, c.modalidad
    INTO v_cita
  FROM public.evento_cita_servicio c WHERE c.id = p_cita_id;

  IF v_cita.id IS NULL THEN RAISE EXCEPTION 'cita_inexistente' USING ERRCODE = '22023'; END IF;
  IF v_cita.modalidad IS DISTINCT FROM 'telemedicina' THEN
    RAISE EXCEPTION 'no_es_teleconsulta' USING ERRCODE = '22023';
  END IF;
  IF v_cita.evento_id IS NULL THEN RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023'; END IF;
  IF NOT COALESCE(public.empleado_tiene_capacidad_clinica(v_cita.prestador_id), false) THEN
    RAISE EXCEPTION 'sin_capacidad_clinica' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id INTO v_empleado FROM public.prestador_empleados pe
  WHERE pe.prestador_id = v_cita.prestador_id AND pe.user_id = v_uid AND pe.activo LIMIT 1;

  SELECT activo INTO v_activo FROM public.cat_categorias_archivo WHERE codigo = k_categoria;
  IF v_activo IS NULL THEN RAISE EXCEPTION 'categoria_archivo_invalida: %', k_categoria USING ERRCODE = '22023'; END IF;
  IF NOT v_activo THEN RAISE EXCEPTION 'categoria_archivo_inactiva: %', k_categoria USING ERRCODE = '22023'; END IF;

  INSERT INTO public.evento_archivo_adjunto (
    evento_padre_id, mascota_id, prestador_id, empleado_id, country_code,
    bucket, storage_path, nombre_archivo, mime_type, tamano_bytes,
    categoria, descripcion, subido_por_user_id, origen_captura
  ) VALUES (
    v_cita.evento_id, v_cita.mascota_id, v_cita.prestador_id, v_empleado, v_cita.country_code,
    p_bucket, p_storage_path,
    COALESCE(NULLIF(regexp_replace(p_storage_path, '^.*/', ''), ''), 'cuadro-teleconsulta'),
    p_mime_type, p_tamano_bytes,
    k_categoria, p_descripcion, v_uid, k_origen
  )
  RETURNING id INTO v_adjunto;

  RETURN jsonb_build_object(
    'ok', true, 'adjunto_id', v_adjunto,
    'evento_padre_id', v_cita.evento_id,
    'categoria', k_categoria, 'origen_captura', k_origen
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text) TO authenticated;

DO $cinturon$
DECLARE v_n integer;
BEGIN
  -- El vocabulario se prueba RECHAZANDO, no listando.
  BEGIN
    INSERT INTO public.evento_archivo_adjunto
      (evento_padre_id, mascota_id, prestador_id, country_code, bucket, storage_path,
       nombre_archivo, categoria, subido_por_user_id, origen_captura)
    SELECT evento_padre_id, mascota_id, prestador_id, country_code, bucket, storage_path,
           'cinturon', categoria, subido_por_user_id, 'inventado'
    FROM public.evento_archivo_adjunto LIMIT 1;
    RAISE EXCEPTION 'cinturon: el CHECK dejo pasar un origen inventado';
  EXCEPTION
    WHEN check_violation THEN NULL;              -- lo rebotó: correcto
    WHEN no_data_found THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.evento_archivo_adjunto'::regclass
      AND conname = 'evento_archivo_adjunto_origen_captura_check'
  ) THEN
    RAISE EXCEPTION 'cinturon: no quedo el CHECK del eje de origen';
  END IF;

  -- El productor lo estampa: se lee del CUERPO VIVO, no del archivo.
  IF pg_get_functiondef(
       to_regprocedure('public.adjuntar_cuadro_teleconsulta(uuid,text,text,text,bigint,text)')
     ) NOT LIKE '%origen_captura%' THEN
    RAISE EXCEPTION 'cinturon: el productor NO estampa el origen — la columna nace muerta';
  END IF;

  SELECT count(*) INTO v_n FROM public.evento_archivo_adjunto WHERE nombre_archivo = 'cinturon';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: quedo residuo (% filas)', v_n; END IF;

  RAISE NOTICE 'cinturon origen_captura: OK (eje propio + CHECK rechaza + productor estampa + residuo 0)';
END;
$cinturon$;

-- ============================================================================
-- S106-A tanda 2 · EL CUADRO CONGELADO — la puerta que le faltaba al vet
--
-- El profesional congela un cuadro del video remoto durante la teleconsulta y
-- queda adjunto al expediente de la mascota, con su marca de teleconsulta.
--
-- ── EL CENSO QUE ORDENÓ ESTE DISEÑO, y por qué no es un camino paralelo ─────
--
--    El founder pidió medir primero qué existe de adjuntos clínicos: *«si ya
--    hay camino, se usa; no se inventa uno paralelo»*. Se midió, y el
--    resultado fue más fino que un sí o un no:
--
--    • **La infraestructura existe entera y se usa tal cual**:
--      `evento_archivo_adjunto` cuelga de `eventos_mascota`, con su catálogo
--      `cat_categorias_archivo`. **No nace tabla, no nace categoría, no nace
--      vocabulario.** La categoría `foto_consulta` ya estaba.
--
--    • **La PUERTA no servía.** `registrar_archivo_atencion` exige un
--      `evento_atencion`, y **el flujo veterinario nunca crea uno**: medido,
--      los únicos productores de `evento_atencion` son
--      `iniciar_atencion_{paseo,grooming,adiestramiento}` — **no existe
--      `iniciar_atencion_veterinaria`**. El vet adjunta hoy por
--      `completar_historia_clinica`, que sedimenta la nota entera al final.
--
--    ⇒ **Lo que falta no es un camino: es la puerta de este momento.** Un
--      cuadro se congela EN MEDIO de la consulta, cuando la nota todavía no
--      existe. *Hacerlo viajar dentro de la nota significaría que la imagen
--      sólo existe si el profesional termina de escribir — y un cuadro que se
--      pierde porque la nota quedó a medias es justo el dato que se congeló
--      para no perder.*
--
-- ── LA MARCA DE TELECONSULTA NO ES UNA COLUMNA NUEVA ────────────────────────
--    El adjunto cuelga del **evento padre de la cita**, y la cita dice
--    `modalidad = 'telemedicina'`. Es exactamente lo que firmó
--    `LETRA_TELEMEDICINA` §7 y resuelve `BIO_EXPEDIENTE` D13.6: *el padre es
--    la cita*. **La marca viaja sola, por estructura**, y por eso también
--    viaja cuando la ficha se exporta o se imprime — que es la única adición
--    que el análisis legal del 26-ago pidió sobre este punto.
--
-- ── VEDA 76(g): NO RIGE. ────────────────────────────────────────────────────
--    Una función nueva. Cero DDL sobre tablas, cero backfill, cero anclas.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
--    `docs/relevamientos/2026-08-26-s106a-REVERSA-cuadro-teleconsulta.sql`.
--    Declara que **quita la puerta y NO los adjuntos** — borrar expediente
--    para deshacer código no es revertir.
-- ============================================================================

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

  v_uid        uuid := auth.uid();
  v_cita       record;
  v_empleado   uuid;
  v_activo     boolean;
  v_adjunto    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'sin_sesion' USING ERRCODE = '42501';
  END IF;
  IF p_bucket IS NULL OR btrim(p_bucket) = '' THEN
    RAISE EXCEPTION 'bucket_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_storage_path IS NULL OR btrim(p_storage_path) = '' THEN
    RAISE EXCEPTION 'storage_path_requerido' USING ERRCODE = '22023';
  END IF;

  SELECT c.id, c.mascota_id, c.prestador_id, c.country_code, c.evento_id, c.modalidad, c.estado
    INTO v_cita
  FROM public.evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_inexistente' USING ERRCODE = '22023';
  END IF;

  -- 🔴 La puerta es de TELECONSULTA y lo dice. *Si aceptara cualquier cita, el
  --    día que alguien la llame desde una presencial adjuntaría una imagen
  --    marcada como acto a distancia — y esa marca es la que delimita contra
  --    qué estándar se juzga al veterinario.*
  IF v_cita.modalidad IS DISTINCT FROM 'telemedicina' THEN
    RAISE EXCEPTION 'no_es_teleconsulta' USING ERRCODE = '22023';
  END IF;

  -- El padre. Si faltara, **se aborta en vez de inventar uno**: un adjunto
  -- colgado de un evento fabricado acá quedaría fuera de la línea de vida.
  IF v_cita.evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;

  -- 🔴 EL GATE ES CLÍNICO, y se resuelve con el helper único de la casa — el
  --    mismo que gobierna los otros seis sitios clínicos. *Re-implementar el
  --    predicado acá sería la séptima copia, y la séptima es la que se olvida
  --    de actualizar el día que la regla cambie.*
  IF NOT COALESCE(public.empleado_tiene_capacidad_clinica(v_cita.prestador_id), false) THEN
    RAISE EXCEPTION 'sin_capacidad_clinica' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id INTO v_empleado
  FROM public.prestador_empleados pe
  WHERE pe.prestador_id = v_cita.prestador_id AND pe.user_id = v_uid AND pe.activo
  LIMIT 1;
  -- `v_empleado` puede quedar NULL: el titular no siempre tiene fila de
  -- empleado. La columna lo admite y el adjunto igual queda atribuido por
  -- `subido_por_user_id`. **No se aborta por eso.**

  -- La categoría se valida contra el catálogo VIVO aunque sea constante acá.
  -- *Si alguien la desactivara, quiero que esto reviente y no que escriba un
  -- código muerto que después nadie sabe leer.*
  SELECT activo INTO v_activo FROM public.cat_categorias_archivo WHERE codigo = k_categoria;
  IF v_activo IS NULL THEN
    RAISE EXCEPTION 'categoria_archivo_invalida: %', k_categoria USING ERRCODE = '22023';
  END IF;
  IF NOT v_activo THEN
    RAISE EXCEPTION 'categoria_archivo_inactiva: %', k_categoria USING ERRCODE = '22023';
  END IF;

  -- `nombre_archivo` es NOT NULL (lo cazó el cinturón, no el relevamiento
  -- previo — se anota porque es la clase de dato que sólo aparece al escribir
  -- de verdad). **Se DERIVA del path en vez de pedirse**: el nombre de un
  -- cuadro congelado es un detalle de la subida, no información que el
  -- profesional tenga que dar, y derivarlo garantiza que nunca falte.
  INSERT INTO public.evento_archivo_adjunto (
    evento_padre_id, mascota_id, prestador_id, empleado_id, country_code,
    bucket, storage_path, nombre_archivo, mime_type, tamano_bytes,
    categoria, descripcion, subido_por_user_id
  ) VALUES (
    v_cita.evento_id, v_cita.mascota_id, v_cita.prestador_id, v_empleado, v_cita.country_code,
    p_bucket, p_storage_path,
    COALESCE(NULLIF(regexp_replace(p_storage_path, '^.*/', ''), ''), 'cuadro-teleconsulta'),
    p_mime_type, p_tamano_bytes,
    k_categoria, p_descripcion, v_uid
  )
  RETURNING id INTO v_adjunto;

  RETURN jsonb_build_object(
    'ok', true,
    'adjunto_id', v_adjunto,
    'evento_padre_id', v_cita.evento_id,
    'categoria', k_categoria
  );
END;
$$;

COMMENT ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text) IS
  'S106 · Adjunta un cuadro congelado de teleconsulta al evento padre de la cita. '
  'La marca de teleconsulta viaja por estructura: el padre es la cita y la cita dice modalidad.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PERMISOS · L-140 con las tres. Acá `authenticated` SÍ la necesita: la llama
-- la app del profesional con su sesión, y el gate clínico vive en el cuerpo.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text)
  TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- CINTURÓN — se ejerce la defensa con su DISCRIMINADOR, no se lista.
-- ─────────────────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_rol_origen constant text := current_user;
  v_firma      constant text := 'public.adjuntar_cuadro_teleconsulta(uuid, text, text, text, bigint, text)';
  -- El titular de Clínica Aurora: tiene capacidad clínica por el brazo del
  -- titular. Es quien SÍ debe poder.
  k_vet        constant uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  -- El dueño de una de las citas semilla: NO debe poder, y es el discriminador.
  k_dueno      constant uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  k_cita_tele  constant uuid := '68cb15a2-a3c3-4a16-a58b-2bae096b7d02';

  v_res    jsonb;
  v_id     uuid;
  v_paso   boolean;
BEGIN
  IF has_function_privilege('anon', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: anon puede ejecutar';
  END IF;
  IF NOT has_function_privilege('authenticated', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: authenticated NO puede — la app del vet no podria adjuntar';
  END IF;

  -- (a) EL BRAZO QUE PASA. Con la sesión del veterinario, sobre una cita de
  --     telemedicina real.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_vet, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  v_res := public.adjuntar_cuadro_teleconsulta(
    k_cita_tele, 'cita-archivos', 'cinturon/s106/cuadro.jpg', 'image/jpeg', 1234, 'fixture cinturon');
  IF (v_res->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: el veterinario NO pudo adjuntar';
  END IF;
  v_id := (v_res->>'adjunto_id')::uuid;

  -- (b) EL DISCRIMINADOR. **Sin este brazo, (a) no prueba que haya gate**: una
  --     función sin ninguna defensa también daría verde ahí.
  EXECUTE format('SET LOCAL ROLE %I', v_rol_origen);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_dueno, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  v_paso := true;
  BEGIN
    PERFORM public.adjuntar_cuadro_teleconsulta(
      k_cita_tele, 'cita-archivos', 'cinturon/s106/intruso.jpg');
  EXCEPTION WHEN OTHERS THEN
    v_paso := false;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon: EL DUEÑO PUDO ADJUNTAR AL EXPEDIENTE CLINICO';
  END IF;

  -- (c) Residuo cero: el fixture escribió de verdad, así que se limpia y se
  --     verifica la limpieza.
  EXECUTE format('SET LOCAL ROLE %I', v_rol_origen);
  DELETE FROM public.evento_archivo_adjunto WHERE id = v_id;
  IF EXISTS (SELECT 1 FROM public.evento_archivo_adjunto WHERE id = v_id) THEN
    RAISE EXCEPTION 'cinturon: quedo residuo del fixture';
  END IF;

  RAISE NOTICE 'cinturon cuadro_teleconsulta: OK (vet adjunta · dueño rebota · residuo 0)';
END;
$cinturon$;

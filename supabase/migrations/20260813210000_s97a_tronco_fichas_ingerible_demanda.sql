-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · EL TRONCO Y LAS FICHAS POR FAMILIA + `ingerible` + DEMANDA MEDIDA
-- (enmiendas de mesa al Paso 0, 13-ago-2026 — la carga FRENÓ hasta esto)
--
-- ① TRONCO + ATRIBUTOS POR FAMILIA: el maestro (`productos`) queda como
--    tronco común; los atributos propios de cada familia viven en fichas
--    1:1 por producto — *una sola tabla ancha con la mitad de las columnas
--    vacías no distingue «no aplica» de «falta el dato»*:
--      · `producto_ficha_nutricional`  (alimento · heno): análisis
--        garantizado, kcal, ración.
--      · `producto_ficha_dosificacion` (antiparasitario · suplemento):
--        principio activo, concentración, periodicidad, vía, espectro,
--        contraindicaciones, edad mínima, receta, registro Agrocalidad.
--      · `producto_ficha_accesorio`    (accesorio · higiene · sustrato ·
--        acondicionador_agua): material, talla, medidas.
--    NOTA DECLARADA: `alergenos`/`ingredientes_activos`/`composicion_*` NO
--    se mudan del tronco en esta pasada — todos sus lectores vivos (M16,
--    wrappers, voces de alergia) los leen de `productos` y mudarlos es
--    cirugía de motor con fixture propio, no un paso de carga.
--
-- ② 🔴 `cat_familias_producto.ingerible` — GOBIERNA EL MOTOR DE ALERGIAS
--    (firma founder 13-ago): el motor solo corre sobre productos de familia
--    ingerible. *Una advertencia de alergia sobre una cama mata la
--    advertencia entera.* Ingeribles: alimento · antiparasitario ·
--    suplemento · dieta_prescripcion · heno. El cableado del lado lector
--    (wrappers) va con su propio discriminador.
--
-- ③ `accesorio` se ACTIVA — cuarta familia de v1 (firma founder 13-ago),
--    NO ingerible. Comercialmente sigue gobernada por `vendible` y por el
--    cuarto ① de la configuración.
--
-- ④ `busquedas_sin_resultado` — LA DEMANDA MEDIDA de la ley de
--    disponibilidad (firma founder 13-ago: la vitrina muestra lo que
--    alguien puede vender; la búsqueda exacta declara el no-disponible y
--    REGISTRA la demanda desde el día uno). Append-only: sin UPDATE/DELETE.
--
-- 76(g): NO RIGE — aditiva (columna con default, tablas nuevas, puertas
-- nuevas); sin backfill de negocio, sin anclas.
-- Bundles vivos (D-662): columnas y tablas NUEVAS — ningún lector vivo las
-- consulta todavía; cero renombres, cero drops.
-- REVERSA escrita ANTES: scripts/s97/2026-08-13-s97a-tronco-fichas-REVERSA.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ② ingerible ────────────────────────────────────────────────────────────
ALTER TABLE public.cat_familias_producto
  ADD COLUMN IF NOT EXISTS ingerible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cat_familias_producto.ingerible IS
  'Gobierna el motor de alergias (firma founder 13-ago-2026): la exclusión '
  'y la advertencia solo corren sobre familias ingeribles.';

UPDATE public.cat_familias_producto SET ingerible = true, updated_at = now()
 WHERE codigo IN ('alimento','antiparasitario','suplemento','dieta_prescripcion','heno');

-- ── ③ accesorio, cuarta familia v1 ────────────────────────────────────────
UPDATE public.cat_familias_producto SET activo = true, updated_at = now()
 WHERE codigo = 'accesorio' AND activo = false;

-- ── ① las fichas por familia (tronco + atributos) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.producto_ficha_nutricional (
  producto_id   uuid PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  proteina_pct  numeric CHECK (proteina_pct  IS NULL OR (proteina_pct  >= 0 AND proteina_pct  <= 100)),
  grasa_pct     numeric CHECK (grasa_pct     IS NULL OR (grasa_pct     >= 0 AND grasa_pct     <= 100)),
  fibra_pct     numeric CHECK (fibra_pct     IS NULL OR (fibra_pct     >= 0 AND fibra_pct     <= 100)),
  humedad_pct   numeric CHECK (humedad_pct   IS NULL OR (humedad_pct   >= 0 AND humedad_pct   <= 100)),
  cenizas_pct   numeric CHECK (cenizas_pct   IS NULL OR (cenizas_pct   >= 0 AND cenizas_pct   <= 100)),
  kcal_por_kg   numeric CHECK (kcal_por_kg   IS NULL OR kcal_por_kg > 0),
  racion        jsonb,          -- {'perro_5kg_g':…} — la calculada, jamás la genérica
  fuente        text,           -- de dónde salió el dato (origen_dato del archivo)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.producto_ficha_dosificacion (
  producto_id          uuid PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  principio_activo     text,
  concentracion        text,
  periodicidad_dias    numeric CHECK (periodicidad_dias IS NULL OR periodicidad_dias > 0),
  via_administracion   text,
  espectro             text,
  contraindicaciones   text,
  edad_minima          text,
  requiere_receta      boolean,
  registro_agrocalidad text,
  rango_peso_animal_kg text,
  fuente               text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.producto_ficha_accesorio (
  producto_id uuid PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  material    text,
  talla       text,
  medidas     jsonb,
  fuente      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Lectura pública como el tronco (la vitrina es pública); escritura SOLO por
-- la puerta DEFINER — cero policies de INSERT/UPDATE/DELETE.
ALTER TABLE public.producto_ficha_nutricional  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_ficha_dosificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_ficha_accesorio    ENABLE ROW LEVEL SECURITY;
CREATE POLICY ficha_nutricional_select  ON public.producto_ficha_nutricional  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY ficha_dosificacion_select ON public.producto_ficha_dosificacion FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY ficha_accesorio_select    ON public.producto_ficha_accesorio    FOR SELECT TO anon, authenticated USING (true);

-- ── La puerta de la ficha (solo e-PetPlace cura el catálogo) ──────────────
CREATE OR REPLACE FUNCTION public.declarar_ficha_producto(p_producto_id uuid, p_ficha jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_familia text;
  v_tabla   text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_cura_el_catalogo' USING ERRCODE = '42501';
  END IF;
  SELECT familia_codigo INTO v_familia FROM productos WHERE id = p_producto_id;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023'; END IF;

  IF v_familia IN ('alimento','heno','dieta_prescripcion') THEN
    INSERT INTO producto_ficha_nutricional AS f (producto_id, proteina_pct, grasa_pct, fibra_pct,
      humedad_pct, cenizas_pct, kcal_por_kg, racion, fuente)
    VALUES (p_producto_id,
      nullif(p_ficha->>'proteina_pct','')::numeric, nullif(p_ficha->>'grasa_pct','')::numeric,
      nullif(p_ficha->>'fibra_pct','')::numeric, nullif(p_ficha->>'humedad_pct','')::numeric,
      nullif(p_ficha->>'cenizas_pct','')::numeric, nullif(p_ficha->>'kcal_por_kg','')::numeric,
      p_ficha->'racion', nullif(p_ficha->>'fuente',''))
    ON CONFLICT (producto_id) DO UPDATE SET
      proteina_pct = coalesce(EXCLUDED.proteina_pct, f.proteina_pct),
      grasa_pct    = coalesce(EXCLUDED.grasa_pct,    f.grasa_pct),
      fibra_pct    = coalesce(EXCLUDED.fibra_pct,    f.fibra_pct),
      humedad_pct  = coalesce(EXCLUDED.humedad_pct,  f.humedad_pct),
      cenizas_pct  = coalesce(EXCLUDED.cenizas_pct,  f.cenizas_pct),
      kcal_por_kg  = coalesce(EXCLUDED.kcal_por_kg,  f.kcal_por_kg),
      racion       = coalesce(EXCLUDED.racion,       f.racion),
      fuente       = coalesce(EXCLUDED.fuente,       f.fuente),
      updated_at   = now();
    v_tabla := 'nutricional';
  ELSIF v_familia IN ('antiparasitario','suplemento') THEN
    INSERT INTO producto_ficha_dosificacion AS f (producto_id, principio_activo, concentracion,
      periodicidad_dias, via_administracion, espectro, contraindicaciones, edad_minima,
      requiere_receta, registro_agrocalidad, rango_peso_animal_kg, fuente)
    VALUES (p_producto_id,
      nullif(p_ficha->>'principio_activo',''), nullif(p_ficha->>'concentracion',''),
      nullif(p_ficha->>'periodicidad_dias','')::numeric, nullif(p_ficha->>'via_administracion',''),
      nullif(p_ficha->>'espectro',''), nullif(p_ficha->>'contraindicaciones',''),
      nullif(p_ficha->>'edad_minima',''),
      CASE lower(coalesce(p_ficha->>'requiere_receta','')) WHEN 'si' THEN true WHEN 'sí' THEN true
        WHEN 'true' THEN true WHEN 'no' THEN false WHEN 'false' THEN false ELSE NULL END,
      nullif(p_ficha->>'registro_agrocalidad',''), nullif(p_ficha->>'rango_peso_animal_kg',''),
      nullif(p_ficha->>'fuente',''))
    ON CONFLICT (producto_id) DO UPDATE SET
      principio_activo     = coalesce(EXCLUDED.principio_activo,     f.principio_activo),
      concentracion        = coalesce(EXCLUDED.concentracion,        f.concentracion),
      periodicidad_dias    = coalesce(EXCLUDED.periodicidad_dias,    f.periodicidad_dias),
      via_administracion   = coalesce(EXCLUDED.via_administracion,   f.via_administracion),
      espectro             = coalesce(EXCLUDED.espectro,             f.espectro),
      contraindicaciones   = coalesce(EXCLUDED.contraindicaciones,   f.contraindicaciones),
      edad_minima          = coalesce(EXCLUDED.edad_minima,          f.edad_minima),
      requiere_receta      = coalesce(EXCLUDED.requiere_receta,      f.requiere_receta),
      registro_agrocalidad = coalesce(EXCLUDED.registro_agrocalidad, f.registro_agrocalidad),
      rango_peso_animal_kg = coalesce(EXCLUDED.rango_peso_animal_kg, f.rango_peso_animal_kg),
      fuente               = coalesce(EXCLUDED.fuente,               f.fuente),
      updated_at           = now();
    v_tabla := 'dosificacion';
  ELSE
    INSERT INTO producto_ficha_accesorio AS f (producto_id, material, talla, medidas, fuente)
    VALUES (p_producto_id, nullif(p_ficha->>'material',''), nullif(p_ficha->>'talla',''),
            p_ficha->'medidas', nullif(p_ficha->>'fuente',''))
    ON CONFLICT (producto_id) DO UPDATE SET
      material   = coalesce(EXCLUDED.material, f.material),
      talla      = coalesce(EXCLUDED.talla,    f.talla),
      medidas    = coalesce(EXCLUDED.medidas,  f.medidas),
      fuente     = coalesce(EXCLUDED.fuente,   f.fuente),
      updated_at = now();
    v_tabla := 'accesorio';
  END IF;
  RETURN jsonb_build_object('ok', true, 'ficha', v_tabla);
END $$;

-- ── ④ la demanda medida ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.busquedas_sin_resultado (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termino      text NOT NULL CHECK (length(btrim(termino)) > 0),
  country_code text NOT NULL DEFAULT 'EC',
  familia_filtro text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.busquedas_sin_resultado ENABLE ROW LEVEL SECURITY;
CREATE POLICY busquedas_sr_admin_select ON public.busquedas_sin_resultado
  FOR SELECT TO authenticated USING (is_admin());
-- Append-only: cero policies de UPDATE/DELETE; el INSERT entra por la puerta.

CREATE OR REPLACE FUNCTION public.registrar_busqueda_sin_resultado(
  p_termino text, p_country_code text DEFAULT 'EC', p_familia_filtro text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_termino IS NULL OR length(btrim(p_termino)) = 0 THEN RETURN; END IF;
  INSERT INTO busquedas_sin_resultado (termino, country_code, familia_filtro, user_id)
  VALUES (left(btrim(p_termino), 200), upper(coalesce(p_country_code,'EC')), p_familia_filtro, auth.uid());
END $$;

-- ── L-140: las puertas nuevas cierran anon/PUBLIC explícito ───────────────
REVOKE EXECUTE ON FUNCTION public.declarar_ficha_producto(uuid, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.declarar_ficha_producto(uuid, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_busqueda_sin_resultado(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_busqueda_sin_resultado(text, text, text) TO authenticated;

-- ── Cinturón ──────────────────────────────────────────────────────────────
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM cat_familias_producto WHERE ingerible;
  IF n <> 5 THEN RAISE EXCEPTION 'CINTURON: ingeribles esperadas 5, hay %', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_familias_producto WHERE codigo='accesorio' AND activo) THEN
    RAISE EXCEPTION 'CINTURON: accesorio no quedo activa';
  END IF;
  IF has_function_privilege('anon', 'public.declarar_ficha_producto(uuid, jsonb)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.registrar_busqueda_sin_resultado(text, text, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: una puerta nueva quedo abierta a anon (L-140)';
  END IF;
END $$;

COMMIT;

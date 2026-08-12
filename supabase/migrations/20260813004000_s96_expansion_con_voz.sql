-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · LA EXPANSIÓN GANA SU VOZ — pedido de la pista D (12-ago, post-cierre):
-- `cat_alergenos.nombre_es` existía desde M15 con las 23 voces sembradas y
-- ningún lector la exponía — el helper del cliente degradaba guiones→espacios
-- («moluscos_crustaceos» → «moluscos crustaceos») como hack declarado.
--
-- `expandir_alergenos_a_vigilar` pasa a devolver la voz junto al código:
-- `declarado_nombre` (del catálogo — el declarado SIEMPRE está en el
-- vocabulario) y `origen_nombre` (COALESCE con el texto de la mascota: el
-- alérgeno del EXPEDIENTE es texto libre del vet y puede no estar en el
-- catálogo — inventarle una voz sería fabricar el dato).
--
-- L-119: una sola firma — DROP + CREATE (el RETURNS TABLE cambia).
--
-- 76(g): NO RIGE — una función STABLE de lectura. Reversa:
-- scripts/s96/2026-08-12-s96-m20-REVERSA.sql (escrita ANTES, cuerpo viejo
-- embebido).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION public.expandir_alergenos_a_vigilar(text[]);

CREATE FUNCTION public.expandir_alergenos_a_vigilar(p_alergenos text[])
RETURNS TABLE (
  declarado        text,
  origen           text,
  exacta           boolean,
  declarado_nombre text,
  origen_nombre    text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT lower(trim(a)) AS declarado,
         lower(trim(a)) AS origen,
         true AS exacta,
         coalesce(c.nombre_es, lower(trim(a))) AS declarado_nombre,
         coalesce(c.nombre_es, lower(trim(a))) AS origen_nombre
    FROM unnest(p_alergenos) a
    LEFT JOIN cat_alergenos c ON c.codigo = lower(trim(a))
   WHERE trim(a) <> ''
  UNION
  SELECT r.alergeno_codigo,
         lower(trim(a)),
         (r.tipo = 'es_un'),
         coalesce(cd.nombre_es, r.alergeno_codigo),
         coalesce(co.nombre_es, lower(trim(a)))
    FROM unnest(p_alergenos) a
    JOIN cat_alergeno_relaciones r ON r.relacionado_codigo = lower(trim(a))
    LEFT JOIN cat_alergenos cd ON cd.codigo = r.alergeno_codigo
    LEFT JOIN cat_alergenos co ON co.codigo = lower(trim(a))
$$;

REVOKE ALL ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) TO authenticated;

COMMENT ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) IS
  'S96: la exclusión y la advertencia expanden por cat_alergeno_relaciones. '
  'exacta=false ⇒ la voz dice «podría ser», jamás «contiene». Desde M20 '
  'devuelve la VOZ del catálogo (nombre_es); el origen conserva el texto de '
  'la mascota cuando no está en el vocabulario — no se le inventa voz.';

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $$
DECLARE v_row record; v_n int;
BEGIN
  -- (a) el caso de la firma, ahora CON voz: ave imprecisa con su nombre.
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
   WHERE declarado = 'ave_no_especificada';
  IF NOT FOUND OR v_row.exacta THEN RAISE EXCEPTION 'cinturón (a): la expansión perdió el caso ave→pollo'; END IF;
  IF v_row.declarado_nombre <> 'Proteína de ave sin especificar' OR v_row.origen_nombre <> 'Pollo' THEN
    RAISE EXCEPTION 'cinturón (a2): la voz salió %/%', v_row.declarado_nombre, v_row.origen_nombre;
  END IF;

  -- (b) un alérgeno del expediente FUERA del vocabulario conserva SU texto.
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['polen de gramíneas']);
  IF v_row.origen_nombre <> 'polen de gramíneas' THEN
    RAISE EXCEPTION 'cinturón (b): al texto libre se le inventó voz (%)', v_row.origen_nombre;
  END IF;

  -- (c) la dieta de eliminación sigue viva tras el DROP/CREATE.
  SELECT count(*) INTO v_n FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
   WHERE declarado IN ('pavo','pato');
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (c): pavo/pato advierten al alérgico a pollo'; END IF;

  RAISE NOTICE 'CINTURÓN M20 VERDE: la expansión habla con la voz del catálogo y el texto libre conserva la suya';
END $$;

COMMIT;

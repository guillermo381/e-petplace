-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago, 4ª tanda) — 🔴 EL VOCABULARIO DE ALÉRGENOS SE
-- AMPLÍA Y DEJA DE SER UNA LISTA PLANA: gana RELACIONES DECLARADAS.
--
-- LA MEDICIÓN QUE LO ORDENA: 242 de 456 productos del catálogo real (222 de
-- 231 dentro del alcance v1) declaran un alérgeno que el motor no podía
-- sostener — el motor de alergias estaba APAGADO EN LA PRÁCTICA.
--
-- EL CASO QUE CAMBIA EL MODELO: Thor es alérgico a `pollo`; un producto
-- declara `ave_no_especificada`. Sin relación no hay coincidencia exacta y el
-- motor CALLA — el peor caso posible. Y si la relación vive en código,
-- mañana nadie sabe por qué advierte. ⇒ las relaciones son DATO.
--
-- Dos tipos de arista, y la diferencia es la VOZ (firma: el motor distingue
-- advertencia exacta de advertencia por relación):
--   · `es_un`     → X ES biológicamente Y (bisonte es_un res — Bovidae;
--                   jabalí es_un cerdo — Sus scrofa: proteína novel es
--                   marketing, no biología). Advertencia EXACTA.
--   · `puede_ser` → X declarado genérico PUEDE contener Y
--                   (ave_no_especificada puede_ser pollo/pavo/pato;
--                   legumbres puede_ser soja). Advertencia IMPRECISA — la
--                   superficie dice «podría ser pollo», jamás «contiene».
--
-- LO QUE JAMÁS SE AGRUPA, protegido EN EL MODELO (trigger, no nota): pollo,
-- pavo y pato van SEPARADOS — las dietas de eliminación usan pato o pavo
-- para el alérgico al pollo; fundirlos mata el caso de uso. Insectos aparte
-- de moluscos_crustaceos pese a la tropomiosina compartida: la proteína de
-- insecto existe como alternativa.
--
-- Y la lección de `ave_no_especificada`, escrita: 80 productos dicen
-- «proteínas de ave deshidratadas» y ninguno nombra pollo — leerlos como
-- `pollo` era un alérgeno INFERIDO (lo que prohibimos, hecho por nosotros).
-- No se borra (callar es peor): se le da un casillero que dice lo que la
-- etiqueta dice y nada más.
--
-- Conteo resultante MEDIDO, no cuadrado: 10 vivas + 13 nuevas = 23 (la lista
-- de la firma más los nodos que sus propias relaciones exigen: soja, res,
-- cerdo, jabali, bufalo_de_agua).
--
-- 76(g): NO RIGE — catálogo + relaciones + función STABLE; cero datos de
-- producto tocados. Reversa: scripts/s96/2026-08-12-s96-m16-REVERSA.sql
-- (escrita ANTES; declara que revertir apaga el motor de alergias real).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① LAS ENTRADAS NUEVAS ───────────────────────────────────────────────────
INSERT INTO public.cat_alergenos (codigo, nombre_es, nota) VALUES
  ('levadura',  'Levadura',  NULL),
  ('ave_no_especificada', 'Proteína de ave sin especificar',
   'La etiqueta dice «proteínas de ave» sin nombrar cuál. NO se lee como '
   'pollo: eso sería un alérgeno inferido. La relación puede_ser hace que '
   'igual ADVIERTA al alérgico a pollo/pavo/pato, con voz de imprecisión.'),
  ('legumbres', 'Legumbres', 'Genérico de etiqueta. Solapa DECLARADO con soja (puede_ser).'),
  ('cebada',    'Cebada',    NULL),
  ('avena',     'Avena',     NULL),
  ('pavo',      'Pavo',      'SEPARADO de pollo y pato a propósito: dieta de eliminación.'),
  ('insectos',  'Proteína de insecto',
   'APARTE de moluscos_crustaceos pese a la tropomiosina compartida: existe '
   'como alternativa para el animal alérgico. Jamás se agrupan.'),
  ('pato',      'Pato',      'SEPARADO de pollo y pavo a propósito: dieta de eliminación.'),
  ('soja',      'Soja',      'Entrada propia por su peso; es_un legumbres (declarado, no escondido).'),
  ('res',       'Res',       'Grupo Bovidae: bisonte y búfalo de agua son res para una alergia.'),
  ('cerdo',     'Cerdo',     'Sus scrofa: el jabalí ES cerdo para una alergia.'),
  ('jabali',    'Jabalí',    'es_un cerdo — proteína novel es marketing, no biología.'),
  ('bufalo_de_agua', 'Búfalo de agua', 'es_un res (Bovidae).');

-- ── ② LAS RELACIONES, COMO DATO ─────────────────────────────────────────────
CREATE TABLE public.cat_alergeno_relaciones (
  alergeno_codigo    text NOT NULL REFERENCES public.cat_alergenos(codigo),
  relacionado_codigo text NOT NULL REFERENCES public.cat_alergenos(codigo),
  tipo               text NOT NULL CHECK (tipo IN ('es_un','puede_ser')),
  nota               text,
  PRIMARY KEY (alergeno_codigo, relacionado_codigo),
  CONSTRAINT chk_relacion_no_reflexiva CHECK (alergeno_codigo <> relacionado_codigo)
);

COMMENT ON TABLE public.cat_alergeno_relaciones IS
  'S96 (firma 12-ago): (X,Y,es_un) = X ES biológicamente Y — advertencia '
  'EXACTA para el alérgico a Y. (X,Y,puede_ser) = X genérico PUEDE contener '
  'Y — advertencia IMPRECISA («podría ser Y»). La relación es DATO para que '
  'mañana se sepa POR QUÉ advierte. Ampliar = INSERT, jamás código.';

ALTER TABLE public.cat_alergeno_relaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY alerg_rel_select ON public.cat_alergeno_relaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY alerg_rel_insert ON public.cat_alergeno_relaciones FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY alerg_rel_update ON public.cat_alergeno_relaciones FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY alerg_rel_delete ON public.cat_alergeno_relaciones FOR DELETE TO authenticated USING (is_admin());
REVOKE ALL ON public.cat_alergeno_relaciones FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_alergeno_relaciones TO authenticated;

-- ── ③ LO QUE JAMÁS SE AGRUPA — protegido en el modelo, hablado ─────────────
CREATE FUNCTION public._trg_alergeno_relacion_prohibida()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_aves text[] := ARRAY['pollo','pavo','pato'];
BEGIN
  IF NEW.alergeno_codigo = ANY (v_aves) AND NEW.relacionado_codigo = ANY (v_aves) THEN
    RAISE EXCEPTION 'relacion_prohibida: pollo, pavo y pato van SEPARADOS — la dieta de eliminación usa pato o pavo para el alérgico al pollo (firma founder S96)'
      USING ERRCODE = '22023';
  END IF;
  IF (NEW.alergeno_codigo, NEW.relacionado_codigo) IN
     (('insectos','moluscos_crustaceos'), ('moluscos_crustaceos','insectos')) THEN
    RAISE EXCEPTION 'relacion_prohibida: insectos va APARTE de moluscos_crustaceos pese a la tropomiosina — la proteína de insecto existe como alternativa (firma founder S96)'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alergeno_relacion_prohibida
  BEFORE INSERT OR UPDATE ON public.cat_alergeno_relaciones
  FOR EACH ROW EXECUTE FUNCTION public._trg_alergeno_relacion_prohibida();

-- El seed de relaciones — cada una declarada por la medición del founder:
INSERT INTO public.cat_alergeno_relaciones (alergeno_codigo, relacionado_codigo, tipo, nota) VALUES
  ('ave_no_especificada', 'pollo', 'puede_ser', '80 productos dicen «proteínas de ave» sin nombrar cuál.'),
  ('ave_no_especificada', 'pavo',  'puede_ser', NULL),
  ('ave_no_especificada', 'pato',  'puede_ser', NULL),
  ('legumbres',           'soja',  'puede_ser', 'Solapamiento declarado, no escondido.'),
  ('soja',                'legumbres', 'es_un',  'La soja ES una legumbre.'),
  ('bisonte',             'res',   'es_un',     'Bovidae.'),
  ('bufalo_de_agua',      'res',   'es_un',     'Bovidae.'),
  ('jabali',              'cerdo', 'es_un',     'Sus scrofa: proteína novel es marketing, no biología.');

-- ── ④ LA EXPANSIÓN — el motor distingue exacta de imprecisa ────────────────
--     Entrada: los alérgenos documentados de la mascota. Salida: TODO código
--     declarado-en-producto que tiene que ADVERTIR, con su origen y si la
--     advertencia es exacta (es_un / coincidencia) o imprecisa (puede_ser).
CREATE FUNCTION public.expandir_alergenos_a_vigilar(p_alergenos text[])
RETURNS TABLE (declarado text, origen text, exacta boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  -- La coincidencia exacta: el alérgeno mismo.
  SELECT lower(trim(a)) AS declarado, lower(trim(a)) AS origen, true AS exacta
    FROM unnest(p_alergenos) a
   WHERE trim(a) <> ''
  UNION
  -- Por relación: todo X cuya arista apunta al alérgeno de la mascota.
  -- es_un = exacta (bisonte ES res) · puede_ser = imprecisa (ave podría ser pollo).
  SELECT r.alergeno_codigo, lower(trim(a)), (r.tipo = 'es_un')
    FROM unnest(p_alergenos) a
    JOIN cat_alergeno_relaciones r ON r.relacionado_codigo = lower(trim(a))
$$;

REVOKE ALL ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) TO authenticated;

COMMENT ON FUNCTION public.expandir_alergenos_a_vigilar(text[]) IS
  'S96: la exclusión y la advertencia dejan de ser coincidencia exacta — '
  'expanden por cat_alergeno_relaciones. exacta=false ⇒ la voz dice «podría '
  'ser», jamás «contiene» (firma: la imprecisión se dice).';

-- ── ⑤ EL CINTURÓN ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_n   int;
  v_ok  boolean;
  v_row record;
BEGIN
  -- (a) el conteo del vocabulario, medido.
  SELECT count(*) INTO v_n FROM cat_alergenos WHERE activo;
  IF v_n <> 23 THEN RAISE EXCEPTION 'cinturón (a): % entradas activas (se esperaban 23)', v_n; END IF;

  -- (b) EL CASO DE LA FIRMA: Thor alérgico a pollo, producto con
  --     ave_no_especificada → ADVIERTE, y advierte IMPRECISO.
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
   WHERE declarado = 'ave_no_especificada';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cinturón (b): ave_no_especificada NO advierte al alérgico a pollo — el motor calla';
  END IF;
  IF v_row.exacta THEN
    RAISE EXCEPTION 'cinturón (b): la advertencia de ave salió EXACTA — «contiene pollo» sería mentir';
  END IF;

  -- (c) bisonte advierte EXACTO al alérgico a res (es_un, biología).
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['res'])
   WHERE declarado = 'bisonte';
  IF NOT FOUND OR NOT v_row.exacta THEN
    RAISE EXCEPTION 'cinturón (c): bisonte no advierte exacto al alérgico a res';
  END IF;

  -- (d) el alérgico a pollo NO es advertido por pavo ni pato (la dieta de
  --     eliminación VIVE: separados significa separados).
  SELECT count(*) INTO v_n FROM expandir_alergenos_a_vigilar(ARRAY['pollo'])
   WHERE declarado IN ('pavo','pato');
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (d): pavo/pato advierten al alérgico a pollo — la dieta de eliminación murió'; END IF;

  -- (e) la pareja prohibida REBOTA HABLANDO.
  v_ok := false;
  BEGIN
    INSERT INTO cat_alergeno_relaciones (alergeno_codigo, relacionado_codigo, tipo)
    VALUES ('pavo', 'pollo', 'es_un');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'relacion_prohibida%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (e): pavo→pollo entró — lo que jamás se agrupa se agrupó'; END IF;
  v_ok := false;
  BEGIN
    INSERT INTO cat_alergeno_relaciones (alergeno_codigo, relacionado_codigo, tipo)
    VALUES ('insectos', 'moluscos_crustaceos', 'es_un');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'relacion_prohibida%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (e2): insectos→moluscos entró'; END IF;

  -- (f) el alérgico a legumbres es advertido EXACTO por soja (soja es_un
  --     legumbres) y el alérgico a soja, IMPRECISO por legumbres.
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['legumbres']) WHERE declarado = 'soja';
  IF NOT FOUND OR NOT v_row.exacta THEN RAISE EXCEPTION 'cinturón (f): soja no advierte exacto al alérgico a legumbres'; END IF;
  SELECT * INTO v_row FROM expandir_alergenos_a_vigilar(ARRAY['soja']) WHERE declarado = 'legumbres';
  IF NOT FOUND OR v_row.exacta THEN RAISE EXCEPTION 'cinturón (f2): legumbres no advierte imprecisa al alérgico a soja'; END IF;

  -- (g) residuo 0 (el cinturón no insertó nada que haya quedado).
  SELECT count(*) INTO v_n FROM cat_alergeno_relaciones;
  IF v_n <> 8 THEN RAISE EXCEPTION 'cinturón (g): % relaciones (se sembraron 8)', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M16 VERDE: 23 entradas, relaciones como dato, ave advierte imprecisa, la dieta de eliminación vive, residuo 0';
END $$;

COMMIT;

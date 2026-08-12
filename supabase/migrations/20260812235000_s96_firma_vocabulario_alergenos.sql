-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago, 3ª tanda) — 🔴 `moluscos_crustaceos` ENTRA AL
-- VOCABULARIO, y el vocabulario entra al MOTOR.
--
-- UNA sola entrada, no dos: en alergias alimentarias moluscos y crustáceos se
-- manejan juntos por reactividad cruzada, y partirlos crea el caso de
-- declarar uno y callar el otro.
--
-- El caso que lo probó: Royal Canin Instinctive 7+ (húmedo de gato) los
-- declara en etiqueta y no había dónde ponerlos. Sin la entrada, la app
-- CALLARÍA sobre un alérgeno que la etiqueta declara con todas las letras.
-- 🔴 BLOQUEO DECLARADO (founder): ningún húmedo de gato llega a la vitrina
-- antes de esta migración.
--
-- LA FORMA, MEDIDA ANTES DE ELEGIR (la propia firma lo ordena): el motor NO
-- tenía vocabulario — `productos.alergenos` era texto libre, cero CHECK, cero
-- catálogo; los 8 tokens vivos se midieron del catálogo real. Un enum o CHECK
-- rígido costaría UNA MIGRACIÓN por cada alérgeno nuevo, y viene una segunda
-- tanda (Cowork está barriendo etiquetas ecuatorianas). ⇒ CATÁLOGO COMO DATO:
-- ampliar el vocabulario = un INSERT en `cat_alergenos`. El trigger valida y
-- NORMALIZA (minúsculas, sin espacios) — el vocabulario cerrado con basura
-- adentro ya se pagó una vez (S95, el CHECK con `&&`).
--
-- 76(g): NO RIGE — catálogo nuevo + trigger; los datos vivos se verifican
-- adentro (los 8 tokens ⊆ seed), no se tocan.
-- Reversa: scripts/s96/2026-08-12-s96-m15-REVERSA.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① EL CATÁLOGO ───────────────────────────────────────────────────────────
CREATE TABLE public.cat_alergenos (
  codigo     text PRIMARY KEY
    CHECK (codigo = lower(codigo) AND codigo !~ '\s' AND codigo <> ''),
  nombre_es  text NOT NULL,
  nota       text,
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cat_alergenos IS
  'S96 (firma 12-ago): el vocabulario CERRADO de alérgenos del catálogo de '
  'productos — cerrado en el dato, abierto por INSERT (la segunda tanda de '
  'etiquetas ecuatorianas entra sin migración). El trigger de productos '
  'valida contra esto. El alérgeno del EXPEDIENTE sigue siendo texto libre '
  'del vet (declarado, no cambiado acá): la costura vive en la exclusión.';

ALTER TABLE public.cat_alergenos ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_alergenos_select ON public.cat_alergenos FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_alergenos_insert ON public.cat_alergenos FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_alergenos_update ON public.cat_alergenos FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_alergenos_delete ON public.cat_alergenos FOR DELETE TO authenticated USING (is_admin());
REVOKE ALL ON public.cat_alergenos FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_alergenos TO authenticated;

-- El seed: los 8 MEDIDOS del catálogo vivo + la entrada de la firma.
INSERT INTO public.cat_alergenos (codigo, nombre_es, nota) VALUES
  ('pollo',    'Pollo',    NULL),
  ('arroz',    'Arroz',    NULL),
  ('cordero',  'Cordero',  NULL),
  ('pescado',  'Pescado',  NULL),
  ('papa',     'Papa',     NULL),
  ('bisonte',  'Bisonte',  NULL),
  ('venado',   'Venado',   NULL),
  ('salmon',   'Salmón',   NULL),
  ('trucha',   'Trucha',   NULL),
  ('moluscos_crustaceos', 'Moluscos y crustáceos',
   'UNA sola entrada por firma founder S96: en alergias alimentarias se '
   'manejan juntos por reactividad cruzada — partirlos crea el caso de '
   'declarar uno y callar el otro. Caso origen: Royal Canin Instinctive 7+.');

-- ── ② EL TRIGGER — valida y NORMALIZA, jamás calla ─────────────────────────
CREATE FUNCTION public._trg_producto_alergenos_vocabulario()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_norm text[];
  v_x    text;
  v_malo text;
BEGIN
  IF NEW.alergenos = '{}' THEN RETURN NEW; END IF;

  -- Normalización: minúsculas y sin bordes — 'Pollo' y 'pollo' son el mismo
  -- alérgeno, y un desajuste de mayúsculas en la exclusión no perdona.
  v_norm := '{}';
  FOREACH v_x IN ARRAY NEW.alergenos LOOP
    v_x := lower(trim(v_x));
    IF v_x = '' THEN CONTINUE; END IF;
    IF NOT v_x = ANY (v_norm) THEN v_norm := v_norm || v_x; END IF;
  END LOOP;

  SELECT a INTO v_malo
    FROM unnest(v_norm) a
   WHERE NOT EXISTS (SELECT 1 FROM cat_alergenos c WHERE c.codigo = a AND c.activo)
   LIMIT 1;
  IF v_malo IS NOT NULL THEN
    RAISE EXCEPTION 'alergeno_desconocido: "%" no está en cat_alergenos — ampliar el vocabulario es un INSERT, no una migración', v_malo
      USING ERRCODE = '22023';
  END IF;

  NEW.alergenos := v_norm;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_producto_alergenos_vocabulario
  BEFORE INSERT OR UPDATE OF alergenos ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public._trg_producto_alergenos_vocabulario();

-- ── ③ EL CINTURÓN ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_familia text;
  v_p1      uuid;
  v_al      text[];
  v_ok      boolean;
  v_n       int;
BEGIN
  -- (a) los datos VIVOS ya están todos en el vocabulario (medido, no supuesto).
  SELECT count(*) INTO v_n
    FROM (SELECT unnest(alergenos) AS a FROM productos) t
   WHERE NOT EXISTS (SELECT 1 FROM cat_alergenos c WHERE c.codigo = t.a AND c.activo);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturón (a): % alérgenos vivos fuera del vocabulario — el seed quedó corto, MEDIR', v_n;
  END IF;

  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;

  -- (b) el caso de la firma ENTRA: un húmedo de gato con moluscos_crustaceos.
  INSERT INTO productos (nombre, marca, familia_codigo, ingredientes_activos, alergenos)
  VALUES ('__cinturon_m15', '__cint', v_familia,
          ARRAY['pescado'], ARRAY['Pescado', ' moluscos_crustaceos '])
  RETURNING id, alergenos INTO v_p1, v_al;
  IF v_al <> ARRAY['pescado','moluscos_crustaceos'] THEN
    RAISE EXCEPTION 'cinturón (b): la normalización dejó % (se esperaba pescado+moluscos_crustaceos)', v_al;
  END IF;

  -- (c) un alérgeno fuera del vocabulario REBOTA HABLANDO.
  v_ok := false;
  BEGIN
    UPDATE productos SET alergenos = ARRAY['kriptonita'] WHERE id = v_p1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'alergeno_desconocido%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (c): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (c): un alérgeno inventado entró al catálogo'; END IF;

  -- (d) ampliar el vocabulario ES un INSERT — el costo que la firma pidió medir.
  INSERT INTO cat_alergenos (codigo, nombre_es) VALUES ('__cint_nuevo', 'De prueba');
  UPDATE productos SET alergenos = ARRAY['__cint_nuevo'] WHERE id = v_p1;
  SELECT alergenos INTO v_al FROM productos WHERE id = v_p1;
  IF v_al <> ARRAY['__cint_nuevo'] THEN
    RAISE EXCEPTION 'cinturón (d): el vocabulario ampliado por INSERT no rigió';
  END IF;

  -- (e) residuo 0.
  DELETE FROM productos WHERE id = v_p1;
  DELETE FROM cat_alergenos WHERE codigo = '__cint_nuevo';
  SELECT count(*) INTO v_n FROM productos WHERE nombre = '__cinturon_m15';
  v_n := v_n + (SELECT count(*) FROM cat_alergenos WHERE codigo = '__cint_nuevo');
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (e): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M15 VERDE: vocabulario como dato, moluscos_crustaceos adentro, ampliar = INSERT, residuo 0';
END $$;

COMMIT;

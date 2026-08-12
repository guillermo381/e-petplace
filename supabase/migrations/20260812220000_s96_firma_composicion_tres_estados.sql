-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago, segunda tanda) — LA COMPOSICIÓN TIENE TRES
-- ESTADOS, NO DOS: verificada · declarada_sin_verificar · ausente.
--
-- SOLO la verificada puede callar. Las otras dos dicen su condición.
--
-- La razón, MEDIDA sobre el catálogo real: 133 productos tienen composición
-- presente y lista de alérgenos INCOMPLETA (ej.: Royal Canin Medium Adulto
-- lleva aceite de pescado y no declara pescado). El candado de la letra
-- cubría «sin composición» — no cubría «con composición incompleta», y ese
-- silencio se ve IDÉNTICO al silencio confiable.
--
-- COROLARIO (misma firma): la advertencia se dispara por COMPOSICIÓN, jamás
-- por nombre — hay 10 productos «hypoallergenic/sensitive» con alérgeno común
-- adentro. El nombre no es una dieta de eliminación. (Ese corolario vive en
-- la letra y en el cargador: acá no hay nada que apague por nombre porque
-- nada se enciende por nombre.)
--
-- Diseño:
--   · `productos.composicion_estado` — vocabulario cerrado, DEFAULT 'ausente'
--     (defensivo: nada cae en 'verificada' por omisión).
--   · Trigger de coherencia: al ENTRAR composición un 'ausente' sube solo a
--     'declarada_sin_verificar'; al CAMBIAR la composición o los alérgenos de
--     un 'verificada' la verificación CADUCA (baja a 'declarada_sin_verificar')
--     — la curaduría fue sobre OTRA composición. Por estructura, no por
--     disciplina de los escritores (proponer_sku_vendedor no se toca).
--   · `declarar_composicion_estado` — la puerta. 'verificada' SOLO e-PetPlace
--     (is_admin). Un 'ausente' con ingredientes presentes REBOTA: sería mentir.
--
-- 76(g): NO RIGE — DDL + backfill de 6 filas medidas (todas `epetplace`,
-- todas con composición transcripta de etiqueta y jamás verificada). Sin
-- anclas, sin veda.
-- Reversa: scripts/s96/2026-08-12-s96-m11-REVERSA.sql (escrita ANTES; declara
-- que revertir borra las verificaciones declaradas).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① LA COLUMNA — vocabulario cerrado, default defensivo ──────────────────
ALTER TABLE public.productos
  ADD COLUMN composicion_estado text NOT NULL DEFAULT 'ausente'
    CONSTRAINT chk_composicion_estado
    CHECK (composicion_estado IN ('verificada','declarada_sin_verificar','ausente'));

COMMENT ON COLUMN public.productos.composicion_estado IS
  'Firma founder S96 (12-ago): verificada (e-PetPlace cotejó la lista de '
  'alérgenos contra la composición — la ÚNICA que puede callar) · '
  'declarada_sin_verificar (composición presente, nadie la cotejó — la '
  'superficie dice su condición) · ausente (sin composición declarada — la '
  'app lo dice, jamás calla). El silencio de una lista incompleta se ve '
  'idéntico al silencio confiable: por eso el estado existe.';

-- ── ② BACKFILL de las 6 vivas — transcriptas de etiqueta, no verificadas ────
UPDATE public.productos
   SET composicion_estado = 'declarada_sin_verificar'
 WHERE ingredientes_activos <> '{}';

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM productos WHERE composicion_estado = 'declarada_sin_verificar';
  IF v_n <> 6 THEN
    RAISE EXCEPTION 'backfill inesperado: % productos declarados (se midieron 6 con composición el 12-ago) — MEDIR antes de seguir', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM productos WHERE composicion_estado = 'verificada';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'el backfill JAMÁS verifica: % filas en verificada', v_n;
  END IF;
END $$;

-- ── ③ EL TRIGGER DE COHERENCIA — estructura, no disciplina ──────────────────
CREATE FUNCTION public._trg_producto_composicion_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nada con composición entra callado como 'ausente'. Y nada entra
    -- 'verificada' por un INSERT: verificar es un acto de la puerta.
    IF NEW.composicion_estado = 'verificada' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    IF NEW.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: solo actúa cuando el escritor NO tocó el estado (si lo tocó, la
  -- puerta ya lo validó — el trigger no le discute a la puerta).
  IF NEW.composicion_estado = OLD.composicion_estado THEN
    IF OLD.composicion_estado = 'verificada'
       AND (NEW.ingredientes_activos IS DISTINCT FROM OLD.ingredientes_activos
            OR NEW.alergenos IS DISTINCT FROM OLD.alergenos) THEN
      -- La verificación fue sobre OTRA composición: caduca.
      NEW.composicion_estado := 'declarada_sin_verificar';
    ELSIF OLD.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_producto_composicion_estado
  BEFORE INSERT OR UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public._trg_producto_composicion_estado();

-- ── ④ LA PUERTA — declarar el estado, con la verificación reservada ────────
CREATE FUNCTION public.declarar_composicion_estado(
  p_producto_id uuid,
  p_estado      text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ingredientes text[];
BEGIN
  IF p_estado NOT IN ('verificada','declarada_sin_verificar','ausente') THEN
    RAISE EXCEPTION 'composicion_estado_invalido: "%"', p_estado USING ERRCODE = '22023';
  END IF;

  SELECT ingredientes_activos INTO v_ingredientes
    FROM productos WHERE id = p_producto_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 'verificada' es un acto de curaduría de e-PetPlace, de nadie más.
  IF p_estado = 'verificada' AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_verifica' USING ERRCODE = '42501';
  END IF;

  -- Quién puede declarar los otros dos: el equipo, o un vendedor con SKU
  -- sobre alguna variante de este producto (mismo predicado que las fotos).
  -- Sin sesión = el motor por dentro (cargador vía claims de admin).
  IF p_estado <> 'verificada'
     AND auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
       SELECT 1 FROM vendedor_skus vs
       JOIN producto_variantes pv ON pv.id = vs.variante_id
       WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;

  -- Un 'ausente' con composición presente sería mentir: la composición ESTÁ.
  IF p_estado = 'ausente' AND v_ingredientes <> '{}' THEN
    RAISE EXCEPTION 'composicion_presente_no_puede_ser_ausente' USING ERRCODE = '22023';
  END IF;

  UPDATE productos
     SET composicion_estado = p_estado,
         updated_at         = now()
   WHERE id = p_producto_id;

  RETURN jsonb_build_object('producto_id', p_producto_id, 'composicion_estado', p_estado);
END;
$$;

REVOKE ALL ON FUNCTION public.declarar_composicion_estado(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_composicion_estado(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.declarar_composicion_estado(uuid, text) IS
  'S96 (firma 12-ago): la puerta del estado de composición. verificada SOLO '
  'e-PetPlace (is_admin); declarada_sin_verificar/ausente también el vendedor '
  'con SKU del producto. ausente con ingredientes presentes rebota.';

-- ── ⑤ EL CINTURÓN — camino real, residuo 0 ──────────────────────────────────
DO $$
DECLARE
  v_familia   text;
  v_admin     uuid;
  v_no_admin  uuid;
  v_p1        uuid;  -- fixture con composición
  v_p2        uuid;  -- fixture sin composición
  v_estado    text;
  v_ok        boolean;
  v_n         int;
BEGIN
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  SELECT p.id INTO v_no_admin FROM profiles p
   WHERE NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo) LIMIT 1;
  IF v_familia IS NULL OR v_admin IS NULL OR v_no_admin IS NULL THEN
    RAISE EXCEPTION 'cinturón sin sujetos: familia=%, admin=%, no_admin=%', v_familia, v_admin, v_no_admin;
  END IF;

  -- (a) el INSERT con composición NO puede entrar callado como ausente,
  --     y NO puede entrar verificado aunque lo pida.
  INSERT INTO productos (nombre, marca, familia_codigo, ingredientes_activos, alergenos, composicion_estado)
  VALUES ('__cinturon_m11_con_compo', '__cint', v_familia, ARRAY['pollo','arroz'], ARRAY['pollo'], 'verificada')
  RETURNING id, composicion_estado INTO v_p1, v_estado;
  IF v_estado <> 'declarada_sin_verificar' THEN
    RAISE EXCEPTION 'cinturón (a): entró como % (verificada por INSERT o ausente con composición)', v_estado;
  END IF;

  -- (b) sin composición entra 'ausente' (el default defensivo).
  INSERT INTO productos (nombre, marca, familia_codigo)
  VALUES ('__cinturon_m11_sin_compo', '__cint', v_familia)
  RETURNING id, composicion_estado INTO v_p2, v_estado;
  IF v_estado <> 'ausente' THEN
    RAISE EXCEPTION 'cinturón (b): sin composición entró como %', v_estado;
  END IF;

  -- (c) un NO-admin no puede verificar — el rebote es la prueba.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_no_admin, 'role', 'authenticated')::text, true);
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'verificada');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'solo_epetplace_verifica%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (c): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (c): un no-admin VERIFICÓ'; END IF;

  -- (d) e-PetPlace verifica.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  PERFORM declarar_composicion_estado(v_p1, 'verificada');
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p1;
  IF v_estado <> 'verificada' THEN RAISE EXCEPTION 'cinturón (d): el admin no pudo verificar (%)', v_estado; END IF;

  -- (e) LA CADUCIDAD: cambia la composición del verificado → la verificación cae.
  UPDATE productos SET alergenos = ARRAY['pollo','pescado'] WHERE id = v_p1;
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p1;
  IF v_estado <> 'declarada_sin_verificar' THEN
    RAISE EXCEPTION 'cinturón (e): la composición cambió y siguió % — la verificación vieja quedó mintiendo', v_estado;
  END IF;

  -- (f) 'ausente' con composición presente REBOTA (sería mentir).
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'ausente');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'composicion_presente_no_puede_ser_ausente%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (f): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (f): se declaró ausente con ingredientes presentes'; END IF;

  -- (g) al 'ausente' le LLEGA composición → sube solo a declarada_sin_verificar.
  UPDATE productos SET ingredientes_activos = ARRAY['salmon'] WHERE id = v_p2;
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p2;
  IF v_estado <> 'declarada_sin_verificar' THEN
    RAISE EXCEPTION 'cinturón (g): llegó composición y quedó % — el silencio ambiguo sigue vivo', v_estado;
  END IF;

  -- (h) vocabulario inventado rebota HABLANDO.
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'confiable');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'composicion_estado_invalido%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (h): un estado inventado entró o rebotó mudo'; END IF;

  -- (i) residuo 0.
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM productos WHERE id IN (v_p1, v_p2);
  SELECT count(*) INTO v_n FROM productos WHERE nombre LIKE '__cinturon_m11%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (i): residuo % — el fixture quedó vivo', v_n; END IF;

  -- (j) la coherencia global del catálogo vivo: nada con composición quedó ausente.
  SELECT count(*) INTO v_n FROM productos
   WHERE ingredientes_activos <> '{}' AND composicion_estado = 'ausente';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (j): % productos con composición dicen ausente', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M11 VERDE: tres estados, verificación reservada, caducidad probada, residuo 0';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago, 3ª tanda) — LA COMPOSICIÓN SE VERIFICA CONTRA
-- LA FICHA DEL PAÍS. El producto canónico declara DE QUÉ MERCADO es su
-- composición. Hoy Ecuador.
--
-- REGLA DURA: una ficha GLOBAL del fabricante NO puede marcar `verificada` —
-- cae en `declarada_sin_verificar`.
--
-- El caso que lo probó (founder, catálogo real): Royal Canin Hepatic canino,
-- MISMO SKU — la ficha ecuatoriana declara hígado de ave hidrolizado; la
-- británica dice solo «proteínas animales hidrolizadas». El catálogo estaba a
-- punto de afirmar implícitamente que un producto no lleva ave cuando en
-- Ecuador sí lo lleva.
--
-- Lo que esto rompe, y es el motivo real del campo: el supuesto NO ESCRITO de
-- que un SKU es un producto. El fabricante formula por planta y por mercado —
-- sin el campo, el día que entremos a Colombia el mismo SKU puede traer otra
-- fórmula y no hay forma de saber cuál composición rige.
--
-- 76(g): NO RIGE — DDL sobre columna nueva; las 6 vivas quedan NULL (fuente
-- de composición NO declarada: afirmar 'EC' sin haberlo medido sería fabricar
-- el dato que esta firma existe para no fabricar).
-- Reversa: scripts/s96/2026-08-12-s96-m14-REVERSA.sql (escrita ANTES, con el
-- cuerpo de la firma vieja embebido).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① EL CAMPO — de qué mercado es la ficha ─────────────────────────────────
ALTER TABLE public.productos
  ADD COLUMN composicion_mercado text
    CONSTRAINT chk_composicion_mercado
    CHECK (composicion_mercado IS NULL
           OR composicion_mercado = 'global'
           OR composicion_mercado ~ '^[A-Z]{2}$');

COMMENT ON COLUMN public.productos.composicion_mercado IS
  'Firma founder S96 (12-ago): de qué mercado es la ficha de composición — '
  'código de país (EC…) o ''global'' (ficha del fabricante sin mercado). '
  'NULL = fuente no declarada. Una ficha global JAMÁS sostiene verificada: '
  'el fabricante formula por planta y por mercado (caso Royal Canin Hepatic: '
  'la ficha EC declara hígado de ave; la británica no).';

-- ── ② LA REGLA DURA, COMO ESTRUCTURA ────────────────────────────────────────
ALTER TABLE public.productos
  ADD CONSTRAINT chk_verificada_exige_mercado
  CHECK (composicion_estado <> 'verificada'
         OR (composicion_mercado IS NOT NULL AND composicion_mercado <> 'global'));

-- ── ③ LA CADUCIDAD APRENDE DEL MERCADO — trigger reemplazado ────────────────
--     (si cambia el mercado de un verificado sin tocar el estado, la
--     verificación fue contra OTRA ficha: caduca.)
CREATE OR REPLACE FUNCTION public._trg_producto_composicion_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.composicion_estado = 'verificada' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    IF NEW.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.composicion_estado = OLD.composicion_estado THEN
    IF OLD.composicion_estado = 'verificada'
       AND (NEW.ingredientes_activos IS DISTINCT FROM OLD.ingredientes_activos
            OR NEW.alergenos IS DISTINCT FROM OLD.alergenos
            OR NEW.composicion_mercado IS DISTINCT FROM OLD.composicion_mercado) THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    ELSIF OLD.composicion_estado = 'ausente' AND NEW.ingredientes_activos <> '{}' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── ④ LA PUERTA, con el mercado — UNA sola firma (L-119) ────────────────────
DROP FUNCTION public.declarar_composicion_estado(uuid, text);

CREATE FUNCTION public.declarar_composicion_estado(
  p_producto_id uuid,
  p_estado      text DEFAULT NULL,   -- NULL = conservar el estado actual
  p_mercado     text DEFAULT NULL    -- NULL = conservar el mercado actual
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ingredientes text[];
  v_estado_final  text;
  v_mercado_final text;
BEGIN
  IF p_estado IS NOT NULL
     AND p_estado NOT IN ('verificada','declarada_sin_verificar','ausente') THEN
    RAISE EXCEPTION 'composicion_estado_invalido: "%"', p_estado USING ERRCODE = '22023';
  END IF;
  IF p_mercado IS NOT NULL AND p_mercado <> 'global' THEN
    IF NOT EXISTS (SELECT 1 FROM country_config WHERE country_code = p_mercado) THEN
      RAISE EXCEPTION 'mercado_invalido: "%" no es un país configurado ni ''global''', p_mercado
        USING ERRCODE = '22023';
    END IF;
  END IF;
  IF p_estado IS NULL AND p_mercado IS NULL THEN
    RAISE EXCEPTION 'composicion_estado_invalido: nada que declarar' USING ERRCODE = '22023';
  END IF;

  SELECT ingredientes_activos,
         coalesce(p_estado, composicion_estado),
         coalesce(p_mercado, composicion_mercado)
    INTO v_ingredientes, v_estado_final, v_mercado_final
    FROM productos WHERE id = p_producto_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 'verificada' es un acto de curaduría de e-PetPlace, de nadie más.
  IF p_estado = 'verificada' AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_verifica' USING ERRCODE = '42501';
  END IF;

  -- Quién puede declarar lo demás: el equipo, o un vendedor con SKU sobre
  -- alguna variante del producto. Sin sesión = el motor por dentro.
  IF p_estado IS DISTINCT FROM 'verificada'
     AND auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
       SELECT 1 FROM vendedor_skus vs
       JOIN producto_variantes pv ON pv.id = vs.variante_id
       WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;

  -- Un 'ausente' con composición presente sería mentir.
  IF v_estado_final = 'ausente' AND v_ingredientes <> '{}' THEN
    RAISE EXCEPTION 'composicion_presente_no_puede_ser_ausente' USING ERRCODE = '22023';
  END IF;

  -- 🔴 LA REGLA DURA, HABLADA (el CHECK de ② es el cinturón mudo detrás):
  -- verificada exige saber CONTRA QUÉ FICHA — y la global no alcanza.
  IF v_estado_final = 'verificada'
     AND (v_mercado_final IS NULL OR v_mercado_final = 'global') THEN
    RAISE EXCEPTION 'verificada_exige_mercado: una ficha global (o sin fuente) no sostiene una verificación'
      USING ERRCODE = '22023';
  END IF;

  UPDATE productos
     SET composicion_estado  = v_estado_final,
         composicion_mercado = v_mercado_final,
         updated_at          = now()
   WHERE id = p_producto_id;

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'composicion_estado', v_estado_final,
    'composicion_mercado', v_mercado_final);
END;
$$;

REVOKE ALL ON FUNCTION public.declarar_composicion_estado(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_composicion_estado(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.declarar_composicion_estado(uuid, text, text) IS
  'S96 (firmas 12-ago): estado y MERCADO de la composición. verificada SOLO '
  'e-PetPlace y SOLO contra ficha de un país real — la global no la sostiene. '
  'NULL en un parámetro = conservar lo que hay.';

-- ── ⑤ EL CINTURÓN ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_familia  text;
  v_admin    uuid;
  v_p1       uuid;
  v_estado   text;
  v_mercado  text;
  v_ok       boolean;
  v_n        int;
BEGIN
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;

  INSERT INTO productos (nombre, marca, familia_codigo, ingredientes_activos, alergenos)
  VALUES ('__cinturon_m14', '__cint', v_familia, ARRAY['pollo'], ARRAY['pollo'])
  RETURNING id INTO v_p1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- (a) verificar SIN mercado rebota HABLANDO.
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'verificada');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'verificada_exige_mercado%' THEN v_ok := true;
    ELSE RAISE EXCEPTION 'cinturón (a): rebotó con otro motivo: %', SQLERRM; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (a): verificó sin mercado — el caso Hepatic sigue abierto'; END IF;

  -- (b) verificar contra ficha GLOBAL rebota igual.
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'verificada', 'global');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'verificada_exige_mercado%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (b): la ficha global sostuvo una verificación'; END IF;

  -- (c) un mercado inventado rebota HABLANDO.
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, NULL, 'XX');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'mercado_invalido%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (c): un mercado inventado entró'; END IF;

  -- (d) el camino bueno: verificada contra EC.
  PERFORM declarar_composicion_estado(v_p1, 'verificada', 'EC');
  SELECT composicion_estado, composicion_mercado INTO v_estado, v_mercado
    FROM productos WHERE id = v_p1;
  IF v_estado <> 'verificada' OR v_mercado <> 'EC' THEN
    RAISE EXCEPTION 'cinturón (d): quedó %/% en vez de verificada/EC', v_estado, v_mercado;
  END IF;

  -- (e) cambiar el MERCADO de un verificado caduca la verificación (trigger).
  UPDATE productos SET composicion_mercado = 'global' WHERE id = v_p1;
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p1;
  IF v_estado <> 'declarada_sin_verificar' THEN
    RAISE EXCEPTION 'cinturón (e): el mercado cambió y siguió % — verificación de otra ficha quedó viva', v_estado;
  END IF;

  -- (f) el CHECK mudo también existe (cinturón del cinturón): escribir
  --     verificada+global directo a la tabla rebota por constraint.
  v_ok := false;
  BEGIN
    UPDATE productos SET composicion_estado = 'verificada' WHERE id = v_p1;  -- mercado quedó 'global'
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (f): el CHECK no rebotó verificada+global'; END IF;

  -- (g) residuo 0.
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM productos WHERE id = v_p1;
  SELECT count(*) INTO v_n FROM productos WHERE nombre = '__cinturon_m14';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (g): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M14 VERDE: verificada exige mercado real, la global no sostiene, la caducidad mira el mercado, residuo 0';
END $$;

COMMIT;

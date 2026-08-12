-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · FIRMA FOUNDER (12-ago, 4ª tanda) — EL CUARTO ESTADO: `no_aplica`.
--
-- verificada · declarada_sin_verificar · ausente · no_aplica
--
-- Para productos donde la composición de ingredientes NO es una categoría que
-- aplique — seis arenas sanitarias del catálogo real. Hoy la app cree que les
-- falta un dato que no existe, y la advertencia honesta de «no tenemos los
-- ingredientes» es absurda sobre una bolsa de arena.
--
-- Reglas: `no_aplica` con ingredientes presentes REBOTA (sería negar una
-- composición que está); si a un `no_aplica` le LLEGA composición, la
-- afirmación quedó falsada y baja a `declarada_sin_verificar` (trigger).
-- `no_aplica` es EXPLÍCITO — jamás se deriva: decir «esta categoría no lleva
-- composición» es un acto de curaduría, no un default.
--
-- 76(g): NO RIGE — CHECK + funciones; cero filas tocadas (las seis arenas
-- entran con el catálogo real, por el cargador). Reversa:
-- scripts/s96/2026-08-12-s96-m17-REVERSA.sql (escrita ANTES; ABORTA si hay
-- filas no_aplica — su destino es decisión humana). Cuerpos pre-M17:
-- scripts/s96/functiondef-pre-m17.sql.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① EL VOCABULARIO GANA EL CUARTO ─────────────────────────────────────────
ALTER TABLE public.productos DROP CONSTRAINT chk_composicion_estado;
ALTER TABLE public.productos ADD CONSTRAINT chk_composicion_estado
  CHECK (composicion_estado IN ('verificada','declarada_sin_verificar','ausente','no_aplica'));

-- Un no_aplica con composición es inexpresable también EN LA TABLA:
ALTER TABLE public.productos ADD CONSTRAINT chk_no_aplica_sin_composicion
  CHECK (composicion_estado <> 'no_aplica' OR ingredientes_activos = '{}');

-- ── ② EL TRIGGER APRENDE EL CUARTO ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_producto_composicion_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.composicion_estado = 'verificada' THEN
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
    IF NEW.composicion_estado IN ('ausente','no_aplica')
       AND NEW.ingredientes_activos <> '{}' THEN
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
    ELSIF OLD.composicion_estado IN ('ausente','no_aplica')
          AND NEW.ingredientes_activos <> '{}' THEN
      -- La composición LLEGÓ: «ausente» quedó viejo y «no_aplica» quedó
      -- FALSADO — los dos bajan al estado honesto.
      NEW.composicion_estado := 'declarada_sin_verificar';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── ③ LA PUERTA ACEPTA EL CUARTO (misma firma — L-119) ─────────────────────
CREATE OR REPLACE FUNCTION public.declarar_composicion_estado(
  p_producto_id uuid,
  p_estado      text DEFAULT NULL,
  p_mercado     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ingredientes text[];
  v_estado_final  text;
  v_mercado_final text;
BEGIN
  IF p_estado IS NOT NULL
     AND p_estado NOT IN ('verificada','declarada_sin_verificar','ausente','no_aplica') THEN
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

  IF p_estado = 'verificada' AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_verifica' USING ERRCODE = '42501';
  END IF;

  IF p_estado IS DISTINCT FROM 'verificada'
     AND auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
       SELECT 1 FROM vendedor_skus vs
       JOIN producto_variantes pv ON pv.id = vs.variante_id
       WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;

  -- Negar una composición que ESTÁ es mentir — en las dos formas de negarla.
  IF v_estado_final IN ('ausente','no_aplica') AND v_ingredientes <> '{}' THEN
    RAISE EXCEPTION 'composicion_presente_no_puede_ser_ausente' USING ERRCODE = '22023';
  END IF;

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

-- ── ④ EL CINTURÓN ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_familia text;
  v_admin   uuid;
  v_p1      uuid;
  v_estado  text;
  v_ok      boolean;
  v_n       int;
BEGIN
  SELECT codigo INTO v_familia FROM cat_familias_producto WHERE activo AND NOT deprecado LIMIT 1;
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- (a) la arena: sin ingredientes, declarada no_aplica — ENTRA.
  INSERT INTO productos (nombre, marca, familia_codigo)
  VALUES ('__cinturon_m17_arena', '__cint', v_familia)
  RETURNING id INTO v_p1;
  PERFORM declarar_composicion_estado(v_p1, 'no_aplica');
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p1;
  IF v_estado <> 'no_aplica' THEN RAISE EXCEPTION 'cinturón (a): la arena quedó % — la app le va a seguir pidiendo ingredientes', v_estado; END IF;

  -- (b) no_aplica CON ingredientes rebota (puerta) — sería negar lo que está.
  UPDATE productos SET ingredientes_activos = ARRAY['pollo'] WHERE id = v_p1;
  --   ↑ al llegar composición, el trigger ya lo bajó a declarada_sin_verificar:
  SELECT composicion_estado INTO v_estado FROM productos WHERE id = v_p1;
  IF v_estado <> 'declarada_sin_verificar' THEN
    RAISE EXCEPTION 'cinturón (b): llegó composición y el no_aplica quedó % — la afirmación falsada sobrevivió', v_estado;
  END IF;
  v_ok := false;
  BEGIN
    PERFORM declarar_composicion_estado(v_p1, 'no_aplica');
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'composicion_presente_no_puede_ser_ausente%' THEN v_ok := true; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (b2): se declaró no_aplica con ingredientes presentes'; END IF;

  -- (c) el CHECK mudo detrás de la puerta también existe.
  v_ok := false;
  BEGIN
    UPDATE productos SET composicion_estado = 'no_aplica' WHERE id = v_p1;
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'cinturón (c): el CHECK no rebotó no_aplica+ingredientes'; END IF;

  -- (d) residuo 0.
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM productos WHERE id = v_p1;
  SELECT count(*) INTO v_n FROM productos WHERE nombre LIKE '__cinturon_m17%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (d): residuo %', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M17 VERDE: no_aplica entra explícito, con composición rebota, falsado baja solo, residuo 0';
END $$;

COMMIT;

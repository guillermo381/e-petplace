-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B6 (mitad de motor) — LAS FOTOS DEL PRODUCTO GANAN SU PUERTA
--
-- El cargador EN GRANDE (decisión founder ② del arranque S96) tiene que poder
-- cargar fotos, y `proponer_sku_vendedor` no las toca. En vez de reescribir
-- esa función de 200 líneas (riesgo de transcripción sobre la puerta más
-- delicada del catálogo), nace una compañera chica con un solo trabajo.
--
-- 🔴 Y ESTO DECIDE LA FORMA DE `productos.imagenes` (D-767 decía que se
-- decidía sola con la primera foto — la primera foto va a entrar por acá):
--   **jsonb array de strings** — cada una un path del bucket
--   `productos-fotos` o una URL completa. **La primera es la portada**, y
--   `imagen_url` (la columna vieja que la vitrina ya lee) se materializa con
--   ella para que ningún lector existente cambie.
--
-- Reversa: scripts/s96/2026-08-12-s96-m9-REVERSA.sql
-- ── DECLARACIÓN 76(g): rige solo en el cinturón (fixture por id, residuo 0).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE FUNCTION public.adjuntar_fotos_producto(
  p_producto_id uuid,
  p_imagenes    jsonb    -- array de strings; la primera es la portada
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_n int; v_portada text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_producto_id) THEN
    RAISE EXCEPTION 'producto_no_existe' USING ERRCODE = '22023';
  END IF;
  -- Quién puede: el equipo (la curaduría es de e-PetPlace) o un vendedor con
  -- SKU sobre alguna variante de este producto (propone la foto de LO SUYO).
  -- Sin sesión = el motor por dentro (mismo patrón que empacar_pedido).
  IF auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
      SELECT 1 FROM vendedor_skus vs
      JOIN producto_variantes pv ON pv.id = vs.variante_id
      WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;
  IF p_imagenes IS NULL OR jsonb_typeof(p_imagenes) <> 'array'
     OR jsonb_array_length(p_imagenes) = 0 THEN
    RAISE EXCEPTION 'imagenes_invalidas: se espera un array de paths/URLs, la primera es la portada'
      USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_imagenes) e
             WHERE jsonb_typeof(e.value) <> 'string' OR length(btrim(e.value #>> '{}')) = 0) THEN
    RAISE EXCEPTION 'imagenes_invalidas: todas las entradas tienen que ser strings no vacíos'
      USING ERRCODE = '22023';
  END IF;

  v_portada := p_imagenes ->> 0;
  UPDATE productos
     SET imagenes = p_imagenes,
         imagen_url = v_portada,     -- la columna vieja sigue diciendo la verdad
         updated_at = now()
   WHERE id = p_producto_id;
  SELECT jsonb_array_length(p_imagenes) INTO v_n;
  RETURN jsonb_build_object('ok', true, 'producto_id', p_producto_id,
                            'fotos', v_n, 'portada', v_portada);
END $$;

REVOKE ALL ON FUNCTION public.adjuntar_fotos_producto(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjuntar_fotos_producto(uuid, jsonb) TO authenticated;

-- ── Cinturón ────────────────────────────────────────────────────────────────
DO $$
DECLARE v_prod uuid; v_img_antes jsonb; v_url_antes text; v_res jsonb;
BEGIN
  SELECT id, imagenes, imagen_url INTO v_prod, v_img_antes, v_url_antes
  FROM productos ORDER BY created_at LIMIT 1;
  IF v_prod IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin productos vivos el cinturón no prueba nada.';
  END IF;

  v_res := adjuntar_fotos_producto(v_prod, '["productos-fotos/__cint9-a.jpg","productos-fotos/__cint9-b.jpg"]'::jsonb);
  IF (v_res->>'fotos')::int <> 2 OR v_res->>'portada' <> 'productos-fotos/__cint9-a.jpg' THEN
    RAISE EXCEPTION 'ABORTA: las fotos no quedaron con su portada.';
  END IF;
  IF (SELECT imagen_url FROM productos WHERE id = v_prod) <> 'productos-fotos/__cint9-a.jpg' THEN
    RAISE EXCEPTION 'ABORTA: imagen_url no se materializó con la portada.';
  END IF;

  -- El array vacío rebota hablado.
  BEGIN
    PERFORM adjuntar_fotos_producto(v_prod, '[]'::jsonb);
    RAISE EXCEPTION 'ABORTA: un array vacío entró.';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'imagenes_invalidas%' THEN RAISE; END IF;
  END;

  -- Restauración exacta del producto real (76(g)).
  UPDATE productos SET imagenes = v_img_antes, imagen_url = v_url_antes, updated_at = now()
   WHERE id = v_prod;
  IF (SELECT imagen_url FROM productos WHERE id = v_prod) IS DISTINCT FROM v_url_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): el producto no volvió a su foto original.';
  END IF;

  RAISE NOTICE 'CINTURÓN S96-M9: la puerta de fotos escribe portada + galería, el array vacío rebota, y el producto real volvió a su estado. Residuo 0.';
END $$;

COMMIT;

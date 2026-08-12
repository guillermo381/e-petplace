-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812234000_s96_firma_composicion_mercado.sql
--
-- Deshace: `productos.composicion_mercado` + el CHECK «verificada exige
-- mercado» + la firma nueva de `declarar_composicion_estado` (vuelve la de
-- DOS parámetros de la M11, embebida acá porque su fuente es la M11 y el
-- DROP la pierde) + el trigger vuelve a NO mirar el mercado.
--
-- ⚠️ QUÉ NO DESHACE: tirar la columna BORRA de qué mercado es cada
--    composición — y revertir REABRE el caso Royal Canin Hepatic: la ficha
--    global vuelve a poder decir «verificada» afirmando de más.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.declarar_composicion_estado(uuid, text, text);

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
  IF p_estado = 'verificada' AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_epetplace_verifica' USING ERRCODE = '42501';
  END IF;
  IF p_estado <> 'verificada'
     AND auth.uid() IS NOT NULL AND NOT is_admin() AND NOT EXISTS (
       SELECT 1 FROM vendedor_skus vs
       JOIN producto_variantes pv ON pv.id = vs.variante_id
       WHERE pv.producto_id = p_producto_id AND es_vendedor_de(vs.cuenta_comercial_id)) THEN
    RAISE EXCEPTION 'no_podes_tocar_este_producto' USING ERRCODE = '42501';
  END IF;
  IF p_estado = 'ausente' AND v_ingredientes <> '{}' THEN
    RAISE EXCEPTION 'composicion_presente_no_puede_ser_ausente' USING ERRCODE = '22023';
  END IF;
  UPDATE productos SET composicion_estado = p_estado, updated_at = now()
   WHERE id = p_producto_id;
  RETURN jsonb_build_object('producto_id', p_producto_id, 'composicion_estado', p_estado);
END;
$$;
REVOKE ALL ON FUNCTION public.declarar_composicion_estado(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_composicion_estado(uuid, text) TO authenticated;

-- El trigger vuelve al cuerpo de la M11 (sin mercado en la caducidad):
-- re-aplicar el CREATE FUNCTION _trg_producto_composicion_estado de
-- 20260812220000_s96_firma_composicion_tres_estados.sql (sección ③).

ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS chk_verificada_exige_mercado;
ALTER TABLE public.productos DROP COLUMN IF EXISTS composicion_mercado;

COMMIT;

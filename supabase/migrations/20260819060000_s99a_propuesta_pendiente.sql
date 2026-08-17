-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LA PROPUESTA PENDIENTE SE VE (pedido de C)
--
-- SU RAZÓN, verbatim: *«sin él no se puede pintar la propuesta pendiente
-- sobre el precio, y un cambio que se acepta y desaparece se lee como que se
-- perdió — y la segunda vez el vendedor deja de pedir.»*
--
-- El caso es REAL y lo produce la banda que acaba de nacer: cuando el precio
-- cae **fuera de banda** o **no hay referencia**, la puerta **guarda la
-- propuesta** (para no perder el trabajo del vendedor) **y rebota**. Sin este
-- dato, la pantalla vuelve a mostrar el precio viejo y **no queda rastro
-- visible de que hay algo esperando aprobación.**
--
-- 🔴 Y EL HECHO LO EMITE EL SERVIDOR, no la pantalla — mismo corte que las
-- razones (firma de C, S99): `propuesta_pendiente` es una VERDAD, no una
-- presentación. *Comparar en el cliente parece trivial hasta que dos
-- superficies lo comparan distinto: una olvida el caso NULL y otra no, y el
-- vendedor ve «pendiente» en una pantalla y nada en la otra.*
--
-- Se agrega AL FINAL: `CREATE OR REPLACE VIEW` admite columnas nuevas al
-- final y no admite reordenar (lo cobró `20260819040000` con un 42P16).
--
-- 76(g): NO RIGE. REVERSA: recrear la vista sin las dos últimas columnas.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_skus_vendedor
WITH (security_invoker = true) AS
SELECT
  vs.id, vs.cuenta_comercial_id, vs.sku_vendedor, vs.variante_id,
  vs.stock_disponible, vs.stock_reservado, vs.estado, vs.motivo_rechazo,
  vs.precio_propuesto, vs.created_at,
  pv.presentacion,
  pv.precio_referencia,
  round(pv.precio_referencia * (1 - COALESCE((SELECT valor::numeric FROM app_config WHERE clave='precio_banda_pct'), 15)/100), 2) AS banda_min,
  round(pv.precio_referencia * (1 + COALESCE((SELECT valor::numeric FROM app_config WHERE clave='precio_banda_pct'), 15)/100), 2) AS banda_max,
  p.id AS producto_id, p.nombre AS producto_nombre, p.marca AS producto_marca,
  p.composicion_estado, p.momentos_aplicables, p.especies_aplicables,
  p.imagen_url, p.imagenes,
  o.id AS oferta_id, o.precio AS oferta_precio, o.estado AS oferta_estado, o.hay_stock,
  (
    CASE
      WHEN vs.estado = 'rechazado'                     THEN ARRAY['sku_rechazado']
      WHEN vs.estado IN ('propuesto', 'en_revision')   THEN ARRAY['sku_en_revision']
      WHEN o.id IS NULL                                THEN ARRAY['sin_precio_propuesto']
      WHEN o.estado <> 'publicada'                     THEN ARRAY['oferta_no_publicada']
      ELSE ARRAY[]::text[]
    END
    || CASE WHEN vs.stock_disponible <= 0 THEN ARRAY['sin_stock'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.composicion_estado IS NULL OR p.composicion_estado = 'ausente'
            THEN ARRAY['composicion_ausente'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.momentos_aplicables IS NULL OR cardinality(p.momentos_aplicables) = 0
            THEN ARRAY['sin_momento_etario'] ELSE ARRAY[]::text[] END
    || CASE WHEN p.imagen_url IS NULL
                 AND (p.imagenes IS NULL OR jsonb_array_length(
                        CASE WHEN jsonb_typeof(p.imagenes) = 'array' THEN p.imagenes ELSE '[]'::jsonb END) = 0)
            THEN ARRAY['sin_foto'] ELSE ARRAY[]::text[] END
  ) AS razones,
  -- 🔴 HAY ALGO ESPERANDO APROBACIÓN: el vendedor pidió un precio y el
  -- publicado sigue siendo otro. **Es un HECHO, y por eso lo dice el
  -- servidor.** Falso cuando no hay propuesta o cuando ya coincide con lo
  -- publicado —o sea, cuando ya se aplicó—: *una marca que no se apaga al
  -- cumplirse deja de significar algo en dos días.*
  (vs.precio_propuesto IS NOT NULL AND o.precio IS DISTINCT FROM vs.precio_propuesto)
    AS propuesta_pendiente
FROM public.vendedor_skus vs
JOIN public.producto_variantes pv ON pv.id = vs.variante_id
JOIN public.productos p           ON p.id = pv.producto_id
LEFT JOIN public.ofertas o        ON o.sku_id = vs.id AND o.estado = 'publicada'
WHERE vs.activo;

REVOKE ALL ON public.v_skus_vendedor FROM PUBLIC, anon;
GRANT SELECT ON public.v_skus_vendedor TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el brazo que importa es que la marca SE APAGUE al cumplirse.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_sku uuid; v_of uuid; v_precio numeric; v_pend boolean; v_n int;
BEGIN
  SELECT vs.id, o.id, o.precio INTO v_sku, v_of, v_precio
    FROM vendedor_skus vs JOIN ofertas o ON o.sku_id = vs.id AND o.estado='publicada'
   WHERE vs.activo LIMIT 1;
  IF v_sku IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no hay sku con oferta publicada'; END IF;

  -- ① Sin propuesta ⇒ falso.
  UPDATE vendedor_skus SET precio_propuesto = NULL WHERE id = v_sku;
  SELECT propuesta_pendiente INTO v_pend FROM v_skus_vendedor WHERE id = v_sku;
  IF v_pend THEN RAISE EXCEPTION 'CINTURÓN ①: sin propuesta y dice pendiente'; END IF;

  -- ② Propuesta DISTINTA del publicado ⇒ verdadero.
  UPDATE vendedor_skus SET precio_propuesto = v_precio + 1 WHERE id = v_sku;
  SELECT propuesta_pendiente INTO v_pend FROM v_skus_vendedor WHERE id = v_sku;
  IF NOT v_pend THEN RAISE EXCEPTION 'CINTURÓN ②: hay propuesta distinta y NO dice pendiente'; END IF;

  -- ③ Propuesta IGUAL al publicado ⇒ falso (ya se aplicó). Sin este brazo,
  --    la marca quedaría prendida para siempre después del primer cambio.
  UPDATE vendedor_skus SET precio_propuesto = v_precio WHERE id = v_sku;
  SELECT propuesta_pendiente INTO v_pend FROM v_skus_vendedor WHERE id = v_sku;
  IF v_pend THEN RAISE EXCEPTION 'CINTURÓN ③: la propuesta YA se aplicó y sigue diciendo pendiente'; END IF;

  -- Se deshace: el cinturón no deja residuo.
  UPDATE vendedor_skus SET precio_propuesto = NULL WHERE id = v_sku;
  SELECT count(*) INTO v_n FROM vendedor_skus WHERE id = v_sku AND precio_propuesto IS NOT NULL;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURÓN: quedó residuo'; END IF;

  RAISE NOTICE 'CINTURÓN propuesta_pendiente: ①②③ verdes — y la marca SE APAGA al cumplirse';
END $$;

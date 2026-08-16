-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · EL ESPEJO ORDENA IGUAL, Y LAS RAZONES TIENEN UN SOLO DUEÑO
--
-- DOS DECISIONES DE MESA, las dos con su razón:
--
-- ① 🔴 EL ORDEN DIVERGÍA ENTRE LAS DOS CARAS (hallazgo de C): el lado
--    vendedor ordenaba `created_at DESC, id ASC` y **la vitrina no ordenaba
--    en absoluto**. *No se notaba porque el orden es invisible hasta que
--    alguien pagina.* Su lectura, que es ley y va a N17: **cambiar de modo
--    cambia CÓMO se ve, jamás QUÉ se ve — y una lista en otro orden es otro
--    QUÉ.** ⇒ las dos adoptan **`producto_nombre ASC, id ASC`**, que además
--    es el cursor que B firmó.
--    *Y su freno, registrado: NO se hizo el orden elegible por el vendedor —
--    «hoy no hay caso y sería un control sin uso».*
--
-- ② 🔴 EL SERVIDOR EMITE LAS RAZONES; EL CLIENTE DICE DE QUIÉN SON (firma de
--    C, ratificada): filtrar por razón en SQL **y** derivarla en TS dejaría
--    **dos implementaciones de la misma verdad, y van a divergir**. El corte:
--    **el servidor decide QUÉ ES VERDAD** (emite los códigos y filtra por
--    ellos) · **el cliente decide DE QUIÉN ES y CÓMO SE DICE**. *El dueño de
--    una razón es letra de producto y puede cambiar sin que cambie una
--    columna; los códigos son lo contrario.*
--
-- ⚠️ LOS OCHO CÓDIGOS SON VERBATIM de `RazonAlcance` en
--    `packages/api/src/wrappers/despensa-vendedor.ts` — **y desde esta
--    migración el TS deja de derivarlos: los CONSUME.** Si alguien agrega un
--    código, se agrega acá; el TS solo le pone dueño y voz.
--
-- 76(g): NO RIGE. REVERSA: `DROP VIEW public.v_vitrina_publicada;` y
-- restaurar `v_skus_vendedor` a su forma de `20260819030000`.
-- ⚠️ Revertir la del vendedor deja al TS consumiendo una columna que ya no
-- existe ⇒ **la reversa exige revertir también el bundle** (D-662).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LA VISTA DEL VENDEDOR gana razones, especie y el eje etario ──────────
-- DROP y no REPLACE: `CREATE OR REPLACE VIEW` no puede insertar columnas en
-- el medio ni reordenarlas (rebota 42P16). Se recrea entera y se re-conceden
-- los grants abajo — que es justo por lo que se re-conceden EXPLÍCITOS y no
-- se dan por heredados.
DROP VIEW IF EXISTS public.v_skus_vendedor;
CREATE VIEW public.v_skus_vendedor
WITH (security_invoker = true) AS
SELECT
  vs.id, vs.cuenta_comercial_id, vs.sku_vendedor, vs.variante_id,
  vs.stock_disponible, vs.stock_reservado, vs.estado, vs.motivo_rechazo,
  vs.precio_propuesto, vs.created_at,
  pv.presentacion,
  p.id AS producto_id, p.nombre AS producto_nombre, p.marca AS producto_marca,
  p.composicion_estado, p.momentos_aplicables, p.especies_aplicables,
  p.imagen_url, p.imagenes,
  o.id AS oferta_id, o.precio AS oferta_precio, o.estado AS oferta_estado, o.hay_stock,
  -- LAS RAZONES, en el ÚNICO lugar donde viven. Mismo orden y mismos
  -- códigos que la cascada del wrapper: el primer bloque es EXCLUYENTE
  -- (el estado del SKU manda sobre el de la oferta), los otros se suman.
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
    -- «sin foto» = ni portada propia ni ninguna en la galería. El TS lo
    -- resolvía con `fotosDeProducto(...).portada === null`; acá es el mismo
    -- predicado sobre las dos columnas que esa función mira.
    || CASE WHEN p.imagen_url IS NULL
                 AND (p.imagenes IS NULL OR jsonb_array_length(
                        CASE WHEN jsonb_typeof(p.imagenes) = 'array' THEN p.imagenes ELSE '[]'::jsonb END) = 0)
            THEN ARRAY['sin_foto'] ELSE ARRAY[]::text[] END
  ) AS razones
FROM public.vendedor_skus vs
JOIN public.producto_variantes pv ON pv.id = vs.variante_id
JOIN public.productos p           ON p.id = pv.producto_id
LEFT JOIN public.ofertas o        ON o.sku_id = vs.id AND o.estado = 'publicada'
WHERE vs.activo;

REVOKE ALL ON public.v_skus_vendedor FROM PUBLIC, anon;
GRANT SELECT ON public.v_skus_vendedor TO authenticated;

-- ── ② LA VITRINA APLANADA — para que el espejo ordene IGUAL ────────────────
-- Misma razón que la del vendedor: PostgREST **acepta y ignora** el `order`
-- por columna embebida (medido), así que sin vista la vitrina no puede
-- ordenar por nombre y las dos caras divergen.
CREATE OR REPLACE VIEW public.v_vitrina_publicada
WITH (security_invoker = true) AS
SELECT
  o.id AS oferta_id, o.cuenta_comercial_id, o.precio, o.moneda, o.country_code,
  o.hay_stock,
  pv.id AS variante_id, pv.presentacion, pv.contenido_valor, pv.contenido_unidad, pv.peso_kg,
  p.id AS producto_id, p.nombre, p.marca, p.familia_codigo,
  p.especies_aplicables, p.momentos_aplicables, p.alergenos,
  p.composicion_estado, p.es_dieta_prescripcion, p.imagen_url, p.imagenes
FROM public.ofertas o
JOIN public.producto_variantes pv ON pv.id = o.variante_id AND pv.activo
JOIN public.productos p           ON p.id = pv.producto_id AND p.estado = 'activo'
WHERE o.estado = 'publicada';

COMMENT ON VIEW public.v_vitrina_publicada IS
  'La vitrina con el producto APLANADO. Existe para que el orden del espejo '
  'sea el MISMO de las dos caras (nombre ASC, id ASC): PostgREST no ordena '
  'por columna embebida. security_invoker: la RLS de ofertas sigue mandando.';

REVOKE ALL ON public.v_vitrina_publicada FROM PUBLIC;
GRANT SELECT ON public.v_vitrina_publicada TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_n int; v_vitrina int; v_ofertas int; v_mal int;
BEGIN
  -- ① Las razones EXISTEN y discriminan: un SKU sin stock tiene 'sin_stock'
  --    y uno con stock NO lo tiene. (Sin este brazo, un array vacío para
  --    todos daría verde.)
  SELECT count(*) INTO v_mal FROM v_skus_vendedor
   WHERE cuenta_comercial_id = v_cta
     AND ((stock_disponible <= 0) <> ('sin_stock' = ANY(razones)));
  IF v_mal <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ①: % filas donde `sin_stock` no coincide con el stock', v_mal;
  END IF;
  SELECT count(*) INTO v_n FROM v_skus_vendedor
   WHERE cuenta_comercial_id = v_cta AND 'sin_stock' = ANY(razones);
  IF v_n = 0 THEN
    RAISE EXCEPTION 'CINTURÓN ①: NINGUNA fila con sin_stock — el brazo no discrimina con estos datos';
  END IF;
  RAISE NOTICE 'CINTURÓN ①: % SKU con sin_stock, y el predicado coincide fila por fila', v_n;

  -- ② La vitrina aplanada trae EXACTAMENTE lo mismo que la consulta con
  --    embeds (ni una fila de más por el join, ni una de menos por el filtro).
  SELECT count(*) INTO v_vitrina FROM v_vitrina_publicada;
  SELECT count(*) INTO v_ofertas
    FROM ofertas o
    JOIN producto_variantes pv ON pv.id = o.variante_id AND pv.activo
    JOIN productos p ON p.id = pv.producto_id AND p.estado = 'activo'
   WHERE o.estado = 'publicada';
  IF v_vitrina <> v_ofertas THEN
    RAISE EXCEPTION 'CINTURÓN ②: la vista trae % y la consulta directa %', v_vitrina, v_ofertas;
  END IF;

  -- ③ La clave de orden del ESPEJO es única en las DOS caras — si no, el
  --    cursor de una de las dos salta filas.
  SELECT count(*) - count(DISTINCT (nombre, oferta_id)) INTO v_mal FROM v_vitrina_publicada;
  IF v_mal <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ③: (nombre, oferta_id) repite % veces en la vitrina', v_mal;
  END IF;

  -- ④ La RLS sigue rigiendo del lado del vendedor (la vitrina ES pública).
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL ROLE authenticated;
  IF (SELECT count(*) FROM v_skus_vendedor) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ④: la vista del vendedor entregó filas SIN sesión';
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  RAISE NOTICE 'CINTURÓN espejo: ①②③④ verdes — vitrina % filas, clave única en las dos caras', v_vitrina;
END $$;

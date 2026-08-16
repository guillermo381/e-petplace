-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · `v_skus_vendedor` — LA VISTA QUE HACE POSIBLE EL ORDEN QUE B FIRMÓ
--
-- EL CONTRATO DE PAGINACIÓN, decidido por B: **CURSOR, no offset** —
-- *«offset asume una lista quieta, y acá el que la lee es el que la mueve»*
-- (el vendedor publica, despublica y ajusta mientras recorre; con 722 filas
-- son 24 páginas). Su orden: **`nombre ASC, id ASC`** — el nombre porque es
-- como el vendedor busca, y el `id` porque **en 722 filas con variantes los
-- homónimos no son el borde: son lo normal.**
--
-- 🔴 POR QUÉ HACE FALTA UNA VISTA, y es una MEDICIÓN, no una preferencia:
-- el nombre vive en `productos`, dos embeds más abajo. **PostgREST ACEPTA
-- `order('nombre', { referencedTable: … })` SIN ERROR Y NO ORDENA LAS FILAS
-- DE ARRIBA** — probado el 16-ago contra la base: devolvió *Broadline ·
-- Advantix · CORDERO · GASTRO*. *Es la clase «verosímil pero falso» en su
-- forma más barata de creer: no falla, simplemente no hace lo que dice.*
-- ⇒ el nombre tiene que ser **columna de primer nivel**, y eso es una vista.
--
-- Y con ella caen las tres piezas del contrato de una sola vez: **orden
-- estable** · **`count: 'exact'`** para el TOTAL · y **keyset** por
-- `(producto_nombre, id)`, que es único.
--
-- `security_invoker = true`: la vista NO relaja nada — la RLS de
-- `vendedor_skus` (`es_vendedor_de OR is_admin`) sigue decidiendo qué filas
-- ve cada quien. *Una vista `definer` acá sería una puerta trasera al
-- inventario de otro negocio.*
--
-- 76(g): NO RIGE (objeto nuevo, sin backfill).
-- REVERSA: `DROP VIEW IF EXISTS public.v_skus_vendedor;` — no deshace nada
-- de datos; el lector viejo (embeds) sigue existiendo hasta que se migre.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_skus_vendedor
WITH (security_invoker = true) AS
SELECT
  vs.id,
  vs.cuenta_comercial_id,
  vs.sku_vendedor,
  vs.variante_id,
  vs.stock_disponible,
  vs.stock_reservado,
  vs.estado,
  vs.motivo_rechazo,
  vs.precio_propuesto,
  vs.created_at,
  pv.presentacion,
  p.id                  AS producto_id,
  -- 🔴 LA RAZÓN DE SER DE LA VISTA: el nombre, arriba, ordenable.
  p.nombre              AS producto_nombre,
  p.marca               AS producto_marca,
  p.composicion_estado,
  p.momentos_aplicables,
  p.imagen_url,
  p.imagenes,
  o.id                  AS oferta_id,
  o.precio              AS oferta_precio,
  o.estado              AS oferta_estado,
  o.hay_stock
FROM public.vendedor_skus vs
JOIN public.producto_variantes pv ON pv.id = vs.variante_id
JOIN public.productos p           ON p.id = pv.producto_id
LEFT JOIN public.ofertas o        ON o.sku_id = vs.id AND o.estado = 'publicada'
WHERE vs.activo;

COMMENT ON VIEW public.v_skus_vendedor IS
  'Los SKU del vendedor con su producto APLANADO. Existe porque PostgREST no '
  'ordena las filas de arriba por una columna embebida (lo acepta y lo ignora), '
  'y el orden firmado es por nombre. security_invoker: la RLS de vendedor_skus '
  'sigue mandando.';

REVOKE ALL ON public.v_skus_vendedor FROM PUBLIC, anon;
GRANT SELECT ON public.v_skus_vendedor TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — tres brazos, y el ② es el que justifica la vista entera.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_cta uuid := 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  v_vista int; v_tabla int; v_dup int; v_ordenado boolean;
BEGIN
  -- ① LA VISTA NO PIERDE NI AGREGA FILAS.
  SELECT count(*) INTO v_vista FROM v_skus_vendedor WHERE cuenta_comercial_id = v_cta;
  SELECT count(*) INTO v_tabla FROM vendedor_skus WHERE cuenta_comercial_id = v_cta AND activo;
  IF v_vista <> v_tabla THEN
    RAISE EXCEPTION 'CINTURÓN ①: la vista trae % y la tabla %', v_vista, v_tabla;
  END IF;

  -- ② LA CLAVE DE ORDEN ES ÚNICA — sin esto el cursor de B no es cursor.
  --    (`producto_nombre` SOLO empata: es exactamente el caso que el `id`
  --    viene a resolver, y acá se MIDE en vez de suponerse.)
  SELECT count(*) - count(DISTINCT (producto_nombre, id)) INTO v_dup
    FROM v_skus_vendedor WHERE cuenta_comercial_id = v_cta;
  IF v_dup <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ②: la clave (producto_nombre, id) repite % veces', v_dup;
  END IF;
  SELECT count(*) - count(DISTINCT producto_nombre) INTO v_dup
    FROM v_skus_vendedor WHERE cuenta_comercial_id = v_cta;
  IF v_dup = 0 THEN
    RAISE NOTICE 'CINTURÓN ②: (aviso) hoy los nombres NO empatan en esta cuenta — el desempate no se prueba con estos datos, pero se queda: es la condición del cursor';
  ELSE
    RAISE NOTICE 'CINTURÓN ②: % nombres empatados ⇒ el desempate por id NO es teórico', v_dup;
  END IF;

  -- ③ SE PUEDE ORDENAR POR NOMBRE (que es lo que PostgREST no podía hacer).
  SELECT bool_and(ok) INTO v_ordenado FROM (
    SELECT producto_nombre >= lag(producto_nombre) OVER (ORDER BY producto_nombre, id) IS NOT FALSE AS ok
    FROM v_skus_vendedor WHERE cuenta_comercial_id = v_cta) z;
  IF NOT COALESCE(v_ordenado, true) THEN
    RAISE EXCEPTION 'CINTURÓN ③: el orden por nombre no es monótono';
  END IF;

  -- La RLS sigue mandando: sin sesión, la vista no entrega nada.
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL ROLE authenticated;
  IF (SELECT count(*) FROM v_skus_vendedor) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ④: la vista entregó filas SIN sesión — security_invoker no está rigiendo';
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  RAISE NOTICE 'CINTURÓN v_skus_vendedor: ①②③④ verdes — % filas, clave única, RLS rigiendo', v_vista;
END $$;

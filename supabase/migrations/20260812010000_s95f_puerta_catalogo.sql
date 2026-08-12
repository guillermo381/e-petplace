-- ═══════════════════════════════════════════════════════════════════════════
-- S95-F · LA PUERTA DEL CATÁLOGO — dos funciones, una para proponer y otra
--          para publicar. (11-ago-2026)
--
-- POR QUÉ EXISTE, en una línea: el relevamiento del portal admin midió
-- **104 escrituras directas a tabla contra 1 solo RPC**, y esta migración se
-- escribe el MISMO día — la deuda que no se repite es la que se acaba de
-- medir. El cargador del catálogo inicial NO va a escribir una sola tabla:
-- va a llamar a estas dos funciones, que son **las mismas que va a usar el
-- vendedor desde su app**.
--
--   *Estrenamos nosotros la puerta, no el primer vendedor.*
--   (`MODELO_DESPENSA` §4.2, enmienda firmada S95-F.)
--
-- ── DECLARACIÓN 76(g) — VEDA DE ESCRITURA ─────────────────────────────────
--   **DECLARADA Y NO RIGE.** Esta migración no hace backfill, no ancla ids y
--   no toca una sola fila de negocio. Crea un índice sobre una tabla que se
--   midió en **0 filas**, y dos funciones nuevas. La ventana de fixtures del
--   cinturón se abre y se cierra dentro de una SUBTRANSACCIÓN que se
--   revierte por construcción (ver §4) ⇒ **residuo 0 garantizado por el
--   mecanismo, no por la prolijidad de quien la escribió.**
--
-- ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR (regla 22: nombres medidos) ─────────
--   · `productos` = 0 filas · `producto_variantes` = 0 · `vendedor_skus` = 0
--     · `ofertas` = 0  ⇒ el índice único nuevo no puede chocar con nada.
--   · `productos` **NO tiene ninguna clave natural** — sin `codigo`, sin
--     unique sobre nombre. Sin eso la idempotencia era imposible ⇒ §1.
--   · `producto_variantes.impuesto_codigo` ya es **NOT NULL con FK** a
--     `cat_tasas_impuesto` ⇒ "variante publicada sin código de tasa" **ya es
--     inexpresable**. La función igual lo valida ANTES, para que el error
--     sea hablado en vez de una violación de FK.
--   · `uq_oferta_publicada_por_variante` — UNIQUE parcial sobre
--     `ofertas(variante_id) WHERE estado='publicada'` — **YA EXISTE**. La
--     segunda oferta publicada ya es inexpresable; la función la rechaza
--     hablando para no depender del mensaje de Postgres.
--   · El label del enum **no es `vendedor`: es `seller_productos`**.
--   · `es_vendedor_de(uuid)` **ya existe** y ata owner + rol activo. **Se
--     REÚSA, no se copia** (L-175).
--   · `cuenta_roles` tiene **6 filas, las 6 `prestador_servicios`** ⇒
--     **cero cuentas con rol de vendedor.** Las funciones nacen correctas y
--     **sin poder ejecutarse contra datos reales todavía** — eso es freno
--     del founder, no de esta migración.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- §1 · LA CLAVE NATURAL DE `productos`
--
-- Sin esto la idempotencia del cargador sería un `SELECT` optimista con
-- ventana de carrera. Con esto, **"dos productos iguales" pasa a ser
-- inexpresable** — que es la forma que la casa eligió para los estados malos
-- (L-222: no se vigila, se vuelve imposible).
--
-- La llave es (familia, marca, nombre) normalizada: es la identidad que un
-- humano usa para decir "este producto ya está cargado".
-- ═══════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_natural
  ON public.productos (familia_codigo, lower(coalesce(marca, '')), lower(nombre));

COMMENT ON INDEX public.uq_producto_natural IS
  'S95-F · clave natural del catálogo: un producto es único por familia+marca+nombre. '
  'Es lo que hace idempotente a proponer_sku_vendedor(). Nació con la tabla en 0 filas.';

-- ═══════════════════════════════════════════════════════════════════════════
-- §2 · EL HELPER QUE FALTABA — ¿la CUENTA es vendedora?
--
-- `es_vendedor_de()` responde "¿el que llama es el vendedor de esta cuenta?"
-- — ata QUIÉN LLAMA con LA CUENTA. Acá hace falta la otra mitad: **¿esta
-- cuenta tiene el rol de vendedor, sin importar quién pregunte?**
--
-- Son dos preguntas distintas y mezclarlas tiene consecuencia: si el gate
-- fuera solo `es_vendedor_de() OR is_admin()`, **un admin podría proponer
-- para una cuenta que NO es vendedora** y el catálogo quedaría colgando de
-- una cuenta sin rol. Por eso el rol de la cuenta se verifica SIEMPRE,
-- incluso cuando quien llama es admin.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._cuenta_es_vendedora(p_cuenta_comercial_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      AND cr.tipo_actor = 'seller_productos'
      AND cr.estado     = 'activo'
  );
$$;

COMMENT ON FUNCTION public._cuenta_es_vendedora(uuid) IS
  'S95-F · ¿la CUENTA tiene rol de vendedor activo? Es la mitad que le falta a '
  'es_vendedor_de(), que ata quién llama. Se verifica SIEMPRE, también para admin.';

-- ═══════════════════════════════════════════════════════════════════════════
-- §3 · LAS DOS FUNCIONES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① PROPONER ────────────────────────────────────────────────────────────
-- Crea (o actualiza) el producto canónico, su variante y el SKU del vendedor.
-- El SKU **nace en `propuesto`** — publicar es otro acto, con otro actor.
--
-- IDEMPOTENTE por construcción: los tres UPSERT van contra claves únicas
-- reales. Correrla dos veces converge; **no duplica y no revierte estado**.
--
-- 🔴 LA REGLA QUE NO SE VE Y ES LA QUE MÁS IMPORTA: al reproponer un SKU que
--    ya fue **aceptado**, el estado NO vuelve a `propuesto`. Si volviera,
--    correr el cargador otra vez **despublicaría la vitrina en silencio.**
CREATE OR REPLACE FUNCTION public.proponer_sku_vendedor(
  p_cuenta_comercial_id uuid,
  p_producto            jsonb,
  p_variante            jsonb,
  p_sku                 jsonb,
  p_origen_carga        text DEFAULT 'epetplace'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_familia      text := nullif(trim(p_producto ->> 'familia_codigo'), '');
  v_nombre       text := nullif(trim(p_producto ->> 'nombre'), '');
  v_marca        text := nullif(trim(p_producto ->> 'marca'), '');
  v_var_codigo   text := nullif(trim(p_variante ->> 'codigo'), '');
  v_presentacion text := nullif(trim(p_variante ->> 'presentacion'), '');
  v_impuesto     text := nullif(trim(p_variante ->> 'impuesto_codigo'), '');
  v_sku_vendedor text := nullif(trim(p_sku ->> 'sku_vendedor'), '');
  v_producto_id  uuid;
  v_variante_id  uuid;
  v_sku_id       uuid;
  v_prod_nuevo   boolean;
  v_var_nuevo    boolean;
  v_sku_nuevo    boolean;
  v_sku_estado   text;
BEGIN
  -- ── Gate de sesión ──────────────────────────────────────────────────────
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  -- ── Gate de autorización: quién llama ───────────────────────────────────
  IF NOT (es_vendedor_de(p_cuenta_comercial_id) OR is_admin()) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  -- ── Gate de la CUENTA: tiene que ser vendedora, la llame quien la llame ──
  IF NOT _cuenta_es_vendedora(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION
      'cuenta_sin_rol_vendedor: la cuenta % no tiene rol seller_productos activo',
      p_cuenta_comercial_id USING ERRCODE = '22023';
  END IF;

  -- ── Campos que no se inventan ───────────────────────────────────────────
  IF v_familia      IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.familia_codigo'  USING ERRCODE = '22023'; END IF;
  IF v_nombre       IS NULL THEN RAISE EXCEPTION 'campo_requerido: producto.nombre'          USING ERRCODE = '22023'; END IF;
  IF v_var_codigo   IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.codigo'          USING ERRCODE = '22023'; END IF;
  IF v_presentacion IS NULL THEN RAISE EXCEPTION 'campo_requerido: variante.presentacion'    USING ERRCODE = '22023'; END IF;
  IF v_sku_vendedor IS NULL THEN RAISE EXCEPTION 'campo_requerido: sku.sku_vendedor'         USING ERRCODE = '22023'; END IF;

  -- ── El código de tasa es OBLIGATORIO (§4.4-③, firmado) ──────────────────
  --    La FK ya lo haría imposible; acá se rechaza HABLANDO, porque un
  --    "violates foreign key constraint" no le dice nada a quien carga.
  IF v_impuesto IS NULL THEN
    RAISE EXCEPTION 'impuesto_codigo_requerido: la variante % no declara código de tasa', v_var_codigo
      USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_tasas_impuesto t WHERE t.codigo = v_impuesto AND t.activo) THEN
    RAISE EXCEPTION 'impuesto_codigo_desconocido: "%" no existe o no está activo en cat_tasas_impuesto', v_impuesto
      USING ERRCODE = '22023';
  END IF;

  -- ── La familia sale del catálogo, no de la imaginación ──────────────────
  IF NOT EXISTS (SELECT 1 FROM cat_familias_producto f
                  WHERE f.codigo = v_familia AND f.activo AND NOT f.deprecado) THEN
    RAISE EXCEPTION 'familia_desconocida: "%" no existe, está inactiva o está deprecada', v_familia
      USING ERRCODE = '22023';
  END IF;

  IF p_origen_carga NOT IN ('vendedor', 'epetplace', 'asistido_por_ia') THEN
    RAISE EXCEPTION 'origen_carga_invalido: "%"', p_origen_carga USING ERRCODE = '22023';
  END IF;

  -- ── ① EL PRODUCTO CANÓNICO ──────────────────────────────────────────────
  INSERT INTO productos (
    nombre, marca, descripcion, familia_codigo,
    especies_aplicables, tallas_aplicables, momentos_aplicables,
    ingredientes_activos, alergenos, es_dieta_prescripcion,
    origen_carga, creado_por, estado
  ) VALUES (
    v_nombre, v_marca, nullif(trim(coalesce(p_producto ->> 'descripcion', '')), ''), v_familia,
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'especies_aplicables',  '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'tallas_aplicables',    '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'momentos_aplicables',  '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'ingredientes_activos', '[]'::jsonb)) x), '{}'),
    coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(coalesce(p_producto -> 'alergenos',            '[]'::jsonb)) x), '{}'),
    coalesce((p_producto ->> 'es_dieta_prescripcion')::boolean, false),
    p_origen_carga, v_uid, 'activo'
  )
  ON CONFLICT (familia_codigo, lower(coalesce(marca, '')), lower(nombre)) DO UPDATE
    SET descripcion           = coalesce(EXCLUDED.descripcion, productos.descripcion),
        especies_aplicables   = CASE WHEN EXCLUDED.especies_aplicables   = '{}' THEN productos.especies_aplicables   ELSE EXCLUDED.especies_aplicables   END,
        tallas_aplicables     = CASE WHEN EXCLUDED.tallas_aplicables     = '{}' THEN productos.tallas_aplicables     ELSE EXCLUDED.tallas_aplicables     END,
        momentos_aplicables   = CASE WHEN EXCLUDED.momentos_aplicables   = '{}' THEN productos.momentos_aplicables   ELSE EXCLUDED.momentos_aplicables   END,
        ingredientes_activos  = CASE WHEN EXCLUDED.ingredientes_activos  = '{}' THEN productos.ingredientes_activos  ELSE EXCLUDED.ingredientes_activos  END,
        alergenos             = EXCLUDED.alergenos,   -- 🔴 el alérgeno SÍ se pisa: quitar uno es una corrección clínica
        es_dieta_prescripcion = EXCLUDED.es_dieta_prescripcion,
        updated_at            = now()
  RETURNING id, (xmax = 0) INTO v_producto_id, v_prod_nuevo;

  -- ── ② LA VARIANTE ───────────────────────────────────────────────────────
  INSERT INTO producto_variantes (
    producto_id, codigo, presentacion, contenido_valor, contenido_unidad,
    peso_kg, gtin, impuesto_codigo, largo_cm, ancho_cm, alto_cm, activo
  ) VALUES (
    v_producto_id, v_var_codigo, v_presentacion,
    (p_variante ->> 'contenido_valor')::numeric,
    nullif(trim(coalesce(p_variante ->> 'contenido_unidad', '')), ''),
    (p_variante ->> 'peso_kg')::numeric,
    nullif(trim(coalesce(p_variante ->> 'gtin', '')), ''),
    v_impuesto,
    (p_variante ->> 'largo_cm')::numeric,
    (p_variante ->> 'ancho_cm')::numeric,
    (p_variante ->> 'alto_cm')::numeric,
    true
  )
  ON CONFLICT (producto_id, codigo) DO UPDATE
    SET presentacion     = EXCLUDED.presentacion,
        contenido_valor  = coalesce(EXCLUDED.contenido_valor,  producto_variantes.contenido_valor),
        contenido_unidad = coalesce(EXCLUDED.contenido_unidad, producto_variantes.contenido_unidad),
        peso_kg          = coalesce(EXCLUDED.peso_kg,          producto_variantes.peso_kg),
        gtin             = coalesce(EXCLUDED.gtin,             producto_variantes.gtin),
        impuesto_codigo  = EXCLUDED.impuesto_codigo,
        largo_cm         = coalesce(EXCLUDED.largo_cm,         producto_variantes.largo_cm),
        ancho_cm         = coalesce(EXCLUDED.ancho_cm,         producto_variantes.ancho_cm),
        alto_cm          = coalesce(EXCLUDED.alto_cm,          producto_variantes.alto_cm),
        updated_at       = now()
  RETURNING id, (xmax = 0) INTO v_variante_id, v_var_nuevo;

  -- ── ③ EL SKU DEL VENDEDOR ───────────────────────────────────────────────
  BEGIN
    INSERT INTO vendedor_skus (
      cuenta_comercial_id, variante_id, sku_vendedor, precio_propuesto,
      country_code, estado, origen_carga, propuesto_por, stock_disponible
    ) VALUES (
      p_cuenta_comercial_id, v_variante_id, v_sku_vendedor,
      (p_sku ->> 'precio_propuesto')::numeric,
      coalesce(nullif(trim(coalesce(p_sku ->> 'country_code', '')), ''), 'EC'),
      'propuesto', p_origen_carga, v_uid,
      coalesce((p_sku ->> 'stock_disponible')::integer, 0)
    )
    ON CONFLICT (cuenta_comercial_id, variante_id) DO UPDATE
      SET sku_vendedor     = EXCLUDED.sku_vendedor,
          precio_propuesto = coalesce(EXCLUDED.precio_propuesto, vendedor_skus.precio_propuesto),
          stock_disponible = EXCLUDED.stock_disponible,
          origen_carga     = EXCLUDED.origen_carga,
          -- 🔴 `estado` NO se toca: reproponer no despublica.
          updated_at       = now()
    RETURNING id, (xmax = 0), estado INTO v_sku_id, v_sku_nuevo, v_sku_estado;
  EXCEPTION WHEN unique_violation THEN
    -- La otra unicidad de la tabla: (cuenta, sku_vendedor). Si el mismo
    -- código de vendedor ya está en OTRA variante, el dato de entrada está
    -- mal y hay que decirlo con nombre, no con un error de Postgres.
    RAISE EXCEPTION
      'sku_vendedor_duplicado: "%" ya está usado por otra variante de esta cuenta', v_sku_vendedor
      USING ERRCODE = '22023';
  END;

  RETURN jsonb_build_object(
    'ok',           true,
    'producto_id',  v_producto_id,
    'variante_id',  v_variante_id,
    'sku_id',       v_sku_id,
    'estado',       v_sku_estado,
    'creado',       jsonb_build_object('producto', v_prod_nuevo,
                                       'variante', v_var_nuevo,
                                       'sku',      v_sku_nuevo)
  );
END $$;

COMMENT ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) IS
  'S95-F · LA PUERTA DEL VENDEDOR. Crea/actualiza producto canónico + variante + SKU en '
  'estado `propuesto`. Idempotente. Rechaza hablando: familia desconocida, código de tasa '
  'ausente o inactivo, cuenta sin rol de vendedor, SKU duplicado. `MODELO_DESPENSA` §4.2.';

-- ─── ② PUBLICAR ────────────────────────────────────────────────────────────
-- **Solo e-PetPlace publica.** Es la mitad de la letra que sostiene el foso:
-- si el vendedor publicara directo, la vitrina curada deja de existir.
CREATE OR REPLACE FUNCTION public.publicar_oferta_sku(
  p_sku_id       uuid,
  p_precio       numeric,
  p_country_code text DEFAULT 'EC'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_sku       record;
  v_impuesto  text;
  v_previa    record;
  v_oferta_id uuid;
  v_cambio    boolean := true;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;

  -- 🔴 EL VENDEDOR PROPONE, e-PetPlace PUBLICA. El gate es admin y solo admin.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_sku FROM vendedor_skus WHERE id = p_sku_id FOR UPDATE;
  IF v_sku.id IS NULL THEN
    RAISE EXCEPTION 'sku_no_existe' USING ERRCODE = '22023';
  END IF;

  IF p_precio IS NULL OR p_precio <= 0 THEN
    RAISE EXCEPTION 'precio_invalido: publicar exige un precio mayor a cero' USING ERRCODE = '22023';
  END IF;

  -- La cuenta tiene que seguir siendo vendedora AL PUBLICAR, no solo al proponer.
  IF NOT _cuenta_es_vendedora(v_sku.cuenta_comercial_id) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_vendedor: la cuenta % perdió el rol seller_productos',
      v_sku.cuenta_comercial_id USING ERRCODE = '22023';
  END IF;

  -- El código de tasa, otra vez y a propósito: la FK garantiza que EXISTE,
  -- no que siga VIGENTE. Una tasa dada de baja no puede publicar.
  SELECT pv.impuesto_codigo INTO v_impuesto
    FROM producto_variantes pv WHERE pv.id = v_sku.variante_id;
  IF v_impuesto IS NULL
     OR NOT EXISTS (SELECT 1 FROM cat_tasas_impuesto t WHERE t.codigo = v_impuesto AND t.activo) THEN
    RAISE EXCEPTION 'impuesto_sin_tasa_vigente: la variante no tiene código de tasa activo'
      USING ERRCODE = '22023';
  END IF;

  -- ── UNA SOLA OFERTA PUBLICADA POR VARIANTE ──────────────────────────────
  --    El UNIQUE parcial `uq_oferta_publicada_por_variante` ya lo vuelve
  --    inexpresable. Acá se rechaza hablando, y se distingue el caso que SÍ
  --    es legítimo: republicar el MISMO sku converge en vez de fallar.
  SELECT * INTO v_previa FROM ofertas
   WHERE variante_id = v_sku.variante_id AND estado = 'publicada' FOR UPDATE;

  IF v_previa.id IS NOT NULL AND v_previa.sku_id <> p_sku_id THEN
    RAISE EXCEPTION
      'oferta_publicada_ya_existe: la variante ya tiene una oferta publicada de otro SKU (%)',
      v_previa.sku_id USING ERRCODE = '22023';
  END IF;

  -- El SKU pasa a aceptado. Idempotente: reaceptar no rompe.
  UPDATE vendedor_skus
     SET estado      = 'aceptado',
         revisado_por = v_uid,
         revisado_en  = now(),
         updated_at   = now()
   WHERE id = p_sku_id;

  IF v_previa.id IS NOT NULL THEN
    v_cambio := (v_previa.precio IS DISTINCT FROM p_precio);
    UPDATE ofertas
       SET precio = p_precio, updated_at = now()
     WHERE id = v_previa.id
    RETURNING id INTO v_oferta_id;
  ELSE
    INSERT INTO ofertas (variante_id, sku_id, precio, country_code,
                         estado, publicado_por, publicado_en)
    VALUES (v_sku.variante_id, p_sku_id, p_precio, p_country_code,
            'publicada', v_uid, now())
    RETURNING id INTO v_oferta_id;
  END IF;

  RETURN jsonb_build_object(
    'ok',          true,
    'oferta_id',   v_oferta_id,
    'sku_id',      p_sku_id,
    'variante_id', v_sku.variante_id,
    'precio',      p_precio,
    'estado',      'publicada',
    'sin_cambio',  NOT v_cambio
  );
END $$;

COMMENT ON FUNCTION public.publicar_oferta_sku(uuid, numeric, text) IS
  'S95-F · e-PetPlace PUBLICA. Gate: is_admin() y nada más — si el vendedor publicara '
  'directo, la vitrina curada deja de existir. Idempotente: republicar el mismo SKU '
  'converge; publicar OTRO SKU sobre la misma variante rebota hablando.';

-- ═══════════════════════════════════════════════════════════════════════════
-- §3bis · PERMISOS — L-140 y L-216
--   REVOKE de PUBLIC además de anon: **todo rol hereda de PUBLIC**, y un
--   REVOKE que deja PUBLIC intacto no cierra nada.
-- ═══════════════════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publicar_oferta_sku(uuid, numeric, text)               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._cuenta_es_vendedora(uuid)                             FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.proponer_sku_vendedor(uuid, jsonb, jsonb, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_oferta_sku(uuid, numeric, text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public._cuenta_es_vendedora(uuid)                             TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- §4 · EL CINTURÓN — con DISCRIMINADOR
--
-- No alcanza con "las funciones existen": eso lo cumple una función vacía.
-- El cinturón **ejecuta el camino real** dentro de una SUBTRANSACCIÓN que se
-- revierte por construcción (el bloque BEGIN…EXCEPTION es una subtransacción:
-- al levantar la excepción centinela, todo lo que escribió desaparece).
--
-- 🔴 Y el discriminador: **cada guard se prueba en ROJO** — se le pasa el dato
--    malo y se exige que reviente con SU código. Un cinturón que solo prueba
--    el camino feliz da verde con los cuatro guards borrados.
-- ═══════════════════════════════════════════════════════════════════════════

DO $cinturon$
DECLARE
  v_n           integer;
  v_def         text;
  v_uid         uuid;
  v_admin       uuid;
  v_cuenta      uuid;
  v_cuenta2     uuid;
  v_r           jsonb;
  v_sku         uuid;
  v_sku2        uuid;
  v_var         uuid;
  v_cazados     text[] := '{}';
BEGIN
  -- ── ESTRUCTURA ──────────────────────────────────────────────────────────
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('proponer_sku_vendedor', 'publicar_oferta_sku', '_cuenta_es_vendedora')
     AND p.prosecdef
     AND array_to_string(p.proconfig, ' ') LIKE '%search_path=public, pg_temp%';
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'ABORTA: se esperaban 3 funciones DEFINER con search_path fijo y hay %.', v_n;
  END IF;

  -- Ninguna alcanzable por anon ni por PUBLIC (medido por privilegio, jamás por LIKE sobre proacl).
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('proponer_sku_vendedor', 'publicar_oferta_sku', '_cuenta_es_vendedora')
     AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: % función(es) alcanzable(s) por anon.', v_n; END IF;

  -- El índice único de idempotencia existe y es único.
  SELECT count(*) INTO v_n FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
   WHERE i.relname = 'uq_producto_natural' AND x.indisunique;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: uq_producto_natural no existe o no es único.'; END IF;

  -- El UNIQUE parcial de "una oferta publicada por variante" tiene que seguir vivo:
  -- las funciones se apoyan en él, no lo reemplazan.
  SELECT count(*) INTO v_n FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
   WHERE i.relname = 'uq_oferta_publicada_por_variante' AND x.indisunique;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ABORTA: uq_oferta_publicada_por_variante desapareció. La unicidad de la vitrina dejó de ser inexpresable.';
  END IF;

  -- El gate de publicar tiene que nombrar is_admin en su CUERPO, no en un comentario.
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'publicar_oferta_sku';
  IF position('is_admin()' in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: publicar_oferta_sku no gatea por is_admin(). El vendedor podría publicarse solo.';
  END IF;

  -- ── DISCRIMINADOR — el camino real, en subtransacción que se revierte ───
  BEGIN
    SELECT cc.id, cc.owner_profile_id INTO v_cuenta, v_uid
      FROM cuentas_comerciales cc ORDER BY cc.created_at LIMIT 1;
    IF v_cuenta IS NULL THEN
      RAISE EXCEPTION 'ABORTA: no hay ninguna cuenta comercial para montar el fixture.';
    END IF;
    SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
    IF v_admin IS NULL THEN
      RAISE EXCEPTION 'ABORTA: no hay ningún admin activo para probar la publicación.';
    END IF;

    -- Nos hacemos pasar por el dueño de esa cuenta (auth.uid() lee este claim).
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);

    -- ROJO 1 · el dueño de una cuenta que todavía NO es vendedora.
    --   Rebota por el gate de QUIÉN LLAMA, porque `es_vendedor_de()` ya exige
    --   el rol activo. Es el camino que va a recorrer un vendedor real cuyo
    --   rol todavía no fue otorgado.
    BEGIN
      PERFORM proponer_sku_vendedor(v_cuenta,
        jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE'),
        jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15'),
        jsonb_build_object('sku_vendedor','FIXSKU-1'), 'epetplace');
      RAISE EXCEPTION 'ABORTA: el dueño de una cuenta SIN rol de vendedor pudo proponer.';
    EXCEPTION WHEN sqlstate '42501' THEN
      IF SQLERRM NOT LIKE 'no_sos_el_vendedor%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'no_sos_el_vendedor');
    END;

    -- 🔴 ROJO 2 · el MISMO caso, pero llamando como ADMIN.
    --   Acá está el porqué del segundo gate, y es el único camino por el que
    --   `cuenta_sin_rol_vendedor` es alcanzable: el admin PASA el gate de
    --   quién llama, así que sin este guard **podría colgar catálogo de una
    --   cuenta que no es vendedora.** Lo encontró el propio cinturón: la
    --   primera versión de este fixture esperaba este código en el caso de
    --   arriba y salió el otro.
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);
    BEGIN
      PERFORM proponer_sku_vendedor(v_cuenta,
        jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE'),
        jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15'),
        jsonb_build_object('sku_vendedor','FIXSKU-1'), 'epetplace');
      RAISE EXCEPTION 'ABORTA: un admin cargó catálogo en una cuenta SIN rol de vendedor.';
    EXCEPTION WHEN sqlstate '22023' THEN
      IF SQLERRM NOT LIKE 'cuenta_sin_rol_vendedor%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'cuenta_sin_rol_vendedor');
    END;

    -- Ahora sí: la cuenta gana el rol (dentro del fixture, se revierte).
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
    VALUES (v_cuenta, 'seller_productos', 'activo');

    -- Volvemos a ser el dueño de la cuenta para el resto de las propuestas.
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_uid::text, 'role', 'authenticated')::text, true);

    -- ROJO 2 · familia inexistente.
    BEGIN
      PERFORM proponer_sku_vendedor(v_cuenta,
        jsonb_build_object('familia_codigo','no_existe_esta_familia','nombre','FIXTURE S95F','marca','FIXTURE'),
        jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15'),
        jsonb_build_object('sku_vendedor','FIXSKU-1'), 'epetplace');
      RAISE EXCEPTION 'ABORTA: se aceptó una familia que no existe.';
    EXCEPTION WHEN sqlstate '22023' THEN
      IF SQLERRM NOT LIKE 'familia_desconocida%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'familia_desconocida');
    END;

    -- ROJO 3 · variante sin código de tasa.
    BEGIN
      PERFORM proponer_sku_vendedor(v_cuenta,
        jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE'),
        jsonb_build_object('codigo','FIX-1','presentacion','1 kg'),
        jsonb_build_object('sku_vendedor','FIXSKU-1'), 'epetplace');
      RAISE EXCEPTION 'ABORTA: se aceptó una variante SIN código de tasa.';
    EXCEPTION WHEN sqlstate '22023' THEN
      IF SQLERRM NOT LIKE 'impuesto_codigo_requerido%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'impuesto_codigo_requerido');
    END;

    -- VERDE · el camino real, y su IDEMPOTENCIA.
    v_r := proponer_sku_vendedor(v_cuenta,
      jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE',
                         'especies_aplicables', jsonb_build_array('perro'),
                         'alergenos', jsonb_build_array()),
      jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15','peso_kg',1),
      jsonb_build_object('sku_vendedor','FIXSKU-1','precio_propuesto',10), 'epetplace');
    IF (v_r ->> 'estado') <> 'propuesto' THEN
      RAISE EXCEPTION 'ABORTA: el SKU no nació en `propuesto` (nació en %).', v_r ->> 'estado';
    END IF;
    v_sku := (v_r ->> 'sku_id')::uuid;
    v_var := (v_r ->> 'variante_id')::uuid;

    v_r := proponer_sku_vendedor(v_cuenta,
      jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE'),
      jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15'),
      jsonb_build_object('sku_vendedor','FIXSKU-1','precio_propuesto',10), 'epetplace');
    IF (v_r -> 'creado' ->> 'producto')::boolean OR (v_r ->> 'sku_id')::uuid <> v_sku THEN
      RAISE EXCEPTION 'ABORTA: la segunda propuesta DUPLICÓ. La función no es idempotente.';
    END IF;
    SELECT count(*) INTO v_n FROM productos WHERE nombre = 'FIXTURE S95F';
    IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: quedaron % productos donde debía haber 1.', v_n; END IF;

    -- ROJO 4 · publicar sin ser admin (somos el dueño de la cuenta, no admin).
    BEGIN
      PERFORM publicar_oferta_sku(v_sku, 12.5, 'EC');
      RAISE EXCEPTION 'ABORTA: un NO-admin pudo publicar. El vendedor se publica solo.';
    EXCEPTION WHEN sqlstate '42501' THEN
      IF SQLERRM NOT LIKE 'no_sos_admin%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'no_sos_admin');
    END;

    -- Nos hacemos pasar por el admin real para el resto.
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);

    v_r := publicar_oferta_sku(v_sku, 12.5, 'EC');
    IF (v_r ->> 'estado') <> 'publicada' THEN RAISE EXCEPTION 'ABORTA: la oferta no quedó publicada.'; END IF;
    SELECT estado INTO v_def FROM vendedor_skus WHERE id = v_sku;
    IF v_def <> 'aceptado' THEN RAISE EXCEPTION 'ABORTA: el SKU no pasó a `aceptado` (quedó en %).', v_def; END IF;

    -- 🔴 REPROPONER NO DESPUBLICA — la regla que no se ve.
    PERFORM proponer_sku_vendedor(v_cuenta,
      jsonb_build_object('familia_codigo','alimento','nombre','FIXTURE S95F','marca','FIXTURE'),
      jsonb_build_object('codigo','FIX-1','presentacion','1 kg','impuesto_codigo','EC_IVA_15'),
      jsonb_build_object('sku_vendedor','FIXSKU-1','precio_propuesto',10), 'epetplace');
    SELECT estado INTO v_def FROM vendedor_skus WHERE id = v_sku;
    IF v_def <> 'aceptado' THEN
      RAISE EXCEPTION 'ABORTA: reproponer devolvió el SKU a %. Correr el cargador dos veces DESPUBLICA la vitrina.', v_def;
    END IF;

    -- ROJO 5 · segunda oferta publicada sobre la MISMA variante, desde otro SKU.
    -- Se usa una SEGUNDA cuenta que ya existe, en vez de crear una: la casa
    -- tiene `uq_cuentas_owner_profile` (una cuenta comercial por dueño) y
    -- `chk_estado_consistente` (una cuenta activa exige `activado_en`).
    -- **Los dos invariantes cazaron este fixture antes de que corriera** —
    -- se anotan acá porque son justo la clase de regla que uno descubre
    -- chocando.
    SELECT cc.id INTO v_cuenta2 FROM cuentas_comerciales cc
     WHERE cc.id <> v_cuenta ORDER BY cc.created_at LIMIT 1;
    IF v_cuenta2 IS NULL THEN
      RAISE EXCEPTION 'ABORTA: hace falta una segunda cuenta comercial para probar la doble publicación.';
    END IF;
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
    VALUES (v_cuenta2, 'seller_productos', 'activo');
    INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado, origen_carga)
    VALUES (v_cuenta2, v_var, 'FIXSKU-2', 'propuesto', 'epetplace')
    RETURNING id INTO v_sku2;

    BEGIN
      PERFORM publicar_oferta_sku(v_sku2, 9.9, 'EC');
      RAISE EXCEPTION 'ABORTA: se publicó una SEGUNDA oferta sobre la misma variante.';
    EXCEPTION WHEN sqlstate '22023' THEN
      IF SQLERRM NOT LIKE 'oferta_publicada_ya_existe%' THEN RAISE; END IF;
      v_cazados := array_append(v_cazados, 'oferta_publicada_ya_existe');
    END;

    IF array_length(v_cazados, 1) <> 6 THEN
      RAISE EXCEPTION 'ABORTA: se esperaban 6 guards en rojo y se cazaron % (%).',
        coalesce(array_length(v_cazados, 1), 0), array_to_string(v_cazados, ', ');
    END IF;

    RAISE EXCEPTION 'FIXTURE_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'FIXTURE_ROLLBACK' THEN RAISE; END IF;
  END;

  -- ── RESIDUO 0, medido y no argumentado ──────────────────────────────────
  SELECT count(*) INTO v_n FROM productos WHERE nombre LIKE 'FIXTURE S95F%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % productos de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM vendedor_skus WHERE sku_vendedor LIKE 'FIXSKU-%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % SKU de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM cuentas_comerciales WHERE identificacion_fiscal LIKE 'FIXTURE-S95F%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % cuentas de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM cuenta_roles WHERE tipo_actor = 'seller_productos';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % roles seller_productos. El fixture contaminó la base y ese rol habilita a vender.', v_n;
  END IF;

  RAISE NOTICE 'S95-F cinturón VERDE · 6 guards cazados en rojo · idempotencia probada · residuo 0.';
END $cinturon$;

COMMIT;

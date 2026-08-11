-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 2 — EL CATÁLOGO
--
-- Las tres entidades que PE7 escribió en S12 y que `MODELO_DESPENSA` §3.3
-- adopta: producto canónico ≠ SKU del vendedor ≠ oferta visible. Más la
-- VARIANTE, que es la presentación (3 kg / 15 kg) y sin la cual el cálculo de
-- «se acaba en 6 días» no se puede hacer.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m2-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. Esta migración es DDL aditivo más el vaciado de
-- columnas de una tabla con CERO filas (`productos`, medida en la M1 y
-- re-verificada acá por cinturón). No computa anclas sobre datos vivos, no
-- hace backfill y no borra ninguna fila.
--
-- ── LO QUE ESTA MIGRACIÓN DECIDE, con su razón ────────────────────────────
-- ① `productos` deja de ser producto + oferta + inventario + vendedor en una
--    fila. Es lo que §3.4 prohíbe. Con 0 filas el DROP COLUMN es gratis.
-- ② La VARIANTE es tabla y no el `variantes` jsonb que ya existía: un jsonb no
--    puede recibir FK desde `pedido_items` ni desde `vendedor_skus`, y sin eso
--    es inexpresable decir «este SKU es el de 15 kg».
-- ③ Los atributos de recomendación son COLUMNAS Y ARRAYS, no un jsonb libre.
--    Es el molde ya vivo de la casa (`tipos_servicio.especies_elegibles` S57,
--    `cat_conductas_bitacora.especies_aplicables` S91). Un jsonb libre no se
--    indexa por contenido ni se verifica, y la exclusión dura por alergia de
--    §6 tiene que ser verificable.
-- ④ **La oferta es por VARIANTE, no por producto canónico.** Si la unidad
--    fuera el producto, vender 3 kg y 15 kg del mismo alimento sería
--    imposible. Lo que §4.1 prohíbe son siete precios para la MISMA cosa, y la
--    misma cosa es la presentación.
-- ⑤ La frontera de `BIO_EXPEDIENTE` E2bis vive en una COLUMNA
--    (`cat_familias_producto.entra_al_expediente`), no en un documento — así
--    el criterio «entra lo que cambia el cuerpo o el riesgo sanitario» deja de
--    re-discutirse cada vez.
-- ⑥ **Ninguna variante puede nacer sin código de tasa de impuesto.** NOT NULL,
--    no una convención.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · el DROP COLUMN de `productos` es gratis SOLO con 0 filas.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM productos;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA: `productos` tiene % filas. El vaciado de columnas deja de ser gratis y esta migración no fue diseñada para migrar datos.', v_n;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LOS DOS CATÁLOGOS
-- ───────────────────────────────────────────────────────────────────────────

-- Molde `cat_tipos_evento`: código semántico, voz, banderas, y sabe morir
-- (`deprecado` + `reemplazado_por`).
CREATE TABLE public.cat_familias_producto (
  codigo                text PRIMARY KEY,
  nombre                text NOT NULL,
  descripcion           text,
  eje_jtbd              text REFERENCES public.cat_ejes_jtbd(codigo),
  -- 🔴 LA FRONTERA DE E2bis, EN EL ESQUEMA:
  entra_al_expediente   boolean NOT NULL,
  orden_display         integer,
  activo                boolean NOT NULL DEFAULT true,
  deprecado             boolean NOT NULL DEFAULT false,
  deprecado_motivo      text,
  reemplazado_por       text REFERENCES public.cat_familias_producto(codigo),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.cat_familias_producto.entra_al_expediente IS
  'BIO_EXPEDIENTE E2bis: entra lo que cambia el cuerpo o el riesgo sanitario '
  'de la mascota. Una cama es compra; un antipulgas es cuidado. El criterio '
  'vive acá y no en un documento para que no se re-discuta cada vez.';

-- Las cuatro que ENTRAN al expediente y a la vitrina de v1 (§11.1).
INSERT INTO public.cat_familias_producto
  (codigo, nombre, descripcion, eje_jtbd, entra_al_expediente, orden_display, activo) VALUES
  ('alimento',           'Alimento',            'Alimento balanceado. Se cruza con la curva de peso.',        'alimentacion', true,  1, true),
  ('antiparasitario',    'Antiparasitarios',    'Antiparasitarios y antipulgas, con su periodicidad.',        'salud',        true,  2, true),
  ('suplemento',         'Suplementos',         'Suplementos y vitaminas.',                                   'alimentacion', true,  3, true),
  ('dieta_prescripcion', 'Dieta de prescripción','Alimento indicado por un veterinario para una condición.',  'salud',        true,  4, true);

-- Las cuatro EXCLUIDAS. Nacen APAGADAS y con su razón, no ausentes: §11.3 las
-- deja «en evaluación hasta el 15-sep», y una familia que no existe se
-- reinventa mal el día que alguien la necesite.
INSERT INTO public.cat_familias_producto
  (codigo, nombre, entra_al_expediente, orden_display, activo, deprecado_motivo) VALUES
  ('juguete',   'Juguetes',    false, 10, false, 'Fuera de v1 (MODELO_DESPENSA §11.3, en evaluación al 15-sep). No alimenta el expediente.'),
  ('accesorio', 'Accesorios',  false, 11, false, 'Fuera de v1 (§11.3). No alimenta el expediente.'),
  ('cama',      'Camas',       false, 12, false, 'Fuera de v1 (§11.3). No alimenta el expediente.'),
  ('higiene',   'Higiene',     false, 13, false, 'Fuera de v1 (§11.3). No alimenta el expediente.');

-- El impuesto es DATO. `country_config.iva_pct` da UNA tasa por país y Ecuador
-- tributa 0 % varios alimentos — `facturas` ya tiene subtotal_0/12/15, que es
-- la historia del IVA ecuatoriano hecha columna y la prueba de que una sola
-- tasa nunca alcanzó.
CREATE TABLE public.cat_tasas_impuesto (
  codigo          text PRIMARY KEY,
  country_code    text NOT NULL REFERENCES public.country_config(country_code),
  nombre          text NOT NULL,
  pct             numeric(5,2) NOT NULL CHECK (pct >= 0 AND pct <= 100),
  vigencia_desde  timestamptz NOT NULL DEFAULT now(),
  vigencia_hasta  timestamptz,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cat_tasas_impuesto (codigo, country_code, nombre, pct, vigencia_desde) VALUES
  ('EC_IVA_15', 'EC', 'IVA 15 % Ecuador',            15.00, '2024-04-01'),
  ('EC_IVA_0',  'EC', 'Tarifa 0 % Ecuador',           0.00, '2024-04-01'),
  ('CO_IVA_19', 'CO', 'IVA 19 % Colombia',           19.00, '2024-01-01'),
  ('CO_IVA_0',  'CO', 'Excluido de IVA Colombia',     0.00, '2024-01-01');

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · `productos` PASA A SER EL CANÓNICO PURO
-- ───────────────────────────────────────────────────────────────────────────

-- Se va todo lo que es de la OFERTA, del INVENTARIO o del VENDEDOR.
ALTER TABLE public.productos
  DROP COLUMN IF EXISTS precio,
  DROP COLUMN IF EXISTS stock,
  DROP COLUMN IF EXISTS stock_minimo,
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS seller_id,
  DROP COLUMN IF EXISTS seller_perfil_id,
  DROP COLUMN IF EXISTS peso_kg,          -- es de la variante: 3 kg y 15 kg pesan distinto
  DROP COLUMN IF EXISTS variantes,        -- el jsonb muere: la variante es tabla (decisión ②)
  DROP COLUMN IF EXISTS para_especie,     -- lo reemplaza especies_aplicables text[]
  DROP COLUMN IF EXISTS categoria;        -- lo reemplaza familia_codigo

ALTER TABLE public.productos
  ADD COLUMN familia_codigo        text NOT NULL REFERENCES public.cat_familias_producto(codigo),
  ADD COLUMN marca                 text,
  ADD COLUMN especies_aplicables   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN tallas_aplicables     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN momentos_aplicables   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN ingredientes_activos  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN alergenos             text[] NOT NULL DEFAULT '{}',
  ADD COLUMN es_dieta_prescripcion boolean NOT NULL DEFAULT false,
  ADD COLUMN origen_carga          text NOT NULL DEFAULT 'epetplace'
    CHECK (origen_carga IN ('vendedor','epetplace','asistido_por_ia')),
  ADD COLUMN creado_por            uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.productos.alergenos IS
  'MODELO_DESPENSA §6: exclusión DURA. Jamás se recomienda algo contraindicado '
  'contra las alergias documentadas del expediente. Es array y no jsonb para '
  'que la exclusión se pueda indexar y verificar.';
COMMENT ON COLUMN public.productos.origen_carga IS
  'MODELO_DESPENSA §4.2: el origen del dato queda declarado. `asistido_por_ia` '
  'se modela hoy; la ingesta por IA es posterior al 15-sep (§14).';

-- El estado del canónico no tiene «agotado»: eso es del inventario, no del
-- producto. Con 0 filas el reemplazo del CHECK es gratis.
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_estado_check;
ALTER TABLE public.productos
  ADD CONSTRAINT productos_estado_check CHECK (estado IN ('activo','inactivo','retirado'));

CREATE INDEX idx_productos_familia   ON public.productos (familia_codigo, estado);
CREATE INDEX idx_productos_especies  ON public.productos USING gin (especies_aplicables);
CREATE INDEX idx_productos_alergenos ON public.productos USING gin (alergenos);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LA VARIANTE — la presentación
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.producto_variantes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id       uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  codigo            text NOT NULL,
  presentacion      text NOT NULL,
  contenido_valor   numeric(10,3),
  contenido_unidad  text CHECK (contenido_unidad IN ('kg','g','l','ml','unidad')),
  -- El peso viaja acá porque el flete lo cobra por kilo (zonas_cobertura.tarifa_kg).
  peso_kg           numeric(8,3) CHECK (peso_kg IS NULL OR peso_kg > 0),
  gtin              text,
  -- 🔴 NOT NULL: ninguna variante nace sin saber cómo tributa.
  impuesto_codigo   text NOT NULL REFERENCES public.cat_tasas_impuesto(codigo),
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producto_id, codigo)
);
CREATE INDEX idx_variantes_producto ON public.producto_variantes (producto_id, activo);

COMMENT ON TABLE public.producto_variantes IS
  'La presentación (3 kg / 15 kg) es VARIANTE del producto canónico, no un '
  'producto aparte. La recomendación y el cálculo de «se acaba en N días» '
  'dependen de esto.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · EL SKU DEL VENDEDOR — él propone
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vendedor_skus (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 🔴 La llave del actor es la CUENTA COMERCIAL, jamás `profiles`. Es lo que
  --    `MODELO_FINANCIERO` Decisión I exige y lo que la tabla jubilada
  --    `seller_inventario` hacía mal.
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  variante_id         uuid NOT NULL REFERENCES public.producto_variantes(id) ON DELETE RESTRICT,
  sku_vendedor        text NOT NULL,
  precio_propuesto    numeric(10,2) CHECK (precio_propuesto IS NULL OR precio_propuesto >= 0),
  moneda              text NOT NULL DEFAULT 'USD',
  country_code        text NOT NULL DEFAULT 'EC' REFERENCES public.country_config(country_code),
  -- §4.2: EL VENDEDOR PROPONE. Publicar es otro acto y vive en `ofertas`.
  estado              text NOT NULL DEFAULT 'propuesto'
    CHECK (estado IN ('propuesto','en_revision','aceptado','rechazado')),
  origen_carga        text NOT NULL DEFAULT 'vendedor'
    CHECK (origen_carga IN ('vendedor','epetplace','asistido_por_ia')),
  propuesto_por       uuid REFERENCES public.profiles(id),
  propuesto_en        timestamptz NOT NULL DEFAULT now(),
  revisado_por        uuid REFERENCES public.profiles(id),
  revisado_en         timestamptz,
  motivo_rechazo      text,
  -- Materializados por trigger desde `inventario_movimientos` en la M3.
  -- El ledger es la fuente de verdad; estas dos son lectura rápida (mismo
  -- patrón que `mascota_perfil_vigente` sobre `eventos_mascota`).
  stock_disponible    integer NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
  stock_reservado     integer NOT NULL DEFAULT 0 CHECK (stock_reservado >= 0),
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cuenta_comercial_id, variante_id),
  UNIQUE (cuenta_comercial_id, sku_vendedor),
  CHECK (estado <> 'rechazado' OR motivo_rechazo IS NOT NULL)
);
CREATE INDEX idx_skus_cuenta   ON public.vendedor_skus (cuenta_comercial_id, activo);
CREATE INDEX idx_skus_variante ON public.vendedor_skus (variante_id, estado);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · LA OFERTA — e-PetPlace publica
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.ofertas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variante_id    uuid NOT NULL REFERENCES public.producto_variantes(id) ON DELETE RESTRICT,
  sku_id         uuid NOT NULL REFERENCES public.vendedor_skus(id) ON DELETE RESTRICT,
  precio         numeric(10,2) NOT NULL CHECK (precio >= 0),
  moneda         text NOT NULL DEFAULT 'USD',
  country_code   text NOT NULL DEFAULT 'EC' REFERENCES public.country_config(country_code),
  estado         text NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','publicada','pausada','retirada')),
  publicado_por  uuid REFERENCES public.profiles(id),
  publicado_en   timestamptz,
  retirado_en    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (estado <> 'publicada' OR (publicado_por IS NOT NULL AND publicado_en IS NOT NULL))
);

-- 🔴 §4.1 HECHA INEXPRESABLE DE VIOLAR, no vigilada: dos ofertas publicadas
--    de la misma variante no pueden existir. Precedente: el UNIQUE de
--    `es_portada` en la galería del prestador (S84) — «dos portadas» no era
--    un estado que hubiera que revisar, era un estado imposible.
CREATE UNIQUE INDEX uq_oferta_publicada_por_variante
  ON public.ofertas (variante_id) WHERE estado = 'publicada';

CREATE INDEX idx_ofertas_estado ON public.ofertas (estado, country_code);

COMMENT ON INDEX public.uq_oferta_publicada_por_variante IS
  'MODELO_DESPENSA §4.1: UNA sola oferta visible por producto. La despensa no '
  'compite por precio, compite por criterio — mostrar siete opciones a una app '
  'que conoce a la mascota es admitir que no sabe.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE F · EL HELPER DEL VENDEDOR
-- El molde de la casa: predicado compuesto de helpers CON NOMBRE, jamás de
-- subqueries inline (es lo que D-700 vino a pagar).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.es_vendedor_de(p_cuenta_comercial_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cuentas_comerciales cc
    JOIN cuenta_roles cr ON cr.cuenta_comercial_id = cc.id
    WHERE cc.id = p_cuenta_comercial_id
      AND cc.owner_profile_id = auth.uid()
      AND cr.tipo_actor = 'seller_productos'
      AND cr.estado = 'activo'
  );
$$;

COMMENT ON FUNCTION public.es_vendedor_de(uuid) IS
  'ALCANCE v1 DECLARADO: resuelve por el TITULAR de la cuenta comercial. El '
  'arco de equipo (empleados del vendedor) NO está cableado acá — cuando lo '
  'esté, se ensancha este helper y las policies no se tocan. '
  'MODELO_DESPENSA §7.4: este helper JAMÁS aparece en una policy del '
  'expediente. El rol seller no hereda nada del rol prestador.';

-- L-140: toda función nace con EXECUTE para anon y PUBLIC por default
-- privileges. Se cierra explícito, y se verifica abajo por cinturón.
REVOKE ALL ON FUNCTION public.es_vendedor_de(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_vendedor_de(uuid) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE G · RLS — desde el primer día, y CERO policies `ALL`
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_familias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tasas_impuesto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedor_skus         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas               ENABLE ROW LEVEL SECURITY;

-- Los catálogos: los lee cualquiera con sesión; los escribe el admin.
CREATE POLICY cat_familias_select ON public.cat_familias_producto FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_familias_insert ON public.cat_familias_producto FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_familias_update ON public.cat_familias_producto FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_familias_delete ON public.cat_familias_producto FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY cat_tasas_select ON public.cat_tasas_impuesto FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_tasas_insert ON public.cat_tasas_impuesto FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_tasas_update ON public.cat_tasas_impuesto FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_tasas_delete ON public.cat_tasas_impuesto FOR DELETE TO authenticated USING (is_admin());

-- La variante: vitrina para todos, escritura de plataforma (el canónico es
-- nuestro — §4.2: la curaduría es decisión de plataforma).
CREATE POLICY variantes_select ON public.producto_variantes FOR SELECT TO authenticated USING (true);
CREATE POLICY variantes_insert ON public.producto_variantes FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY variantes_update ON public.producto_variantes FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY variantes_delete ON public.producto_variantes FOR DELETE TO authenticated USING (is_admin());

-- El SKU: el vendedor ve y propone el suyo; el admin ve y decide todos.
-- 🔴 El vendedor NO puede cambiarse el estado a 'aceptado': ése es el acto de
--    e-PetPlace. Se materializa en el WITH CHECK, no en la UI.
CREATE POLICY skus_select ON public.vendedor_skus FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY skus_insert ON public.vendedor_skus FOR INSERT TO authenticated
  WITH CHECK ((es_vendedor_de(cuenta_comercial_id) AND estado = 'propuesto') OR is_admin());
CREATE POLICY skus_update ON public.vendedor_skus FOR UPDATE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin())
  WITH CHECK ((es_vendedor_de(cuenta_comercial_id) AND estado IN ('propuesto','en_revision')) OR is_admin());
CREATE POLICY skus_delete ON public.vendedor_skus FOR DELETE TO authenticated
  USING (is_admin());

-- La oferta: la ve todo el mundo con sesión, la fija SOLO e-PetPlace.
-- §4.2: «si el vendedor publica directo, la vitrina curada deja de existir —
-- y con ella el foso entero».
CREATE POLICY ofertas_select ON public.ofertas FOR SELECT TO authenticated USING (true);
CREATE POLICY ofertas_insert ON public.ofertas FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY ofertas_update ON public.ofertas FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY ofertas_delete ON public.ofertas FOR DELETE TO authenticated USING (is_admin());

-- `productos` tenía una policy ALL. Se parte en cuatro (invariante 1) y se le
-- cierra la lectura anónima: la vitrina vive dentro de la app, con sesión.
DROP POLICY IF EXISTS admins_manage_productos ON public.productos;
DROP POLICY IF EXISTS productos_public_read   ON public.productos;
CREATE POLICY productos_select ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY productos_insert ON public.productos FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY productos_update ON public.productos FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY productos_delete ON public.productos FOR DELETE TO authenticated USING (is_admin());

-- Grants. Las tablas nuevas nacen SIN nada para anon (default privileges de
-- Supabase conceden a anon y authenticated: se revoca explícito, L-140).
REVOKE ALL ON public.cat_familias_producto, public.cat_tasas_impuesto,
              public.producto_variantes, public.vendedor_skus, public.ofertas,
              public.productos
  FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.cat_familias_producto, public.cat_tasas_impuesto,
     public.producto_variantes, public.vendedor_skus, public.ofertas, public.productos
  TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① EL DISCRIMINADOR DE «UNA OFERTA POR VARIANTE»: no basta con que el
--    índice exista — se prueba que el estado prohibido REBOTA de verdad, con
--    datos reales creados y deshechos dentro de un SAVEPOINT.
DO $$
DECLARE
  v_prod uuid; v_var uuid; v_cc uuid; v_sku uuid; v_ok boolean := false;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;
  INSERT INTO productos (nombre, descripcion, familia_codigo, estado)
    VALUES ('__cinturon_s95_m2', 'fixture', 'alimento', 'activo') RETURNING id INTO v_prod;
  INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo)
    VALUES (v_prod, '15kg', '15 kg', 'EC_IVA_15') RETURNING id INTO v_var;
  INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado)
    VALUES (v_cc, v_var, '__cint_sku', 'aceptado') RETURNING id INTO v_sku;

  INSERT INTO ofertas (variante_id, sku_id, precio, estado, publicado_por, publicado_en)
    VALUES (v_var, v_sku, 10.00, 'publicada', (SELECT id FROM profiles LIMIT 1), now());
  BEGIN
    INSERT INTO ofertas (variante_id, sku_id, precio, estado, publicado_por, publicado_en)
      VALUES (v_var, v_sku, 12.00, 'publicada', (SELECT id FROM profiles LIMIT 1), now());
  EXCEPTION WHEN unique_violation THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se pudieron publicar DOS ofertas de la misma variante. §4.1 no está siendo exigida.';
  END IF;

  -- Contra-caso: una BORRADOR además de la publicada SÍ tiene que poder existir
  -- (el índice es parcial a propósito — curar una oferta exige preparar la
  -- siguiente mientras la actual sigue viva).
  INSERT INTO ofertas (variante_id, sku_id, precio, estado)
    VALUES (v_var, v_sku, 11.00, 'borrador');

  -- Limpieza por id: residuo 0.
  DELETE FROM ofertas WHERE variante_id = v_var;
  DELETE FROM vendedor_skus WHERE id = v_sku;
  DELETE FROM producto_variantes WHERE id = v_var;
  DELETE FROM productos WHERE id = v_prod;
END $$;

-- ② La variante no puede nacer sin código de tasa.
DO $$
DECLARE v_prod uuid; v_ok boolean := false;
BEGIN
  INSERT INTO productos (nombre, familia_codigo, estado)
    VALUES ('__cinturon_s95_m2b', 'alimento', 'activo') RETURNING id INTO v_prod;
  BEGIN
    INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo)
      VALUES (v_prod, 'x', 'x', NULL);
  EXCEPTION WHEN not_null_violation THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: una variante nació sin código de tasa de impuesto.';
  END IF;
  DELETE FROM productos WHERE id = v_prod;
END $$;

-- ③ L-140 sobre el helper nuevo, medido por el privilegio efectivo.
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.es_vendedor_de(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA L-140: `es_vendedor_de` quedó ejecutable por anon.';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.es_vendedor_de(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: `es_vendedor_de` no es ejecutable por authenticated — el camino legítimo quedó cerrado.';
  END IF;
END $$;

-- ④ Cero policies `ALL` sobre lo que esta migración tocó, y `anon` sin nada.
DO $$
DECLARE v_all text; v_anon text;
BEGIN
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('productos','producto_variantes','vendedor_skus','ofertas',
                       'cat_familias_producto','cat_tasas_impuesto');
  IF v_all IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: quedaron policies ALL (%).', v_all;
  END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY[
    'productos','producto_variantes','vendedor_skus','ofertas',
    'cat_familias_producto','cat_tasas_impuesto']) x
  WHERE has_table_privilege('anon', 'public.'||x, 'SELECT')
     OR has_table_privilege('anon', 'public.'||x, 'INSERT');
  IF v_anon IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: anon conserva privilegio sobre (%).', v_anon;
  END IF;
END $$;

-- ⑤ Residuo 0: ningún fixture del cinturón sobrevivió.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM productos WHERE nombre LIKE '\_\_cinturon\_s95%';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % fixtures del cinturón.', v_n;
  END IF;
END $$;

COMMIT;

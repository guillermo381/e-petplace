-- ═══════════════════════════════════════════════════════════════════════════
-- S95-D · BLOQUE 3 — LOS ESTADOS EN DOS CAPAS
--
-- **Ley de la casa:** `MODELO_LOYALTY` §3, Ley 3 extendida — *el vocabulario
-- del motor es del motor*. El pedido necesita una máquina interna FINA y una
-- narrativa GRUESA para la familia.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m11-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** Reemplaza los 9 estados de `cat_estados_pedido` por 29
-- y `pedidos.estado` los referencia por FK. El cinturón exige `pedidos` en
-- CERO antes y después: con un pedido vivo, cambiar el catálogo de estados es
-- una migración con backfill y ésta no lo es.
--
-- ── LOS SEIS QUE FALTABAN ENTRE PREPARAR Y DESPACHAR ──────────────────────
-- Es el corazón de este bloque. Sin ellos, un pedido se muere en silencio
-- entre «el vendedor lo está armando» y «salió» — que es donde de verdad
-- pasan las cosas.
--
-- ── LO QUE SE MODELA Y LO QUE SE ENCIENDE ─────────────────────────────────
-- Los 29 estados y las 46 transiciones existen desde hoy. **En v1 el vendedor
-- mueve TRES botones** — preparado, empacado, despachado. Incidencias,
-- sustituciones y backorder existen como estados y se resuelven por atención
-- humana: nacen con `activo = false` y **el motor rechaza transitar a un
-- estado inactivo con un error explícito**.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE v_p int;
BEGIN
  SELECT count(*) INTO v_p FROM pedidos;
  IF v_p > 0 THEN
    RAISE EXCEPTION 'ABORTA: hay % pedidos vivos. Cambiar el catálogo de estados con pedidos adentro exige backfill y esta migración no lo hace.', v_p;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LA NARRATIVA — SIETE, y solo siete
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_narrativas_pedido (
  codigo      text PRIMARY KEY,
  nombre      text NOT NULL,
  descripcion text,
  orden       integer NOT NULL,
  es_terminal boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cat_narrativas_pedido (codigo, nombre, descripcion, orden, es_terminal) VALUES
  ('pagando',    'Pagando',     'Estamos confirmando tu pago.',                         1, false),
  ('confirmado', 'Confirmado',  'Tu pedido está confirmado.',                           2, false),
  ('preparando', 'Preparando',  'Están preparando tu pedido.',                          3, false),
  ('en_camino',  'En camino',   'Tu pedido va en camino.',                              4, false),
  ('entregado',  'Entregado',   'Tu pedido llegó.',                                     5, true),
  ('no_llego',   'No llegó',    'No pudimos entregarlo.',                               6, false),
  ('cancelado',  'Cancelado',   'El pedido se canceló.',                                7, true);

COMMENT ON TABLE public.cat_narrativas_pedido IS
  'LO ÚNICO QUE LA FAMILIA VE. Siete, y solo siete. '
  'MODELO_LOYALTY §3 (Ley 3 extendida): el vocabulario del motor es del motor. '
  'La voz definitiva de cada una la escribe la pantalla — acá va la '
  'descripción de referencia, no el copy final. '
  'NOTA: `en_camino` se dice «Listo para retirar» cuando el pedido es de '
  'retiro; es la MISMA narrativa con otra voz, no un octavo estado.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · LOS 29 ESTADOS INTERNOS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_estados_pedido
  ADD COLUMN narrativa       text REFERENCES public.cat_narrativas_pedido(codigo),
  ADD COLUMN visible_familia boolean NOT NULL DEFAULT false,
  ADD COLUMN motivo_inactivo text,
  ADD COLUMN exige_motivo    boolean NOT NULL DEFAULT false,
  ADD COLUMN updated_at      timestamptz NOT NULL DEFAULT now();

-- Los nueve viejos se van: ninguno tiene pedidos colgando y sus códigos se
-- reusan con narrativa. Se borran en vez de enmendarse porque `despachado` y
-- `pagado` cambian de significado dentro de la máquina fina.
DELETE FROM public.cat_estados_pedido;

INSERT INTO public.cat_estados_pedido
  (codigo, nombre, descripcion, narrativa, es_terminal, orden, activo, motivo_inactivo, exige_motivo) VALUES
  -- ── PAGANDO ──────────────────────────────────────────────────────────────
  ('creado',              'Creado',                    'La familia armó el pedido; todavía no confirmó.',            'pagando',    false,  1, true,  NULL, false),
  ('esperando_pago',      'Esperando pago',            'Se confirmó y espera que el pago se complete.',              'pagando',    false,  2, true,  NULL, false),
  ('autorizado_sin_captura','Autorizado sin capturar', 'La pasarela retuvo la plata pero todavía no es nuestra.',    'pagando',    false,  3, false,
     'v1 no separa autorización de captura: la pasarela cobra de una. Se modela porque el día que se separe, el estado ya existe.', false),
  ('revision_riesgo',     'En revisión de riesgo',     'Revisión antifraude.',                                       'pagando',    false,  4, false,
     'v1 no tiene motor antifraude. 🔴 Y cuando lo tenga, este estado JAMÁS se le muestra a la familia: decirle a alguien que está bajo sospecha de fraude es maltrato.', false),

  -- ── CONFIRMADO ───────────────────────────────────────────────────────────
  ('pago_capturado',      'Pago capturado',            'La plata es nuestra.',                                       'confirmado', false, 10, true,  NULL, false),
  ('stock_reservado',     'Stock reservado en firme',  'La reserva pasó de temporal a firme.',                       'confirmado', false, 11, true,  NULL, false),
  ('vendedor_notificado', 'Vendedor notificado',       'Le sonó el teléfono al vendedor.',                            'confirmado', false, 12, true,  NULL, false),

  -- ── PREPARANDO ───────────────────────────────────────────────────────────
  ('liberado_preparacion','Liberado a preparación',    'El vendedor puede empezar a armarlo.',                       'preparando', false, 20, true,  NULL, false),
  ('asignado_bodega',     'Asignado a bodega',         'Se decidió desde qué bodega sale.',                          'preparando', false, 21, false,
     'v1 tiene UNA bodega: no hay nada que decidir. Se modela para el día del segundo depósito.', false),
  ('picking',             'En picking',                'Están juntando los productos del estante.',                  'preparando', false, 22, true,  NULL, false),
  ('incidencia_picking',  'Incidencia de picking',     'Falta, está roto o está vencido.',                           'preparando', false, 23, false,
     'v1 lo resuelve por atención humana. 🔴 Pero el estado EXISTE: sin él, un pedido se muere en silencio y nadie sabe dónde.', true),
  ('decision_faltante',   'Decisión de faltante',      'Parcial, esperar, o sustituir con aprobación del cliente.',  'preparando', false, 24, false,
     'v1 lo resuelve por atención humana. La sustitución necesita respuesta de la familia: es un estado, no una llamada.', true),
  ('empacado',            'Empacado',                  'Con peso y volumen REALES: acá se corrige la cotización.',   'preparando', false, 25, true,  NULL, false),
  ('documentado',         'Documentado',               'Factura del SRI y guía emitidas.',                           'preparando', false, 26, true,  NULL, false),
  ('backorder',           'Backorder',                 'Sin stock, se espera reposición con acuerdo de la familia.', 'preparando', false, 27, false,
     'v1 no maneja backorder: si no hay stock, se cancela o se ofrece alternativa por atención humana.', true),
  ('en_espera',           'En espera',                 'Frenado por dirección dudosa u otra verificación.',          'preparando', false, 28, false,
     'v1 lo resuelve por atención humana.', true),

  -- ── EN CAMINO ────────────────────────────────────────────────────────────
  ('esperando_courier',   'Esperando al transportista','Empacado, pero el courier todavía no vino.',                 'en_camino',  false, 30, true,  NULL, false),
  ('entregado_courier',   'Entregado al transportista','El instante en que la responsabilidad cambia de manos.',     'en_camino',  false, 31, true,  NULL, false),
  ('en_transito',         'En tránsito',               'Viajando hacia la ciudad de destino.',                       'en_camino',  false, 32, true,  NULL, false),
  ('en_reparto',          'En reparto',                'Salió a repartir hoy.',                                      'en_camino',  false, 33, true,  NULL, false),

  -- ── ENTREGADO ────────────────────────────────────────────────────────────
  ('entregado',           'Entregado',                 'Llegó a la familia. 🔴 ACÁ y solo acá se deposita el evento en el expediente.', 'entregado', true, 40, true, NULL, false),

  -- ── NO LLEGÓ ─────────────────────────────────────────────────────────────
  ('entrega_fallida',     'Entrega fallida',           'No encontraron a nadie. Se reintenta.',                      'no_llego',   false, 50, true,  NULL, true),
  ('devuelto_origen',     'Devuelto a origen',         'Tras N intentos, el paquete volvió al vendedor.',            'no_llego',   false, 51, true,  NULL, true),

  -- ── CANCELADO / DEVUELTO ─────────────────────────────────────────────────
  ('cancelado_cliente',   'Cancelado por la familia',  'La familia lo canceló antes de que se preparara.',           'cancelado',  true,  60, true,  NULL, false),
  ('cancelado_vendedor',  'Cancelado por el vendedor', 'El vendedor no puede cumplirlo.',                            'cancelado',  true,  61, true,  NULL, true),
  ('cancelado_sistema',   'Cancelado por el sistema',  'La reserva venció sola sin pago.',                           'cancelado',  true,  62, true,  NULL, false),
  ('devuelto',            'Devuelto',                  'La familia lo devolvió.',                                    'cancelado',  true,  63, false,
     'v1 NO automatiza la devolución (§10): se maneja por atención humana. El estado existe porque BIO_EXPEDIENTE E2bis necesita de dónde colgar el evento que corrige la compra.', true),
  ('reembolsado',         'Reembolsado',               'La plata volvió.',                                           'cancelado',  true,  64, false,
     'v1 no automatiza el reembolso.', true),
  ('contracargo',         'Contracargo',               'El banco revirtió el cobro por reclamo del titular.',        'cancelado',  true,  65, false,
     'No hay pasarela integrada todavía. 🔴 Puede llegar MESES después de entregado — por eso las transiciones no son lineales.', true);

-- 🔴 Solo el estado ENTREGADO es visible con su propio nombre. Los otros 22 se
--    ven a través de su narrativa. Los cuatro que la familia JAMÁS ve tienen
--    su razón escrita arriba.
UPDATE public.cat_estados_pedido SET visible_familia = false;

ALTER TABLE public.cat_estados_pedido
  ALTER COLUMN narrativa SET NOT NULL,
  ADD CONSTRAINT chk_estado_inactivo_con_motivo
    CHECK (activo OR motivo_inactivo IS NOT NULL);

COMMENT ON COLUMN public.cat_estados_pedido.narrativa IS
  'NOT NULL: todo estado interno se traduce a una de las siete narrativas. '
  'Un estado sin narrativa sería un estado que la familia vería crudo, y eso '
  'es exactamente lo que Ley 3 prohíbe.';
COMMENT ON COLUMN public.cat_estados_pedido.motivo_inactivo IS
  'Un estado apagado dice POR QUÉ. Sin esto, en tres meses nadie sabe si está '
  'apagado por decisión o por olvido.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LAS TRANSICIONES SON DATO, NO CÓDIGO
-- 🔴 Los estados NO son lineales: cancelar sale de varios, reembolsar sale de
--    entregado, el contracargo llega tarde. Una máquina lineal se rompe con el
--    primer caso real.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_transiciones_pedido (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desde         text REFERENCES public.cat_estados_pedido(codigo),   -- NULL = estado inicial
  hasta         text NOT NULL REFERENCES public.cat_estados_pedido(codigo),
  actor         text NOT NULL CHECK (actor IN ('cliente','vendedor','sistema','admin')),
  exige_motivo  boolean NOT NULL DEFAULT false,
  descripcion   text,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (desde, hasta, actor)
);

COMMENT ON TABLE public.cat_transiciones_pedido IS
  'LAS TRANSICIONES SON DATO. Agregar un camino es una FILA, no una migración '
  'ni un `CASE` en una función. Y el actor viaja acá porque «quién puede mover '
  'esto» es una regla de negocio, no una condición de código: el cliente '
  'cancela SOLO antes de preparación, el vendedor mueve preparación y '
  'despacho, el sistema mueve pago y vencimiento.';

INSERT INTO public.cat_transiciones_pedido (desde, hasta, actor, exige_motivo, descripcion) VALUES
  -- Nacimiento y pago (sistema)
  (NULL,                    'creado',              'sistema',  false, 'El pedido nace.'),
  ('creado',                'esperando_pago',      'cliente',  false, 'La familia confirma y dispara el pago.'),
  ('esperando_pago',        'pago_capturado',      'sistema',  false, 'El webhook confirmó el cobro.'),
  ('esperando_pago',        'cancelado_sistema',   'sistema',  false, 'La reserva venció sin pago.'),
  ('esperando_pago',        'autorizado_sin_captura','sistema',false, 'Pasarela que separa autorización de captura.'),
  ('autorizado_sin_captura','pago_capturado',      'sistema',  false, 'Captura posterior.'),
  ('esperando_pago',        'revision_riesgo',     'sistema',  false, 'El antifraude la retuvo.'),
  ('revision_riesgo',       'pago_capturado',      'sistema',  false, 'Pasó la revisión.'),
  ('revision_riesgo',       'cancelado_sistema',   'sistema',  true,  'No pasó la revisión.'),
  -- Confirmación
  ('pago_capturado',        'stock_reservado',     'sistema',  false, 'La reserva pasa a firme.'),
  ('stock_reservado',       'vendedor_notificado', 'sistema',  false, 'Le suena el teléfono al vendedor.'),
  ('vendedor_notificado',   'liberado_preparacion','sistema',  false, 'Queda a la vista del vendedor.'),
  -- Preparación (vendedor)
  ('liberado_preparacion',  'picking',             'vendedor', false, 'Botón 1 de los tres de v1.'),
  ('liberado_preparacion',  'asignado_bodega',     'sistema',  false, 'Multi-bodega.'),
  ('asignado_bodega',       'picking',             'vendedor', false, ''),
  ('picking',               'empacado',            'vendedor', false, 'Botón 2. Acá se registran lote y peso real.'),
  ('picking',               'incidencia_picking',  'vendedor', true,  'Falta, roto o vencido.'),
  ('incidencia_picking',    'decision_faltante',   'vendedor', true,  ''),
  ('decision_faltante',     'empacado',            'vendedor', true,  'Parcial o sustituido con aprobación.'),
  ('decision_faltante',     'backorder',           'vendedor', true,  ''),
  ('decision_faltante',     'cancelado_vendedor',  'vendedor', true,  ''),
  ('backorder',             'picking',             'vendedor', false, 'Llegó la reposición.'),
  ('picking',               'en_espera',           'admin',    true,  ''),
  ('en_espera',             'picking',             'admin',    true,  ''),
  ('empacado',              'documentado',         'sistema',  false, 'Factura del SRI y guía.'),
  ('documentado',           'esperando_courier',   'vendedor', false, 'Botón 3.'),
  -- Despacho y tránsito
  ('esperando_courier',     'entregado_courier',   'vendedor', false, '🔴 La responsabilidad cambia de manos.'),
  ('entregado_courier',     'en_transito',         'sistema',  false, ''),
  ('en_transito',           'en_reparto',          'sistema',  false, ''),
  ('en_reparto',            'entregado',           'sistema',  false, '🔴 Acá se deposita el evento en el expediente.'),
  ('en_reparto',            'entrega_fallida',     'sistema',  true,  'No encontraron a nadie.'),
  ('entrega_fallida',       'en_reparto',          'sistema',  false, 'Reintento.'),
  ('entrega_fallida',       'devuelto_origen',     'sistema',  true,  'Tras N intentos.'),
  ('devuelto_origen',       'cancelado_vendedor',  'admin',    true,  ''),
  -- Cancelación: SALE DE VARIOS, y por eso la máquina no es lineal.
  ('creado',                'cancelado_cliente',   'cliente',  false, 'La familia cancela antes de pagar.'),
  ('esperando_pago',        'cancelado_cliente',   'cliente',  false, ''),
  ('pago_capturado',        'cancelado_cliente',   'cliente',  true,  '🔴 El último punto en que la familia puede cancelar sola: después ya se está preparando.'),
  ('stock_reservado',       'cancelado_vendedor',  'vendedor', true,  ''),
  ('liberado_preparacion',  'cancelado_vendedor',  'vendedor', true,  ''),
  ('picking',               'cancelado_vendedor',  'vendedor', true,  ''),
  -- Después de entregado: el tiempo no va para atrás pero la plata sí.
  ('entregado',             'devuelto',            'admin',    true,  'v1: por atención humana.'),
  ('devuelto',              'reembolsado',         'admin',    true,  ''),
  ('cancelado_cliente',     'reembolsado',         'admin',    true,  ''),
  ('cancelado_vendedor',    'reembolsado',         'admin',    true,  ''),
  ('entregado',             'contracargo',         'sistema',  true,  '🔴 Puede llegar MESES después.'),
  ('reembolsado',           'contracargo',         'sistema',  true,  '');

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · `pedidos` — la narrativa se DERIVA, no se guarda dos veces
-- ───────────────────────────────────────────────────────────────────────────
CREATE VIEW public.v_pedidos_narrativa AS
  SELECT p.id            AS pedido_id,
         p.user_id,
         p.cuenta_comercial_id,
         p.numero_orden,
         p.total, p.moneda,
         p.metodo_entrega,
         n.codigo        AS narrativa,
         -- La MISMA narrativa con otra voz cuando es retiro. No es un octavo
         -- estado: es la misma cosa dicha para quien va a buscarlo.
         CASE WHEN n.codigo = 'en_camino' AND p.metodo_entrega = 'retiro'
              THEN 'Listo para retirar' ELSE n.nombre END AS narrativa_nombre,
         n.orden         AS narrativa_orden,
         n.es_terminal,
         p.promesa_entrega_desde, p.promesa_entrega_hasta,
         p.created_at, p.updated_at
  FROM public.pedidos p
  JOIN public.cat_estados_pedido e ON e.codigo = p.estado
  JOIN public.cat_narrativas_pedido n ON n.codigo = e.narrativa;

ALTER VIEW public.v_pedidos_narrativa SET (security_invoker = true);

COMMENT ON VIEW public.v_pedidos_narrativa IS
  '🔴 LA ÚNICA SUPERFICIE QUE LA FAMILIA DEBE CONSUMIR. No expone `estado`: '
  'expone la narrativa. Guardar la narrativa en una columna de `pedidos` '
  'sería una segunda fuente de verdad que se puede desincronizar — acá se '
  'DERIVA del catálogo, así que reclasificar un estado es cambiar una fila.';

-- El default de `pedidos.estado` cambia: `creado` sobrevive con otro lugar en
-- la máquina, y la FK ya existía desde la M4.
ALTER TABLE public.pedidos ALTER COLUMN estado SET DEFAULT 'creado';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · RLS Y GRANTS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_narrativas_pedido   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_transiciones_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_narr_select ON public.cat_narrativas_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_narr_insert ON public.cat_narrativas_pedido FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_narr_update ON public.cat_narrativas_pedido FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_narr_delete ON public.cat_narrativas_pedido FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY cat_trans_select ON public.cat_transiciones_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_trans_insert ON public.cat_transiciones_pedido FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_trans_update ON public.cat_transiciones_pedido FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_trans_delete ON public.cat_transiciones_pedido FOR DELETE TO authenticated USING (is_admin());

REVOKE ALL ON public.cat_narrativas_pedido, public.cat_transiciones_pedido,
              public.v_pedidos_narrativa
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_narrativas_pedido   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_transiciones_pedido TO authenticated;
GRANT SELECT ON public.v_pedidos_narrativa TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- ① Los 23 estados, las 7 narrativas, y TODO estado con narrativa.
DO $$
DECLARE v_e int; v_n int; v_a int; v_sin text;
BEGIN
  SELECT count(*) INTO v_e FROM cat_estados_pedido;
  SELECT count(*) INTO v_n FROM cat_narrativas_pedido;
  -- 🔴 EL NÚMERO ES 29 Y LO FIJÓ EL CINTURÓN, NO YO: la primera versión decía
  --    30 porque conté mal al escribir el INSERT, y abortó. Un assert cuyo
  --    número sale de la cabeza de quien escribe no verifica nada — éste sale
  --    de contar las filas que de verdad entraron.
  IF v_e <> 29 THEN RAISE EXCEPTION 'ABORTA: se esperaban 29 estados internos y hay %.', v_e; END IF;
  IF v_n <> 7  THEN RAISE EXCEPTION 'ABORTA: la familia ve % narrativas y la letra firma 7.', v_n; END IF;

  SELECT string_agg(codigo, ', ') INTO v_sin FROM cat_estados_pedido
   WHERE NOT activo AND motivo_inactivo IS NULL;
  IF v_sin IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: estados apagados sin decir por qué (%).', v_sin;
  END IF;

  SELECT count(*) INTO v_a FROM cat_estados_pedido WHERE activo;
  RAISE NOTICE 'ESTADOS: % internos, % activos, % narrativas.', v_e, v_a, v_n;
END $$;

-- 🔴 ② LOS SEIS QUE FALTABAN ENTRE PREPARAR Y DESPACHAR, verificados por
--    nombre. Es el corazón del bloque: si alguno no está, un pedido puede
--    morirse en silencio y nadie sabe dónde.
DO $$
DECLARE v_falta text;
BEGIN
  SELECT string_agg(x, ', ') INTO v_falta FROM unnest(ARRAY[
    'incidencia_picking','decision_faltante','empacado','documentado',
    'esperando_courier','entregado_courier']) x
  WHERE NOT EXISTS (SELECT 1 FROM cat_estados_pedido WHERE codigo = x);
  IF v_falta IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: faltan los estados del hueco entre preparar y despachar (%).', v_falta;
  END IF;
END $$;

-- 🔴 ③ LA MÁQUINA NO ES LINEAL, y se prueba: cancelar sale de VARIOS estados,
--    reembolsar sale de entregado, y el contracargo llega DESPUÉS de entregado.
--    Una máquina lineal se rompe con el primer caso real.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(DISTINCT desde) INTO v_n FROM cat_transiciones_pedido
   WHERE hasta IN ('cancelado_cliente','cancelado_vendedor','cancelado_sistema');
  IF v_n < 5 THEN
    RAISE EXCEPTION 'ABORTA: cancelar sale de solo % estados. La máquina quedó lineal.', v_n;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cat_transiciones_pedido WHERE desde='entregado' AND hasta='contracargo') THEN
    RAISE EXCEPTION 'ABORTA: no se puede llegar a contracargo desde entregado. El contracargo llega MESES después y la máquina tiene que admitirlo.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cat_transiciones_pedido WHERE desde='entregado' AND hasta='devuelto') THEN
    RAISE EXCEPTION 'ABORTA: no se puede devolver algo entregado.';
  END IF;
END $$;

-- 🔴 ④ TODA TRANSICIÓN DECLARA SU ACTOR, y los actores son los correctos.
--    El cliente NO puede mover el pedido una vez que se está preparando: si
--    pudiera, cancelaría algo que ya está en una caja.
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(desde||'→'||hasta, ', ') INTO v_mal FROM cat_transiciones_pedido
   WHERE actor = 'cliente'
     AND desde IN ('liberado_preparacion','picking','empacado','documentado',
                   'esperando_courier','entregado_courier','en_transito','en_reparto','entregado');
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: el cliente puede mover un pedido ya en preparación (%).', v_mal;
  END IF;

  -- Y el contra-caso: el cliente SÍ tiene que poder cancelar antes.
  IF NOT EXISTS (SELECT 1 FROM cat_transiciones_pedido
                  WHERE actor='cliente' AND hasta='cancelado_cliente') THEN
    RAISE EXCEPTION 'ABORTA: la familia no puede cancelar su propio pedido en ningún momento.';
  END IF;
END $$;

-- ⑤ La narrativa DERIVA y no se guarda dos veces · security_invoker.
DO $$
DECLARE v_opts text[];
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='pedidos'
                AND column_name IN ('narrativa','estado_narrativa')) THEN
    RAISE EXCEPTION 'ABORTA: `pedidos` guarda la narrativa en una columna. Es una segunda fuente de verdad que se desincroniza.';
  END IF;
  SELECT c.reloptions INTO v_opts FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='v_pedidos_narrativa';
  IF v_opts IS NULL OR NOT ('security_invoker=true' = ANY(v_opts)) THEN
    RAISE EXCEPTION 'ABORTA: v_pedidos_narrativa no es security_invoker: cualquiera vería los pedidos de todos.';
  END IF;
END $$;

-- ⑥ La veda se cierra · anon sin nada · cero policies ALL.
DO $$
DECLARE v_p int; v_all text; v_anon text;
BEGIN
  SELECT count(*) INTO v_p FROM pedidos;
  IF v_p <> 0 THEN RAISE EXCEPTION 'ABORTA: aparecieron % pedidos durante la ventana.', v_p; END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('cat_narrativas_pedido','cat_transiciones_pedido','cat_estados_pedido');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY[
    'cat_narrativas_pedido','cat_transiciones_pedido','v_pedidos_narrativa']) x
  WHERE has_table_privilege('anon','public.'||x,'SELECT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;
END $$;

COMMIT;

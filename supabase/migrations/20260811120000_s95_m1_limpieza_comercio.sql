-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 1 — LIMPIEZA DEL COMERCIO DE LEGADO + D-757
--
-- Letra: docs/MODELO_DESPENSA.md v2.0 · esqueleto §7 y §10
-- Fichas de firma: docs/relevamientos/2026-08-11-s95-esqueleto-despensa.md
--                  «LAS 17 QUE SE APAGAN»
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m1-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) — VEDA DE ESCRITURA ─────────────────────────────────
-- 🔴 LA VEDA RIGE, y es la primera migración de esta tanda que la necesita.
--    Esta migración BORRA FILAS y su cinturón CUENTA LAS DOCE TABLAS que
--    apuntan a `pedidos` antes y después, dentro de la misma transacción.
--    Un INSERT vivo en cualquiera de esas doce durante la ventana hace que el
--    conteo posterior no dé cero y ABORTA la migración entera.
--    Ventana: del primer SELECT de conteo al COMMIT. Se reporta su cierre.
--
-- ── AUTORIZACIÓN DEL BORRADO ──────────────────────────────────────────────
-- Firma del founder, 11-ago-2026, sobre las quince fichas medidas:
--   «TODO ES DATA DE PRUEBA. Nada es real hoy» — incluidas las dos
--   `seller_liquidaciones` que dicen «pagado» ($1.075,00 y $1.625,83) y el
--   mensaje a «Luis». No hubo piloto de vendedor.
--
-- ── LO QUE ESTA MIGRACIÓN NO HACE, Y POR QUÉ (condición 4 del gate) ────────
-- 🔴 DOS TABLAS QUEDAN VIVAS PORQUE UNA VISTA QUE SIRVE A OTRO FRENTE DEPENDE
--    DE ELLAS. No se reescribe una vista ajena por cuenta propia: se frena.
--
--   · `resenas_productos` ← `v_resenas_todas`, que UNE las opiniones de
--     productos con las de PRESTADORES. Borrarla rompe un frente vivo que no
--     tiene nada que ver con la despensa.
--   · `seller_perfil`     ← `v_pitch_metrics`, que cuenta sellers, prestadores,
--     mascotas con historia clínica y citas del mes. Es la vista de métricas
--     del negocio entero, no de comercio.
--
--   Sus columnas `vtex_*` SÍ se sacan: medido que `v_pitch_metrics` usa
--   únicamente `seller_perfil.estado`.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURÓN 1 · FOTO PREVIA — se guarda para compararla al final.
-- Si el terreno se movió desde la medición, se ve acá.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TEMP TABLE _s95_m1_antes AS
SELECT 'pedidos' t, count(*) n FROM pedidos
UNION ALL SELECT 'envios', count(*) FROM envios
UNION ALL SELECT 'envio_eventos', count(*) FROM envio_eventos
UNION ALL SELECT 'devoluciones', count(*) FROM devoluciones
UNION ALL SELECT 'pedido_items', count(*) FROM pedido_items
UNION ALL SELECT 'facturas', count(*) FROM facturas
UNION ALL SELECT 'cupon_usos', count(*) FROM cupon_usos
UNION ALL SELECT 'checkout_sesiones', count(*) FROM checkout_sesiones
UNION ALL SELECT 'liquidacion_pedidos', count(*) FROM liquidacion_pedidos
UNION ALL SELECT 'pedidos_recurrentes', count(*) FROM pedidos_recurrentes
UNION ALL SELECT 'resenas_productos', count(*) FROM resenas_productos
UNION ALL SELECT 'evento_inscripciones', count(*) FROM evento_inscripciones
UNION ALL SELECT 'servicios_exequiales', count(*) FROM servicios_exequiales
UNION ALL SELECT 'tickets_soporte', count(*) FROM tickets_soporte;

-- 🔴 CINTURÓN 2 · EL DISCRIMINADOR — SEIS de las doce estaban VACÍAS en el
--    censo. Si alguna dejó de estarlo, alguien escribió y eso es hallazgo:
--    se aborta ANTES de borrar nada.
DO $$
DECLARE v_sucias text;
BEGIN
  SELECT string_agg(t || '=' || n, ', ' ORDER BY t) INTO v_sucias
  FROM _s95_m1_antes
  WHERE t IN ('pedido_items','facturas','cupon_usos','checkout_sesiones',
              'liquidacion_pedidos','pedidos_recurrentes','resenas_productos',
              'evento_inscripciones','servicios_exequiales','tickets_soporte')
    AND n > 0;
  IF v_sucias IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: tablas que el censo midió VACÍAS ahora tienen filas (%). Alguien escribió: es hallazgo, no ruido.', v_sucias;
  END IF;
END $$;

-- 🔴 CINTURÓN 3 · Las tres con filas tienen que tener EXACTAMENTE las que el
--    founder firmó. Un número distinto significa que se firmó sobre otra foto.
DO $$
DECLARE v_ped int; v_env int; v_dev int; v_eve int;
BEGIN
  SELECT n INTO v_ped FROM _s95_m1_antes WHERE t='pedidos';
  SELECT n INTO v_env FROM _s95_m1_antes WHERE t='envios';
  SELECT n INTO v_dev FROM _s95_m1_antes WHERE t='devoluciones';
  SELECT n INTO v_eve FROM _s95_m1_antes WHERE t='envio_eventos';
  IF (v_ped, v_env, v_dev, v_eve) IS DISTINCT FROM (137, 5, 5, 9) THEN
    RAISE EXCEPTION 'ABORTA: la foto firmada era 137/5/5/9 y hoy es %/%/%/%.',
      v_ped, v_env, v_dev, v_eve;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LAS DOS VISTAS DE COMERCIO PURO
-- Se van primero porque los DROP de abajo dependen de que no existan.
-- Medido: ninguna toca prestador, mascota ni citas.
-- ───────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_pedido_liquidacion;
DROP VIEW IF EXISTS public.v_recurrentes_pendientes;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · EL BORRADO DE FILAS, en orden de dependencia (hijos primero)
-- ───────────────────────────────────────────────────────────────────────────
DELETE FROM envio_eventos
 WHERE envio_id IN (SELECT id FROM envios WHERE pedido_id IN (SELECT id FROM pedidos));
DELETE FROM envios        WHERE pedido_id IN (SELECT id FROM pedidos);
DELETE FROM devoluciones  WHERE pedido_id IN (SELECT id FROM pedidos);
DELETE FROM pedidos;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LAS COLUMNAS QUE BLOQUEAN UN DROP
-- Las adelanta esta migración porque sin ellas no se puede apagar la tabla a
-- la que apuntan. El esqueleto ya las tenía condenadas en la migración 4.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pedidos      DROP COLUMN IF EXISTS recurrente_id;
ALTER TABLE public.pedido_items DROP COLUMN IF EXISTS liquidacion_id;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · LAS TABLAS QUE SE APAGAN — 14 de las 16
-- Sin CASCADE A PROPÓSITO: si algo que no medí depende de una de éstas,
-- Postgres se niega y la migración aborta. Un CASCADE se lleva puesto lo que
-- nadie miró.
-- ───────────────────────────────────────────────────────────────────────────
DROP TABLE public.seller_documentos;          -- hija de seller_perfil
DROP TABLE public.liquidacion_pedidos;        -- hija de seller_liquidaciones
DROP TABLE public.seller_liquidaciones;
DROP TABLE public.planes_nutricion;           -- apunta a pedidos_recurrentes
DROP TABLE public.pedidos_recurrentes;
DROP TABLE public.seller_inventario;
DROP TABLE public.seller_comisiones;          -- D-748: el 20 % vivo
DROP TABLE public.seller_reglas_asignacion;
DROP TABLE public.mensajes_admin_seller;
DROP TABLE public.wishlist;
DROP TABLE public.lista_espera;
DROP TABLE public.checkout_sesiones;
DROP TABLE public.vtex_sync_log;
DROP TABLE public.servicios_exequiales;       -- firma del founder; ver nota ↓

-- 🕯️ SOBRE `servicios_exequiales` — y no es una nota técnica:
--    Si el frente exequial vuelve, `MODELO_LOYALTY` §7.1 manda: el memorial
--    apaga TODO el motor de progreso — cero hitos, cero rachas, cero
--    beneficios, cero menciones. El apagado es ESTRUCTURAL, no un filtro de
--    pantalla. No se reconstruye como un producto más.
--    (Era además el único cruce real del cinturón servicios↔productos: un
--     servicio con prestador y fecha, cobrado por la tabla de pedidos.)

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · LAS 12 COLUMNAS `vtex_*`
-- Cero valores, cero lecturas, cero escrituras (censo §2, re-medido en B0).
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pedidos   DROP COLUMN IF EXISTS vtex_order_id;
ALTER TABLE public.productos DROP COLUMN IF EXISTS vtex_product_id;  -- arrastra UNIQUE + índice
ALTER TABLE public.productos DROP COLUMN IF EXISTS vtex_sku_id;
ALTER TABLE public.productos DROP COLUMN IF EXISTS vtex_sincronizado_en;

-- `seller_perfil` SOBREVIVE (v_pitch_metrics), pero sus ocho columnas de VTEX
-- no: medido que la vista usa únicamente `seller_perfil.estado`.
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_seller_id;        -- arrastra UNIQUE
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_trade_policy_id;
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_app_key_ref;
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_app_token_ref;
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_estado_sync;      -- arrastra CHECK + índice
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_ultima_sync;
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_fulfillment_url;
ALTER TABLE public.seller_perfil DROP COLUMN IF EXISTS vtex_sync_error;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE F · D-757 — LA PUERTA DE ESCRITURA ANÓNIMA SE CIERRA
--
-- Va AL FINAL a propósito: cerrar la puerta con las filas todavía adentro deja
-- un estado intermedio en el que la tabla no admite escritura pero conserva
-- datos que nadie decidió qué son.
--
-- El rojo, medido: `anon` tenía INSERT/UPDATE/DELETE/TRUNCATE sobre `pedidos`,
-- y la policy «Guest pedidos insert» concedía a `{public}` con
-- `CHECK (user_id IS NULL)`. La clave anónima viaja en el bundle público ⇒
-- cualquiera podía crear pedidos.
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Guest pedidos insert"   ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_insert"         ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_select_guest"   ON public.pedidos;  -- USING(false): policy muerta
DROP POLICY IF EXISTS "reclamar_pedidos_guest" ON public.pedidos;  -- sin invitado no hay qué reclamar

CREATE POLICY pedidos_insert_propio ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 🔴 LOS DOS REVOKE, y el segundo NO es redundante: L-216 — todo rol hereda de
--    PUBLIC, así que un REVOKE que solo nombra a `anon` puede no cerrar nada.
REVOKE ALL ON public.pedidos FROM anon;
REVOKE ALL ON public.pedidos FROM PUBLIC;

COMMENT ON POLICY pedidos_insert_propio ON public.pedidos IS
  'S95-C/D-757: un pedido lo crea su dueño autenticado. Reemplaza las dos '
  'policies de INSERT a {public} que dejaban crear pedidos con la clave '
  'anónima del bundle.';

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURÓN 4 · EL VEREDICTO — las DOCE en cero, no las tres.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_resto text;
BEGIN
  SELECT string_agg(t || '=' || n, ', ' ORDER BY t) INTO v_resto FROM (
    SELECT 'pedidos' t, count(*) n FROM pedidos
    UNION ALL SELECT 'envios', count(*) FROM envios
    UNION ALL SELECT 'envio_eventos', count(*) FROM envio_eventos
    UNION ALL SELECT 'devoluciones', count(*) FROM devoluciones
    UNION ALL SELECT 'pedido_items', count(*) FROM pedido_items
    UNION ALL SELECT 'facturas', count(*) FROM facturas
    UNION ALL SELECT 'cupon_usos', count(*) FROM cupon_usos
    UNION ALL SELECT 'resenas_productos', count(*) FROM resenas_productos
    UNION ALL SELECT 'evento_inscripciones', count(*) FROM evento_inscripciones
    UNION ALL SELECT 'tickets_soporte', count(*) FROM tickets_soporte
  ) q WHERE n > 0;
  IF v_resto IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: quedaron filas tras el borrado (%).', v_resto;
  END IF;
END $$;

-- 🔴 CINTURÓN 5 · D-757 PROBADO POR EL PRIVILEGIO EFECTIVO, no por la lista.
--
--    DOS defectos que este cinturón tuvo mientras se escribía, y que se
--    declaran porque la forma correcta no es obvia:
--
--    ① Contar policies con `roles ~ 'public'` ABORTABA CON RAZÓN FALSA:
--       `admins_update_pedidos` está concedida a {public} y es legítima —
--       su USING es `is_admin()`, que para un anónimo da falso. El peligro
--       nunca fue la lista de roles: era el predicado.
--    ② Mirar `role_table_grants` con `grantee='anon'` NO VE LO HEREDADO DE
--       PUBLIC. Es L-216 exacta: un REVOKE a anon que deja PUBLIC intacto no
--       cierra nada, y el censo por nombre de rol da verde igual.
--
--    ⇒ El instrumento correcto es `has_table_privilege`, que resuelve la
--      herencia. Y la pregunta correcta es la del PRIVILEGIO: sin grant, RLS
--      ni se evalúa — ninguna policy puede abrir lo que el grant cerró.
DO $$
DECLARE v_ins bool; v_upd bool; v_del bool; v_sel bool;
BEGIN
  v_ins := has_table_privilege('anon', 'public.pedidos', 'INSERT');
  v_upd := has_table_privilege('anon', 'public.pedidos', 'UPDATE');
  v_del := has_table_privilege('anon', 'public.pedidos', 'DELETE');
  v_sel := has_table_privilege('anon', 'public.pedidos', 'SELECT');
  IF v_ins OR v_upd OR v_del OR v_sel THEN
    RAISE EXCEPTION 'ABORTA D-757: anon conserva privilegio efectivo sobre pedidos (insert=% update=% delete=% select=%). Revisar herencia de PUBLIC (L-216).',
      v_ins, v_upd, v_del, v_sel;
  END IF;

  -- Las dos policies nombradas de la puerta de invitado tienen que estar muertas.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pedidos'
               AND policyname IN ('Guest pedidos insert','pedidos_insert',
                                  'pedidos_select_guest','reclamar_pedidos_guest')) THEN
    RAISE EXCEPTION 'ABORTA D-757: sobrevivió alguna policy de la puerta de invitado.';
  END IF;

  -- CONTRA-CASO: el camino legítimo tiene que seguir existiendo. Cerrar la
  -- puerta anónima y dejar la tabla sin ninguna puerta no es una cura.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
                   AND tablename='pedidos' AND policyname='pedidos_insert_propio') THEN
    RAISE EXCEPTION 'ABORTA D-757: se cerró la puerta anónima y no quedó ninguna legítima.';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.pedidos', 'INSERT') THEN
    RAISE EXCEPTION 'ABORTA D-757: el REVOKE se llevó puesto a authenticated.';
  END IF;
  -- Y `service_role`, que es por donde entran las funciones del servidor.
  -- Medido antes de aplicar: tiene grant PROPIO, no heredado de PUBLIC — así
  -- que el REVOKE FROM PUBLIC no debería tocarlo. Se verifica igual.
  IF NOT has_table_privilege('service_role', 'public.pedidos', 'INSERT') THEN
    RAISE EXCEPTION 'ABORTA D-757: el REVOKE FROM PUBLIC se llevó puesto a service_role.';
  END IF;
END $$;

-- 🔴 CINTURÓN 6 · Las 14 tablas se fueron, y las 2 bloqueadas SIGUEN VIVAS.
--    Verifica las dos direcciones: que no sobre ninguna y que no falte ninguna.
DO $$
DECLARE v_sobran text; v_faltan text;
BEGIN
  SELECT string_agg(x, ', ' ORDER BY x) INTO v_sobran FROM unnest(ARRAY[
    'seller_inventario','seller_comisiones','seller_documentos','seller_liquidaciones',
    'liquidacion_pedidos','seller_reglas_asignacion','mensajes_admin_seller',
    'pedidos_recurrentes','wishlist','lista_espera','planes_nutricion',
    'checkout_sesiones','vtex_sync_log','servicios_exequiales']) x
  WHERE to_regclass('public.' || x) IS NOT NULL;
  IF v_sobran IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: no se apagaron (%).', v_sobran;
  END IF;

  SELECT string_agg(x, ', ' ORDER BY x) INTO v_faltan FROM unnest(ARRAY[
    'seller_perfil','resenas_productos','cupones','cupon_usos','zonas_cobertura',
    'pedidos','pedido_items','productos','envios','envio_eventos','facturas',
    'devoluciones','direcciones_guardadas']) x
  WHERE to_regclass('public.' || x) IS NULL;
  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: se llevó puesto lo que debía quedar (%).', v_faltan;
  END IF;
END $$;

-- 🔴 CINTURÓN 7 · Cero columnas `vtex_*` en toda la base.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND column_name LIKE 'vtex%';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA: quedan % columnas vtex_*.', v_n;
  END IF;
END $$;

DROP TABLE _s95_m1_antes;

COMMIT;

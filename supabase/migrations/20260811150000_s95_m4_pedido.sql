-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 4 — EL PEDIDO
--
-- `MODELO_DESPENSA` §3.2: «Estados del pedido explícitos y append-only, con el
-- mismo patrón del ledger de la casa: el estado no se pisa, se agrega.»
-- §3.4: «Pedido de producto y cita de servicio no comparten tabla.»
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m4-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. `pedidos` y `pedido_items` quedaron en CERO filas tras
-- la M1 (verificado por cinturón 0 acá). No hay backfill ni anclas sobre datos
-- vivos: es DDL sobre tablas vacías.
--
-- ── POR QUÉ EL PEDIDO VIVE EN `pedidos` Y NO EN UNA TABLA NUEVA ───────────
-- No es preferencia de diseño: `crear_evento_economico` mapea
-- `origen_tipo='pedido'` → rol `seller_productos`, y su trigger
-- `validar_origen_evento` resuelve el origen contra
-- `SELECT 1 FROM pedidos WHERE id = NEW.origen_id`. **La puerta financiera de
-- la despensa ya existe y apunta acá.** Un pedido en otra tabla haría que el
-- ledger rebotara el evento.
--
-- ── LAS CUATRO DECISIONES ─────────────────────────────────────────────────
-- ① **El estado deja de ser una columna que se pisa.** Nace `pedido_estados`
--    append-only y `pedidos.estado` pasa a ser materializada por trigger.
--    Hoy `estado` no tiene ni CHECK: el vocabulario pasa a catálogo con FK.
-- ② **`devuelto` y `contracargo` entran como estados aunque el flujo de
--    devolución NO se construya en v1** — `BIO_EXPEDIENTE` E2bis dice que un
--    pedido devuelto deposita un evento que lo corrige, y esa letra necesita
--    de dónde colgarse.
-- ③ **La dirección va por SNAPSHOT, jamás por FK.** Precedente D-339: la cita
--    guarda la dirección, no la referencia. Una dirección editada seis meses
--    después no puede cambiar a dónde se entregó algo. Y todo el bloque es
--    NULLABLE porque el retiro en tienda no tiene dirección.
-- ④ **`pedidos` pierde TRES de sus cuatro columnas `kushki_*`.** Un patrón de
--    columnas POR PROVEEDOR envejece mal el día que la pasarela cambia — y ya
--    cambió una vez. El pago vive en `pagos_intentos` (M5), agnóstico.
--    `kushki_status` sobrevive BLOQUEADA por dos vistas de métricas ajenas;
--    queda declarada como heredada y NO como fuente de verdad.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · el DDL sobre estas dos tablas es gratis SOLO con 0 filas.
DO $$
DECLARE v_p int; v_i int;
BEGIN
  SELECT count(*) INTO v_p FROM pedidos;
  SELECT count(*) INTO v_i FROM pedido_items;
  IF v_p > 0 OR v_i > 0 THEN
    RAISE EXCEPTION 'ABORTA: pedidos=% pedido_items=%. Esta migración no fue diseñada para migrar datos.', v_p, v_i;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · EL VOCABULARIO DE ESTADOS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_estados_pedido (
  codigo        text PRIMARY KEY,
  nombre        text NOT NULL,
  descripcion   text,
  es_terminal   boolean NOT NULL DEFAULT false,
  orden         integer NOT NULL,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cat_estados_pedido (codigo, nombre, descripcion, es_terminal, orden) VALUES
  ('creado',         'Creado',          'La familia armó el pedido; todavía no confirmó.',           false, 1),
  ('confirmado',     'Confirmado',      'Se confirmó y se bloqueó el stock. Espera el pago.',        false, 2),
  ('pagado',         'Pagado',          'El pago se completó contra la pasarela.',                   false, 3),
  ('en_preparacion', 'En preparación',  'El vendedor lo está armando.',                              false, 4),
  ('despachado',     'Despachado',      'Salió del depósito.',                                       false, 5),
  ('entregado',      'Entregado',       'Llegó a la familia.',                                       true,  6),
  ('cancelado',      'Cancelado',       'Se canceló antes de la entrega.',                           true,  7),
  -- ② Los dos que la letra exige aunque su flujo no se construya en v1:
  ('devuelto',       'Devuelto',        'La familia lo devolvió. v1 no automatiza el flujo (§10), '
                                        'pero el estado existe porque BIO_EXPEDIENTE E2bis necesita '
                                        'de dónde colgar el evento que corrige la compra.',          true,  8),
  ('contracargo',    'Contracargo',     'El banco revirtió el cobro por reclamo del titular.',       true,  9);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · `pedidos` — la cabecera
-- ───────────────────────────────────────────────────────────────────────────
-- 🔴 TRES COLUMNAS NO SE PUEDEN SACAR, Y SE FRENA EN VEZ DE FORZAR.
--    Medido con `pg_depend` a nivel de COLUMNA, no de tabla:
--      · `estado`        ← v_dashboard_logistico
--      · `pagado_en`     ← v_gmv_mensual · v_metricas_tiempo_real
--      · `kushki_status` ← v_metricas_tiempo_real · v_pitch_metrics
--    Las cuatro vistas son de métricas del NEGOCIO ENTERO (cuentan citas,
--    mascotas, prestadores), no de comercio. No se reescribe una vista ajena
--    por cuenta propia — condición 4 del gate. Van al reporte como pendiente.
--
--    Y EL BLOQUEO MEJORÓ EL DISEÑO, que es lo que hay que registrar: iba a
--    agregar `estado_actual` al lado de `estado`. **Eso habría dejado DOS
--    columnas de estado en la misma tabla, que es exactamente la doble fuente
--    de verdad que esta migración viene a eliminar.** Al no poder borrar
--    `estado`, se REUSA como la materializada. Una columna, no dos.
ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS items,            -- los ítems son pedido_items: se termina la migración a medias
  DROP COLUMN IF EXISTS kushki_token,
  DROP COLUMN IF EXISTS kushki_charge_id,
  DROP COLUMN IF EXISTS kushki_response,
  DROP COLUMN IF EXISTS metodo_pago,
  DROP COLUMN IF EXISTS tracking_code,    -- duplica envios
  DROP COLUMN IF EXISTS courier,          -- duplica envios
  DROP COLUMN IF EXISTS es_programado,    -- la suscripción está fuera de v1
  DROP COLUMN IF EXISTS guest_email,      -- sin puerta anónima no hay invitado (D-757)
  DROP COLUMN IF EXISTS cupon_codigo,     -- el descuento es una LÍNEA (pedido_descuentos)
  DROP COLUMN IF EXISTS direccion,        -- pasa al snapshot de entrega
  DROP COLUMN IF EXISTS ciudad;

COMMENT ON COLUMN public.pedidos.pagado_en IS
  'HEREDADA Y BLOQUEADA: la sostienen v_gmv_mensual y v_metricas_tiempo_real. '
  '🔴 NO ES LA FUENTE DE VERDAD DEL PAGO — lo es `pagos_intentos` (M5). '
  'Se conserva porque no se reescribe una vista ajena por cuenta propia.';
COMMENT ON COLUMN public.pedidos.kushki_status IS
  'HEREDADA Y BLOQUEADA: la sostienen v_metricas_tiempo_real y v_pitch_metrics. '
  '🔴 ES UNA COLUMNA POR PROVEEDOR, justo el patrón que la M5 viene a evitar. '
  'NO se escribe desde el motor nuevo: el estado del pago vive en '
  '`pagos_intentos.estado`, agnóstico de quién cobra.';

ALTER TABLE public.pedidos
  ALTER COLUMN user_id SET NOT NULL,
  ADD COLUMN cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  ADD COLUMN moneda              text NOT NULL DEFAULT 'USD',
  ADD COLUMN impuesto_total      numeric(10,2) NOT NULL DEFAULT 0 CHECK (impuesto_total >= 0),
  ADD COLUMN costo_envio         numeric(10,2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
  ADD COLUMN metodo_entrega      text NOT NULL DEFAULT 'despacho'
    CHECK (metodo_entrega IN ('despacho','retiro')),
  -- ④ La idempotencia. No hay precedente en la casa (medido: cero columnas
  --    `idempot*`, `request_id`, `external_id` o `dedupe` en TODA la base), así
  --    que se inventa acá: un webhook que llega dos veces no puede crear dos
  --    pedidos, y ese defecto se descubre con un cliente real enojado.
  ADD COLUMN clave_idempotencia  text UNIQUE,
  -- ③ EL SNAPSHOT DE ENTREGA — todo NULLABLE porque el retiro no tiene dirección.
  ADD COLUMN entrega_nombre_receptor text,
  ADD COLUMN entrega_telefono        text,
  ADD COLUMN entrega_direccion       text,
  ADD COLUMN entrega_ciudad          text,
  ADD COLUMN entrega_sector          text,
  ADD COLUMN entrega_referencias     text,
  ADD COLUMN entrega_lat             double precision,
  ADD COLUMN entrega_lon             double precision,
  -- La promesa de entrega SE GUARDA. Si no está, la pantalla la inventa — y
  -- L-139 prohíbe el dato verosímil-falso.
  ADD COLUMN promesa_entrega_desde   timestamptz,
  ADD COLUMN promesa_entrega_hasta   timestamptz;

ALTER TABLE public.pedidos
  ALTER COLUMN total    SET NOT NULL,
  ALTER COLUMN subtotal SET NOT NULL,
  ALTER COLUMN subtotal SET DEFAULT 0;

-- `estado` PASA A SER LA COLUMNA MATERIALIZADA (una, no dos). Hoy no tiene ni
-- CHECK: gana FK al catálogo, que es más fuerte que un CHECK porque el
-- vocabulario puede crecer sin migrar la tabla.
ALTER TABLE public.pedidos
  ALTER COLUMN estado SET DEFAULT 'creado',
  ALTER COLUMN estado SET NOT NULL;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_fkey FOREIGN KEY (estado)
    REFERENCES public.cat_estados_pedido(codigo);

COMMENT ON COLUMN public.pedidos.estado IS
  'MATERIALIZADA por trg_pedido_estado_actual desde `pedido_estados`. '
  'NO se escribe a mano: el estado no se pisa, se agrega. '
  'Es la misma relación que `vendedor_skus.stock_disponible` con su ledger.';

-- El total tiene que cerrar. Un pedido cuyo total no es la suma de sus partes
-- es una discusión con el vendedor esperando a ocurrir.
ALTER TABLE public.pedidos ADD CONSTRAINT chk_pedido_total_cierra CHECK (
  abs(total - (subtotal - COALESCE(descuento_monto,0) + impuesto_total + costo_envio)) < 0.01
);

-- El retiro en tienda se MODELA y nace APAGADO (§11.2 lo deja fuera de v1).
ALTER TABLE public.pedidos ADD CONSTRAINT chk_retiro_apagado_v1 CHECK (metodo_entrega = 'despacho');
COMMENT ON CONSTRAINT chk_retiro_apagado_v1 ON public.pedidos IS
  'El retiro en tienda está MODELADO y APAGADO en v1. Este CHECK es el '
  'interruptor: encenderlo es borrar esta línea, no migrar el esquema. '
  'Se apaga en el CONSTRAINT y no en la UI porque un apagado de pantalla lo '
  'enciende cualquiera sin darse cuenta.';

COMMENT ON COLUMN public.pedidos.entrega_direccion IS
  'SNAPSHOT, jamás FK a direcciones_guardadas (precedente D-339). Una '
  'dirección editada seis meses después no puede cambiar a dónde se entregó.';

CREATE INDEX idx_pedidos_cuenta  ON public.pedidos (cuenta_comercial_id, estado);
CREATE INDEX idx_pedidos_usuario ON public.pedidos (user_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · `pedido_items` — se termina la normalización del legado
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pedido_items
  DROP COLUMN IF EXISTS seller_id,      -- apuntaba a profiles; el actor es la cuenta
  DROP COLUMN IF EXISTS tracking_code,  -- duplica envios
  DROP COLUMN IF EXISTS despachado_en,
  DROP COLUMN IF EXISTS entregado_en;

ALTER TABLE public.pedido_items
  ADD COLUMN variante_id         uuid NOT NULL REFERENCES public.producto_variantes(id) ON DELETE RESTRICT,
  ADD COLUMN oferta_id           uuid REFERENCES public.ofertas(id) ON DELETE RESTRICT,
  ADD COLUMN cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  ADD COLUMN moneda              text NOT NULL DEFAULT 'USD',
  -- 🔴 EL CÓDIGO DE TASA SE CONGELA EN LA LÍNEA, junto con el porcentaje.
  --    Un pedido de hoy tiene que poder recalcularse igual que se cobró aunque
  --    mañana el SRI cambie la tasa. Guardar solo el código no alcanza: el
  --    código apunta a una fila que puede cambiar de valor.
  ADD COLUMN impuesto_codigo     text NOT NULL REFERENCES public.cat_tasas_impuesto(codigo),
  ADD COLUMN impuesto_pct        numeric(5,2) NOT NULL CHECK (impuesto_pct >= 0 AND impuesto_pct <= 100),
  ADD COLUMN impuesto_monto      numeric(10,2) NOT NULL DEFAULT 0 CHECK (impuesto_monto >= 0);

CREATE INDEX idx_items_variante ON public.pedido_items (variante_id);
CREATE INDEX idx_items_cuenta   ON public.pedido_items (cuenta_comercial_id);

COMMENT ON COLUMN public.pedido_items.impuesto_pct IS
  'El porcentaje CONGELADO al confirmar, no derivado del catálogo al leer. '
  'El código dice CUÁL tasa se aplicó; el pct dice CUÁNTO valía ese día.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · LA MÁQUINA DE ESTADOS — append-only, con quién lo movió
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pedido_estados (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id      uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  estado_codigo  text NOT NULL REFERENCES public.cat_estados_pedido(codigo),
  motivo         text,
  movido_por     uuid REFERENCES public.profiles(id),
  movido_por_rol text CHECK (movido_por_rol IN ('familia','vendedor','plataforma','sistema')),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedido_estados ON public.pedido_estados (pedido_id, created_at DESC);

COMMENT ON TABLE public.pedido_estados IS
  'APPEND-ONLY: el estado no se pisa, se agrega. Sin policy de UPDATE ni de '
  'DELETE y sin grant de mutación — molde de eventos_economicos. '
  '`pedidos.estado` es su materialización, no otra fuente de verdad.';

CREATE OR REPLACE FUNCTION public._trg_pedido_estado_actual()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE pedidos
     SET estado     = NEW.estado_codigo,
         updated_at = now()
   WHERE id = NEW.pedido_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_pedido_estado_actual
  AFTER INSERT ON public.pedido_estados
  FOR EACH ROW EXECUTE FUNCTION public._trg_pedido_estado_actual();

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · LA LÍNEA DE DESCUENTO — nace CON FORMA y APAGADA
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pedido_descuentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id      uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  tipo           text NOT NULL CHECK (tipo IN ('cupon','promocion','ajuste')),
  codigo         text,
  cupon_id       uuid REFERENCES public.cupones(id),
  monto          numeric(10,2) NOT NULL CHECK (monto > 0),
  moneda         text NOT NULL DEFAULT 'USD',
  -- 🔴 LA COSTURA. NOT NULL a propósito.
  financiado_por text NOT NULL CHECK (financiado_por IN ('vendedor','epetplace')),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_descuentos_pedido ON public.pedido_descuentos (pedido_id);

COMMENT ON COLUMN public.pedido_descuentos.financiado_por IS
  'LA COSTURA MÁS BARATA DE ESTA TANDA. En Forma B el vendedor factura: si '
  'e-PetPlace regala 15 %, nadie decidió si lo absorbe él o si sale de nuestro '
  '10 %. Sin este campo, la PRIMERA liquidación es una discusión. '
  'NOT NULL porque un descuento sin financiador es exactamente el dato que '
  'nadie va a poder reconstruir después. '
  'v1 NO enciende el descuento (MODELO_LOYALTY §9 es el canal, y llega '
  'después); la tabla nace con forma y sin uso.';

COMMENT ON TABLE public.pedido_descuentos IS
  'Que un beneficio se pueda GASTAR comprando no convierte a la compra en '
  'FUENTE de loyalty (MODELO_LOYALTY §5). Esta tabla registra el descuento '
  'aplicado; jamás escribe en el motor de puntos.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE F · RLS Y GRANTS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_estados_pedido  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_estados      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_descuentos   ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_estados_select ON public.cat_estados_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_estados_insert ON public.cat_estados_pedido FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_estados_update ON public.cat_estados_pedido FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_estados_delete ON public.cat_estados_pedido FOR DELETE TO authenticated USING (is_admin());

-- El pedido lo ve su dueño y el vendedor que lo despacha. 🔴 El vendedor ve el
-- PEDIDO — qué, cuánto, dónde entregar — y NADA del expediente (§7.4).
DROP POLICY IF EXISTS pedidos_select_owner ON public.pedidos;
DROP POLICY IF EXISTS pedidos_select_admin ON public.pedidos;
DROP POLICY IF EXISTS pedidos_update       ON public.pedidos;
DROP POLICY IF EXISTS admins_update_pedidos ON public.pedidos;
CREATE POLICY pedidos_select ON public.pedidos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY pedidos_update ON public.pedidos FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY pedidos_delete ON public.pedidos FOR DELETE TO authenticated
  USING (is_admin());

-- `pedido_items` tenía una policy ALL. Se parte.
DROP POLICY IF EXISTS pedido_items_admin ON public.pedido_items;
DROP POLICY IF EXISTS pedido_items_owner ON public.pedido_items;
CREATE POLICY items_select ON public.pedido_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_items.pedido_id
                   AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
         OR is_admin());
CREATE POLICY items_insert ON public.pedido_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_items.pedido_id
                        AND p.user_id = auth.uid())
              OR is_admin());
CREATE POLICY items_update ON public.pedido_items FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY items_delete ON public.pedido_items FOR DELETE TO authenticated
  USING (is_admin());

-- 🔴 LA MÁQUINA DE ESTADOS: SELECT e INSERT. Sin UPDATE ni DELETE para nadie.
CREATE POLICY estados_select ON public.pedido_estados FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_estados.pedido_id
                   AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
         OR is_admin());
CREATE POLICY estados_insert ON public.pedido_estados FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_estados.pedido_id
                        AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
              OR is_admin());

CREATE POLICY descuentos_select ON public.pedido_descuentos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_descuentos.pedido_id
                   AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
         OR is_admin());
CREATE POLICY descuentos_insert ON public.pedido_descuentos FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Grants. El REVOKE nombra a `authenticated` — los DEFAULT PRIVILEGES de
-- Supabase le dan TODO a cada tabla nueva y un GRANT de menos no lo quita
-- (defecto cazado por el cinturón de la M3).
REVOKE ALL ON public.cat_estados_pedido, public.pedido_estados,
              public.pedido_descuentos, public.pedidos, public.pedido_items
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_estados_pedido TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_items      TO authenticated;
-- 🔴 APPEND-ONLY EN EL GRANT:
GRANT SELECT, INSERT ON public.pedido_estados    TO authenticated;
GRANT SELECT, INSERT ON public.pedido_descuentos TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA MÁQUINA DE ESTADOS MUEVE EL PEDIDO, Y EL ESTADO NO SE PISA.
DO $$
DECLARE v_cc uuid; v_u uuid; v_ped uuid; v_est text; v_n int; v_ok boolean := false;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;
  SELECT id INTO v_u  FROM profiles LIMIT 1;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, numero_orden)
    VALUES (v_u, v_cc, 100.00, 15.00, 0, 0, 115.00, '__cint_m4')
    RETURNING id INTO v_ped;

  SELECT estado INTO v_est FROM pedidos WHERE id = v_ped;
  IF v_est <> 'creado' THEN RAISE EXCEPTION 'ABORTA: el pedido no nació en `creado` (es %).', v_est; END IF;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
    VALUES (v_ped, 'confirmado', 'familia');
  SELECT estado INTO v_est FROM pedidos WHERE id = v_ped;
  IF v_est <> 'confirmado' THEN
    RAISE EXCEPTION 'ABORTA: el trigger no materializó el estado (quedó en %).', v_est;
  END IF;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
    VALUES (v_ped, 'pagado', 'sistema');
  SELECT count(*) INTO v_n FROM pedido_estados WHERE pedido_id = v_ped;
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'ABORTA: la historia de estados tiene % filas y debía tener 2. El estado se está PISANDO.', v_n;
  END IF;

  -- 🔴 EL DISCRIMINADOR DEL TOTAL: un total que no cierra tiene que rebotar.
  BEGIN
    INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                         costo_envio, descuento_monto, total, numero_orden)
      VALUES (v_u, v_cc, 100.00, 15.00, 0, 0, 999.00, '__cint_m4b');
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'ABORTA: un pedido con total que no cierra fue aceptado.'; END IF;

  -- 🔴 Y EL DEL RETIRO APAGADO.
  v_ok := false;
  BEGIN
    INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total, costo_envio,
                         descuento_monto, total, numero_orden, metodo_entrega)
      VALUES (v_u, v_cc, 10.00, 0, 0, 0, 10.00, '__cint_m4c', 'retiro');
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: el retiro en tienda está ENCENDIDO y v1 lo deja fuera.';
  END IF;

  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE numero_orden LIKE '\_\_cint\_m4%';
END $$;

-- ② Append-only del pedido, por privilegio efectivo (L-216).
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(r || ' puede ' || p || ' sobre ' || t, ', ') INTO v_mal
  FROM unnest(ARRAY['pedido_estados','pedido_descuentos']) t,
       unnest(ARRAY['anon','authenticated']) r,
       unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.'||t, p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: la máquina de estados NO es append-only (%).', v_mal;
  END IF;
END $$;

-- ③ Cero policies ALL sobre lo tocado · anon sin nada · el descuento con
--    financiador NOT NULL.
DO $$
DECLARE v_all text; v_anon text; v_null text;
BEGIN
  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('pedidos','pedido_items','pedido_estados','pedido_descuentos','cat_estados_pedido');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY[
    'pedidos','pedido_items','pedido_estados','pedido_descuentos','cat_estados_pedido']) x
  WHERE has_table_privilege('anon', 'public.'||x, 'SELECT')
     OR has_table_privilege('anon', 'public.'||x, 'INSERT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;

  SELECT is_nullable INTO v_null FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pedido_descuentos' AND column_name='financiado_por';
  IF v_null <> 'NO' THEN
    RAISE EXCEPTION 'ABORTA: `financiado_por` es NULLABLE — un descuento sin financiador es una discusión en la primera liquidación.';
  END IF;
END $$;

-- ④ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % pedidos de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM pedido_estados;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % filas de estado.', v_n; END IF;
END $$;

COMMIT;

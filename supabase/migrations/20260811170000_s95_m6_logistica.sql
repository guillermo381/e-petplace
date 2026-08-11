-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 6 — LA LOGÍSTICA
--
-- **Acá no se construye casi nada: se enmienda lo que ya existía.** El censo
-- de S95-B lo dijo y la medición lo confirmó: `envios` tiene 25 columnas con
-- transportista, tracking, origen, destino, ventana de entrega, intentos,
-- `costo_envio` y `pagado_por`; `envio_eventos` tiene el historial con lat/lon;
-- `zonas_cobertura` tiene 20 filas con tarifa base, tarifa por kilo y tiempo
-- estimado. *La sospecha del mandato era incorrecta: la logística SÍ existe.*
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m6-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** Esta migración APAGA las 20 filas de `zonas_cobertura`
-- y el cinturón cuenta cuántas quedan activas antes y después. Un INSERT o un
-- UPDATE en esa tabla durante la ventana hace que el conteo no cierre y aborta.
--
-- ── LA MARCA DEL FLETE: IMPIDE, NO ADVIERTE ───────────────────────────────
-- Firma del founder: las 20 tarifas se conservan **marcadas sin verificar**, y
-- **la marca tiene que IMPEDIR el uso, no solo advertirlo**.
--
-- Una columna `verificada` que alguien tiene que acordarse de filtrar no
-- impide nada: en tres meses se cotiza con tarifas del prototipo. Por eso el
-- apagado usa el mecanismo que YA filtra — `activo = false`, que la policy
-- `zonas_read` (USING activo = true) convierte en INVISIBLE para todo el
-- mundo salvo el admin.
--
-- **El dato se conserva entero y deja de ser alcanzable por el camino normal.**
-- Encenderlo exige una decisión explícita fila por fila, con quién la verificó
-- y cuándo — que es exactamente lo que D-754 necesita de la llamada al vendedor.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · foto previa de las zonas (la veda vive acá).
CREATE TEMP TABLE _s95_m6_zonas AS
SELECT count(*) total, count(*) FILTER (WHERE activo) activas FROM zonas_cobertura;

DO $$
DECLARE v_t int; v_a int;
BEGIN
  SELECT total, activas INTO v_t, v_a FROM _s95_m6_zonas;
  IF (v_t, v_a) IS DISTINCT FROM (20, 19) THEN
    RAISE EXCEPTION 'ABORTA: la foto firmada era 20 zonas con 19 activas y hoy es %/%.', v_t, v_a;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · EL CATÁLOGO DE TRANSPORTISTAS
-- `envios.transportista` tenía un CHECK con lista fija. Un catálogo crece sin
-- migrar la tabla; un CHECK exige una migración por cada transportista nuevo
-- (regla 21: buscar catálogo antes de hardcodear).
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_transportistas (
  codigo       text PRIMARY KEY,
  nombre       text NOT NULL,
  es_propio    boolean NOT NULL DEFAULT false,
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cat_transportistas (codigo, nombre, es_propio, activo) VALUES
  ('picap',        'Picap',        false, true),
  ('borzo',        'Borzo',        false, true),
  ('servientrega', 'Servientrega', false, true),
  ('laar',         'Laar Courier', false, true),
  ('tramaco',      'Tramaco',      false, true),
  ('propio',       'Reparto propio del vendedor', true,  true),
  ('otro',         'Otro',         false, true);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · `envios` — se enmienda, no se reconstruye
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.envios
  DROP COLUMN IF EXISTS seller_id;   -- apuntaba a profiles; el actor es la cuenta

ALTER TABLE public.envios
  ADD COLUMN cuenta_comercial_id   uuid REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  ADD COLUMN bodega_id             uuid REFERENCES public.vendedor_bodegas(id) ON DELETE RESTRICT,
  ADD COLUMN moneda                text NOT NULL DEFAULT 'USD',
  ADD COLUMN metodo                text NOT NULL DEFAULT 'despacho'
    CHECK (metodo IN ('despacho','retiro')),
  ADD COLUMN promesa_entrega_desde timestamptz,
  ADD COLUMN promesa_entrega_hasta timestamptz,
  ADD COLUMN zona_cobertura_id     uuid REFERENCES public.zonas_cobertura(id);

-- El transportista pasa de CHECK a FK de catálogo.
ALTER TABLE public.envios DROP CONSTRAINT IF EXISTS envios_transportista_check;
ALTER TABLE public.envios
  ADD CONSTRAINT envios_transportista_fkey FOREIGN KEY (transportista)
    REFERENCES public.cat_transportistas(codigo);

-- El retiro se MODELA y nace APAGADO, igual que en `pedidos` y por la misma
-- razón: un apagado de pantalla lo enciende cualquiera sin darse cuenta.
ALTER TABLE public.envios ADD CONSTRAINT chk_envio_retiro_apagado_v1
  CHECK (metodo = 'despacho');

COMMENT ON COLUMN public.envios.costo_envio IS
  'EL COSTO DE ENVÍO ES DATO, NO MOTOR. El cálculo vive FUERA del esquema: '
  'tarifa plana hoy, zonas_cobertura mañana, sin tocar una tabla. D-754 define '
  'la política de precio, y esa respuesta sale de una llamada al vendedor real, '
  'no de una calculadora.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · `devoluciones` — la tabla existe; el flujo v1 NO se automatiza
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.devoluciones
  ADD COLUMN moneda text NOT NULL DEFAULT 'USD';

COMMENT ON TABLE public.devoluciones IS
  'MODELO_DESPENSA §10: la devolución NO se automatiza en v1 — se maneja por '
  'atención humana con criterio escrito en POLITICAS (D-744, sin redactar). '
  'La tabla y sus estados existen; el flujo no. Y `pedido_estados` ya tiene '
  '`devuelto` para que BIO_EXPEDIENTE E2bis pueda colgar el evento correctivo.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · `zonas_cobertura` — el dato se conserva y se vuelve INALCANZABLE
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.zonas_cobertura
  ADD COLUMN moneda        text NOT NULL DEFAULT 'USD',
  ADD COLUMN verificada_en timestamptz,
  ADD COLUMN verificada_por uuid REFERENCES public.profiles(id),
  ADD COLUMN notas          text;

-- 🔴 LA MARCA QUE IMPIDE. `activo = false` + la policy `zonas_read`
--    (USING activo = true) = invisible por el camino normal.
UPDATE public.zonas_cobertura
   SET activo = false,
       notas  = 'S95-C: tarifa del prototipo del 2-may-2026, NUNCA verificada '
                'contra un transportista real. Se conserva como insumo de D-754 '
                'y queda APAGADA: encenderla exige verificarla y firmar '
                'verificada_por/verificada_en.';

ALTER TABLE public.zonas_cobertura ADD CONSTRAINT chk_zona_activa_verificada
  CHECK (NOT activo OR verificada_en IS NOT NULL);

COMMENT ON CONSTRAINT chk_zona_activa_verificada ON public.zonas_cobertura IS
  'S95-C: una zona ACTIVA tiene que estar verificada. No es una advertencia '
  'que alguien deba acordarse de filtrar: es un CHECK. Encender una tarifa sin '
  'decir quién la verificó y cuándo es un estado imposible. '
  'D-754: el criterio de flete sale de una llamada al vendedor, no de la base.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · LAS CUATRO POLICIES `ALL` QUE QUEDABAN
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS envios_admin       ON public.envios;
DROP POLICY IF EXISTS envios_owner       ON public.envios;
DROP POLICY IF EXISTS eventos_admin      ON public.envio_eventos;
DROP POLICY IF EXISTS eventos_owner      ON public.envio_eventos;
DROP POLICY IF EXISTS devoluciones_admin ON public.devoluciones;
DROP POLICY IF EXISTS devoluciones_owner ON public.devoluciones;
DROP POLICY IF EXISTS zonas_admin        ON public.zonas_cobertura;
DROP POLICY IF EXISTS zonas_read         ON public.zonas_cobertura;

-- El envío lo ve la familia que compró y el vendedor que despacha.
CREATE POLICY envios_select ON public.envios FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = envios.pedido_id
                   AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
         OR is_admin());
CREATE POLICY envios_insert ON public.envios FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = envios.pedido_id
                        AND es_vendedor_de(p.cuenta_comercial_id))
              OR is_admin());
CREATE POLICY envios_update ON public.envios FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = envios.pedido_id
                   AND es_vendedor_de(p.cuenta_comercial_id))
         OR is_admin())
  WITH CHECK (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = envios.pedido_id
                        AND es_vendedor_de(p.cuenta_comercial_id))
              OR is_admin());
CREATE POLICY envios_delete ON public.envios FOR DELETE TO authenticated USING (is_admin());

-- 🔴 `envio_eventos` ES APPEND-ONLY: el tracking no se reescribe.
CREATE POLICY envio_eventos_select ON public.envio_eventos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM envios e JOIN pedidos p ON p.id = e.pedido_id
                  WHERE e.id = envio_eventos.envio_id
                    AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id)))
         OR is_admin());
CREATE POLICY envio_eventos_insert ON public.envio_eventos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM envios e JOIN pedidos p ON p.id = e.pedido_id
                       WHERE e.id = envio_eventos.envio_id
                         AND es_vendedor_de(p.cuenta_comercial_id))
              OR is_admin());

CREATE POLICY devoluciones_select ON public.devoluciones FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY devoluciones_insert ON public.devoluciones FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY devoluciones_update ON public.devoluciones FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY devoluciones_delete ON public.devoluciones FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY zonas_select ON public.zonas_cobertura FOR SELECT TO authenticated
  USING (activo = true OR is_admin());
CREATE POLICY zonas_insert ON public.zonas_cobertura FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY zonas_update ON public.zonas_cobertura FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY zonas_delete ON public.zonas_cobertura FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY cat_transp_select ON public.cat_transportistas FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_transp_insert ON public.cat_transportistas FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_transp_update ON public.cat_transportistas FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_transp_delete ON public.cat_transportistas FOR DELETE TO authenticated USING (is_admin());

ALTER TABLE public.cat_transportistas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.envios, public.envio_eventos, public.devoluciones,
              public.zonas_cobertura, public.cat_transportistas
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.envios             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devoluciones       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zonas_cobertura    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_transportistas TO authenticated;
-- 🔴 APPEND-ONLY EN EL GRANT:
GRANT SELECT, INSERT ON public.envio_eventos TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA VEDA SE CIERRA y la marca IMPIDE de verdad.
DO $$
DECLARE v_total int; v_activas int; v_ok boolean := false;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE activo) INTO v_total, v_activas FROM zonas_cobertura;
  IF v_total <> 20 THEN
    RAISE EXCEPTION 'ABORTA: las 20 zonas ya no son 20 (son %). Alguien escribió durante la ventana.', v_total;
  END IF;
  IF v_activas <> 0 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % zonas ACTIVAS. La marca no apagó nada.', v_activas;
  END IF;

  -- 🔴 EL DISCRIMINADOR: encender una zona SIN verificarla tiene que REBOTAR.
  --    Si no rebota, la marca es una advertencia y no un impedimento.
  BEGIN
    UPDATE zonas_cobertura SET activo = true WHERE ciudad = 'Quito' AND sector = 'Norte';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se encendió una tarifa sin verificarla. La marca ADVIERTE en vez de IMPEDIR.';
  END IF;

  -- Contra-caso: con verificación firmada SÍ se puede encender. Una marca que
  -- no se puede levantar nunca no es una marca: es un borrado con otro nombre.
  UPDATE zonas_cobertura
     SET activo = true, verificada_en = now(), verificada_por = (SELECT id FROM profiles LIMIT 1)
   WHERE ciudad = 'Quito' AND sector = 'Norte';
  -- y se deja como estaba: apagada.
  UPDATE zonas_cobertura
     SET activo = false, verificada_en = NULL, verificada_por = NULL
   WHERE ciudad = 'Quito' AND sector = 'Norte';
END $$;

-- ② El transportista resuelve por catálogo, y uno inventado rebota.
DO $$
DECLARE v_cc uuid; v_u uuid; v_ped uuid; v_ok boolean := false;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;
  SELECT id INTO v_u  FROM profiles LIMIT 1;
  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total, costo_envio,
                       descuento_monto, total, numero_orden)
    VALUES (v_u, v_cc, 10, 0, 0, 0, 10, '__cint_m6') RETURNING id INTO v_ped;

  INSERT INTO envios (pedido_id, transportista, destino_direccion, cuenta_comercial_id)
    VALUES (v_ped, 'borzo', 'calle falsa 123', v_cc);

  BEGIN
    INSERT INTO envios (pedido_id, transportista, destino_direccion)
      VALUES (v_ped, '__inventado', 'x');
  EXCEPTION WHEN foreign_key_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se aceptó un transportista fuera del catálogo.';
  END IF;

  -- Y el retiro apagado también acá.
  v_ok := false;
  BEGIN
    INSERT INTO envios (pedido_id, transportista, destino_direccion, metodo)
      VALUES (v_ped, 'propio', 'x', 'retiro');
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'ABORTA: el retiro está encendido en envios.'; END IF;

  DELETE FROM envio_eventos WHERE envio_id IN (SELECT id FROM envios WHERE pedido_id = v_ped);
  DELETE FROM envios  WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE id = v_ped;
END $$;

-- ③ Cero policies ALL en TODO el frente · append-only del tracking · anon.
DO $$
DECLARE v_all text; v_mal text; v_anon text;
BEGIN
  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('envios','envio_eventos','devoluciones','zonas_cobertura',
                       'cat_transportistas','facturas','pedido_items','productos');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: quedaron policies ALL (%).', v_all; END IF;

  SELECT string_agg(r||' puede '||p, ', ') INTO v_mal
  FROM unnest(ARRAY['anon','authenticated']) r, unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.envio_eventos', p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: envio_eventos no es append-only (%).', v_mal;
  END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY[
    'envios','envio_eventos','devoluciones','zonas_cobertura','cat_transportistas']) x
  WHERE has_table_privilege('anon','public.'||x,'SELECT')
     OR has_table_privilege('anon','public.'||x,'INSERT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;
END $$;

-- ④ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % pedidos de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM envios;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % envíos de fixture.', v_n; END IF;
END $$;

DROP TABLE _s95_m6_zonas;

COMMIT;

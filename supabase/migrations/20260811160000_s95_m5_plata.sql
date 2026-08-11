-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 5 — LA PLATA
--
-- `MODELO_DESPENSA` §1.2: «Comisión de e-PetPlace: 10 % sobre el TOTAL CON
-- IVA. Parámetro configurable, JAMÁS constante en código.»
-- `MODELO_FINANCIERO` §7.4: «UPDATE permitido en fee_configs (con auditoría).
-- Eventos viejos no se recalculan.»
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m5-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE, en una ventana angosta.** Esta migración toca
-- `fee_configs`, que es infraestructura VIVA del motor de servicios: el 15 %
-- del prestador sale de ahí. El cinturón toma una FOTO de los fees de
-- servicios ANTES y exige que sean BYTE-IDÉNTICOS después.
-- **Si alguien edita un fee durante la ventana, la migración aborta.**
-- Ventana: del snapshot al veredicto. Se reporta su cierre.
--
-- ── LA DECISIÓN DE LA COMISIÓN: VIGENCIA, JAMÁS UPDATE SOBRE LA VIGENTE ───
-- `fee_configs` tiene historial auditado por trigger y `eventos_economicos`
-- guarda `fee_config_id` como snapshot. **Pisar un valor vigente borra la
-- trazabilidad de qué se cobró antes.** Se cierra la vigencia de la del 14 % y
-- se abre la del 10 %.
--
-- Y hay una razón MEDIDA además de la contable: el desempate final de
-- `_resolver_fee_aplicable` es `vigencia_desde DESC`. Cerrar la vieja hace que
-- la resolución sea DETERMINISTA en vez de depender de un desempate.
--
-- **La de Colombia NO se toca** (firma del founder): Colombia no lanza.
--
-- ── 🔴 QUIÉN LEE ESTE PARÁMETRO, Y NO ES EL LEDGER ────────────────────────
-- El founder firmó que en Forma B el evento económico es FEE PURO: `monto_bruto`
-- = la comisión, cuenta comercial NULL, payout NULL, con la cuenta y el total
-- de la venta en `metadata`. Con esa forma, `crear_evento_economico` cae en su
-- rama de «revenue puro plataforma» y **NO consulta `fee_configs`**.
--
-- Por lo tanto el parámetro lo lee EL MOTOR DE PEDIDOS, no el ledger. Para que
-- eso no se degrade en una constante en el código de la app, esta migración
-- deja la puerta: `resolver_comision_despensa()`. **El día que el founder
-- cambie el 10 %, la puerta devuelve otro número y nadie toca código.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · FOTO DE LOS FEES DE SERVICIOS — la veda vive acá.
CREATE TEMP TABLE _s95_m5_fees_servicios AS
SELECT id, tipo_actor::text, country_code, tipo_origen, tipo_calculo::text,
       parametros, vigencia_desde, vigencia_hasta, activo
FROM fee_configs
WHERE tipo_actor <> 'seller_productos';

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM _s95_m5_fees_servicios;
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'ABORTA: se esperaban 4 fees de servicios (prestador EC/CO + refugio EC/CO) y hay %.', v_n;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LA COMISIÓN — vigencia, no pisada
-- ───────────────────────────────────────────────────────────────────────────

-- La del 14 % de Ecuador CIERRA su vigencia. No se borra ni se desactiva: un
-- evento viejo con ese `fee_config_id` tiene que poder seguir explicándose.
UPDATE fee_configs
   SET vigencia_hasta = '2026-08-11 00:00:00+00',
       notas = COALESCE(notas,'') || ' | S95-C: vigencia cerrada. La despensa pasa a 10% sobre el total con IVA (MODELO_DESPENSA §1.2). No se borra: eventos viejos apuntan acá.'
 WHERE tipo_actor = 'seller_productos'
   AND country_code = 'EC'
   AND vigencia_hasta IS NULL;

-- La del 10 %, con SU BASE DECLARADA.
INSERT INTO fee_configs
  (cuenta_comercial_id, tipo_actor, country_code, revenue_stream, tipo_origen,
   tipo_calculo, parametros, vigencia_desde, activo, notas)
VALUES
  (NULL, 'seller_productos', 'EC', 'transaccional', 'pedido',
   'porcentual',
   -- 🔴 LA CLAVE `base`. `fee_configs` NO sabía sobre qué calculaba: el motor
   --    aplica el pct sobre `monto_bruto` y la base la elige QUIEN LLAMA.
   --    `MODELO_FINANCIERO` §3.1 define monto_bruto = lo que paga el cliente
   --    final = el total CON IVA, así que el motor no necesita cambiar — pero
   --    sin esta clave, quien mire `{"pct":10}` dentro de un año no puede
   --    saber sobre qué.
   '{"pct": 10, "base": "total_con_impuesto"}'::jsonb,
   '2026-08-11 00:00:00+00', true,
   'S95-C: comisión de la despensa firmada por el founder. 10% LIBRE sobre el TOTAL CON IVA; los costos de terceros (banco, procesador) los paga el vendedor (MODELO_DESPENSA §2.2).');

-- El CHECK nace NOT VALID: la fila de Colombia también es `tipo_origen='pedido'`
-- y no declara base, y el founder firmó que **Colombia no se toca**. NOT VALID
-- exige la base a toda fila NUEVA sin tocar la vieja — y eso queda escrito acá
-- para que nadie lo lea como un descuido.
ALTER TABLE public.fee_configs
  ADD CONSTRAINT chk_fee_pedido_declara_base
  CHECK (tipo_origen <> 'pedido' OR parametros ? 'base') NOT VALID;

COMMENT ON CONSTRAINT chk_fee_pedido_declara_base ON public.fee_configs IS
  'S95-C: todo fee de origen `pedido` declara sobre qué base calcula. NOT VALID '
  'a propósito: la fila de Colombia es anterior y el founder firmó no tocarla. '
  'Se valida el día que Colombia lance.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · LA PUERTA DEL PARÁMETRO
-- Para que «jamás constante en código» sea exigible y no una intención.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_comision_despensa(
  p_country_code text DEFAULT 'EC',
  p_fecha timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
           'fee_config_id', fc.id,
           'pct',           (fc.parametros->>'pct')::numeric,
           'base',          fc.parametros->>'base',
           'vigencia_desde', fc.vigencia_desde
         )
  FROM fee_configs fc
  WHERE fc.tipo_actor = 'seller_productos'
    AND fc.country_code = p_country_code
    AND fc.tipo_origen = 'pedido'
    AND fc.activo
    AND p_fecha >= fc.vigencia_desde
    AND (fc.vigencia_hasta IS NULL OR p_fecha < fc.vigencia_hasta)
  ORDER BY fc.vigencia_desde DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolver_comision_despensa(text, timestamptz) IS
  'LA PUERTA DEL PARÁMETRO. El motor de pedidos pregunta acá cuánto es la '
  'comisión; jamás la escribe. Devuelve también `fee_config_id` para que el '
  'evento económico guarde su snapshot y `base` para que el cálculo sepa sobre '
  'qué aplicar el pct. El día que el founder cambie el 10%, esto devuelve otro '
  'número y no se toca una línea de código.';

REVOKE ALL ON FUNCTION public.resolver_comision_despensa(text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolver_comision_despensa(text, timestamptz) TO authenticated, service_role;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LA FACTURA DEL VENDEDOR — se REGISTRA, no se emite
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.facturas
  ADD COLUMN moneda              text NOT NULL DEFAULT 'USD',
  ADD COLUMN emitida_por_tercero boolean NOT NULL DEFAULT false,
  ADD COLUMN cuenta_comercial_id uuid REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  ADD COLUMN archivo_url         text;

COMMENT ON COLUMN public.facturas.emitida_por_tercero IS
  'Forma B: el VENDEDOR factura al cliente final. e-PetPlace no emite la '
  'factura de la venta — la GUARDA. Sin esto, atención al cliente queda ciega '
  'ante el primer reclamo. La tabla ya tenía ruc_emisor y razon_social_emisor: '
  'estaba preparada para que el emisor no fuéramos nosotros.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · LA PASARELA — agnóstica de verdad
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pagos_intentos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id             uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  -- 🔴 NINGUNA COLUMNA SE LLAMA POR UN PROVEEDOR. `pedidos` tenía cuatro
  --    `kushki_*` y ese patrón envejece mal el día que la pasarela cambia —
  --    y ya cambió una vez.
  proveedor             text NOT NULL,
  proveedor_referencia  text,
  monto                 numeric(10,2) NOT NULL CHECK (monto > 0),
  moneda                text NOT NULL DEFAULT 'USD',
  -- 🔴 LAS DOS FORMAS DESDE EL DÍA UNO. Una billetera con redirección y QR
  --    tiene forma distinta que una tokenización de tarjeta. Diseñar solo para
  --    tarjeta convierte la primera billetera en una reescritura.
  forma                 text NOT NULL CHECK (forma IN ('tokenizacion','redireccion')),
  url_redireccion       text,
  estado                text NOT NULL DEFAULT 'iniciado'
    CHECK (estado IN ('iniciado','pendiente','aprobado','rechazado','expirado','reversado')),
  motivo_rechazo        text,
  payload_crudo         jsonb NOT NULL DEFAULT '{}'::jsonb,
  clave_idempotencia    text NOT NULL UNIQUE,
  creado_en             timestamptz NOT NULL DEFAULT now(),
  actualizado_en        timestamptz NOT NULL DEFAULT now(),
  cerrado_en            timestamptz,
  -- La redirección sin URL no es una redirección.
  CHECK (forma <> 'redireccion' OR estado = 'iniciado' OR url_redireccion IS NOT NULL)
);
CREATE INDEX idx_pagos_pedido ON public.pagos_intentos (pedido_id, estado);
CREATE INDEX idx_pagos_ref    ON public.pagos_intentos (proveedor, proveedor_referencia);

COMMENT ON TABLE public.pagos_intentos IS
  'El dominio JAMÁS sabe quién cobra. El proveedor todavía no está elegido: si '
  'este esquema dependiera de cuál sea, estaría mal diseñado. '
  'MODELO_DESPENSA §9.3: el resultado se lee del CUERPO, jamás del status code '
  '— por eso `payload_crudo` es NOT NULL y se guarda siempre.';

CREATE TABLE public.pagos_eventos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intento_id         uuid REFERENCES public.pagos_intentos(id) ON DELETE RESTRICT,
  proveedor          text NOT NULL,
  tipo               text NOT NULL,
  payload            jsonb NOT NULL,
  -- 🔴 LA IDEMPOTENCIA. No hay precedente en la casa que copiar (medido: cero
  --    columnas `idempot*`, `request_id`, `external_id` o `dedupe` en TODA la
  --    base). Un webhook que llega dos veces no puede crear dos pedidos, y ese
  --    defecto se descubre con un cliente real enojado del otro lado.
  clave_idempotencia text NOT NULL UNIQUE,
  recibido_en        timestamptz NOT NULL DEFAULT now(),
  procesado_en       timestamptz,
  error_proceso      text
);
CREATE INDEX idx_pagos_eventos_intento ON public.pagos_eventos (intento_id, recibido_en DESC);

COMMENT ON TABLE public.pagos_eventos IS
  'APPEND-ONLY. Los webhooks de la pasarela, crudos. La clave de idempotencia '
  'es UNIQUE: el segundo intento del mismo evento rebota en la base, no en una '
  'comparación del código que alguien puede olvidar.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · RLS Y GRANTS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pagos_intentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_eventos  ENABLE ROW LEVEL SECURITY;

-- El intento lo ve el dueño del pedido y el admin. 🔴 EL VENDEDOR NO:
-- en Forma B él cobra por su cuenta; el intento de pago de la plataforma no
-- es dato suyo.
CREATE POLICY pagos_select ON public.pagos_intentos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pagos_intentos.pedido_id
                   AND p.user_id = auth.uid())
         OR is_admin());
CREATE POLICY pagos_insert ON public.pagos_intentos FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY pagos_update ON public.pagos_intentos FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 🔴 Los webhooks: NADIE los lee salvo el admin, y NADIE los muta.
CREATE POLICY pagos_eventos_select ON public.pagos_eventos FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY pagos_eventos_insert ON public.pagos_eventos FOR INSERT TO authenticated
  WITH CHECK (is_admin());

REVOKE ALL ON public.pagos_intentos, public.pagos_eventos, public.facturas
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.pagos_intentos TO authenticated;
GRANT SELECT, INSERT          ON public.pagos_eventos  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facturas TO authenticated;

-- `facturas` tenía una policy ALL. Se parte (invariante 1).
DROP POLICY IF EXISTS facturas_admin ON public.facturas;
CREATE POLICY facturas_insert ON public.facturas FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY facturas_update ON public.facturas FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY facturas_delete ON public.facturas FOR DELETE TO authenticated USING (is_admin());

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA VEDA SE CIERRA: los fees de SERVICIOS byte-idénticos.
--    Es la razón por la que esta migración declara veda: `fee_configs` es
--    infraestructura viva y el 15 % del prestador sale de ahí.
DO $$
DECLARE v_dif int;
BEGIN
  SELECT count(*) INTO v_dif FROM (
    SELECT id, tipo_actor::text, country_code, tipo_origen, tipo_calculo::text,
           parametros, vigencia_desde, vigencia_hasta, activo
    FROM fee_configs WHERE tipo_actor <> 'seller_productos'
    EXCEPT
    SELECT * FROM _s95_m5_fees_servicios
  ) q;
  IF v_dif > 0 THEN
    RAISE EXCEPTION 'ABORTA: % fee(s) de SERVICIOS cambiaron durante la ventana. Esta migración no toca servicios.', v_dif;
  END IF;
END $$;

-- 🔴 ② LA COMISIÓN RESUELVE 10 % Y NO 14 %, PROBADO POR LA PUERTA REAL —
--    no leyendo la tabla, sino preguntándole a la función que el motor va a
--    usar. Y con el contra-caso HISTÓRICO: una fecha anterior al corte tiene
--    que seguir devolviendo 14 %, o la trazabilidad se perdió.
DO $$
DECLARE v_hoy jsonb; v_antes jsonb;
BEGIN
  v_hoy   := resolver_comision_despensa('EC', now());
  v_antes := resolver_comision_despensa('EC', '2026-06-01'::timestamptz);

  IF v_hoy IS NULL THEN RAISE EXCEPTION 'ABORTA: no hay comisión vigente para EC.'; END IF;
  IF (v_hoy->>'pct')::numeric <> 10 THEN
    RAISE EXCEPTION 'ABORTA: la comisión vigente resuelve % y la letra firma 10.', v_hoy->>'pct';
  END IF;
  IF v_hoy->>'base' <> 'total_con_impuesto' THEN
    RAISE EXCEPTION 'ABORTA: la base vigente es "%" y la letra firma total con IVA.', v_hoy->>'base';
  END IF;

  -- El contra-caso: la historia no se borró.
  IF v_antes IS NULL OR (v_antes->>'pct')::numeric <> 14 THEN
    RAISE EXCEPTION 'ABORTA: una fecha de junio ya no resuelve el 14%% que regía entonces. Se perdió la trazabilidad.';
  END IF;

  -- Y exactamente UNA vigente hoy: dos serían una resolución por desempate.
  IF (SELECT count(*) FROM fee_configs
       WHERE tipo_actor='seller_productos' AND country_code='EC' AND activo
         AND now() >= vigencia_desde AND (vigencia_hasta IS NULL OR now() < vigencia_hasta)) <> 1 THEN
    RAISE EXCEPTION 'ABORTA: hay más de una comisión vigente para EC. La resolución dependería de un desempate.';
  END IF;
END $$;

-- ③ El CHECK de la base exige a las filas NUEVAS.
DO $$
DECLARE v_ok boolean := false;
BEGIN
  BEGIN
    INSERT INTO fee_configs (cuenta_comercial_id, tipo_actor, country_code, revenue_stream,
                             tipo_origen, tipo_calculo, parametros, vigencia_desde, activo, notas)
    VALUES (NULL, 'seller_productos', 'EC', 'transaccional', 'pedido', 'porcentual',
            '{"pct": 99}'::jsonb, '2030-01-01', false, '__cinturon_s95_m5');
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se aceptó un fee de pedido sin declarar su base.';
  END IF;
END $$;

-- ④ La idempotencia REBOTA de verdad, y las dos formas de pago conviven.
DO $$
DECLARE v_cc uuid; v_u uuid; v_ped uuid; v_ok boolean := false;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;
  SELECT id INTO v_u  FROM profiles LIMIT 1;
  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total, costo_envio,
                       descuento_monto, total, numero_orden)
    VALUES (v_u, v_cc, 100, 15, 0, 0, 115, '__cint_m5') RETURNING id INTO v_ped;

  INSERT INTO pagos_intentos (pedido_id, proveedor, monto, forma, clave_idempotencia)
    VALUES (v_ped, 'proveedor_x', 115, 'tokenizacion', '__cint_idem_1');
  -- La otra forma también entra: el esquema no privilegia la tarjeta.
  INSERT INTO pagos_intentos (pedido_id, proveedor, monto, forma, url_redireccion, clave_idempotencia)
    VALUES (v_ped, 'billetera_y', 115, 'redireccion', 'https://x/pagar', '__cint_idem_2');

  BEGIN
    INSERT INTO pagos_intentos (pedido_id, proveedor, monto, forma, clave_idempotencia)
      VALUES (v_ped, 'proveedor_x', 115, 'tokenizacion', '__cint_idem_1');
  EXCEPTION WHEN unique_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: el mismo intento de pago entró DOS VECES. La idempotencia no rebota.';
  END IF;

  DELETE FROM pagos_intentos WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE id = v_ped;
END $$;

-- ⑤ Append-only de los webhooks, por privilegio efectivo · cero ALL · anon.
DO $$
DECLARE v_mal text; v_all text; v_anon text;
BEGIN
  SELECT string_agg(r||' puede '||p, ', ') INTO v_mal
  FROM unnest(ARRAY['anon','authenticated']) r, unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.pagos_eventos', p);
  IF v_mal IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: pagos_eventos no es append-only (%).', v_mal; END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL' AND tablename IN ('pagos_intentos','pagos_eventos','facturas');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY['pagos_intentos','pagos_eventos','facturas']) x
  WHERE has_table_privilege('anon','public.'||x,'SELECT') OR has_table_privilege('anon','public.'||x,'INSERT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;

  IF has_function_privilege('anon','public.resolver_comision_despensa(text, timestamptz)','EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA L-140: resolver_comision_despensa quedó ejecutable por anon.';
  END IF;
END $$;

-- ⑥ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM fee_configs WHERE notas = '__cinturon_s95_m5';
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % fee_configs de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM pagos_intentos;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % intentos de pago de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % pedidos de fixture.', v_n; END IF;
END $$;

DROP TABLE _s95_m5_fees_servicios;

COMMIT;

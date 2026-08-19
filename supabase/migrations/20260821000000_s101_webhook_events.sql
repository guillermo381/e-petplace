-- ═══════════════════════════════════════════════════════════════════════════
-- S101-A · MIGRACIÓN 1 — `webhook_events`: EL BUZÓN DE LA PASARELA
--
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-19-s101-REVERSA-webhook-events.sql
--
-- Veda 76(g): NO RIGE. DDL aditivo puro, tabla nueva, sin backfill, sin anclas.
--
-- ───────────────────────────────────────────────────────────────────────────
-- 🔴 POR QUÉ ESTA TABLA NO DUPLICA A `pagos_eventos` (censo B0 §3)
--
-- El censo encontró `pagos_eventos` YA VIVA, y la letra advierte que el peor
-- resultado posible es crear una tabla al lado de una que ya existe. Se midió
-- y son DOS CAPAS DISTINTAS, no dos versiones de lo mismo:
--
--   · `pagos_eventos` es el evento de DOMINIO. Cuelga de un `intento_id`, su
--     `payload` es NOT NULL y su `clave_idempotencia` es NOT NULL UNIQUE —
--     y esa clave es PORTANTE: `confirmar_pago_pedido` la consulta para
--     decidir si un pago ya se aplicó. Meterle ruido de transporte pondría
--     basura en la llave de la que depende la idempotencia del cobro.
--
--   · `webhook_events` es el evento de TRANSPORTE. Guarda lo que llegó por
--     HTTP tal cual llegó, ANTES de saber si significa algo: sin FK, sin
--     clave obligatoria, y aceptando un body que ni siquiera es JSON.
--
-- La frontera, en una línea: acá entra TODO lo que golpea la puerta; a
-- `pagos_eventos` entra solo lo que resultó ser un pago.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recibido_en     timestamptz NOT NULL DEFAULT now(),

  -- 🔴 OBLIGATORIA, y no es prolijidad: NO existe proyecto Supabase de staging
  --    (medido en el censo §7 — hay un solo proyecto activo). Los eventos del
  --    sandbox de Nuvei van a aterrizar sobre la MISMA base que los reales.
  --    Sin esta columna, un evento de prueba y uno de plata de verdad serían
  --    indistinguibles para siempre.
  ambiente        text NOT NULL CHECK (ambiente IN ('sandbox','produccion')),

  proveedor       text NOT NULL CHECK (proveedor IN ('nuvei','deuna')),
  transaction_id  text,
  payload         jsonb NOT NULL,
  stoken_valido   boolean,

  resultado       text NOT NULL CHECK (resultado IN (
                    'recibido','aplicado','duplicado',
                    'stoken_invalido','monto_no_coincide','desconocido','ilegible')),
  detalle         text,

  -- Sin FK a propósito: un evento puede llegar sin pago que lo reciba, y
  -- guardarlo igual es exactamente el punto de esta tabla.
  pago_id         uuid
);

COMMENT ON TABLE public.webhook_events IS
  'S101. Append-only, capa de TRANSPORTE. TODO evento se guarda, incluso el '
  'rechazado: un stoken inválido es la traza de un intento de fraude y '
  'descartarlo pierde la única evidencia. No confundir con `pagos_eventos`, '
  'que es la capa de DOMINIO y cuyo clave_idempotencia sostiene la '
  'idempotencia de confirmar_pago_pedido.';

COMMENT ON COLUMN public.webhook_events.ambiente IS
  'Obligatoria mientras no exista proyecto de staging separado: sandbox y '
  'producción comparten base, y sin esto se vuelven indistinguibles.';

CREATE INDEX IF NOT EXISTS ix_webhook_events_txid
  ON public.webhook_events (proveedor, transaction_id);
CREATE INDEX IF NOT EXISTS ix_webhook_events_recibido
  ON public.webhook_events (recibido_en DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Cero policies, deliberado: con RLS activa y sin policies nadie llega por
-- PostgREST. Solo la Edge Function con `service_role`, que las saltea.

-- 🔴 El REVOKE no es redundante con la RLS: TRUNCATE NO lo filtra la RLS.
--    El censo §8 midió que 190 de 255 tablas de `public` nacen con TRUNCATE
--    para `anon` por el default de la plataforma. Ésta no.
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- ═══ CINTURÓN — aborta la migración si el estado no quedó como se declaró ═══
DO $$
DECLARE v_rls boolean; v_pol int; v_anon boolean; v_auth boolean;
BEGIN
  SELECT c.relrowsecurity INTO v_rls
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relname = 'webhook_events';
  IF v_rls IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'cinturon: webhook_events quedó SIN RLS';
  END IF;

  SELECT count(*) INTO v_pol FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'webhook_events';
  IF v_pol <> 0 THEN
    RAISE EXCEPTION 'cinturon: webhook_events tiene % policies y debe tener CERO', v_pol;
  END IF;

  SELECT has_table_privilege('anon','public.webhook_events','SELECT')
       OR has_table_privilege('anon','public.webhook_events','INSERT')
       OR has_table_privilege('anon','public.webhook_events','TRUNCATE')
    INTO v_anon;
  SELECT has_table_privilege('authenticated','public.webhook_events','SELECT')
       OR has_table_privilege('authenticated','public.webhook_events','INSERT')
       OR has_table_privilege('authenticated','public.webhook_events','TRUNCATE')
    INTO v_auth;
  IF v_anon OR v_auth THEN
    RAISE EXCEPTION 'cinturon: quedaron grants — anon=% authenticated=%', v_anon, v_auth;
  END IF;
END $$;

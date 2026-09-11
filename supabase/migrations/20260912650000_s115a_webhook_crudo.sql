-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL CRUDO DEL WEBHOOK — porque el encabezado lo prometía y el código no
--
-- 🔴 LETRA MUERTA PROPIA, encontrada midiendo antes de registrar el webhook.
--    `fiscal-webhook` abre diciendo, en negrita: *«PERSISTIR ANTES DE ANALIZAR
--    (regla del motor de pagos, S101): el crudo se guarda primero. Si el
--    analizador lanza, el proveedor deja de reintentar y del aviso no queda
--    nada.»* **Medido: no existe ninguna tabla donde guardarlo.** El comentario
--    afirmaba una propiedad que el código no tenía.
--
--    *Es peor que no haberlo escrito: el próximo que lo lea va a dar la
--    persistencia por hecha y no va a ir a mirar.* Y el modo de falla que
--    describe es exactamente el que este proveedor castiga — Factuplan
--    reintenta 5 veces y **desactiva el webhook tras 10 fallos seguidos**.
--
-- 🔴 SE GUARDA ANTES DE VERIFICAR LA FIRMA, y es a propósito. Un cuerpo que no
--    valida igual es evidencia: distingue «nos mandaron basura» de «el secreto
--    está mal cargado», que son dos problemas con la misma cara. El veredicto
--    vive en su propia columna — jamás en el texto de un log (`S103`: *un campo
--    que un humano lee para diagnosticar y una función lee para autorizar tiene
--    dos dueños con intereses opuestos*).
--
-- EDGES A DESPLEGAR CON ESTA MIGRACIÓN (`L-536`): fiscal-webhook.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912650000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fiscal_webhook_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  /* `X-Factuplan-Delivery`. La llave del DEDUP: el proveedor reintenta, y un
     reintento no es un hecho nuevo. UNIQUE para que el duplicado sea
     inexpresable en vez de depender de que alguien se acuerde de chequear. */
  delivery_id     text UNIQUE,
  evento          text,
  /* El cuerpo tal como llegó. Es sobre ESTE texto que se calcula el HMAC: si se
     reparsea y se vuelve a serializar, la firma deja de coincidir. */
  cuerpo_crudo    text NOT NULL,
  firma_verificada boolean,
  /* Por qué no validó, cuando no validó. Columna propia y legible: un motivo
     dentro de un jsonb no se puede listar, contar ni agrupar, y nadie lo abre
     cuando hay una explicación plausible a mano (`L-316`). */
  motivo          text,
  documento_id    uuid REFERENCES public.documentos_fiscales(id) ON DELETE SET NULL,
  recibido_en     timestamptz NOT NULL DEFAULT now(),
  procesado_en    timestamptz,
  resultado       text
);

CREATE INDEX IF NOT EXISTS idx_fiscal_webhook_pendientes
  ON public.fiscal_webhook_eventos (recibido_en)
  WHERE procesado_en IS NULL;

ALTER TABLE public.fiscal_webhook_eventos ENABLE ROW LEVEL SECURITY;
/* Sin policy para `authenticated`: esto es operación, no producto. Lo escribe
   y lo lee la edge con `service_role`, que no pasa por RLS. */
REVOKE ALL ON public.fiscal_webhook_eventos FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.fiscal_webhook_eventos IS
  'El crudo de cada aviso del proveedor fiscal, guardado ANTES de verificar su '
  'firma. Dedup por delivery_id. Es la red cuando el procesamiento falla: el '
  'proveedor ya considera entregado lo que entregó una vez.';

-- ── CINTURÓN, con su rojo ───────────────────────────────────────────────────
DO $cint$
DECLARE v_ok boolean; v_id uuid;
BEGIN
  INSERT INTO public.fiscal_webhook_eventos (delivery_id, evento, cuerpo_crudo)
  VALUES ('cinturon-s115a-1', 'invoice.authorized', '{"prueba":true}')
  RETURNING id INTO v_id;

  /* 🔴 EL ROJO: el mismo delivery NO puede entrar dos veces. *Sin esto, un
     reintento del proveedor procesaría el aviso otra vez — y en un documento
     fiscal «otra vez» puede ser subir un archivo encima o mover un estado que
     ya se movió.* */
  v_ok := true;
  BEGIN
    INSERT INTO public.fiscal_webhook_eventos (delivery_id, evento, cuerpo_crudo)
    VALUES ('cinturon-s115a-1', 'invoice.authorized', '{"prueba":true}');
  EXCEPTION WHEN unique_violation THEN v_ok := false;
  END;
  IF v_ok THEN RAISE EXCEPTION 'cinturon: el delivery duplicado ENTRO'; END IF;

  /* Y el verde: un delivery distinto sí entra. Sin este brazo, un UNIQUE sobre
     una columna equivocada daría el mismo rojo y parecería correcto. */
  INSERT INTO public.fiscal_webhook_eventos (delivery_id, evento, cuerpo_crudo)
  VALUES ('cinturon-s115a-2', 'invoice.authorized', '{"prueba":true}');

  DELETE FROM public.fiscal_webhook_eventos WHERE delivery_id LIKE 'cinturon-s115a-%';
  IF EXISTS (SELECT 1 FROM public.fiscal_webhook_eventos WHERE delivery_id LIKE 'cinturon-s115a-%') THEN
    RAISE EXCEPTION 'cinturon: quedo residuo';
  END IF;
  RAISE NOTICE 'cinturon webhook crudo: dedup rojo + alta verde + residuo 0';
END $cint$;

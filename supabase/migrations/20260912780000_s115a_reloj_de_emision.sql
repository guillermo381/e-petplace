-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `D-1072` · EL RELOJ DE LA EMISIÓN — RELOJ, NO TRIGGER
--
-- 🔴 NACE INERTE, Y NO ES CAUTELA: ES LA MEDICIÓN. Hoy `fiscal-emitir` emitiría
--    CERO — medido el 12-sep: de 101 pagos Nuvei aprobados, **101 no tienen
--    `medio_pago`**, y sin forma de pago el SRI no recibe el comprobante. Un
--    reloj encendido hoy correría cada cinco minutos, rebotaría todo por el
--    mismo motivo, y **el tablero se vería vivo**. *Un reloj que anda y no
--    emite nada es peor que ninguno: parece un circuito sano.*
--    ⇒ el cable se tiende acá; **la llave es del founder** (precedente S103:
--    `recurrente_vivo`). Se enciende poniendo `fiscal_emision_automatica` en
--    `true`, y su precondición es `D-1068`.
--
-- 🔴 POR QUÉ RELOJ Y NO TRIGGER — voto firmado por el founder. Un trigger
--    `AFTER UPDATE` sobre el pago emitiría DENTRO de la transacción del cobro:
--    una caída de Factuplan volteando un pago aprobado es exactamente el borde
--    caro que la casa ya prohibió («un timeout en el camino del pago no puede
--    dejar un cobro en estado desconocido»). El reloj desacopla: el pago
--    cierra, el documento espera, y la emisión se reintenta sola.
--
-- 🔴 LAS DOS COSAS QUE LO VUELVEN CONFIABLE (pedido del founder, y son la
--    diferencia entre un reloj y un reloj en el que se puede confiar):
--    ① **reporta cuántos emitió y cuántos rebotó POR MOTIVO** — un `procesados:
--       7` no distingue siete facturas emitidas de siete rebotes idénticos.
--    ② **un barrido que no emite nada habiendo con qué GRITA** — en vez de
--       salir verde. El silencio de un reloj sano y el de uno roto son el mismo
--       silencio, y por eso el estado sano tiene que decirse.
--
-- CADENCIA: cada 5 minutos. La familia acaba de pagar y espera su factura; una
-- corrida diaria convertiría «te llega la factura» en «te llega mañana». Con la
-- llave apagada la corrida cuesta un early-return, así que las 288 diarias de
-- `D-497` no aplican hasta que se encienda.
--
-- VEDA 76(g): NO RIGE — tabla nueva, función nueva, cron nuevo; cero backfill,
-- cero escritura sobre datos vivos.
-- Reversa: `docs/relevamientos/S115-A-REVERSA-20260912780000-reloj-emision.sql`
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LA LLAVE, APAGADA ─────────────────────────────────────────────────────
INSERT INTO public.app_config (clave, valor, descripcion, es_publico)
VALUES ('fiscal_emision_automatica', 'false',
        'D-1072 · El reloj de emisión. NACE APAGADO: su precondición es D-1068 '
        '(sin medio de pago el SRI no recibe). Encenderlo es decisión del founder.',
        false)
ON CONFLICT (clave) DO NOTHING;

-- ── ② LA BITÁCORA DE CORRIDAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fiscal_emision_corridas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_en    timestamptz NOT NULL DEFAULT now(),
  disparo       text NOT NULL CHECK (disparo IN ('reloj','manual')),
  procesados    int  NOT NULL CHECK (procesados >= 0),
  emitidos      int  NOT NULL CHECK (emitidos   >= 0),
  rebotados     int  NOT NULL CHECK (rebotados  >= 0),
  /* El motivo es la mitad que importa: `rebotados: 7` sin motivo no dice si es
     un problema o siete. */
  por_motivo    jsonb NOT NULL DEFAULT '{}'::jsonb,
  pendientes_al_cerrar int NOT NULL DEFAULT 0,
  grito         text
);
COMMENT ON TABLE public.fiscal_emision_corridas IS
  'D-1072 · Una fila por corrida del reloj de emisión. Existe para que el '
  'silencio de un reloj sano se distinga del de uno roto.';

CREATE INDEX IF NOT EXISTS idx_fiscal_corridas_fecha
  ON public.fiscal_emision_corridas (corrida_en DESC);

ALTER TABLE public.fiscal_emision_corridas ENABLE ROW LEVEL SECURITY;
-- Sólo admin lee; la escribe el service_role de la edge (DEFINER más abajo).
CREATE POLICY fiscal_corridas_admin_select ON public.fiscal_emision_corridas
  FOR SELECT TO authenticated USING (is_admin());

-- ── ③ LA PUERTA QUE ANOTA LA CORRIDA ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_anotar_corrida_emision(
  p_disparo text, p_procesados int, p_emitidos int, p_rebotados int,
  p_por_motivo jsonb DEFAULT '{}'::jsonb, p_pendientes int DEFAULT 0)
RETURNS public.fiscal_emision_corridas
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v public.fiscal_emision_corridas; v_grito text;
BEGIN
  /* 🔴 EL GRITO, y son DOS condiciones distintas que el founder nombró como
     una sola — separarlas importa porque tienen causas opuestas:

     (a) NO PROCESÓ NADA habiendo pendientes ⇒ el barrido no los está viendo:
         un filtro mal puesto, un `sentido` equivocado, un límite. *El reloj
         corre y no toca lo que tiene delante.*
     (b) PROCESÓ y no emitió NINGUNO ⇒ los está viendo y todos rebotan. Es el
         caso de hoy con `sin_forma_de_pago`, y es el que se disfraza de salud:
         el reloj "funciona", la bitácora tiene filas, y no sale una factura.

     Un `grito` en NULL significa «esta corrida estuvo bien», no «no se miró». */
  IF p_procesados = 0 AND p_pendientes > 0 THEN
    v_grito := format('no_proceso_nada_habiendo_%s_pendientes', p_pendientes);
  ELSIF p_procesados > 0 AND p_emitidos = 0 THEN
    v_grito := format('proceso_%s_y_no_emitio_ninguno: %s', p_procesados, p_por_motivo::text);
  END IF;

  INSERT INTO public.fiscal_emision_corridas
    (disparo, procesados, emitidos, rebotados, por_motivo, pendientes_al_cerrar, grito)
  VALUES (p_disparo, p_procesados, p_emitidos, p_rebotados,
          coalesce(p_por_motivo,'{}'::jsonb), p_pendientes, v_grito)
  RETURNING * INTO v;
  RETURN v;
END $fn$;

-- ── ④ EL LECTOR DE SALUD — el que se mira cuando nadie sospecha nada ────────
CREATE OR REPLACE FUNCTION public.fiscal_salud_emision_automatica()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v jsonb; v_ultima public.fiscal_emision_corridas; v_pend int; v_encendido bool;
        v_gritos int; v_sin_correr interval;
BEGIN
  IF NOT (is_admin() OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE='42501';
  END IF;

  SELECT (valor = 'true') INTO v_encendido
    FROM app_config WHERE clave='fiscal_emision_automatica';

  SELECT * INTO v_ultima FROM fiscal_emision_corridas ORDER BY corrida_en DESC LIMIT 1;

  SELECT count(*) INTO v_pend FROM documentos_fiscales
   WHERE estado IN ('borrador','emitiendo') AND sentido='emitido';

  SELECT count(*) INTO v_gritos FROM fiscal_emision_corridas
   WHERE grito IS NOT NULL AND corrida_en > now() - interval '24 hours';

  v_sin_correr := CASE WHEN v_ultima.corrida_en IS NULL THEN NULL
                       ELSE now() - v_ultima.corrida_en END;

  v := jsonb_build_object(
    'encendido', coalesce(v_encendido,false),
    'pendientes_ahora', v_pend,
    'ultima_corrida', v_ultima.corrida_en,
    'hace', v_sin_correr::text,
    'ultima', CASE WHEN v_ultima.id IS NULL THEN NULL ELSE jsonb_build_object(
        'disparo', v_ultima.disparo, 'procesados', v_ultima.procesados,
        'emitidos', v_ultima.emitidos, 'rebotados', v_ultima.rebotados,
        'por_motivo', v_ultima.por_motivo, 'grito', v_ultima.grito) END,
    'gritos_24h', v_gritos,
    /* 🔴 EL ESTADO SANO SE DICE. Un lector que sólo habla cuando hay problema
       no se distingue de uno que dejó de correr. */
    'veredicto',
      CASE
        WHEN NOT coalesce(v_encendido,false) AND v_pend > 0
          THEN format('apagado_con_%s_esperando', v_pend)
        WHEN NOT coalesce(v_encendido,false) THEN 'apagado_y_sin_cola'
        WHEN v_ultima.id IS NULL THEN 'encendido_y_JAMAS_CORRIO'
        WHEN v_sin_correr > interval '20 minutes'
          THEN format('encendido_pero_no_corre_hace_%s', v_sin_correr::text)
        WHEN v_gritos > 0 THEN format('%s_corrida(s)_gritaron_en_24h', v_gritos)
        ELSE 'sano'
      END);
  RETURN v;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.fiscal_anotar_corrida_emision(text,int,int,int,jsonb,int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() TO authenticated;

-- ── ⑤ EL CABLE. La llave está apagada; esto sólo lo tiende. ─────────────────
SELECT cron.unschedule('fiscal-emitir-tick')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='fiscal-emitir-tick');

SELECT cron.schedule('fiscal-emitir-tick', '*/5 * * * *', $cron$
    SELECT net.http_post(
      url     := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/fiscal-emitir',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-despacho-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'despacho_secret')
      ),
      body    := '{"disparo":"reloj"}'::jsonb
    );
$cron$);

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_rol text := current_user; n int; v jsonb; c public.fiscal_emision_corridas;
BEGIN
  -- ① La llave nace APAGADA. Si naciera encendida, esta migración encendería
  --    un reloj que hoy emite cero, que es justo lo que vino a evitar.
  SELECT count(*) INTO n FROM app_config
   WHERE clave='fiscal_emision_automatica' AND valor='false';
  IF n <> 1 THEN RAISE EXCEPTION 'cinturon: la llave NO nace apagada'; END IF;

  -- ② El cable existe y está agendado.
  SELECT count(*) INTO n FROM cron.job WHERE jobname='fiscal-emitir-tick' AND active;
  IF n <> 1 THEN RAISE EXCEPTION 'cinturon: el cron no quedó agendado'; END IF;

  -- ③ 🔴 EL GRITO, PROBADO EN SUS DOS FORMAS — no alcanza con que exista.
  c := fiscal_anotar_corrida_emision('manual', 0, 0, 0, '{}'::jsonb, 5);
  IF c.grito IS NULL THEN
    RAISE EXCEPTION 'cinturon: procesar CERO con 5 pendientes NO gritó';
  END IF;
  c := fiscal_anotar_corrida_emision('manual', 7, 0, 7,
        '{"sin_forma_de_pago":7}'::jsonb, 7);
  IF c.grito IS NULL THEN
    RAISE EXCEPTION 'cinturon: procesar 7 y emitir CERO no gritó — es el caso de hoy';
  END IF;
  -- ④ Y su CONTRA-CASO: una corrida sana NO grita (si gritara siempre, el
  --    grito no informaría nada).
  c := fiscal_anotar_corrida_emision('manual', 3, 3, 0, '{}'::jsonb, 0);
  IF c.grito IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon: una corrida SANA gritó (%) — el grito no discrimina', c.grito;
  END IF;

  -- ⑤ El lector habla, y con la llave apagada lo DICE.
  v := fiscal_salud_emision_automatica();
  IF (v->>'encendido')::bool IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'cinturon: el lector no ve la llave apagada';
  END IF;
  IF v->>'veredicto' IS NULL THEN
    RAISE EXCEPTION 'cinturon: el lector no emite veredicto';
  END IF;

  -- Sin residuo: las tres filas del ensayo se van.
  DELETE FROM fiscal_emision_corridas WHERE disparo='manual';
  SELECT count(*) INTO n FROM fiscal_emision_corridas;
  IF n <> 0 THEN RAISE EXCEPTION 'cinturon: quedaron % filas de ensayo', n; END IF;

  RAISE NOTICE 'cinturon OK · llave APAGADA · cron tendido · grito probado en sus 2 formas + contra-caso · residuo 0 · veredicto=%',
    (SELECT (fiscal_salud_emision_automatica())->>'veredicto');
END $cint$;

-- ============================================================================
-- S88-A · LOTE 2 — EL TIMBRE: pg_net + pg_cron → la Edge Function
--
-- El dispatch FIRMADO (S87, doble check): «pg_cron toca el timbre por pg_net;
-- la Edge Function es la ÚNICA voz al exterior. pg_net como TIMBRE, jamás como
-- transporte» — si un tick se pierde, el del minuto siguiente levanta las
-- mismas filas: auto-reparable por construcción.
--
-- Y el RAISE transporte_no_existe se convierte en EL ENCHUFE: la intención
-- fuera de sombra que pasa los gates queda ENCOLADA + para_transporte; la
-- Edge Function `despachar-correo` la entrega y escribe el resultado. HOY es
-- inalcanzable (cero tipos fuera de sombra): todo corre en sombra hasta que
-- el dominio verifique y el founder gatee el primer tipo (§10.2).
--
-- El Bearer del tick es la ANON key: es pública por definición (viaja en las
-- apps), y tickear al despachador es INOCUO por diseño — idempotente, kill
-- switch y techo duro delante de cualquier entrega. Cero secretos nuevos.
--
-- VEDA 76(g): NO RIGE. REVERSA: docs/relevamientos/2026-08-05-s88a-REVERSA-timbre.sql
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.despachar_notificaciones(p_seco boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_global      record;
  v_i           record;
  v_cfg         record;
  v_cat         record;
  v_entregadas  integer;
  v_retenidas   integer := 0;
  v_vencidas    integer := 0;
  v_sombra      integer := 0;
  v_por_techo   integer := 0;
  v_transporte  integer := 0;
  v_motivo      text;
BEGIN
  SELECT * INTO v_global FROM public.notificacion_config WHERE alcance = 'global';

  FOR v_i IN
    SELECT * FROM public.notificacion_intencion
     WHERE estado = 'nacida' ORDER BY created_at
  LOOP
    SELECT * INTO v_cfg FROM public.notificacion_config WHERE alcance = v_i.categoria;
    SELECT * INTO v_cat FROM public.cat_notificacion_categorias WHERE codigo = v_i.categoria;
    v_motivo := NULL;

    -- ══ ③ VIGENCIA — la cola vuelve a pasar por la puerta ═══════════════════
    -- Se evalúa PRIMERO: un aviso vencido no se retiene "para después", muere.
    -- Retenerlo sería guardar para mañana algo que ya no tiene sentido hoy.
    IF v_cat.vigencia_horas IS NOT NULL
       AND v_i.created_at < now() - make_interval(hours => v_cat.vigencia_horas) THEN
      v_vencidas := v_vencidas + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'descartada', motivo = 'descartada_vencida', updated_at = now()
         WHERE id = v_i.id;
      END IF;
      CONTINUE;
    END IF;

    -- ══ ① KILL SWITCH — global primero, después la categoría ════════════════
    IF NOT v_global.despacho_activo THEN
      v_motivo := 'retenida_kill_switch_global';
    ELSIF NOT COALESCE(v_cfg.despacho_activo, true) THEN
      v_motivo := 'retenida_kill_switch_' || v_i.categoria;
    END IF;

    -- ══ ② TECHO DURO — el FUSIBLE, del sistema entero ═══════════════════════
    -- Cuenta lo YA ENTREGADO en la ventana. No es el gate 5 (que es por
    -- persona): una persona puede estar bajo su techo y el sistema mandando
    -- cien mil.
    IF v_motivo IS NULL THEN
      SELECT count(*) INTO v_entregadas
        FROM public.notificacion_intencion i
       WHERE i.estado IN ('entregada','leida')
         AND i.updated_at > now() - make_interval(hours => v_global.techo_duro_ventana_horas);
      IF v_entregadas >= v_global.techo_duro_max THEN
        v_motivo := 'retenida_techo_duro';
        v_por_techo := v_por_techo + 1;
        -- El fusible SALTA y NO se auto-rearma: se apaga el despacho y se dice.
        IF NOT p_seco AND v_global.despacho_activo THEN
          UPDATE public.notificacion_config
             SET despacho_activo = false, apagado_en = now(),
                 motivo = 'techo_duro_saltado: ' || v_entregadas || ' entregas en '
                       || v_global.techo_duro_ventana_horas || 'h', updated_at = now()
           WHERE alcance = 'global';
          SELECT * INTO v_global FROM public.notificacion_config WHERE alcance = 'global';
        END IF;
      END IF;
    END IF;

    IF v_motivo IS NOT NULL THEN
      v_retenidas := v_retenidas + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', v_motivo,
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;   -- ⚠️ el estado NO cambia: sigue `nacida`, esperando
      END IF;
      CONTINUE;
    END IF;

    -- ══ PASA. Y acá está la única razón por la que hoy nada sale ════════════
    -- El tipo está EN SOMBRA (§10.2): se registra qué habría salido y NO se
    -- entrega. El primer envío real de cada tipo es gate del founder.
    IF v_i.en_sombra THEN
      v_sombra := v_sombra + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'encolada',
               resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', 'sombra_habria_salido',
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;
      END IF;
    ELSE
      -- S88 · EL ENCHUFE DEL TRANSPORTE (donde el RAISE decia "el correo va
      -- aca"): la intencion queda ENCOLADA y marcada para_transporte. Quien
      -- entrega es la Edge Function `despachar-correo` (la unica voz al
      -- exterior): la levanta, habla con el proveedor y escribe de vuelta
      -- entregada/fallida con su causa. La DB jamas llama al proveedor.
      v_transporte := v_transporte + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'encolada',
               resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', 'para_transporte',
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'seco', p_seco,
    'despacho_global_activo', v_global.despacho_activo,
    'sombra_habrian_salido', v_sombra,
    'retenidas', v_retenidas,
    'retenidas_por_techo', v_por_techo,
    'vencidas_al_reevaluar', v_vencidas,
    'para_transporte', v_transporte
  );
END $function$

;

SELECT cron.schedule(
  'despachar-notificaciones-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-correo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHRpcHFzY2RzZHN4bmpjbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMxMDYsImV4cCI6MjA5MjM3OTEwNn0.kvHD9-JvaGytu0a7kAwgTyVXExrhIaGg1Z8_-99SOxA'),
    body    := '{"origen":"pg_cron"}'::jsonb
  );
  $$
);

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM cron.job WHERE jobname='despachar-notificaciones-tick';
  IF v_n <> 1 THEN RAISE EXCEPTION 'timbre_no_agendado'; END IF;
  IF (SELECT count(*) FROM pg_extension WHERE extname='pg_net') <> 1 THEN
    RAISE EXCEPTION 'pg_net_no_instalada';
  END IF;
  RAISE NOTICE 'timbre OK · pg_net instalada · cron cada minuto';
END $$;

COMMIT;

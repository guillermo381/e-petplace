-- ═══════════════════════════════════════════════════════════════════════════
-- S89-A · D-673 — EL RECORDATORIO: SCAN + JOB, EN SOMBRA (orden ③ de la mesa)
--
-- LA VENTANA FIRMADA (founder, 6-ago-2026): DOS toques — la mañana del día
-- anterior y la mañana del día de la cita. Bordes: creada con menos de un día
-- de anticipación → solo el segundo aviso; con menos de unas horas → un único
-- aviso inmediato. LA LETRA FINA operativa (depositada junto al lote de voces
-- para la lámina de D):
--   · «la mañana» = 08:00 America/Guayaquil (D-320: tz fija de la casa).
--   · toque DÍA:    debido en LEAST(fecha 08:00, cita − 1 h); se envía dentro
--     de [debido, hora de la cita). Una cita que NACE dentro de esa ventana
--     sale al próximo tick — ése es el «aviso inmediato» firmado.
--   · toque PREVIO: debido en (fecha − 1) 08:00; se envía dentro de
--     [debido, toque día) SOLO si la cita ya existía esa mañana — el borde
--     «menos de un día → solo el segundo» sale de ahí, no de restar horas.
--   · nada suena después de la hora de la cita; solo estado='confirmada' con
--     dueño en app; una reagenda cambia la fecha ⇒ cambia la clave de dedup
--     ⇒ la cita re-suena en su fecha nueva (declarado, no accidental).
--
-- INFRA: la que el depósito midió VIVA — pg_cron (tick cada 15') + la
-- idempotencia GRATIS de clave_dedup UNIQUE (el timbre hace ON CONFLICT DO
-- NOTHING: correr el scan N veces registra UNA vez). El transporte es el
-- tren existente (despachar-notificaciones-tick, pg_net → despachar-correo).
--
-- REQUISITO DE D (adenda 6-ago): la intención porta su referente —
-- mascota_id siempre, mascota_nombre en datos.
--
-- VARA S89: `cita_recordatorio` sigue en_sombra=true — el scan produce y la
-- sombra registra; nada llega a campana ni correo hasta la firma de la voz.
--
-- 76(g): NO RIGE — función nueva + job, cero backfill.
-- D-662: cero contrato tocado; ningún bundle llama esta función.
-- L-140: la función nace y se le REVOCA EXECUTE a PUBLIC/anon/authenticated
--   en esta misma migración — la corre SOLO el cron (rol postgres).
-- REVERSA: docs/relevamientos/2026-08-06-s89a-REVERSA-d673-recordatorio.sql
--   (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notificar_recordatorios_cita()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora      timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_hoy        date := v_ahora::date;
  c            record;
  v_cita_ts    timestamp;
  v_due_dia    timestamp;
  v_due_previo timestamp;
  v_negocio    text;
  v_nombre     text;
  v_previo     int := 0;
  v_dia        int := 0;
BEGIN
  FOR c IN
    SELECT ec.id, ec.user_id, ec.mascota_id, ec.prestador_id,
           ec.fecha, ec.hora, ec.created_at
    FROM evento_cita_servicio ec
    WHERE ec.estado = 'confirmada'
      AND ec.user_id IS NOT NULL
      AND ec.fecha IS NOT NULL AND ec.hora IS NOT NULL
      AND ec.fecha BETWEEN v_hoy AND v_hoy + 1
  LOOP
    v_cita_ts    := c.fecha + c.hora;
    v_due_dia    := LEAST(c.fecha + time '08:00', v_cita_ts - interval '1 hour');
    v_due_previo := (c.fecha - 1) + time '08:00';
    SELECT p.nombre_comercial INTO v_negocio FROM prestadores p WHERE p.id = c.prestador_id;
    SELECT m.nombre INTO v_nombre FROM mascotas m WHERE m.id = c.mascota_id;

    -- TOQUE DEL DÍA (incluye el «aviso inmediato» de la cita de último momento)
    IF v_ahora >= v_due_dia AND v_ahora < v_cita_ts THEN
      IF registrar_intencion_notificacion(
           p_tipo                 => 'cita_recordatorio',
           p_destinatario_user_id => c.user_id,
           p_mascota_id           => c.mascota_id,
           p_datos                => jsonb_build_object(
                                       'cita_id', c.id, 'toque', 'dia',
                                       'mascota_nombre', v_nombre)
                 || public._voz_notificacion('cita_recordatorio', c.user_id, c.mascota_id,
                      jsonb_build_object('toque', 'dia', 'negocio', v_negocio,
                                         'hora', to_char(c.hora, 'HH24:MI'))),
           p_clave_dedup          => 'cita-recordatorio:dia:' || c.id || ':' || c.fecha
         ) IS NOT NULL THEN
        v_dia := v_dia + 1;
      END IF;
    END IF;

    -- TOQUE PREVIO (solo si la cita ya existía la mañana del día anterior)
    IF v_ahora >= v_due_previo AND v_ahora < v_due_dia
       AND (c.created_at AT TIME ZONE 'America/Guayaquil') <= v_due_previo THEN
      IF registrar_intencion_notificacion(
           p_tipo                 => 'cita_recordatorio',
           p_destinatario_user_id => c.user_id,
           p_mascota_id           => c.mascota_id,
           p_datos                => jsonb_build_object(
                                       'cita_id', c.id, 'toque', 'previo',
                                       'mascota_nombre', v_nombre)
                 || public._voz_notificacion('cita_recordatorio', c.user_id, c.mascota_id,
                      jsonb_build_object('toque', 'previo', 'negocio', v_negocio,
                                         'hora', to_char(c.hora, 'HH24:MI'))),
           p_clave_dedup          => 'cita-recordatorio:previo:' || c.id || ':' || c.fecha
         ) IS NOT NULL THEN
        v_previo := v_previo + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'previo', v_previo, 'dia', v_dia,
                            'corrido_en', v_ahora);
END;
$function$;

-- L-140: el scan lo corre SOLO el cron. Nadie más.
REVOKE EXECUTE ON FUNCTION public.notificar_recordatorios_cita() FROM PUBLIC, anon, authenticated;

-- El job: cada 15 minutos (cron.schedule con el mismo nombre REEMPLAZA).
SELECT cron.schedule('recordatorios-cita', '*/15 * * * *',
                     'SELECT public.notificar_recordatorios_cita();');

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_acl aclitem[]; v_n int;
BEGIN
  SELECT p.proacl INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'notificar_recordatorios_cita';
  IF EXISTS (SELECT 1 FROM unnest(coalesce(v_acl, '{}'::aclitem[])) a
             WHERE a::text LIKE 'anon=%' OR a::text LIKE 'authenticated=%' OR a::text LIKE '=%') THEN
    RAISE EXCEPTION 'cinturon_recordatorio: el scan quedó ejecutable por anon/authenticated/PUBLIC (L-140)';
  END IF;
  SELECT count(*) INTO v_n FROM cron.job WHERE jobname = 'recordatorios-cita' AND active;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_recordatorio: el job no quedó agendado (n=%)', v_n;
  END IF;
END $cint$;

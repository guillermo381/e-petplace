-- S88-A · LA COLUMNA `audiencia` — freno medido de C, contestado en el motor
--
-- 76(g) — VEDA: **NO RIGE** para el DDL; **el UPDATE de clasificación SÍ toca
--   37 filas de catálogo** — se declara: son filas de CATÁLOGO, no de usuario,
--   y ninguna intención viva las referencia por audiencia (la columna nace hoy).
--
-- EL FRENO DE C, verificado: `cat_notificacion_tipos` **no tiene columna de
-- audiencia y ninguna tabla la porta**. Sin ella, «Lo que ya pagaste» se dibuja
-- en el prestador con seis tipos que son **del que paga**. *La regla «vivos
-- para esta audiencia» no era derivable — le faltaba el dato.*
--
-- ⚠️ DOS CLASES DE CLASIFICACIÓN, Y SE DECLARAN POR SEPARADO porque no valen
--   lo mismo:
--     · **MEDIDA** — el tipo tiene productor vivo y su `p_destinatario_user_id`
--       dice a quién le llega. **17 tipos.** No se discute: es literal.
--     · **RAZONADA** — el tipo NO tiene productor; se clasifica por el HECHO
--       que cuenta. **20 tipos.** *La mesa puede corregir cualquiera sin
--       arqueología: están marcadas acá.*
--   **Un catálogo que no distingue lo medido de lo supuesto invita a tratar
--   todo como medido.**
--
-- ⚖️ PRE-ADJUDICACIÓN DE MESA, aplicada: `salud_seguridad` es visible en el
--   prestador ⇒ sus tipos nacen **`ambas`**. *No hace falta escribir excepción:
--   la clasificación la expresa.*

BEGIN;

ALTER TABLE public.cat_notificacion_tipos
  ADD COLUMN IF NOT EXISTS audiencia text NOT NULL DEFAULT 'ambas'
  CONSTRAINT cat_notif_tipos_audiencia_chk CHECK (audiencia IN ('cliente','prestador','ambas'));

COMMENT ON COLUMN public.cat_notificacion_tipos.audiencia IS
  'S88: a QUIÉN le llega este tipo. La pantalla de preferencias filtra por '
  'ella — «Lo que ya pagaste» en el prestador mostraba tipos del que paga. '
  'MEDIDA donde hay productor (el destinatario es literal); RAZONADA donde no, '
  'y la migración marca cuáles.';

-- ── MEDIDOS · el productor dice el destinatario ───────────────────────────
UPDATE cat_notificacion_tipos SET audiencia = 'prestador' WHERE codigo IN (
  'documento_aprobado','documento_rechazado',              -- → dueño del negocio
  'prestador_aprobado','prestador_rechazado',
  'prestador_en_revision','prestador_suspendido',          -- → dueño del negocio
  'registro_completado_prestador',                         -- → dueño
  'registro_completado_operador',                          -- → quien hizo el alta
  'alta_asistida_vencida_soporte'                          -- → el flujo del negocio
);
UPDATE cat_notificacion_tipos SET audiencia = 'cliente' WHERE codigo IN (
  'plan_renovado','plan_renovacion_proxima','plan_renovacion_fallida',
  'plan_vencido_reembolso',                                -- → v_susc.user_id
  'paquete_vence',                                         -- → v_bono.user_id
  'programa_vence','programa_vencido_reembolso',           -- → v_prog.user_id
  'procedimiento_agendado'                                 -- → v_cita.user_id
);

-- ── RAZONADOS · sin productor; por el HECHO que cuentan ───────────────────
--    (la mesa corrige cualquiera de estos sin arqueología)
UPDATE cat_notificacion_tipos SET audiencia = 'prestador' WHERE codigo IN (
  'cita_solicitada',          -- alguien le PIDE una cita al negocio
  'cita_cancelada_cliente',   -- el cliente canceló: se entera el negocio
  'cita_calificada',          -- lo califican A ÉL
  'liquidacion_disponible'    -- la plata que el negocio cobra es suya
);
UPDATE cat_notificacion_tipos SET audiencia = 'cliente' WHERE codigo IN (
  'alta_asistida_completada_por_cliente',
  'alta_asistida_pendiente_enviar_email',
  'cita_confirmada','cita_recordatorio','cita_rechazada',
  'pago_confirmado',
  'pedido_estado','pedido_recurrente','devolucion_estado', -- la Despensa es del dueño
  'promocion'                                              -- comercial: al que compra
);
--    `ambas` (el default) queda en: cita_completada · cita_no_show ·
--    mensaje_nuevo · sistema · vacuna_vencida · wearable_alerta.
--    Las dos últimas POR LA PRE-ADJUDICACIÓN DE MESA; las otras porque el
--    hecho es genuinamente de los dos lados (una cita que no ocurrió le
--    importa igual al que esperaba y al que no fue).

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $belt$
DECLARE v_sin int; v_salud int; v_pres int; v_cli int; v_amb int;
BEGIN
  SELECT count(*) INTO v_sin FROM cat_notificacion_tipos WHERE audiencia IS NULL;
  IF v_sin <> 0 THEN RAISE EXCEPTION 'CINTURON: % tipos sin audiencia', v_sin; END IF;

  -- la pre-adjudicación de mesa, verificada sobre el OBJETO
  SELECT count(*) INTO v_salud FROM cat_notificacion_tipos
   WHERE categoria='salud_seguridad' AND audiencia <> 'ambas';
  IF v_salud <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % tipo(s) de salud_seguridad no quedaron `ambas` — la mesa los pre-adjudicó visibles en el prestador', v_salud;
  END IF;

  -- ⚠️ Y EL QUE CIERRA EL FRENO DE C: la categoría de la plata del cliente NO
  --    puede tener ningún tipo del prestador, o «Lo que ya pagaste» vuelve a
  --    mostrarse mal.
  IF EXISTS (SELECT 1 FROM cat_notificacion_tipos
              WHERE categoria='saldo_pagado' AND audiencia='prestador') THEN
    RAISE EXCEPTION 'CINTURON: saldo_pagado tiene un tipo de audiencia prestador';
  END IF;

  SELECT count(*) FILTER (WHERE audiencia='prestador'),
         count(*) FILTER (WHERE audiencia='cliente'),
         count(*) FILTER (WHERE audiencia='ambas')
    INTO v_pres, v_cli, v_amb FROM cat_notificacion_tipos;
  RAISE NOTICE 'CINTURON VERDE: prestador=% · cliente=% · ambas=% (total %)',
    v_pres, v_cli, v_amb, v_pres+v_cli+v_amb;
END
$belt$;

COMMIT;

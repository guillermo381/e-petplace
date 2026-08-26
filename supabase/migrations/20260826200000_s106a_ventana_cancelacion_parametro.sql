-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2b — LA VENTANA DE CANCELACIÓN DEJA DE SER CONSTANTE
-- ═══════════════════════════════════════════════════════════════════════
--
-- LETRA: LETRA_TELEMEDICINA v1.1 §4 — «cancelación sin penalidad hasta 30
-- minutos antes». Firma founder CP1 S106, 25-ago-2026.
--
-- EL PROBLEMA MEDIDO (S106-A turno ⓪, contra pg_proc): la ventana NO vive
-- en ningún catálogo. Es un literal en el cuerpo de cinco funciones:
--
--   cancelar_cita_suelta:28        interval '24 hours'   (P18 cancelación)
--   cancelar_reserva_paquete:23    interval '2 hours'    (P16)
--   reagendar_cita_suelta:44       interval '2 hours'    (P18 reagenda)
--   reagendar_sesion_programa:34   interval '24 hours'   (reagenda programa)
--   saltar_cita_plan:32            interval '24 hours'   (P14 salto)
--
-- ⚠️ ALCANCE ACOTADO A PROPÓSITO — y se declara porque el pedido decía
-- «las cinco funciones con el literal 24 hours pasan a leer el parámetro»,
-- y la medición dice que **son TRES las que tienen 24 h, no cinco**.
--
-- ESTA MIGRACIÓN CABLEA UNA SOLA: `cancelar_cita_suelta`.
--
--   · Es la ÚNICA que implementa la CANCELACIÓN de una cita suelta, que es
--     lo que la letra de telemedicina regula.
--   · Las otras cuatro NO se cablean, y no es olvido:
--       - `reagendar_cita_suelta` y `reagendar_sesion_programa` son
--         REAGENDA, otra política (P18(b), P22 pendiente). Meterlas bajo un
--         parámetro que se llama «cancelación» conflaciona dos conceptos.
--       - `saltar_cita_plan` es el SALTO de P14, con su propia letra.
--       - `cancelar_reserva_paquete` sí es cancelación, pero su ventana es
--         de **2 h** (P16). Cablearla contra un default de 1440 minutos le
--         CAMBIARÍA la conducta de 2 h a 24 h.
--
--   ⇒ **L-176: una migración no concede disponibilidad.** El default de la
--   columna (1440 = 24 h) reproduce EXACTAMENTE la conducta de hoy de la
--   única función cableada. Cero cambio para paseo, plan, paquete,
--   grooming y adiestramiento. El único valor distinto es telemedicina.
--
--   Unificar las otras cuatro bajo parámetros propios es decisión de letra
--   (P22 · P16 · P14), no un valor que se agrega de paso.
--
-- ─── VEDA 76(g): **NO RIGE.** ───────────────────────────────────────────
-- No hay backfill de filas de negocio ni anclas que dependan de una
-- ventana de escritura. La columna nace con default y el UPDATE toca UNA
-- fila de catálogo (`telemedicina`), que hoy es `reservable=false` y por
-- lo tanto no puede tener citas vivas. Sin ventana de veda.
--
-- ─── REVERSA ────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar:
--   docs/relevamientos/2026-08-25-s106a-REVERSA-ventana-cancelacion.sql
-- Declara qué NO deshace: las citas ya canceladas no se descancelan.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1 · El parámetro, en el catálogo ──────────────────────────────────
ALTER TABLE public.tipos_servicio
  ADD COLUMN IF NOT EXISTS ventana_cancelacion_minutos integer NOT NULL DEFAULT 1440;

COMMENT ON COLUMN public.tipos_servicio.ventana_cancelacion_minutos IS
  'S106 · Minutos antes de la hora de la cita hasta los que se puede '
  'cancelar sin penalidad. Default 1440 (24 h) = la conducta que el motor '
  'ya tenía escrita como literal. Telemedicina: 30 (LETRA_TELEMEDICINA '
  'v1.1 §4, firma founder CP1 S106). NO gobierna reagenda ni el salto de '
  'plan: esas son P18(b), P22 y P14, con sus propias letras.';

ALTER TABLE public.tipos_servicio
  ADD CONSTRAINT chk_ventana_cancelacion_positiva
  CHECK (ventana_cancelacion_minutos > 0);

-- La teleconsulta no inmoviliza un espacio físico: 30 minutos.
UPDATE public.tipos_servicio
   SET ventana_cancelacion_minutos = 30
 WHERE codigo = 'telemedicina';

-- ─── 2 · El lector único ───────────────────────────────────────────────
-- Una sola verdad: si mañana otra función necesita la ventana, la pide acá
-- y no vuelve a escribir el literal.
CREATE OR REPLACE FUNCTION public._ventana_cancelacion_minutos(p_tipo_servicio text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- COALESCE fail-safe: un tipo desconocido cae en las 24 h de siempre,
  -- jamás en «sin ventana» (que sería cancelar cualquier cosa a cualquier
  -- hora). El default protege hacia el lado seguro.
  SELECT COALESCE(
    (SELECT ts.ventana_cancelacion_minutos
       FROM public.tipos_servicio ts
      WHERE ts.codigo = p_tipo_servicio),
    1440);
$fn$;

REVOKE EXECUTE ON FUNCTION public._ventana_cancelacion_minutos(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._ventana_cancelacion_minutos(text) TO authenticated;

-- ─── 3 · La única función cableada ─────────────────────────────────────
-- Firma IDÉNTICA ⇒ no aplica L-119 (no hay sobrecarga que dropear).
CREATE OR REPLACE FUNCTION public.cancelar_cita_suelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth    uuid := auth.uid();
  v_cita    record;
  v_ahora   timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dest    uuid;
  v_ventana int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- S106 · la ventana sale del CATÁLOGO, no de un literal.
  -- Para todo lo que no sea telemedicina el valor es 1440 = las 24 h de
  -- P18(b) que esta misma línea tenía escritas a mano.
  v_ventana := public._ventana_cancelacion_minutos(v_cita.tipo_servicio);
  IF (v_cita.fecha + v_cita.hora) - v_ahora < make_interval(mins => v_ventana) THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  -- La cancelación se DECLARA sobre el pago (7.16). La cita deja de
  -- estar cubierta: estado_reserva sale de 'pagada' (invariante intacto).
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      estado_reserva = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'p18_cancelacion_en_ventana',
        'cancelada_en', now(),
        'ventana_minutos', v_ventana,
        'reembolso_simulado', jsonb_build_object(
          'monto', v_cita.precio,
          'simulado', true,
          'motivo', 'p18_cancelacion_en_ventana',
          'aplicado_en', now()
        )
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  -- ═══ D-822 · EL HUECO EN LA AGENDA DE HOY AVISA HOY (productor ③) ═══
  SELECT pr.user_id INTO v_dest
    FROM prestadores pr WHERE pr.id = v_cita.prestador_id;

  IF v_dest IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_cancelada_cliente',
      p_destinatario_user_id => v_dest,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object(
                                  'cita_id', p_cita_id,
                                  'cuando', to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))
                                || public._voz_notificacion(
                                     'cita_cancelada_cliente', v_dest, v_cita.mascota_id,
                                     jsonb_build_object('cuando',
                                       to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))),
      p_clave_dedup          => 'cita_cancelada:' || p_cita_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'reembolso_monto', v_cita.precio,
    'reembolso_simulado', true
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) TO authenticated;

-- ─── 4 · CINTURÓN — aborta con la conducta vieja intacta si algo falla ──
DO $cinturon$
DECLARE
  v_tele int;
  v_otros int;
  v_sin_default int;
BEGIN
  SELECT ventana_cancelacion_minutos INTO v_tele
    FROM tipos_servicio WHERE codigo = 'telemedicina';
  IF v_tele IS DISTINCT FROM 30 THEN
    RAISE EXCEPTION 'CINTURON: telemedicina no quedó en 30 min (valor: %)', v_tele;
  END IF;

  -- L-176 probada, no argumentada: NINGÚN otro servicio cambió de conducta.
  SELECT count(*) INTO v_otros
    FROM tipos_servicio WHERE codigo <> 'telemedicina' AND ventana_cancelacion_minutos <> 1440;
  IF v_otros > 0 THEN
    RAISE EXCEPTION 'CINTURON: % servicios distintos de telemedicina no quedaron en 1440', v_otros;
  END IF;

  -- El lector devuelve el default para un tipo que no existe (fail-safe).
  IF public._ventana_cancelacion_minutos('no_existe_este_codigo') <> 1440 THEN
    RAISE EXCEPTION 'CINTURON: el lector no cae al default de 1440 para un tipo desconocido';
  END IF;
  IF public._ventana_cancelacion_minutos('telemedicina') <> 30 THEN
    RAISE EXCEPTION 'CINTURON: el lector no devuelve 30 para telemedicina';
  END IF;
  IF public._ventana_cancelacion_minutos('paseo') <> 1440 THEN
    RAISE EXCEPTION 'CINTURON: el lector no devuelve 1440 para paseo';
  END IF;

  -- L-140: la función nueva no puede quedar abierta a anon.
  SELECT count(*) INTO v_sin_default
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = '_ventana_cancelacion_minutos'
     AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_sin_default > 0 THEN
    RAISE EXCEPTION 'CINTURON L-140: _ventana_cancelacion_minutos es ejecutable por anon';
  END IF;

  RAISE NOTICE 'CINTURON OK — telemedicina 30 min, el resto intacto en 1440, lector fail-safe, anon cerrado';
END
$cinturon$;

COMMIT;

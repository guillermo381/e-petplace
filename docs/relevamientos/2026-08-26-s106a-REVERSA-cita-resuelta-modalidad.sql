-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826400000_s106a_cita_resuelta_modalidad.sql`
-- Escrita ANTES de aplicar (ley de la casa).
--
-- QUÉ DESHACE: devuelve `obtener_cita_resuelta` a su forma previa — sin la
-- clave `modalidad` en el jsonb de salida. La FIRMA no cambia en ninguno de
-- los dos sentidos (`(uuid) RETURNS jsonb`), así que **no hace falta DROP**
-- y L-119 no rige: es un `CREATE OR REPLACE` puro.
--
-- ⚠️ QUÉ **NO** DESHACE, y hay que saberlo antes de correrla:
--    · **Nada de datos** — esta migración no escribe una sola fila.
--    · **No revierte el bundle.** Si un bundle publicado ya lee
--      `data.modalidad`, revertir esto le deja la clave AUSENTE. El wrapper
--      la trata como `undefined → null` (no rompe), pero **la marca de
--      teleconsulta deja de pintarse en silencio**. *Revertir el motor sin
--      revertir el bundle no da error: da una firma §7 incumplida sin
--      síntoma* — que es la clase de falla que este archivo existe para
--      anunciar.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_cita_resuelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c evento_cita_servicio;
  v_uid uuid := auth.uid();
  v_puede boolean;
  v_motivo text;
  v_causa text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_c FROM evento_cita_servicio WHERE id = p_cita_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  SELECT public.user_tiene_acceso_a_mascota(v_c.mascota_id)
      OR public.es_mi_prestador(v_c.prestador_id)
      OR public.is_admin()
    INTO v_puede;

  IF NOT COALESCE(v_puede, false) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  v_motivo := v_c.metadata->>'motivo';
  v_causa := CASE
    WHEN v_c.estado <> 'cancelada' THEN NULL
    WHEN v_c.metadata ? 'cancelada_por_reverso_en' THEN 'pago_reversado'
    WHEN v_motivo = 'cierre_periodo_plan'          THEN 'cierre_de_plan'
    WHEN v_motivo IS NOT NULL                      THEN 'otra'
    ELSE 'desconocida'
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_c.id,
    'estado', v_c.estado,
    'estado_reserva', v_c.estado_reserva,
    'fecha', v_c.fecha,
    'hora', v_c.hora,
    'tipo_servicio', v_c.tipo_servicio,
    'prestador_id', v_c.prestador_id,
    'mascota_id', v_c.mascota_id,
    'cancelada', (v_c.estado = 'cancelada'),
    'causa_cancelacion', v_causa,
    'motivo_crudo', v_motivo,
    'cancelada_en', v_c.metadata->>'cancelada_por_reverso_en'
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_cita_resuelta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_cita_resuelta(uuid) TO authenticated;

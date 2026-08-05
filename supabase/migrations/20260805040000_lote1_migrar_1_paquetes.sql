-- ============================================================================
-- S87-A · LOTE 1 — MIGRACIÓN 1 DE 7: `vencer_paquetes_salidas` A LA PUERTA
--
-- La primera de las siete. Deja de insertar directo en `notificaciones` y pasa
-- por `registrar_intencion_notificacion`, con los cinco gates de §5.
--
-- DIFERENCIAS QUE ESTO PRODUCE, declaradas de antemano (el filo del founder:
-- toda fila perdida NOMBRA su gate, o se frena):
--  1. tipo `sistema` → `paquete_vence` (`saldo_pagado`). Antes mapeaba a
--     `seguridad_cuenta` y SOBREVIVÍA AL MEMORIAL. Ahora no. Es el cambio
--     que este lote existe para hacer.
--  2. una intención puede quedar `descartada` por consentimiento, acceso o
--     memorial donde antes SIEMPRE se escribía. Cada caso queda con su motivo
--     en el lector de sombra.
--  3. `en_sombra = true` (el tipo nace en sombra, §10.2): NADA se entrega
--     hasta el gate del founder. Hoy tampoco se entregaba nada — el canal
--     `in_app` no tenía un solo lector.
--
-- DATO MEDIDO que importa al leer la sombra: de 3 bonos vivos, solo 1 tiene
-- `mascota_id`. En los otros dos el gate 1 NO APLICA y el lector lo dirá — un
-- paquete es de la familia, no de una mascota.
--
-- VEDA 76(g): NO RIGE — REPLACE de función, sin DDL de datos, sin backfill.
-- REVERSA: el cuerpo anterior vive en el historial de migraciones; se
-- re-aplica ESE, no se improvisa uno.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vencer_paquetes_salidas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoy       date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_bono      record;
  v_restantes int;
  v_moneda    text;
  v_aviso_key text;
  v_avisados  int := 0;
  v_vencidos  int := 0;
  v_breakage  numeric(14,2) := 0;
  v_monto     numeric(14,2);
BEGIN
  -- (a) el recordatorio: UNO y sereno, cerca del cierre (P16e).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo' AND estado_pago = 'pagado'
      AND unidades_usadas < unidades_total
      AND fecha_vencimiento >= v_hoy AND fecha_vencimiento <= v_hoy + 3
    FOR UPDATE
  LOOP
    v_aviso_key := 'aviso_vencimiento_' || v_bono.fecha_vencimiento::text;
    IF NOT (v_bono.pago_metadata ? v_aviso_key) THEN
      -- S87 · LOTE 1: pasa por LA PUERTA. Cambios que esto trae, declarados:
      --  · el tipo deja de ser 'sistema' (que mapeaba a seguridad_cuenta y por
      --    lo tanto SOBREVIVÍA AL MEMORIAL) y pasa a `paquete_vence` →
      --    `saldo_pagado`. Es el aviso literal de P16(e).
      --  · viaja `mascota_id` para que el gate 1 pueda evaluarlo. Si el bono no
      --    la tiene, va NULL y el gate NO aplica — y el lector lo dice; no se
      --    finge que evaluó.
      --  · la clave de dedup reusa la MISMA llave que ya gobernaba el aviso
      --    (`aviso_vencimiento_<fecha>`), así el candado de idempotencia del
      --    motor y el de esta función dicen lo mismo en vez de competir.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'paquete_vence',
        p_destinatario_user_id => v_bono.user_id,
        p_mascota_id           => v_bono.mascota_id,
        p_evento_id            => NULL,
        p_datos                => jsonb_build_object(
          'subtipo', 'paquete_vencimiento',
          'bono_id', v_bono.id,
          'salidas_restantes', v_bono.unidades_total - v_bono.unidades_usadas,
          'vence_el', v_bono.fecha_vencimiento
        ),
        p_clave_dedup          => 'bono:' || v_bono.id || ':' || v_aviso_key
      );
      UPDATE bonos SET pago_metadata = pago_metadata || jsonb_build_object(v_aviso_key, now())
      WHERE id = v_bono.id;
      v_avisados := v_avisados + 1;
    END IF;
  END LOOP;

  -- (b) el vencimiento: breakage DECLARADO (Decisión T).
  FOR v_bono IN
    SELECT * FROM bonos
    WHERE tipo_servicio = 'paseo' AND estado = 'activo'
      AND fecha_vencimiento < v_hoy
    FOR UPDATE
  LOOP
    v_restantes := v_bono.unidades_total - v_bono.unidades_usadas;

    UPDATE bonos SET estado = 'vencido' WHERE id = v_bono.id;
    v_vencidos := v_vencidos + 1;

    IF v_restantes > 0 AND v_bono.estado_pago = 'pagado'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'bono' AND ee.origen_id = v_bono.id
           AND ee.tipo_evento = 'bono_breakage'
       )
    THEN
      v_monto := round(v_restantes * COALESCE(v_bono.precio_por_unidad, 0), 2);
      SELECT cc.moneda INTO v_moneda
      FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_bono.prestador_id;

      PERFORM crear_evento_economico(
        p_tipo_evento         => 'bono_breakage'::tipo_evento_economico_enum,
        p_revenue_stream      => 'eventual'::revenue_stream_enum,
        p_cuenta_comercial_id => NULL,   -- revenue puro plataforma: sin payout
        p_country_code        => v_bono.country_code,
        p_moneda              => COALESCE(v_moneda, 'USD'),
        p_monto_bruto         => v_monto,
        p_monto_kushki_fee    => 0,      -- simulación honesta
        p_origen_tipo         => 'bono',
        p_origen_id           => v_bono.id,
        p_fecha_devengo       => now(),
        p_fecha_cobro_kushki  => (v_bono.pago_metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object(
          'pago_simulado', true, 'via', 'vencer_paquetes_salidas',
          'salidas_vencidas', v_restantes,
          'precio_por_unidad', v_bono.precio_por_unidad
        )
      );
      v_breakage := v_breakage + v_monto;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'avisados', v_avisados, 'vencidos', v_vencidos,
    'breakage_total', v_breakage, 'corrida_en', now()
  );
END;
$function$

;

REVOKE EXECUTE ON FUNCTION public.vencer_paquetes_salidas() FROM PUBLIC, anon;

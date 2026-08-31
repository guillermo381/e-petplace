-- REVERSA de 20260904180000_s108a_llave_y_correo_del_paseo.sql — ANTES.
-- ⚠️ Revertir DESCONECTA el aviso de guarderia de la llave unica: vuelve a ser
--    posible «aviso encendido, cobro apagado». Y devuelve el aviso del paseo a
--    canal por preferencias.
BEGIN;
UPDATE cat_notificacion_tipos SET canal_forzado = NULL WHERE codigo='plan_renovacion_proxima';
CREATE OR REPLACE FUNCTION public.avisar_renovaciones_guarderia()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_n int := 0; v_prox date;
BEGIN
  FOR v_r IN
    SELECT s.*, cc.moneda
      FROM guarderia_suscripciones s
      JOIN prestadores pr ON pr.id = s.prestador_id
      LEFT JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
     /* 🔴 SOLO PLANES VIVOS. *Avisar de un cobro que no va a ocurrir es peor
        que no avisar*: la familia cancela algo que ya canceló, o vuelve a la app
        a arreglar un problema que no tiene. */
     WHERE s.estado = 'activa'
       /* 🔴 SOLO RENOVACIONES. `periodo_desde IS NULL` es *«autorizado y todavía
          sin cobrar»* ⇒ su primer cobro sale al contratar y **no hay tres días
          que avisar**. Este brazo es lo que impide avisarle a alguien que
          todavía no pagó su primer mes. */
       AND s.periodo_desde IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
  LOOP
    v_prox := public.guarderia_proximo_cobro(v_r.dia_de_cobro, v_r.periodo_desde);
    CONTINUE WHEN v_prox <> public.hoy_local() + 3;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'guarderia_renovacion_proxima',
      p_destinatario_user_id => v_r.autorizada_por,
      p_mascota_id => v_r.mascota_id, p_evento_id => NULL,
      p_datos => _voz_notificacion('guarderia_renovacion_proxima', v_r.autorizada_por, v_r.mascota_id,
                   jsonb_build_object('fecha', v_prox,
                                      'monto', to_char(v_r.precio_mensual,'FM999999990.00'),
                                      'moneda', COALESCE(v_r.moneda,'USD')))
                 || jsonb_build_object('suscripcion_id', v_r.id, 'fecha', v_prox,
                                       'monto', v_r.precio_mensual,
                                       'moneda', COALESCE(v_r.moneda,'USD'),
                                       'puede','cancelar'),
      /* La clave lleva el PERÍODO ⇒ un aviso por período, jamás dos. El índice
         único de `notificacion_intencion` es el piso; esto es su llave. */
      p_clave_dedup => 'guarderia_renovacion:' || v_r.id::text || ':' || v_prox::text);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $function$

;
COMMIT;

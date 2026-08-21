BEGIN;
CREATE TEMP TABLE _r(puerta text, congelo text, detalle text);

-- 🔴 CADA PUERTA EN SU PROPIO BLOQUE: un DO que aborta se lleva puesto el caso
--    siguiente, y un arnés donde un fallo esconde a los otros mide menos de lo
--    que dice medir.
DO $$
DECLARE v_c uuid; v_pre uuid; v_serv uuid; v_masc uuid; v_u uuid; v_n int; v_m text;
BEGIN
  SELECT m.user_id, m.id INTO v_u, v_masc FROM mascotas m WHERE m.user_id IS NOT NULL LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_u,'role','authenticated')::text, true);
  SELECT p.id, ps.id INTO v_pre, v_serv FROM prestadores p
    JOIN prestador_servicios ps ON ps.prestador_id=p.id AND ps.activo
   WHERE p.estado='activo' LIMIT 1;
  SELECT (crear_bloqueo_agenda(v_pre, v_serv, v_masc,
          (now()+interval '3 days')::date, '10:00'::time, NULL, NULL)->>'cita_id')::uuid INTO v_c;
  SELECT count(*), max(moneda) INTO v_n, v_m FROM cita_desglose WHERE cita_id=v_c;
  INSERT INTO _r VALUES ('① crear_bloqueo_agenda (familia)', (v_n=1)::text, 'moneda='||coalesce(v_m,'-'));
EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES ('① crear_bloqueo_agenda (familia)','ERROR',SQLERRM);
END $$;

DO $$
DECLARE v_c uuid; v_pre uuid; v_masc uuid; v_n int; v_m text; v_serv uuid;
BEGIN
  /* ═══ 🔴 LA PUERTA QUE NADIE ENUMERÓ ══════════════════════════════════════
     Un INSERT directo en `evento_cita_servicio`. **Es la prueba fuerte de la
     tesis del trigger:** no cubre siete productores conocidos — cubre
     CUALQUIERA, incluida la octava función que alguien escriba dentro de seis
     meses sin leer esta letra.
     *Probar solo los productores que ya existen probaría la lista, no la
     defensa.* */
  SELECT p.id, ps.id INTO v_pre, v_serv FROM prestadores p
    JOIN prestador_servicios ps ON ps.prestador_id=p.id AND ps.activo
   WHERE p.estado='activo' LIMIT 1;
  SELECT id INTO v_masc FROM mascotas LIMIT 1;

  INSERT INTO evento_cita_servicio
    (mascota_id, prestador_id, tipo_servicio, fecha, hora, precio,
     estado, estado_reserva, expira_en, country_code)
  VALUES (v_masc, v_pre, 'paseo', (now()+interval '5 days')::date, '09:00', 33.00,
          'pendiente', 'pendiente_pago', now()+interval '15 minutes', 'EC')
  RETURNING id INTO v_c;

  SELECT count(*), max(moneda) INTO v_n, v_m FROM cita_desglose WHERE cita_id=v_c;
  INSERT INTO _r VALUES ('② INSERT directo (la octava puerta)', (v_n=1)::text,
    'moneda='||coalesce(v_m,'-')||' · total='||coalesce((SELECT total::text FROM cita_desglose WHERE cita_id=v_c),'-'));
EXCEPTION WHEN OTHERS THEN INSERT INTO _r VALUES ('② INSERT directo','ERROR',SQLERRM);
END $$;

SELECT puerta, congelo, detalle FROM _r;
ROLLBACK;

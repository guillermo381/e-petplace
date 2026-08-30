/* ═══════════════════════════════════════════════════════════════════════════
   ARNÉS · EL CORTE DE LA MEDIA DEL ACTA — ejercido de verdad
   ═══════════════════════════════════════════════════════════════════════════
   El cinturón de `20260830100000` verificó la CAUSA (`no_opera_ese_dia`) y
   **prometió que el corte del acta se ejercía «en el arnés de abajo»** — que no
   estaba. *Un verde que promete más de lo que midió es exactamente el defecto
   que esa migración vino a curar*, así que el arnés existe acá y se corre.

   Fabrica el caso completo —una estadía, dos actas, tres fotos en tres
   momentos— y **deshace todo**. Se corre con:
     npx supabase --experimental db query --linked --file <este archivo>
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;

CREATE TEMP TABLE _arnes_out (que text, valor text) ON COMMIT DROP;

DO $arnes$
DECLARE
  v_cita uuid; v_est uuid; v_masc uuid; v_user uuid; v_prest uuid; v_serv uuid;
  v_acta_r uuid; v_acta_d uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid;
  v_t0 timestamptz := now() - interval '6 hours';   -- llegada
  v_tr timestamptz := now() - interval '5 hours';   -- cierre del acta de RECOGIDA
  v_td timestamptz := now() - interval '1 hour';    -- cierre del acta de DEVOLUCIÓN
  v_n_r int; v_n_d int; v_ids_r text; v_ids_d text; v_rol text := current_user;
BEGIN
  SELECT ps.prestador_id, ps.id INTO v_prest, v_serv
    FROM prestador_servicios ps WHERE ps.tipo_servicio='guarderia_dia' LIMIT 1;
  SELECT c.mascota_id, c.user_id INTO v_masc, v_user
    FROM evento_cita_servicio c JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;

  INSERT INTO evento_cita_servicio
    (user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
     duracion_minutos, estado, estado_reserva, country_code)
  VALUES (v_user, v_masc, v_prest, 'guarderia_dia', public.hoy_local(), 12,
          540, 'completada', 'pagada', 'EC')
  RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, estado, llegada_en)
  VALUES (v_cita, 'entregada', v_t0) RETURNING id INTO v_est;

  -- tres fotos: una ANTES del cierre de recogida, dos DESPUÉS
  INSERT INTO guarderia_media (prestador_id, fecha, tipo, archivo_url, capturada_en, clave_idempotencia, autor_user_id)
  VALUES (v_prest, public.hoy_local(), 'foto', 'x/1.jpg', v_t0 + interval '5 min', 'arnes-1', v_user)
  RETURNING id INTO v_m1;
  INSERT INTO guarderia_media (prestador_id, fecha, tipo, archivo_url, capturada_en, clave_idempotencia, autor_user_id)
  VALUES (v_prest, public.hoy_local(), 'foto', 'x/2.jpg', v_tr + interval '1 hour', 'arnes-2', v_user)
  RETURNING id INTO v_m2;
  INSERT INTO guarderia_media (prestador_id, fecha, tipo, archivo_url, capturada_en, clave_idempotencia, autor_user_id)
  VALUES (v_prest, public.hoy_local(), 'foto', 'x/3.jpg', v_td - interval '5 min', 'arnes-3', v_user)
  RETURNING id INTO v_m3;

  INSERT INTO guarderia_media_etiquetas (media_id, mascota_id, estadia_id)
  VALUES (v_m1, v_masc, v_est), (v_m2, v_masc, v_est), (v_m3, v_masc, v_est);

  INSERT INTO guarderia_actas (estadia_id, direccion, carnet_verificado, cerrada_en, levantada_por)
  VALUES (v_est, 'recogida', true, v_tr, v_user) RETURNING id INTO v_acta_r;
  INSERT INTO guarderia_actas (estadia_id, direccion, carnet_verificado, cerrada_en, levantada_por)
  VALUES (v_est, 'devolucion', true, v_td, v_user) RETURNING id INTO v_acta_d;

  /* El lector exige sesión (y su gate de acceso es parte de lo que se ejerce):
     se lee COMO LA FAMILIA, no como superusuario. */
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;

  SELECT jsonb_array_length(public.obtener_acta_guarderia(v_acta_r)->'media'),
         (public.obtener_acta_guarderia(v_acta_r)->'media')::text
    INTO v_n_r, v_ids_r;
  SELECT jsonb_array_length(public.obtener_acta_guarderia(v_acta_d)->'media'),
         (public.obtener_acta_guarderia(v_acta_d)->'media')::text
    INTO v_n_d, v_ids_d;

  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  /* 🔴 EL DISCRIMINADOR: con el defecto viejo las DOS traían 3.
     Ahora: recogida = 1 (sólo la anterior a su cierre) · devolución = 2. */
  IF v_n_r <> 1 THEN
    RAISE EXCEPTION 'ARNES: el acta de RECOGIDA trajo % fotos, esperaba 1 (con el defecto viejo traia 3)', v_n_r;
  END IF;
  IF v_n_d <> 2 THEN
    RAISE EXCEPTION 'ARNES: el acta de DEVOLUCION trajo % fotos, esperaba 2', v_n_d;
  END IF;
  /* Y que NO sean las mismas: sin esto, 1 y 2 podrian salir del mismo conjunto. */
  IF v_ids_r LIKE '%'||v_m2::text||'%' OR v_ids_r LIKE '%'||v_m3::text||'%' THEN
    RAISE EXCEPTION 'ARNES: la recogida trae fotos de la devolucion';
  END IF;
  IF v_ids_d LIKE '%'||v_m1::text||'%' THEN
    RAISE EXCEPTION 'ARNES: la devolucion trae la foto de la recogida';
  END IF;

  /* 🔴 EL ARNÉS IMPRIME. *Uno que no imprime no midió nada* — el verde tiene
     que ser un NÚMERO que alguien pueda leer, no la ausencia de una excepción. */
  INSERT INTO _arnes_out VALUES
    ('fotos del acta de RECOGIDA',  v_n_r::text || '  (con el defecto viejo: 3)'),
    ('fotos del acta de DEVOLUCION', v_n_d::text || '  (con el defecto viejo: 3)'),
    ('cruce entre las dos', 'NINGUNO — verificado por id, no por conteo'),
    ('total de fotos de la estadia', '3');
END
$arnes$;

SELECT que, valor FROM _arnes_out;

ROLLBACK;   -- ← nada de esto queda

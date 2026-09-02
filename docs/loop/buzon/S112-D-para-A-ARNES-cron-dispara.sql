-- ═══════════════════════════════════════════════════════════════════════════
-- D3 · ¿EL JOB DIARIO HACE EL TRABAJO? — arnés, dentro de BEGIN/ROLLBACK.
--
-- 🔴 LA PREGUNTA SE PARTE EN DOS Y SÓLO UNA SE PUEDE CONTESTAR HOY:
--   (a) **¿el scheduler lo invoca?** — NO se puede probar antes de las 14:00
--       UTC. Se declara, no se supone. Evidencia indirecta medida abajo.
--   (b) **¿cuándo lo invoquen, hace el trabajo?** — ESTO es lo que corre acá,
--       ejecutando el MISMO comando que tiene agendado el job 48
--       (`SELECT public.barrer_adopcion_diario();`), sobre un caso sembrado
--       con fecha vieja.
--
-- *Un job agendado que nadie ejerció es «construido y no ejercido»: se lee
--  como hecho.* Este arnés convierte la mitad (b) en medición.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TEMP TABLE arnes_cron (orden serial, paso text, veredicto text) ON COMMIT DROP;

DO $$
DECLARE
  v_masc uuid; v_cuenta uuid; v_refugio uuid; v_solic uuid; v_otro uuid;
  v_pub uuid; v_vieja uuid; v_ayer uuid; v_r jsonb; v_n int; v_cmd text;
BEGIN
  /* SIN publicación previa: desde la siembra de A6 hay publicaciones reales y
     `uq_publicacion_viva_por_mascota` rebota la segunda. */
  SELECT m.id INTO v_masc FROM public.mascotas m
   WHERE m.familia_id IS NOT NULL AND m.estado_vida IS NOT DISTINCT FROM 'activa'
     AND NOT EXISTS (SELECT 1 FROM public.adopcion_publicacion p WHERE p.mascota_id = m.id)
   LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_refugio
    FROM public.cuentas_comerciales c WHERE c.owner_profile_id IS NOT NULL LIMIT 1;
  SELECT u.id INTO v_solic FROM auth.users u WHERE u.id <> v_refugio LIMIT 1;
  /* 📌 El control negativo necesita OTRO postulante: existe `uq_solicitud_viva`
     sobre (publicacion_id, solicitante_user_id) — el índice de N1 ya está
     puesto, así que la misma persona no puede tener dos solicitudes vivas
     sobre el mismo animal. Lo encontró este arnés al chocarlo. */
  SELECT u.id INTO v_otro FROM auth.users u WHERE u.id NOT IN (v_refugio, v_solic) LIMIT 1;
  IF v_masc IS NULL OR v_cuenta IS NULL OR v_solic IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'ARNES ABORTA: faltan fixtures';
  END IF;

  -- ① EL COMANDO AGENDADO ES EL QUE ESTAMOS PROBANDO, no uno parecido.
  SELECT command INTO v_cmd FROM cron.job WHERE jobname = 'barrer-adopcion-diario';
  IF v_cmd IS DISTINCT FROM 'SELECT public.barrer_adopcion_diario();' THEN
    RAISE EXCEPTION 'ROJO-1: el job agendado corre "%s", no lo que este arnes prueba', v_cmd;
  END IF;
  INSERT INTO arnes_cron(paso, veredicto)
  VALUES ('VERDE 1', 'el comando agendado es exactamente el que se ejerce aca: ' || v_cmd);

  INSERT INTO public.adopcion_publicacion (mascota_id, cuenta_comercial_id, estado, country_code, ingresado_en)
  VALUES (v_masc, v_cuenta, 'publicada', 'EC', current_date - 60) RETURNING id INTO v_pub;

  -- Caso con FECHA VIEJA: 7 días en silencio, sin respuesta del refugio.
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, creada_en, country_code)
  VALUES (v_pub, v_solic, 'recibida', now() - interval '7 days', 'EC') RETURNING id INTO v_vieja;
  -- CONTROL NEGATIVO: de ayer, todavía dentro de los 5 días.
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, creada_en, country_code)
  VALUES (v_pub, v_otro,  'recibida', now() - interval '1 day', 'EC') RETURNING id INTO v_ayer;

  -- ② EL TRABAJO OCURRE: la vieja se avisa, la de ayer no.
  v_r := public.barrer_adopcion_diario();
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_vieja::text;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ROJO-2: la solicitud de 7 dias no genero aviso (n=%). Resultado: %', v_n, v_r;
  END IF;
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_ayer::text;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ROJO-2b (control negativo): la de AYER genero aviso y no debia';
  END IF;
  INSERT INTO arnes_cron(paso, veredicto)
  VALUES ('VERDE 2', 'caso viejo (7 dias) AVISADO · control negativo (1 dia) intacto');

  -- ③ EL SELLO: la segunda corrida del día siguiente no vuelve a avisar.
  SELECT count(*) INTO v_n FROM public.adopcion_solicitud
   WHERE id = v_vieja AND aviso_silencio_emitido_en IS NOT NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-3: el barrido aviso pero NO sello la fila'; END IF;
  v_r := public.barrer_adopcion_diario();
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_vieja::text;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-3b: la segunda corrida duplico el aviso (n=%)', v_n; END IF;
  INSERT INTO arnes_cron(paso, veredicto)
  VALUES ('VERDE 3', 'sella y no repite: dos corridas, UNA sola intencion');

  -- ④ EL AVISO SALE NACIDO (no descartado) Y CON LA VOZ FIRMADA.
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sin_respuesta:' || v_vieja::text
     AND estado = 'nacida'
     AND datos->>'titulo' = 'El refugio todavía no respondió tu solicitud';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ROJO-4: el aviso no nacio con la voz firmada por el founder';
  END IF;
  INSERT INTO arnes_cron(paso, veredicto)
  VALUES ('VERDE 4', 'nace con la voz firmada: "El refugio todavia no respondio tu solicitud" (jamas "incumplio")');

  INSERT INTO arnes_cron(paso, veredicto) VALUES ('TOTAL', 'VERDE 4/4 · mitad (b) probada');
END $$;

SELECT paso, veredicto FROM arnes_cron ORDER BY orden;

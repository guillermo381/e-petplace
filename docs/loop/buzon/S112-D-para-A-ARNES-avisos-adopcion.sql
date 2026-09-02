-- ═══════════════════════════════════════════════════════════════════════════
-- ARNÉS de LOS CINCO AVISOS DEL VERTICAL (S112-D · N3)
--
-- Corre DENTRO de una transacción que se deshace. **Residuo 0.**
-- Siembra sus fixtures porque hoy la base tiene CERO publicaciones y CERO
-- solicitudes de adopción (medido, 2-sep) — reusa usuarios y mascotas que YA
-- existen y no crea cuentas de auth.
--
-- 🔴 CADA BRAZO EXIGE UN NÚMERO EXACTO O UN CÓDIGO DE ERROR ESPECÍFICO, jamás
--    «rebotó»: una función que siempre dijera que no también rebota (`L-437`).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TEMP TABLE arnes_resultado (
  orden serial, paso text, veredicto text
) ON COMMIT DROP;

DO $$
DECLARE
  v_masc        uuid; v_fam_user uuid; v_cuenta uuid; v_refugio uuid;
  v_solic       uuid; v_tercero  uuid; v_pub    uuid; v_sol     uuid;
  v_r           jsonb; v_n int; v_estado text; v_motivo text; v_ruta text;
  v_i1          uuid;  v_i2 uuid; v_titulo text;
BEGIN
  -- ── FIXTURES ────────────────────────────────────────────────────────────
  SELECT m.id INTO v_masc FROM public.mascotas m
   WHERE m.familia_id IS NOT NULL AND m.estado_vida IS NOT DISTINCT FROM 'activa' LIMIT 1;
  SELECT fm.user_id INTO v_fam_user FROM public.mascotas m
    JOIN public.familia_miembro fm ON fm.familia_id = m.familia_id
   WHERE m.id = v_masc AND fm.hasta IS NULL AND fm.rol IN ('adulto_titular','adulto_autorizado') LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_refugio
    FROM public.cuentas_comerciales c WHERE c.owner_profile_id IS NOT NULL LIMIT 1;
  SELECT u.id INTO v_solic FROM auth.users u
   WHERE u.id NOT IN (v_refugio, v_fam_user) LIMIT 1;
  SELECT u.id INTO v_tercero FROM auth.users u
   WHERE u.id NOT IN (v_refugio, v_fam_user, v_solic) LIMIT 1;

  IF v_masc IS NULL OR v_fam_user IS NULL OR v_cuenta IS NULL
     OR v_solic IS NULL OR v_tercero IS NULL THEN
    RAISE EXCEPTION 'ARNES ABORTA: faltan fixtures (masc=% fam=% cuenta=% solic=% terc=%)',
      v_masc, v_fam_user, v_cuenta, v_solic, v_tercero;
  END IF;

  INSERT INTO public.adopcion_publicacion (mascota_id, cuenta_comercial_id, estado, country_code, ingresado_en)
  VALUES (v_masc, v_cuenta, 'publicada', 'EC', current_date - 30) RETURNING id INTO v_pub;
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, country_code)
  VALUES (v_pub, v_solic, 'recibida', 'EC') RETURNING id INTO v_sol;

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ① · EL HALLAZGO QUE JUSTIFICA TODA LA CABECERA:
  --          CON mascota el aviso se DESCARTA; SIN mascota NACE.
  --   Es el brazo más importante del arnés: si diera igual, la decisión de
  --   pasar `NULL` sería una preferencia y no una medición.
  -- ════════════════════════════════════════════════════════════════════════
  SELECT public.registrar_intencion_notificacion(
    'adopcion_solicitud_respondida', v_solic, v_masc, NULL,
    '{"titulo":"x","mensaje":"x"}'::jsonb, 'arnes:con_mascota:' || v_sol::text) INTO v_i1;
  SELECT i.estado, i.motivo INTO v_estado, v_motivo
    FROM public.notificacion_intencion i WHERE i.id = v_i1;
  IF v_estado <> 'descartada' OR v_motivo <> 'descartada_sin_acceso' THEN
    RAISE EXCEPTION 'ROJO-1: CON mascota se esperaba descartada/descartada_sin_acceso, dio %/%',
      v_estado, v_motivo;
  END IF;

  SELECT public.registrar_intencion_notificacion(
    'adopcion_solicitud_respondida', v_solic, NULL, NULL,
    '{"titulo":"x","mensaje":"x"}'::jsonb, 'arnes:sin_mascota:' || v_sol::text) INTO v_i2;
  SELECT i.estado INTO v_estado FROM public.notificacion_intencion i WHERE i.id = v_i2;
  IF v_estado <> 'nacida' THEN
    RAISE EXCEPTION 'ROJO-1b (control positivo): SIN mascota se esperaba nacida, dio %', v_estado;
  END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 1', 'el par discrimina: con mascota=descartada_sin_acceso · sin mascota=nacida');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ② · UN AVISO NO SALE PARA UN ANIMAL EN MEMORIAL
  --   Con su CONTROL POSITIVO: el mismo animal, vivo, SÍ emite.
  -- ════════════════════════════════════════════════════════════════════════
  v_r := public._avisar_adopcion_solicitud_nueva(v_sol);         -- animal vivo
  IF (v_r->>'emitido')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ROJO-2a (control positivo): con animal vivo no emitio: %', v_r;
  END IF;

  UPDATE public.mascotas SET estado_vida = 'fallecida' WHERE id = v_masc;
  v_r := public._avisar_adopcion_solicitud_respondida(v_sol);    -- mismo animal, memorial
  IF (v_r->>'motivo') IS DISTINCT FROM 'memorial' THEN
    RAISE EXCEPTION 'ROJO-2b: en memorial se esperaba motivo=memorial, dio %', v_r;
  END IF;
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sol_resp:' || v_sol::text;
  IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-2c: el memorial dejo pasar % intenciones', v_n; END IF;
  UPDATE public.mascotas SET estado_vida = 'activa' WHERE id = v_masc;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 2', 'memorial: vivo emite · fallecida no emite y no deja fila');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ③ · NO SALE DOS VECES (clave_dedup)
  -- ════════════════════════════════════════════════════════════════════════
  v_r := public._avisar_adopcion_solicitud_nueva(v_sol);   -- segunda corrida
  IF (v_r->>'emitido')::boolean IS NOT FALSE OR (v_r->>'motivo') <> 'ya_existia_dedup' THEN
    RAISE EXCEPTION 'ROJO-3: la segunda corrida no fue frenada por dedup: %', v_r;
  END IF;
  SELECT count(*) INTO v_n FROM public.notificacion_intencion
   WHERE clave_dedup = 'adopcion_sol_nueva:' || v_sol::text;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-3b: se esperaba 1 intencion, hay %', v_n; END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 3', 'dedup: dos corridas, UNA sola fila');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ④ · NO SALE AL TERCERO
  --   El emisor DERIVA el destinatario: nadie se lo puede pasar. Se mide que
  --   el tercero no recibió nada de esta solicitud, con el control positivo
  --   de que el refugio SÍ recibió.
  -- ════════════════════════════════════════════════════════════════════════
  SELECT count(*) INTO v_n FROM public.notificacion_intencion i
   WHERE i.destinatario_user_id = v_tercero
     AND i.datos->>'solicitud_id' = v_sol::text;
  IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-4: al TERCERO le llegaron % avisos', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.notificacion_intencion i
   WHERE i.destinatario_user_id = v_refugio
     AND i.datos->>'solicitud_id' = v_sol::text;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-4b (control positivo): al refugio le llegaron %, se esperaba 1', v_n; END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 4', 'tercero=0 · refugio=1');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ⑤ · EL CIERRE NO SE PUEDE AVISAR ANTES DE QUE HAYA DESENLACE
  -- ════════════════════════════════════════════════════════════════════════
  BEGIN
    v_r := public._avisar_adopcion_cierre(v_sol);   -- estado = 'recibida'
    RAISE EXCEPTION 'ROJO-5: aviso de cierre sobre solicitud ABIERTA no rebotó: %', v_r;
  EXCEPTION WHEN sqlstate '22023' THEN
    IF sqlerrm NOT LIKE '%cierre_sin_desenlace%' THEN RAISE; END IF;
  END;

  UPDATE public.adopcion_solicitud SET estado = 'declinada', cerrada_en = now() WHERE id = v_sol;
  v_r := public._avisar_adopcion_cierre(v_sol);
  IF (v_r->>'tipo') <> 'adopcion_solicitud_declinada' THEN
    RAISE EXCEPTION 'ROJO-5b: se esperaba declinada, dio %', v_r;
  END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 5', 'cierre: abierta rebota · declinada emite su tipo');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ⑥ · «UNA VIDA NUEVA» NO SE PUEDE AVISAR ANTES DEL TRASPASO
  --   Y su control positivo con un adoptante que SÍ es familia de la mascota.
  -- ════════════════════════════════════════════════════════════════════════
  BEGIN
    v_r := public._avisar_adopcion_vida_nueva(v_sol);   -- v_solic no es familia
    RAISE EXCEPTION 'ROJO-6: vida_nueva sin traspaso no rebotó: %', v_r;
  EXCEPTION WHEN sqlstate '22023' THEN
    IF sqlerrm NOT LIKE '%vida_nueva_sin_traspaso%' THEN RAISE; END IF;
  END;

  -- «como si» el traspaso hubiera ocurrido: el adoptante pasa a ser quien ya
  -- es familia de esa mascota. No se falsea el traspaso: se usa un usuario que
  -- de verdad tiene el vínculo que el traspaso crearía.
  UPDATE public.adopcion_solicitud SET solicitante_user_id = v_fam_user WHERE id = v_sol;
  v_r := public._avisar_adopcion_vida_nueva(v_sol);
  IF (v_r->>'emitido')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ROJO-6b (control positivo): con la familia ya hecha no emitio: %', v_r;
  END IF;
  SELECT i.estado, i.datos->>'ruta' INTO v_estado, v_ruta
    FROM public.notificacion_intencion i WHERE i.id = (v_r->>'intencion_id')::uuid;
  IF v_estado <> 'nacida' THEN
    RAISE EXCEPTION 'ROJO-6c: vida_nueva CON mascota deberia nacer, dio %', v_estado;
  END IF;
  IF v_ruta <> '/hogar/mascota/' || v_masc::text THEN
    RAISE EXCEPTION 'ROJO-6d: la ruta de vida_nueva es %, se esperaba /hogar/mascota/%', v_ruta, v_masc;
  END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 6', 'vida_nueva: sin traspaso rebota · con familia nace CON mascota y con su ruta');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ⑦ · EL GATE 1 SIGUE PROTEGIENDO AL ÚNICO AVISO QUE LLEVA MASCOTA
  --   Éste es el brazo que prueba que delegar el memorial al motor FUNCIONA
  --   para `vida_nueva` (los otros cinco lo hacen en el emisor, brazo ②).
  -- ════════════════════════════════════════════════════════════════════════
  UPDATE public.mascotas SET estado_vida = 'fallecida' WHERE id = v_masc;
  SELECT public.registrar_intencion_notificacion(
    'adopcion_vida_nueva', v_fam_user, v_masc, NULL,
    '{"titulo":"x","mensaje":"x"}'::jsonb, 'arnes:gate1:' || v_sol::text) INTO v_i1;
  SELECT i.estado, i.motivo INTO v_estado, v_motivo
    FROM public.notificacion_intencion i WHERE i.id = v_i1;
  IF v_estado <> 'descartada' OR v_motivo <> 'descartada_memorial' THEN
    RAISE EXCEPTION 'ROJO-7: el GATE 1 no apago vida_nueva en memorial: %/%', v_estado, v_motivo;
  END IF;
  UPDATE public.mascotas SET estado_vida = 'activa' WHERE id = v_masc;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 7', 'GATE 1 apaga vida_nueva en memorial (descartada_memorial)');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ⑧ · EL ACTA EMITE DOS, CON CLAVES DISTINTAS
  --   Con su control negativo: si las claves fueran iguales, el segundo
  --   `ON CONFLICT DO NOTHING` habría descartado a una de las dos partes.
  -- ════════════════════════════════════════════════════════════════════════
  UPDATE public.adopcion_solicitud SET estado = 'aceptada', cerrada_en = now() WHERE id = v_sol;
  v_r := public._avisar_adopcion_acta_lista(v_sol);
  IF (v_r->>'emitidos')::int <> 2 THEN
    RAISE EXCEPTION 'ROJO-8: el acta emitio % avisos, se esperaban 2 (una parte se perdio): %',
      (v_r->>'emitidos')::int, v_r;
  END IF;
  SELECT count(DISTINCT i.clave_dedup) INTO v_n FROM public.notificacion_intencion i
   WHERE i.tipo = 'adopcion_acta_lista' AND i.datos->>'solicitud_id' = v_sol::text;
  IF v_n <> 2 THEN RAISE EXCEPTION 'ROJO-8b: hay % claves distintas, se esperaban 2', v_n; END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 8', 'acta: 2 intenciones con 2 claves');

  -- ════════════════════════════════════════════════════════════════════════
  -- ROJO ⑨ · UNA SOLICITUD ANONIMIZADA NO AVISA Y NO ROMPE
  -- ════════════════════════════════════════════════════════════════════════
  UPDATE public.adopcion_solicitud
     SET solicitante_user_id = NULL, anonimizada_en = now() WHERE id = v_sol;
  v_r := public._avisar_adopcion_solicitud_respondida(v_sol);
  IF (v_r->>'motivo') <> 'solicitud_anonimizada' THEN
    RAISE EXCEPTION 'ROJO-9: sobre anonimizada se esperaba solicitud_anonimizada, dio %', v_r;
  END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 9', 'anonimizada: no avisa, no rompe');

  -- ════════════════════════════════════════════════════════════════════════
  -- ⑩ · LA VOZ HABLA DE VERDAD (no `{}`) y NOMBRA AL ANIMAL
  -- ════════════════════════════════════════════════════════════════════════
  SELECT public._voz_adopcion('adopcion_vida_nueva', v_fam_user, 'Luna')->>'titulo' INTO v_titulo;
  IF v_titulo IS NULL OR v_titulo = '' THEN RAISE EXCEPTION 'ROJO-10: la voz salio vacia'; END IF;
  IF public._voz_adopcion('adopcion_solicitud_nueva', v_fam_user, 'Luna')->>'mensaje' NOT LIKE '%Luna%' THEN
    RAISE EXCEPTION 'ROJO-10b: la voz no nombra al animal';
  END IF;
  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('VERDE 10', 'voz: nombra al animal · titulo = ' || v_titulo);

  INSERT INTO arnes_resultado(paso, veredicto) VALUES ('TOTAL', 'VERDE 10/10');
END $$;

-- 🔴 EL VEREDICTO SE IMPRIME. Un arnés que corre en silencio no probó nada:
--    «sin error» y «los diez brazos corrieron» son dos afirmaciones distintas
--    (`L-321`). Lo que se lee abajo es lo que de verdad pasó.
SELECT paso, veredicto FROM arnes_resultado ORDER BY orden;

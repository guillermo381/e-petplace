DO $$
DECLARE v_caso uuid; v_antes int; v_despues int; v_dest uuid; v_fam uuid;
BEGIN
  -- un caso real en con_prestador (82ff) — su familia y prestador
  SELECT id, familia_user_id INTO v_caso, v_fam
    FROM casos_postventa WHERE id::text like '82ff1424%';
  IF v_caso IS NULL THEN RAISE EXCEPTION 'no hay caso de prueba'; END IF;

  SELECT count(*) INTO v_antes FROM notificacion_intencion WHERE tipo='caso_familia_escribio';
  -- la familia escribe un mensaje real (tipo='mensaje')
  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (v_caso, 'familia', v_fam, 'mensaje', 'CINTURON: prueba de aviso');
  SELECT count(*) INTO v_despues FROM notificacion_intencion WHERE tipo='caso_familia_escribio';

  RAISE NOTICE 'aviso caso_familia_escribio: antes=% despues=%', v_antes, v_despues;
  IF v_despues <= v_antes THEN
    RAISE EXCEPTION 'CINTURON ROJO: el mensaje de familia NO produjo aviso al prestador'; END IF;

  -- rojo del brazo: un mensaje 'hecho' (sistema) NO debe avisar
  SELECT count(*) INTO v_antes FROM notificacion_intencion WHERE tipo IN ('caso_familia_escribio','caso_prestador_respondio');
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (v_caso, 'casa', 'hecho', 'CINTURON: evento de sistema, no chat');
  SELECT count(*) INTO v_despues FROM notificacion_intencion WHERE tipo IN ('caso_familia_escribio','caso_prestador_respondio');
  IF v_despues <> v_antes THEN RAISE EXCEPTION 'CINTURON ROJO: un evento hecho produjo aviso (no debe)'; END IF;

  RAISE NOTICE 'CINTURON VERDE (2): mensaje avisa, hecho no avisa';
  RAISE EXCEPTION 'ROLLBACK_CINTURON_OK: verificado, deshaciendo';
END $$;

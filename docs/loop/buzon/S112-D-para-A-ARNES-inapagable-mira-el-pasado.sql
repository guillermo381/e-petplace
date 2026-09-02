-- ═══════════════════════════════════════════════════════════════════════════
-- ARNÉS · el inapagable mira también el pasado (S112-D). BEGIN/ROLLBACK.
--
-- 🔴 SUS DOS PRIMEROS BRAZOS SON EL ROJO SIN LA CURA: reproducen el agujero
--    para que el verde de después signifique algo. Sin ellos, «el trigger
--    existe» sería todo lo que este arnés probaría.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TEMP TABLE r (orden serial, paso text, veredicto text) ON COMMIT DROP;

DO $$
DECLARE v_u uuid; v_n int; v_paso text;
BEGIN
  SELECT id INTO v_u FROM auth.users LIMIT 1;
  IF v_u IS NULL THEN RAISE EXCEPTION 'ARNES ABORTA: no hay usuarios'; END IF;

  -- ① CONTROL POSITIVO DEL CHECK DE A: hoy frena apagar lo inapagable.
  BEGIN
    INSERT INTO public.user_notificacion_prefs(user_id, categoria, canal, habilitada)
    VALUES (v_u, 'seguridad_cuenta', 'push', false);
    RAISE EXCEPTION 'ROJO-1: el CHECK dejo apagar seguridad_cuenta';
  EXCEPTION WHEN check_violation THEN
    INSERT INTO r(paso,veredicto) VALUES ('VERDE 1','el CHECK de A frena apagar una categoria inapagable');
  END;

  -- ② EL AGUJERO, REPRODUCIDO: una fila legitima primero...
  INSERT INTO public.user_notificacion_prefs(user_id, categoria, canal, habilitada)
  VALUES (v_u, 'operacion', 'push', false)
  ON CONFLICT (user_id, categoria, canal) DO UPDATE SET habilitada = false;

  -- ③ ...y la categoria pasa a inapagable. CON el trigger, esto TIENE que rebotar.
  BEGIN
    UPDATE public.cat_notificacion_categorias
       SET apagable_existencia = false WHERE codigo = 'operacion';
    RAISE EXCEPTION 'ROJO-3: el catalogo paso a inapagable con filas apagadas debajo (el agujero sigue vivo)';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF sqlerrm NOT LIKE '%inapagable_con_pasado_apagado%' THEN RAISE; END IF;
    GET STACKED DIAGNOSTICS v_paso = PG_EXCEPTION_DETAIL;
    /* 🔴 El mensaje tiene que NOMBRAR la categoria y CUANTAS filas: «hay un
       problema» manda a buscar; un nombre y un numero se resuelven mirando. */
    /* El conteo esperado se DERIVA, no se escribe: la base tiene filas reales
       de gente que apagó `operacion` además de la del fixture. *Un assert que
       hardcodea un número mide mi supuesto sobre la base, no el trigger.* */
    SELECT count(*) INTO v_n FROM public.user_notificacion_prefs
     WHERE categoria = 'operacion' AND habilitada = false;
    IF v_paso NOT LIKE '%operacion%' OR v_paso NOT LIKE '%' || v_n || ' persona%' THEN
      RAISE EXCEPTION 'ROJO-3b: el rebote no nombra la categoria y el conteo real (%). Detalle: %', v_n, v_paso;
    END IF;
    INSERT INTO r(paso,veredicto) VALUES ('ROJO 3','pasar a inapagable con filas apagadas debajo REBOTA nombrando categoria y conteo real');
  END;

  -- ④ EL CAMINO QUE EL HINT INDICA: se borra explicito y ENTONCES pasa.
  DELETE FROM public.user_notificacion_prefs WHERE categoria='operacion' AND habilitada = false;
  UPDATE public.cat_notificacion_categorias SET apagable_existencia = false WHERE codigo='operacion';
  SELECT count(*) INTO v_n FROM public.cat_notificacion_categorias
   WHERE codigo='operacion' AND apagable_existencia = false;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-4: tras limpiar, el UPDATE siguio sin pasar'; END IF;
  INSERT INTO r(paso,veredicto) VALUES ('VERDE 4','con el camino del HINT recorrido, el UPDATE pasa');

  -- ⑤ CONTROL NEGATIVO: el trigger NO estorba el camino inverso ni otros UPDATE.
  UPDATE public.cat_notificacion_categorias SET apagable_existencia = true WHERE codigo='operacion';
  UPDATE public.cat_notificacion_categorias SET techo_max = techo_max WHERE codigo='relacional';
  INSERT INTO r(paso,veredicto) VALUES ('VERDE 5','el trigger no estorba: volver a apagable y otros UPDATE pasan');

  -- ⑥ Y el invariante que el par CHECK+trigger sostiene, medido de punta a punta.
  SELECT count(*) INTO v_n
    FROM public.user_notificacion_prefs p
    JOIN public.cat_notificacion_categorias c ON c.codigo = p.categoria
   WHERE p.habilitada = false AND c.apagable_existencia = false;
  IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-6: quedaron % filas violando el invariante', v_n; END IF;
  INSERT INTO r(paso,veredicto) VALUES ('VERDE 6','invariante en 0: ninguna persona apagada sobre una categoria inapagable');

  INSERT INTO r(paso,veredicto) VALUES ('TOTAL','VERDE 6/6 · 1 rojo producido');
END $$;

SELECT paso, veredicto FROM r ORDER BY orden;

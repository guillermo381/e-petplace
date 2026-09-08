-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A4 enchufado a la puerta del caso: `saldo` deja de rebotar
--
-- En A3, `caso_elegir_destino('saldo')` devolvía `saldo_todavia_no_existe`
-- porque el motor de saldo no estaba (lo dije en la nota a C). Con A4 vivo,
-- ahora acredita de verdad, y el caso registra el camino.
--
-- §6/§7: el saldo es plata que ya era de la familia. El destino `saldo` la
-- ACREDITA (idempotente por el id del caso) y marca el caso `aplicado` —a
-- diferencia del banco, que es `en_camino_manual` porque lo hace una persona.
--
-- VEDA 76(g): NO RIGE. REVERSA escrita ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.caso_elegir_destino(p_caso_id uuid, p_destino text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_yo uuid := auth.uid(); v_c record; v_fam uuid; v_ac jsonb; v_estado text;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  IF p_destino NOT IN ('banco','saldo') THEN
    RETURN jsonb_build_object('ok',false,'codigo','destino_invalido');
  END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;
  IF v_c.familia_user_id <> v_yo THEN RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo'); END IF;
  IF v_c.destino IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','ya_elegido','destino',v_c.destino);
  END IF;
  IF v_c.resuelto_en IS NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_sin_resolver');
  END IF;
  IF COALESCE(v_c.monto_devuelto,0) <= 0 THEN
    RETURN jsonb_build_object('ok',false,'codigo','sin_monto_a_devolver');
  END IF;

  IF p_destino = 'saldo' THEN
    -- 🔴 A4 VIVO: se acredita de verdad, del HOGAR de quien reclama.
    v_fam := _familia_del_user(v_yo);
    IF v_fam IS NULL THEN
      RETURN jsonb_build_object('ok',false,'codigo','sin_familia');
    END IF;
    -- idempotente por el id del caso: elegir saldo dos veces no acredita dos.
    v_ac := acreditar_saldo_hogar(v_fam, v_c.monto_devuelto, 'caso',
              'caso-saldo:' || p_caso_id::text, p_caso_id);
    IF (v_ac->>'ok')::boolean IS NOT TRUE THEN
      RETURN jsonb_build_object('ok',false,'codigo','acreditacion_fallo','detalle',v_ac);
    END IF;
    v_estado := 'aplicado';   -- el saldo es instantáneo
    UPDATE casos_postventa SET destino='saldo', destino_estado=v_estado, actualizado_en=now()
     WHERE id = p_caso_id;
    INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
    VALUES (p_caso_id, 'casa', 'hecho', 'Elegiste saldo. Ya está disponible en tu cuenta.');
    RETURN jsonb_build_object('ok',true,'estado',v_estado,
      'saldo_nuevo', saldo_hogar_disponible(v_fam));
  END IF;

  -- Banco: acto humano, fuera de la ventana del riel. La superficie NO promete fecha.
  v_estado := 'en_camino_manual';
  UPDATE casos_postventa SET destino='banco', destino_estado=v_estado, actualizado_en=now()
   WHERE id = p_caso_id;
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (p_caso_id, 'casa', 'hecho', 'Elegiste que vuelva a tu banco. La devolución está en camino.');
  RETURN jsonb_build_object('ok', true, 'estado', v_estado);
END $fn$;

REVOKE ALL ON FUNCTION public.caso_elegir_destino(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_elegir_destino(uuid, text) TO authenticated;

-- leer_opciones_devolucion: `saldo` ya está disponible
CREATE OR REPLACE FUNCTION public.leer_opciones_devolucion(p_caso_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record;
BEGIN
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND OR v_c.familia_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');
  END IF;
  RETURN jsonb_build_object('ok', true,
    'monto', COALESCE(v_c.monto_devuelto,0),
    'parcial', (v_c.resolucion_alcance = 'parcial'),
    'banco', jsonb_build_object('disponible', true, 'manual', true),
    -- 🔴 A4 vivo: el saldo ya está disponible.
    'saldo', jsonb_build_object('disponible', true));
END $fn$;
REVOKE ALL ON FUNCTION public.leer_opciones_devolucion(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.leer_opciones_devolucion(uuid) TO authenticated;

DO $c$
BEGIN
  IF has_function_privilege('anon','public.caso_elegir_destino(uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede elegir destino';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · saldo enchufado a la puerta del caso · anon sin EXECUTE';
END $c$;

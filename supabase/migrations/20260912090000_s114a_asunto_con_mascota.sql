-- S114-A · EL ASUNTO DEL AVISO INCLUYE LA MASCOTA (firma founder).
--
-- Hoy el asunto era el tipo de servicio PELADO ⇒ «Tu caso sobre paseo». Que diga
-- lo que la familia reconoce: el servicio con su mascota — «paseo de Thor». Es la
-- misma clase que ya se cobró tres veces en este arco: un identificador del motor
-- llegando a un texto que lee una persona.
--
-- ⚠️ REUSO Y SUS LÍMITES, declarado: CasoEnBandeja compone «Paseo de Thor · martes 9»
-- en la app (voz RN), alimentada por servicio+mascota+fecha que da el motor. Esa
-- voz es TS/RN y NO se puede invocar desde SQL/Deno (el aviso va SQL→transporte→
-- Meta). Así que este helper reusa los MISMOS DATOS del motor y la MISMA FORMA
-- (servicio + mascota), SIN la fecha (la plantilla ya lleva persona y monto; un
-- asunto largo la hace ilegible — fallback firmado del founder). Lo que NO puede
-- reusar es el mapeo código→label bonito de la voz RN (p.ej. telemedicina→
-- Videoconsulta): eso queda como residuo declarado (ver reporte).
--
-- 76(g) NO RIGE. Reversa ANTES.

CREATE OR REPLACE FUNCTION public._asunto_del_caso(p_tipo text, p_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_o record; v_masc text;
BEGIN
  IF p_tipo = 'pedido' THEN RETURN 'tu pedido'; END IF;   -- despensa: sin mascota
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_tipo, p_id);
  SELECT nombre INTO v_masc FROM mascotas WHERE id = v_o.mascota_id;
  IF v_masc IS NULL THEN RETURN COALESCE(v_o.titulo, 'tu caso'); END IF;
  RETURN CASE
    WHEN p_tipo = 'estadia' THEN 'la guardería de ' || v_masc
    ELSE COALESCE(v_o.titulo, 'servicio') || ' de ' || v_masc   -- «paseo de Thor»
  END;
END $fn$;
REVOKE ALL ON FUNCTION public._asunto_del_caso(text, uuid) FROM anon, PUBLIC;

-- ── caso_resolver (asunto del aviso = servicio + mascota) ────────────────────
CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_yo uuid := auth.uid(); v_c record; v_evento uuid; v_camino text;
  v_inverso uuid; v_mov jsonb; v_actor text; v_total numeric; v_disp numeric;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;

  IF is_admin() THEN v_actor := 'casa';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_actor := 'prestador';
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_podes_resolver');
  END IF;

  IF p_alcance NOT IN ('total','parcial','sin_devolucion') THEN
    RETURN jsonb_build_object('ok',false,'codigo','alcance_invalido');
  END IF;
  IF p_alcance = 'parcial' AND (p_monto IS NULL OR p_monto <= 0) THEN
    RETURN jsonb_build_object('ok',false,'codigo','monto_requerido_en_parcial');
  END IF;
  -- 🔴 la razón es obligatoria en parcial Y en sin_devolucion (firma founder):
  -- un cero sin porqué se parece a que nadie miró el caso. El total conserva default.
  IF p_alcance IN ('parcial','sin_devolucion') AND (p_motivo IS NULL OR btrim(p_motivo) = '') THEN
    RETURN jsonb_build_object('ok',false,'codigo','razon_requerida');
  END IF;

  IF v_actor = 'casa' AND v_c.etapa <> 'con_casa' THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_no_tomado');
  END IF;
  IF v_actor = 'prestador' AND v_c.etapa <> 'con_prestador' THEN
    RETURN jsonb_build_object('ok',false,'codigo','etapa_incorrecta');
  END IF;

  IF p_alcance = 'parcial' THEN
    v_total := _caso_monto_objeto(v_c.objeto_tipo, v_c.objeto_id);
    IF v_total IS NOT NULL THEN
      v_disp := GREATEST(v_total - _caso_ya_devuelto(v_c.objeto_tipo, v_c.objeto_id, p_caso_id), 0);
      IF p_monto > v_disp THEN
        RETURN jsonb_build_object('ok',false,'codigo','monto_supera_total',
          'total', v_total, 'disponible', v_disp);
      END IF;
    END IF;
  END IF;

  v_evento := _caso_tiene_devengo(v_c.objeto_tipo, v_c.objeto_id);

  IF p_alcance = 'sin_devolucion' THEN
    v_camino := NULL;
  ELSIF v_evento IS NOT NULL THEN
    v_inverso := aplicar_reembolso(v_evento,
                   COALESCE(p_motivo, 'caso de postventa ' || p_caso_id::text),
                   v_yo,
                   CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE NULL END);
    v_camino := 'aplicar_reembolso';
  ELSE
    v_camino := 'declarado_sobre_pago';
  END IF;

  UPDATE casos_postventa
     SET resolucion_alcance = p_alcance,
         monto_devuelto = CASE WHEN p_alcance='sin_devolucion' THEN 0 ELSE p_monto END,
         camino = v_camino, evento_reembolso_id = v_inverso,
         decidido_por = v_yo, resuelto_en = now(), actualizado_en = now()
   WHERE id = p_caso_id;

  IF p_alcance <> 'sin_devolucion' AND v_c.objeto_tipo = 'pedido' THEN
    DECLARE
      v_ped record; v_cmp record; v_fam2 uuid; v_r numeric; v_saldo_parte numeric; v_ac jsonb;
    BEGIN
      SELECT p.total AS total, p.compra_id AS compra_id INTO v_ped
        FROM pedidos p WHERE p.id = v_c.objeto_id;
      IF v_ped.compra_id IS NOT NULL THEN
        SELECT c.total AS total, c.saldo_aplicado AS saldo_aplicado, c.user_id AS user_id
          INTO v_cmp FROM compras c WHERE c.id = v_ped.compra_id;
        IF COALESCE(v_cmp.saldo_aplicado,0) > 0 AND COALESCE(v_cmp.total,0) > 0 THEN
          v_r := CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE v_ped.total END;
          v_saldo_parte := ROUND(v_r * v_cmp.saldo_aplicado / v_cmp.total, 2);
          IF v_saldo_parte > 0 THEN
            v_fam2 := _familia_del_user(v_cmp.user_id);
            IF v_fam2 IS NOT NULL THEN
              v_ac := acreditar_saldo_hogar(v_fam2, v_saldo_parte, 'caso',
                        'caso:' || p_caso_id::text || ':saldo_devuelto', p_caso_id);
            END IF;
          END IF;
        END IF;
      END IF;
    END;
  END IF;

  -- la razón entra al hilo como mensaje del prestador/casa (sólo la real, no default).
  IF p_motivo IS NOT NULL AND btrim(p_motivo) <> '' AND p_motivo <> 'el prestador lo reconoció' THEN
    INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
    VALUES (p_caso_id, CASE WHEN v_actor='casa' THEN 'casa' ELSE 'prestador' END,
            v_yo, 'mensaje', btrim(p_motivo));
  END IF;

  -- 🔴 S114-A · AVISO «DEVOLUCIÓN POR ELEGIR» (firma founder). Sale cuando la
  -- resolución fija un monto y la familia aún no eligió destino; mapea a la
  -- plantilla caso_elegir_devolucion. El monto vive acá (recién escrito): parcial
  -- = p_monto; total = el valor del objeto. BEGIN/EXCEPTION: un aviso que falla
  -- no tumba la devolución. (El silencio de caso_prestador_respondio para esta
  -- misma transición vive en _trg_caso_mensaje_avisa.)
  IF p_alcance <> 'sin_devolucion' THEN
    BEGIN
      PERFORM registrar_intencion_notificacion(
        'caso_devolucion_por_elegir', v_c.familia_user_id, NULL, NULL,
        jsonb_build_object('caso_id', p_caso_id,
          'monto', COALESCE(p_monto, _caso_monto_objeto(v_c.objeto_tipo, v_c.objeto_id)),
          'asunto', _asunto_del_caso(v_c.objeto_tipo, v_c.objeto_id),
          'titulo', 'Tenes una devolucion para elegir'),
        'caso_devol_elegir:' || p_caso_id::text);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'aviso caso_devolucion_por_elegir no registrado: %', SQLERRM;
    END;
  END IF;

  v_mov := _caso_mover(p_caso_id,
             CASE WHEN v_actor='prestador' THEN 'resuelto_entre_partes' ELSE 'resuelto' END,
             v_actor, v_yo, p_motivo);
  IF (v_mov->>'ok')::boolean IS NOT TRUE THEN RETURN v_mov; END IF;

  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (p_caso_id, CASE WHEN v_actor='casa' THEN 'casa' ELSE 'prestador' END, v_yo, 'hecho',
          CASE WHEN p_alcance='sin_devolucion' THEN 'Se resolvió el caso.'
               ELSE 'Se resolvió: hay una devolución para ti.' END);

  RETURN jsonb_build_object('ok', true, 'camino', v_camino,
    'evento_reembolso_id', v_inverso, 'tenia_devengo', (v_evento IS NOT NULL),
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = p_caso_id));
END $function$
;
REVOKE ALL ON FUNCTION public.caso_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;

-- ── caso_elegir_destino (asunto en las dos ramas) ───────────────────────────
CREATE OR REPLACE FUNCTION public.caso_elegir_destino(p_caso_id uuid, p_destino text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    BEGIN
      PERFORM registrar_intencion_notificacion(
        'devolucion_estado', v_c.familia_user_id, NULL, NULL,
        jsonb_build_object('caso_id', p_caso_id, 'monto', v_c.monto_devuelto,
          'asunto', _asunto_del_caso(v_c.objeto_tipo, v_c.objeto_id),
          'estado', v_estado, 'titulo', 'Tu devolucion esta en camino'),
        'devol_estado:' || p_caso_id::text);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'aviso devolucion_estado no registrado: %', SQLERRM;
    END;
    RETURN jsonb_build_object('ok',true,'estado',v_estado,
      'saldo_nuevo', saldo_hogar_disponible(v_fam));
  END IF;

  -- Banco: acto humano, fuera de la ventana del riel. La superficie NO promete fecha.
  v_estado := 'en_camino_manual';
  UPDATE casos_postventa SET destino='banco', destino_estado=v_estado, actualizado_en=now()
   WHERE id = p_caso_id;
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (p_caso_id, 'casa', 'hecho', 'Elegiste que vuelva a tu banco. La devolución está en camino.');
    BEGIN
      PERFORM registrar_intencion_notificacion(
        'devolucion_estado', v_c.familia_user_id, NULL, NULL,
        jsonb_build_object('caso_id', p_caso_id, 'monto', v_c.monto_devuelto,
          'asunto', _asunto_del_caso(v_c.objeto_tipo, v_c.objeto_id),
          'estado', v_estado, 'titulo', 'Tu devolucion esta en camino'),
        'devol_estado:' || p_caso_id::text);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'aviso devolucion_estado no registrado: %', SQLERRM;
    END;
  RETURN jsonb_build_object('ok', true, 'estado', v_estado);
END $function$
;
REVOKE ALL ON FUNCTION public.caso_elegir_destino(uuid,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_elegir_destino(uuid,text) TO authenticated;

DO $cinturon$
DECLARE v_cr text; v_ced int; v_ej text;
BEGIN
  v_cr := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_cr NOT ILIKE '%_asunto_del_caso%' THEN RAISE EXCEPTION 'CINTURÓN: caso_resolver no usa _asunto_del_caso'; END IF;
  v_ced := (length(pg_get_functiondef('public.caso_elegir_destino(uuid,text)'::regprocedure))
            - length(replace(pg_get_functiondef('public.caso_elegir_destino(uuid,text)'::regprocedure),'_asunto_del_caso','')))
           / length('_asunto_del_caso');
  IF v_ced < 2 THEN RAISE EXCEPTION 'CINTURÓN: _asunto_del_caso no está en las 2 ramas de caso_elegir_destino (%)', v_ced; END IF;
  -- sobre un caso de cita real: el asunto lleva la mascota
  SELECT _asunto_del_caso('cita', objeto_id) INTO v_ej FROM casos_postventa WHERE objeto_tipo='cita' LIMIT 1;
  IF v_ej IS NULL OR v_ej NOT ILIKE '% de %' THEN
    RAISE EXCEPTION 'CINTURÓN: el asunto de una cita no compone «servicio de Mascota»: %', v_ej;
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · asunto = servicio+mascota en caso_resolver y las 2 ramas · ejemplo: %', v_ej;
END $cinturon$;

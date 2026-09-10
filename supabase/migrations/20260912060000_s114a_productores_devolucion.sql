-- S114-A · LOS DOS PRODUCTORES DE AVISO DE DEVOLUCIÓN (firma founder, dos momentos).
--
-- E midió que las dos plantillas de WhatsApp piden monto ({{3}}) y que ningún
-- tipo lo lleva, y que devolucion_estado no tenía productor. El founder firmó que
-- son DOS momentos distintos, no uno:
--  · caso_elegir_devolucion  «falta que elijas cómo recibir {{3}}»  → ANTES de elegir
--  · caso_resuelto           «te devolvemos {{3}}, ves cuándo llega» → DESPUÉS de elegir
--
-- FIRMAS:
--  ① devolucion_estado gana productor en caso_elegir_destino (dos ramas:
--     saldo→aplicado, banco→en_camino_manual), con {asunto, monto, estado}.
--     (mapea a caso_resuelto).
--  ② tipo NUEVO caso_devolucion_por_elegir, productor en caso_resolver cuando la
--     resolución deja monto (alcance total/parcial), con {asunto, monto}.
--     (mapea a caso_elegir_devolucion). El monto vive ahí: parcial=p_monto,
--     total=el valor del objeto.
--  ② EL CRUCE (firma founder): en una resolución CON MONTO, caso_prestador_respondio
--     SE SILENCIA y sale sólo caso_devolucion_por_elegir — son el mismo hecho y
--     sólo uno acciona. El silencio es ESPECÍFICO de esa transición (resuelta,
--     monto>0, destino sin elegir); cuando el prestador responde SIN resolver,
--     caso_prestador_respondio sale normal. La razón no se pierde: vive en el hilo.
--  ③ los dos productores con BEGIN/EXCEPTION: un aviso que falla no tumba la devolución.
--
-- El mapeo de plantillas NO se cablea acá: lo firma el founder con los nombres.
-- 76(g) NO RIGE (DB, sin backfill de negocio). Reversa ANTES.

-- ── el tipo nuevo ────────────────────────────────────────────────────────────
INSERT INTO cat_notificacion_tipos (codigo, categoria, audiencia, en_sombra, activo, descripcion)
VALUES ('caso_devolucion_por_elegir', 'operacion', 'cliente', false, true,
        'La resolución de un caso dejó un monto por devolver y la familia todavía no eligió cómo recibirlo.')
ON CONFLICT (codigo) DO NOTHING;

-- ── el trigger con el SILENCIO específico ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_caso_mensaje_avisa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_dest uuid; v_tipo text;
BEGIN
  IF NEW.tipo <> 'mensaje' THEN RETURN NEW; END IF;
  SELECT familia_user_id, prestador_id, etapa, resuelto_en, monto_devuelto, destino
    INTO v_c FROM casos_postventa WHERE id = NEW.caso_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.autor = 'familia' THEN
    IF v_c.prestador_id IS NULL THEN RETURN NEW; END IF;
    SELECT user_id INTO v_dest FROM prestadores WHERE id = v_c.prestador_id;
    v_tipo := 'caso_familia_escribio';
  ELSE  -- 'prestador' o 'casa' escriben ⇒ a la familia
    -- 🔴 S114-A · SILENCIO ESPECÍFICO (firma founder). Si este mensaje acompaña
    -- una RESOLUCIÓN CON MONTO POR ELEGIR (resuelta, monto>0, destino sin elegir),
    -- NO sale caso_prestador_respondio: en ese segundo sale sólo
    -- caso_devolucion_por_elegir (el único que pide algo). NO es regla general —
    -- cuando el prestador responde SIN resolver (resuelto_en NULL), este aviso
    -- sale normal. La razón vive en el hilo y la familia la lee al entrar.
    IF v_c.resuelto_en IS NOT NULL AND COALESCE(v_c.monto_devuelto,0) > 0
       AND v_c.destino IS NULL THEN
      RETURN NEW;
    END IF;
    v_dest := v_c.familia_user_id;
    v_tipo := 'caso_prestador_respondio';
  END IF;

  IF v_dest IS NULL OR v_dest = NEW.autor_user_id THEN RETURN NEW; END IF;

  BEGIN
    PERFORM registrar_intencion_notificacion(
      v_tipo, v_dest, NULL, NULL,
      jsonb_build_object('caso_id', NEW.caso_id, 'titulo', 'Mensaje nuevo en tu caso'),
      'caso_msg:' || NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aviso caso mensaje no registrado: %', SQLERRM;
  END;
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public._trg_caso_mensaje_avisa() FROM anon, PUBLIC;

-- ── caso_resolver (con el productor caso_devolucion_por_elegir inyectado) ─────
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
          'asunto', (SELECT titulo FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id)),
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

-- ── caso_elegir_destino (con el productor devolucion_estado en dos ramas) ────
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
          'asunto', (SELECT titulo FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id)),
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
          'asunto', (SELECT titulo FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id)),
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

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_cr text; v_ced text; v_trg text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cat_notificacion_tipos WHERE codigo='caso_devolucion_por_elegir' AND audiencia='cliente' AND activo) THEN
    RAISE EXCEPTION 'CINTURÓN: falta el tipo caso_devolucion_por_elegir';
  END IF;
  v_cr  := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  v_ced := pg_get_functiondef('public.caso_elegir_destino(uuid,text)'::regprocedure);
  v_trg := pg_get_functiondef('public._trg_caso_mensaje_avisa()'::regprocedure);
  IF v_cr NOT ILIKE '%caso_devolucion_por_elegir%' THEN RAISE EXCEPTION 'CINTURÓN: caso_resolver no emite el nuevo tipo'; END IF;
  IF (length(v_ced) - length(replace(v_ced, 'devolucion_estado', ''))) / length('devolucion_estado') < 2 THEN
    RAISE EXCEPTION 'CINTURÓN: devolucion_estado no está en las DOS ramas de caso_elegir_destino';
  END IF;
  IF v_trg NOT ILIKE '%resuelto_en IS NOT NULL AND COALESCE(v_c.monto_devuelto%' THEN
    RAISE EXCEPTION 'CINTURÓN: el silencio específico no está en el trigger';
  END IF;
  -- los dos con BEGIN/EXCEPTION
  IF v_cr NOT ILIKE '%aviso caso_devolucion_por_elegir no registrado%'
     OR v_ced NOT ILIKE '%aviso devolucion_estado no registrado%' THEN
    RAISE EXCEPTION 'CINTURÓN: falta el BEGIN/EXCEPTION en algún productor';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · tipo nuevo · productor en caso_resolver · devolucion_estado en 2 ramas · silencio específico · BEGIN/EXCEPTION en los dos';
END $cinturon$;

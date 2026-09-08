-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A3 · LAS RPCs DEL CASO — la puerta única
-- Contrato: `LETRA_POSTVENTA` §§2-6 + `S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`
-- VEDA 76(g): NO RIGE. REVERSA escrita ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① ¿DE QUIÉN ES EL OBJETO? ──────────────────────────────────────────────
-- Resuelve dueño, prestador y fecha de cierre de los TRES objetos. Vive en un
-- solo lugar porque `abrir_caso` y los lectores hacen la misma pregunta: si
-- cada uno la resolviera, un día un objeto sería «tuyo» para uno y no para el otro.
CREATE OR REPLACE FUNCTION public._caso_dueno_del_objeto(p_tipo text, p_id uuid)
RETURNS TABLE (familia_user_id uuid, prestador_id uuid, cuenta_comercial_id uuid,
               cerrado_en timestamptz, mascota_id uuid, titulo text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF p_tipo = 'cita' THEN
    RETURN QUERY
      SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
             COALESCE(a.cerrada_en, (c.fecha + c.hora)::timestamptz),
             c.mascota_id, c.tipo_servicio
        FROM evento_cita_servicio c
        LEFT JOIN prestadores p ON p.id = c.prestador_id
        LEFT JOIN evento_atencion a ON a.cita_id = c.id
       WHERE c.id = p_id;

  ELSIF p_tipo = 'estadia' THEN
    -- 🔴 `guarderia_estadias`, NO `estadias` — esa última es una LÁPIDA de
    -- S107 con 0 filas (ver `S114-A-HALLAZGO-ORIGEN-ESTADIA.md`).
    RETURN QUERY
      SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
             COALESCE(e.entregada_en, e.no_recogida_en, (c.fecha)::timestamptz),
             c.mascota_id, 'guarderia'::text
        FROM guarderia_estadias e
        JOIN evento_cita_servicio c ON c.id = e.cita_id
        LEFT JOIN prestadores p ON p.id = c.prestador_id
       WHERE e.id = p_id;

  ELSIF p_tipo = 'pedido' THEN
    RETURN QUERY
      SELECT ped.user_id, NULL::uuid, ped.cuenta_comercial_id,
             COALESCE((SELECT max(pe.created_at) FROM pedido_estados pe
                        WHERE pe.pedido_id = ped.id AND pe.estado_codigo = 'entregado'),
                      ped.created_at),
             NULL::uuid, COALESCE(ped.numero_orden, 'Pedido')
        FROM pedidos ped WHERE ped.id = p_id;
  END IF;
END $fn$;

-- ── ② 🔴 ¿ESTE OBJETO TIENE DEVENGO? — la pregunta de §6 ───────────────────
-- **Se le pregunta AL OBJETO, jamás se deduce por clase.** Elegir el camino
-- por clase escribiría un reembolso declarado sobre un servicio que sí
-- devengó: la plata vuelve a la familia, el prestador conserva el devengo y la
-- casa paga la diferencia sin que nadie lo vea.
CREATE OR REPLACE FUNCTION public._caso_tiene_devengo(p_tipo text, p_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  -- Devuelve el id del evento vivo, o NULL. `estado <> 'reversado'` porque un
  -- evento ya reversado no se reversa dos veces.
  SELECT e.id FROM eventos_economicos e
   WHERE e.origen_tipo = p_tipo AND e.origen_id = p_id
     AND e.tipo_evento <> 'reembolso' AND e.estado <> 'reversado'
   ORDER BY e.created_at DESC LIMIT 1;
$fn$;

-- ── ③ LA PUERTA DE LA MÁQUINA DE ESTADOS ───────────────────────────────────
CREATE OR REPLACE FUNCTION public._caso_mover(
  p_caso_id uuid, p_hasta text, p_actor text, p_actor_user uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_desde text; v_t record;
BEGIN
  SELECT etapa INTO v_desde FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','caso_no_existe'); END IF;

  -- 🔴 `sistema` SE ACEPTA ACÁ. El catálogo lo declara válido y esta puerta lo
  -- toma: es la lección del callejón de S105, donde `cat_transiciones_pedido`
  -- declaraba `sistema` y `_mover_estado_pedido` no lo aceptaba — un callejón
  -- que se descubrió con plata devuelta de por medio.
  SELECT * INTO v_t FROM cat_transiciones_caso
   WHERE desde = v_desde AND hasta = p_hasta AND actor = p_actor AND activo;

  IF NOT FOUND THEN
    -- HABLA: distingue «ese actor no puede» de «esa transición no existe».
    IF EXISTS (SELECT 1 FROM cat_transiciones_caso WHERE desde=v_desde AND hasta=p_hasta AND activo) THEN
      RETURN jsonb_build_object('ok',false,'codigo','actor_no_puede','desde',v_desde,'hasta',p_hasta,'actor',p_actor);
    END IF;
    RETURN jsonb_build_object('ok',false,'codigo','transicion_inexistente','desde',v_desde,'hasta',p_hasta);
  END IF;

  IF v_t.exige_motivo AND (p_motivo IS NULL OR btrim(p_motivo) = '') THEN
    RETURN jsonb_build_object('ok',false,'codigo','motivo_requerido','hasta',p_hasta);
  END IF;

  UPDATE casos_postventa
     SET etapa = p_hasta,
         estado_final = CASE WHEN (SELECT es_final FROM cat_estados_caso WHERE etapa=p_hasta)
                             THEN p_hasta ELSE estado_final END,
         cerrado_en = CASE WHEN p_hasta = 'cerrado' THEN now() ELSE cerrado_en END,
         actualizado_en = now()
   WHERE id = p_caso_id;

  RETURN jsonb_build_object('ok', true, 'desde', v_desde, 'hasta', p_hasta);
END $fn$;

-- ── ④ ABRIR ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.abrir_caso(
  p_objeto_tipo text, p_objeto_id uuid, p_motivo text,
  p_relato text DEFAULT NULL, p_procedencia text DEFAULT 'familia',
  p_modo text DEFAULT NULL, p_confirmado_por uuid DEFAULT NULL,
  p_resumen_confirmado text DEFAULT NULL, p_foto_url text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_yo uuid := auth.uid(); v_o record; v_m record; v_caso uuid; v_existe uuid;
  v_etapa text; v_plazo timestamptz;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;

  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_objeto_tipo, p_objeto_id);
  IF v_o.familia_user_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','objeto_no_existe');
  END IF;
  IF v_o.familia_user_id <> v_yo THEN
    RETURN jsonb_build_object('ok',false,'codigo','objeto_no_es_tuyo');
  END IF;

  -- 🔴 MEMORIAL. C ya lo frena en la pantalla y lo pidió igual acá, con razón:
  -- el guard de la pantalla protege a quien mira, no a quien llama.
  IF v_o.mascota_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM mascotas m WHERE m.id = v_o.mascota_id AND m.estado_vida = 'memorial') THEN
    RETURN jsonb_build_object('ok',false,'codigo','mascota_en_memorial');
  END IF;

  -- LA VENTANA (§5 · F7), exigida en el motor y con el MISMO número que la app.
  IF v_o.cerrado_en IS NOT NULL
     AND v_o.cerrado_en < now() - (caso_ventana_dias() || ' days')::interval THEN
    RETURN jsonb_build_object('ok',false,'codigo','fuera_de_ventana',
      'cerrado_en', v_o.cerrado_en, 'dias', caso_ventana_dias());
  END IF;

  -- 🔴 EL MOTIVO PERTENECE AL CONJUNTO RESUELTO (A10), no coincide con la columna.
  IF NOT _motivo_pertenece_al_objeto(p_motivo, p_objeto_tipo) THEN
    RETURN jsonb_build_object('ok',false,'codigo','motivo_no_pertenece',
      'motivo', p_motivo, 'objeto', p_objeto_tipo);
  END IF;

  -- 🔴 YA HAY UNO: se devuelve SU ID (L-424). Un guard que sólo sabe negarse
  -- manda a «probá de nuevo» sobre algo que va a fallar siempre.
  SELECT id INTO v_existe FROM casos_postventa
   WHERE objeto_tipo = p_objeto_tipo AND objeto_id = p_objeto_id
     AND etapa NOT IN ('cerrado','retirado','sin_lugar','resuelto_entre_partes');
  IF v_existe IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_ya_abierto','caso_id',v_existe);
  END IF;

  -- LA CLASE VIENE DE LA FILA (§4). El cliente no la manda y no puede.
  SELECT clase, urgente INTO v_m FROM v_motivos_resueltos
   WHERE objeto_resuelto = p_objeto_tipo AND codigo = p_motivo LIMIT 1;

  -- La etapa inicial y el plazo salen de la clase, no de un parámetro.
  IF v_m.clase = 1 THEN v_etapa := 'recibido'; v_plazo := NULL;
  ELSIF v_m.clase = 3 THEN v_etapa := 'recibido'; v_plazo := NULL;   -- «sin plazo, es ahora»
  ELSE v_etapa := 'recibido'; v_plazo := now() + interval '24 hours';
  END IF;

  INSERT INTO casos_postventa (objeto_tipo, objeto_id, motivo_codigo, clase,
      familia_user_id, prestador_id, cuenta_comercial_id, etapa, plazo_prestador_hasta,
      relato, resumen_confirmado, procedencia, modo, confirmado_por, foto_url)
  VALUES (p_objeto_tipo, p_objeto_id, p_motivo, v_m.clase,
      v_yo, v_o.prestador_id, v_o.cuenta_comercial_id, v_etapa, v_plazo,
      p_relato, p_resumen_confirmado, COALESCE(p_procedencia,'familia'), p_modo,
      p_confirmado_por, p_foto_url)
  RETURNING id INTO v_caso;

  -- §3.3: «el primer mensaje lo escribe la casa cuando abro el caso. No hay
  -- hilo vacío.» Por eso lo escribe ESTA función y no la pantalla.
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (v_caso, 'casa', 'hecho', 'Recibimos tu caso.');

  -- El ruteo por clase (§5), por la puerta y con actor `sistema`.
  IF v_m.clase = 1 THEN
    PERFORM _caso_mover(v_caso, 'resuelto', 'sistema', NULL);
    UPDATE casos_postventa SET resuelto_en = now() WHERE id = v_caso;
  ELSIF v_m.clase = 3 THEN
    PERFORM _caso_mover(v_caso, 'con_casa', 'sistema', NULL);
  ELSE
    PERFORM _caso_mover(v_caso, 'con_prestador', 'sistema', NULL);
  END IF;

  RETURN jsonb_build_object('ok', true, 'caso_id', v_caso,
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = v_caso),
    'clase_resuelta', v_m.clase, 'urgente', v_m.urgente);
END $fn$;

-- ── ⑤ RESPONDER (cualquiera de los tres asientos) ──────────────────────────
CREATE OR REPLACE FUNCTION public.caso_responder(p_caso_id uuid, p_texto text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_yo uuid := auth.uid(); v_c record; v_autor text; v_id uuid;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  IF p_texto IS NULL OR btrim(p_texto) = '' THEN
    RETURN jsonb_build_object('ok',false,'codigo','texto_vacio');
  END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;

  -- El asiento se DERIVA de quién sos, jamás se recibe por parámetro: un autor
  -- que el llamador declara es un autor que el llamador elige.
  IF v_c.familia_user_id = v_yo THEN v_autor := 'familia';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_autor := 'prestador';
  ELSIF is_admin() THEN v_autor := 'casa';
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');
  END IF;

  -- §3.3: cerrado ⇒ lectura. La barra se reemplaza por una línea en la app, y
  -- el motor lo sostiene por si otro caller lo intenta.
  IF (SELECT es_final FROM cat_estados_caso WHERE etapa = v_c.etapa) THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_cerrado','etapa',v_c.etapa);
  END IF;

  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (p_caso_id, v_autor, v_yo, 'mensaje', btrim(p_texto)) RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'mensaje_id', v_id, 'autor', v_autor);
END $fn$;

-- ── ⑥ 🔴 RESOLVER — donde se decide el camino de la plata MIDIENDO ─────────
CREATE OR REPLACE FUNCTION public.caso_resolver(
  p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_yo uuid := auth.uid(); v_c record; v_evento uuid; v_camino text;
  v_inverso uuid; v_mov jsonb; v_actor text;
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

  -- 🔴🔴 LA PREGUNTA DE §6, AL OBJETO Y NO A LA CLASE.
  v_evento := _caso_tiene_devengo(v_c.objeto_tipo, v_c.objeto_id);

  IF p_alcance = 'sin_devolucion' THEN
    v_camino := NULL;
  ELSIF v_evento IS NOT NULL THEN
    -- TIENE DEVENGO ⇒ evento inverso. F4: la comisión se devuelve también —
    -- `aplicar_reembolso` ya reversa `monto_plataforma` proporcionalmente, así
    -- que la firma NO pide fórmula nueva: pide que la letra diga lo que el
    -- código hace, y que esto lo use en vez de escribir la suya.
    v_inverso := aplicar_reembolso(v_evento,
                   COALESCE(p_motivo, 'caso de postventa ' || p_caso_id::text),
                   v_yo,
                   CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE NULL END);
    v_camino := 'aplicar_reembolso';
  ELSE
    -- SIN DEVENGO ⇒ se declara sobre el pago (7.14/7.16). `aplicar_reembolso`
    -- no se toca: no hay nada que reversar en el ledger.
    v_camino := 'declarado_sobre_pago';
  END IF;

  UPDATE casos_postventa
     SET resolucion_alcance = p_alcance,
         monto_devuelto = CASE WHEN p_alcance='sin_devolucion' THEN 0 ELSE p_monto END,
         camino = v_camino, evento_reembolso_id = v_inverso,
         decidido_por = v_yo, resuelto_en = now(), actualizado_en = now()
   WHERE id = p_caso_id;

  v_mov := _caso_mover(p_caso_id,
             CASE WHEN v_actor='prestador' THEN 'resuelto_entre_partes' ELSE 'resuelto' END,
             v_actor, v_yo, p_motivo);
  IF (v_mov->>'ok')::boolean IS NOT TRUE THEN RETURN v_mov; END IF;

  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (p_caso_id, CASE WHEN v_actor='casa' THEN 'casa' ELSE 'prestador' END, v_yo, 'hecho',
          CASE WHEN p_alcance='sin_devolucion' THEN 'Se resolvió el caso.'
               ELSE 'Se resolvió: hay una devolución para vos.' END);

  RETURN jsonb_build_object('ok', true, 'camino', v_camino,
    'evento_reembolso_id', v_inverso, 'tenia_devengo', (v_evento IS NOT NULL),
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = p_caso_id));
END $fn$;

CREATE OR REPLACE FUNCTION public.caso_reconocer_y_resolver(
  p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_destino text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$ SELECT public.caso_resolver(p_caso_id, p_alcance, p_monto, 'el prestador lo reconoció'); $fn$;

CREATE OR REPLACE FUNCTION public.caso_pedir_casa(p_caso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_yo uuid := auth.uid(); v_c record; v_actor text; v_mov jsonb;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;
  IF v_c.familia_user_id = v_yo THEN v_actor := 'familia';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_actor := 'prestador';
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo'); END IF;
  v_mov := _caso_mover(p_caso_id, 'con_casa', v_actor, v_yo);
  IF (v_mov->>'ok')::boolean THEN
    INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
    VALUES (p_caso_id, 'casa', 'hecho', 'e-PetPlace tomó el caso.');
  END IF;
  RETURN v_mov;
END $fn$;

CREATE OR REPLACE FUNCTION public.caso_elegir_destino(p_caso_id uuid, p_destino text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_yo uuid := auth.uid(); v_c record; v_estado text;
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

  -- 🔴 `saldo` todavía NO tiene motor (A4). Se DICE en vez de aceptar y no
  -- hacer nada: una elección que se guarda sin efecto es peor que un rebote.
  IF p_destino = 'saldo' THEN
    RETURN jsonb_build_object('ok',false,'codigo','saldo_todavia_no_existe',
      'nota','el motor de saldo es A4; hasta entonces la única salida es el banco');
  END IF;

  -- Banco: dentro de la ventana del riel el motor reversa; fuera, es acto
  -- humano y la superficie NO promete fecha (§6).
  v_estado := 'en_camino_manual';
  UPDATE casos_postventa SET destino = p_destino, destino_estado = v_estado,
         actualizado_en = now() WHERE id = p_caso_id;
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (p_caso_id, 'casa', 'hecho', 'Elegiste que vuelva a tu banco. La devolución está en camino.');
  RETURN jsonb_build_object('ok', true, 'estado', v_estado);
END $fn$;

-- ── ⑦ LOS LECTORES ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_caso_de_objeto(p_tipo text, p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE((
    SELECT jsonb_build_object('caso_id', c.id, 'etapa', c.etapa,
             'voz_estado', CASE c.etapa
               WHEN 'con_prestador' THEN 'Con el prestador'
               WHEN 'con_casa' THEN 'Con e-PetPlace'
               WHEN 'resuelto' THEN 'Resuelto' ELSE 'Recibido' END,
             'plazo_hasta', c.plazo_prestador_hasta)
      FROM casos_postventa c
     WHERE c.objeto_tipo = p_tipo AND c.objeto_id = p_id
       AND c.familia_user_id = auth.uid()
       AND c.etapa NOT IN ('cerrado','retirado','sin_lugar','resuelto_entre_partes')
     LIMIT 1), 'null'::jsonb);
$fn$;

CREATE OR REPLACE FUNCTION public.leer_caso(p_caso_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_o record;
BEGIN
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','no_existe'); END IF;
  IF NOT (v_c.familia_user_id = auth.uid()
          OR (v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id))
          OR is_admin()) THEN
    RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');
  END IF;
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id);
  RETURN jsonb_build_object('ok', true, 'caso_id', v_c.id, 'etapa', v_c.etapa,
    'clase', v_c.clase, 'motivo', v_c.motivo_codigo,
    'en_escalera', (SELECT en_escalera FROM cat_estados_caso WHERE etapa=v_c.etapa),
    'final', v_c.estado_final,
    'cerrado', (SELECT es_final FROM cat_estados_caso WHERE etapa=v_c.etapa),
    'plazo_hasta', v_c.plazo_prestador_hasta,
    'objeto', jsonb_build_object('tipo', v_c.objeto_tipo, 'id', v_c.objeto_id,
                                 'titulo', v_o.titulo, 'fecha', v_o.cerrado_en),
    'resolucion', jsonb_build_object('alcance', v_c.resolucion_alcance,
                    'monto', v_c.monto_devuelto, 'camino', v_c.camino,
                    'destino', v_c.destino, 'destino_estado', v_c.destino_estado),
    'accion_pendiente', CASE WHEN v_c.resuelto_en IS NOT NULL AND v_c.destino IS NULL
                              AND COALESCE(v_c.monto_devuelto,0) > 0
                             THEN 'elegir_devolucion' ELSE NULL END);
END $fn$;

CREATE OR REPLACE FUNCTION public.leer_mensajes_caso(
  p_caso_id uuid, p_cursor_ts timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL, p_limite integer DEFAULT 50)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  -- CURSOR COMPUESTO (creado_en, id). Con la fecha sola, dos mensajes del
  -- mismo instante hacen que la página siguiente SALTEE filas — el defecto
  -- exacto que S99 midió en la línea de vida (55 de 62).
  WITH permitido AS (
    SELECT 1 FROM casos_postventa c WHERE c.id = p_caso_id
      AND (c.familia_user_id = auth.uid()
           OR (c.prestador_id IS NOT NULL AND es_mi_prestador(c.prestador_id))
           OR is_admin())
  ), pagina AS (
    SELECT m.* FROM caso_mensajes m, permitido
     WHERE m.caso_id = p_caso_id
       AND (p_cursor_ts IS NULL
            OR (m.creado_en, m.id) > (p_cursor_ts, COALESCE(p_cursor_id,'00000000-0000-0000-0000-000000000000'::uuid)))
     ORDER BY m.creado_en, m.id
     LIMIT LEAST(COALESCE(p_limite,50), 200)
  )
  SELECT jsonb_build_object(
    'mensajes', COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id, 'autor', p.autor, 'tipo', p.tipo,
        'cuerpo', p.cuerpo, 'creado_en', p.creado_en) ORDER BY p.creado_en, p.id), '[]'::jsonb),
    'cursor', CASE WHEN count(*) = 0 THEN NULL
                   ELSE (max(p.creado_en)::text || '|' || (SELECT id::text FROM pagina ORDER BY creado_en DESC, id DESC LIMIT 1)) END)
  FROM pagina p;
$fn$;

CREATE OR REPLACE FUNCTION public.obtener_casos_del_prestador()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'caso_id', c.id, 'objeto_tipo', c.objeto_tipo, 'objeto_id', c.objeto_id,
    'motivo', c.motivo_codigo, 'clase', c.clase, 'etapa', c.etapa,
    'plazo_hasta', c.plazo_prestador_hasta, 'creado_en', c.creado_en
  ) ORDER BY c.creado_en DESC), '[]'::jsonb)
  FROM casos_postventa c
  WHERE c.prestador_id IS NOT NULL AND es_mi_prestador(c.prestador_id);
$fn$;

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
    -- 🔴 `manual` LO DICE EL SERVIDOR. Depende de la ventana del riel y la
    -- pantalla no puede saberlo; si lo dedujera de la fecha prometería una
    -- fecha que el motor no cumple, que es lo único que §4 prohíbe.
    'banco', jsonb_build_object('disponible', true, 'manual', true),
    'saldo', jsonb_build_object('disponible', false,
             'nota','el motor de saldo es A4'));
END $fn$;

-- ── L-140 en todas ─────────────────────────────────────────────────────────
DO $g$
DECLARE f text;
BEGIN
  FOR f IN SELECT p.oid::regprocedure::text FROM pg_proc p
            JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public'
             AND p.proname IN ('abrir_caso','caso_responder','caso_resolver',
                 'caso_reconocer_y_resolver','caso_pedir_casa','caso_elegir_destino',
                 'obtener_caso_de_objeto','leer_caso','leer_mensajes_caso',
                 'obtener_casos_del_prestador','leer_opciones_devolucion',
                 '_caso_mover','_caso_tiene_devengo','_caso_dueno_del_objeto')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $g$;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('abrir_caso','caso_responder','caso_resolver',
     'caso_reconocer_y_resolver','caso_pedir_casa','caso_elegir_destino');
  IF v <> 6 THEN RAISE EXCEPTION 'CINTURÓN: faltan RPCs de acto (hay %)', v; END IF;

  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('obtener_caso_de_objeto','leer_caso',
     'leer_mensajes_caso','obtener_casos_del_prestador','leer_opciones_devolucion');
  IF v <> 5 THEN RAISE EXCEPTION 'CINTURÓN: faltan lectores (hay %)', v; END IF;

  IF has_function_privilege('anon','public.abrir_caso(text,uuid,text,text,text,text,uuid,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede abrir casos';
  END IF;

  -- Toda función del motor con search_path fijo (D-708)
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE '%caso%'
     AND p.prosecdef AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig,',') LIKE '%search_path%'))
     AND p.proname NOT LIKE '%clinic%';
  IF v > 0 THEN RAISE EXCEPTION 'CINTURÓN: % función(es) de caso sin search_path', v; END IF;

  RAISE NOTICE 'CINTURÓN VERDE · 6 actos · 5 lectores · anon sin EXECUTE · search_path en todas';
END $cinturon$;

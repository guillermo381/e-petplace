-- S114-A ③ · LA CASA PUEDE TOMAR UN CASO — y el hecho queda escrito.
--
-- F midió: caso_pedir_casa devolvía 'no_es_tuyo' a un admin, y cat_transiciones_caso
-- no tenía con_prestador→con_casa para actor 'casa'. Un botón en el admin rebotaba con
-- transicion_inexistente.
--
-- FIRMA DEL FOUNDER: son DOS actos distintos y el caso registra CUÁL fue —
--   · «me llamaron»: el prestador/familia escala (actor prestador/familia) — YA existía.
--   · «entré yo»: la casa entra sola porque el prestador no respondió (actor 'casa') — FALTABA.
-- El actor ya se registra en _caso_mover, así que distinguir los dos hechos es
-- agregar la transición de 'casa' + que caso_pedir_casa acepte al admin con ese actor.
-- El mensaje al hilo también los distingue.
--
-- Y el BORDE FEO que F encontró: caso_resolver aceptaba al admin y NO exigía etapa,
-- así que calculaba toda la plata (aplicar_reembolso) y recién fallaba tarde en
-- _caso_mover. Ahora hay un guard temprano ANTES de tocar la plata.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; sin backfill de escritura de negocio).
-- Reversa escrita ANTES en docs/relevamientos/2026-09-08-s114a-REVERSA-20260911850000.sql

-- ① la transición que faltaba: la casa entra desde con_prestador (entré yo).
INSERT INTO cat_transiciones_caso (desde, hasta, actor, exige_motivo, activo)
  VALUES ('con_prestador', 'con_casa', 'casa', false, true)
  ON CONFLICT DO NOTHING;

-- ② caso_pedir_casa acepta al admin (actor 'casa'), y el mensaje distingue el hecho.
CREATE OR REPLACE FUNCTION public.caso_pedir_casa(p_caso_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_yo uuid := auth.uid(); v_c record; v_actor text; v_mov jsonb;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;
  IF v_c.familia_user_id = v_yo THEN v_actor := 'familia';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_actor := 'prestador';
  ELSIF is_admin() THEN v_actor := 'casa';                       -- 🔴 «entré yo»: faltaba
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo'); END IF;
  v_mov := _caso_mover(p_caso_id, 'con_casa', v_actor, v_yo);
  IF (v_mov->>'ok')::boolean THEN
    INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
    VALUES (p_caso_id, 'casa', 'hecho',
      CASE WHEN v_actor = 'casa' THEN 'e-PetPlace tomó el caso.'        -- entré yo
           ELSE 'Se pidió que intervenga e-PetPlace.' END);            -- me llamaron
  END IF;
  RETURN v_mov;
END $function$;
REVOKE ALL ON FUNCTION public.caso_pedir_casa(uuid) FROM anon, PUBLIC;

-- ③ caso_resolver con el guard temprano (cuerpo vivo + guard, voz «para ti» conservada).
CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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


  -- 🔴 GUARD TEMPRANO (S114-A ③ · hallazgo de F): la etapa se verifica ANTES de
  -- tocar la plata. Sin esto, la casa calculaba todo el reembolso (aplicar_reembolso,
  -- que ya movió plata) y RECIÉN fallaba en _caso_mover con un código que no dice
  -- «primero toma el caso». La casa resuelve desde con_casa; el prestador (entre
  -- partes) desde con_prestador. Sin voz: la UI mapea el código (patrón de la casa).
  IF v_actor = 'casa' AND v_c.etapa <> 'con_casa' THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_no_tomado');
  END IF;
  IF v_actor = 'prestador' AND v_c.etapa <> 'con_prestador' THEN
    RETURN jsonb_build_object('ok',false,'codigo','etapa_incorrecta');
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
               ELSE 'Se resolvió: hay una devolución para ti.' END);

  RETURN jsonb_build_object('ok', true, 'camino', v_camino,
    'evento_reembolso_id', v_inverso, 'tenia_devengo', (v_evento IS NOT NULL),
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = p_caso_id));
END $function$;

REVOKE ALL ON FUNCTION public.caso_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;

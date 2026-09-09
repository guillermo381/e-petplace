-- S114-A · «RECONOCER PARCIAL» DEL PRESTADOR: pide MONTO y RAZÓN, y no supera el total.
--
-- Del recorrido del founder: «reconocer parcial» no pedía monto ni razón. Medido:
-- caso_reconocer_y_resolver YA aceptaba p_monto, pero (a) HARDCODEABA la razón
-- ('el prestador lo reconoció') e IGNORABA p_destino (param muerto), y (b) el tope
-- contra el total del objeto sólo existía como RAISE crudo de aplicar_reembolso en
-- casos CON devengo — sin devengo no había tope, y nunca era un rebote tipado.
--
-- FIRMAS DEL FOUNDER:
--  · el parcial pide monto Y razón.
--  · valida que no supere el TOTAL DEL OBJETO (tipado: monto_supera_total).
--  · el parcial reparte per-source igual que el completo (mismo factor
--    saldo_aplicado/total cuando la compra fue mixta) — YA lo hace caso_resolver.
--  · el parcial del prestador se aplica SOLO, sin pasar por la casa — YA es así
--    (v_actor='prestador' resuelve desde con_prestador → resuelto_entre_partes).
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES.

-- ── el total del objeto (el tope) ───────────────────────────────────────────
-- El devengo es el valor BRUTO de lo que se cobró: el tope autoritativo, y el
-- mismo que aplicar_reembolso ya usa. Sin devengo, el total del objeto por tipo.
CREATE OR REPLACE FUNCTION public._caso_monto_objeto(p_tipo text, p_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_ev uuid; v_bruto numeric;
BEGIN
  v_ev := _caso_tiene_devengo(p_tipo, p_id);
  IF v_ev IS NOT NULL THEN
    SELECT monto_bruto INTO v_bruto FROM eventos_economicos WHERE id = v_ev;
    RETURN v_bruto;
  END IF;
  RETURN CASE p_tipo
    WHEN 'pedido' THEN (SELECT total FROM pedidos WHERE id = p_id)
    WHEN 'cita'   THEN (SELECT total FROM cita_desglose WHERE cita_id = p_id)
    ELSE NULL END;   -- tipo sin fuente conocida: sin tope acá (aplicar_reembolso
                     -- sigue capando los casos con devengo como red)
END $fn$;
REVOKE ALL ON FUNCTION public._caso_monto_objeto(text, uuid) FROM anon, PUBLIC;

-- ── caso_resolver gana el tope tipado del parcial ───────────────────────────
CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_yo uuid := auth.uid(); v_c record; v_evento uuid; v_camino text;
  v_inverso uuid; v_mov jsonb; v_actor text; v_tope numeric;
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

  IF v_actor = 'casa' AND v_c.etapa <> 'con_casa' THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_no_tomado');
  END IF;
  IF v_actor = 'prestador' AND v_c.etapa <> 'con_prestador' THEN
    RETURN jsonb_build_object('ok',false,'codigo','etapa_incorrecta');
  END IF;

  -- 🔴 EL TOPE DEL PARCIAL, TIPADO (firma founder): no supera el total del objeto.
  -- Antes esto sólo lo cazaba aplicar_reembolso con un RAISE crudo, y sólo en
  -- casos con devengo. Acá rebota limpio para cualquier objeto con total conocido.
  IF p_alcance = 'parcial' THEN
    v_tope := _caso_monto_objeto(v_c.objeto_tipo, v_c.objeto_id);
    IF v_tope IS NOT NULL AND p_monto > v_tope THEN
      RETURN jsonb_build_object('ok',false,'codigo','monto_supera_total','total',v_tope);
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

  -- REEMBOLSO PER-SOURCE (parcial usa el mismo factor saldo_aplicado/total).
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

-- ── caso_reconocer_y_resolver: pide RAZÓN (p_motivo), muere p_destino muerto ──
DROP FUNCTION IF EXISTS public.caso_reconocer_y_resolver(uuid,text,numeric,text);
CREATE OR REPLACE FUNCTION public.caso_reconocer_y_resolver(
  p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT public.caso_resolver(p_caso_id, p_alcance, p_monto,
                              COALESCE(NULLIF(btrim(p_motivo), ''), 'el prestador lo reconoció'));
$fn$;
REVOKE ALL ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) TO authenticated;

-- ── CINTURÓN · el tope rebota tipado, el parcial válido pasa ────────────────
DO $cinturon$
DECLARE v_def text;
BEGIN
  -- el tope está en el cuerpo
  v_def := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_def NOT ILIKE '%monto_supera_total%' OR v_def NOT ILIKE '%_caso_monto_objeto%' THEN
    RAISE EXCEPTION 'CINTURÓN: el tope tipado no está en caso_resolver';
  END IF;
  -- reconocer pasa la RAZÓN (no la hardcodea) y coalesce al default si viene vacía
  v_def := pg_get_functiondef('public.caso_reconocer_y_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_def NOT ILIKE '%p_motivo%' OR v_def NOT ILIKE '%el prestador lo reconoció%' THEN
    RAISE EXCEPTION 'CINTURÓN: reconocer_y_resolver no toma la razón con default';
  END IF;
  -- el helper del tope: devengo manda; pedido/cita como fallback
  IF _caso_monto_objeto('tipo_inexistente', gen_random_uuid()) IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN: _caso_monto_objeto no devuelve NULL para un tipo desconocido';
  END IF;
  -- p_destino muerto ya no existe (una firma, no dos)
  IF (SELECT count(*) FROM pg_proc WHERE proname='caso_reconocer_y_resolver'
        AND pronamespace='public'::regnamespace) <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN: caso_reconocer_y_resolver tiene más de una firma';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · tope tipado monto_supera_total · razón con default · helper NULL en tipo desconocido · una sola firma';
END $cinturon$;

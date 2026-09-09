-- S114-A · la razón es obligatoria TAMBIÉN en sin_devolucion (firma founder 9-sep).
--
-- «Un cero sin porqué es lo que más se parece a que nadie miró el caso.» El
-- prestador que reconoce y NO devuelve tiene que decir por qué, igual que el que
-- devuelve una parte. El código deja de llamarse *_en_parcial (mentiría para
-- sin_devolucion) y pasa a `razon_requerida`, general para los dos alcances con
-- decisión de plata (parcial y sin_devolucion). El total conserva su default.
--
-- Firma que la acompaña, ya reflejada en el motor: «dar saldo» NO es opción del
-- prestador (el A4 la volvió destino de la FAMILIA); las tres del prestador son
-- total · parcial · sin_devolucion, que caso_resolver ya acepta — nada que agregar.
--
-- 76(g) NO RIGE. Reversa ANTES.

-- ── caso_resolver: razón obligatoria en parcial Y sin_devolucion ─────────────
CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
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

-- ── reconocer: default SÓLO en total; parcial y sin_devolucion piden razón ───
CREATE OR REPLACE FUNCTION public.caso_reconocer_y_resolver(
  p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT public.caso_resolver(p_caso_id, p_alcance, p_monto,
    CASE WHEN p_alcance = 'total'
         THEN COALESCE(NULLIF(btrim(p_motivo), ''), 'el prestador lo reconoció')
         ELSE p_motivo   -- parcial y sin_devolucion: obligatoria, sin default que la enmascare
    END);
$fn$;
REVOKE ALL ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) TO authenticated;

DO $cinturon$
DECLARE v_def text;
BEGIN
  v_def := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_def NOT ILIKE '%razon_requerida%' THEN RAISE EXCEPTION 'CINTURÓN: falta razon_requerida'; END IF;
  IF v_def ILIKE '%razon_requerida_en_parcial%' THEN RAISE EXCEPTION 'CINTURÓN: quedó el código viejo _en_parcial'; END IF;
  IF v_def NOT ILIKE '%IN (''parcial'',''sin_devolucion'') AND (p_motivo%' THEN RAISE EXCEPTION 'CINTURÓN: la razón no cubre sin_devolucion'; END IF;
  RAISE NOTICE 'CINTURÓN VERDE · razon_requerida en parcial y sin_devolucion · default sólo en total';
END $cinturon$;

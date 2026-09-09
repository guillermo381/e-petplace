-- S114-A · el lector da el total (y el disponible), la razón entra al hilo, y el
--          parcial no supera lo que QUEDA por devolver (afinamiento de C).
--
-- C midió, contra su superficie:
--  ① leer_caso no devuelve el total del objeto ⇒ la pantalla no puede mostrarlo
--     ni poner el tope; y C no lo lee por su lado (sería 2ª fuente de verdad de plata).
--  ①bis pregunta afilada de C: el tope ¿es el total, o el total MENOS lo ya devuelto?
--     — lo segundo: dos parciales que suman más que el servicio es plata que nadie
--     cobró, y las dos formas de pasarse son silenciosas.
--  ② la razón tiene que ENTRAR AL HILO como mensaje del prestador, en la MISMA
--     transacción (voto (a) de C: con dos actos la mitad puede quedar sola).
--
-- Cura:
--  · _caso_ya_devuelto(tipo,id,excluir) — suma monto_devuelto de los OTROS casos
--    resueltos sobre el mismo objeto. disponible = total − ya_devuelto.
--  · leer_caso.objeto gana `total` y `disponible_devolver`.
--  · caso_resolver capa el parcial contra el DISPONIBLE (no el total pelado),
--    rebota monto_supera_total con total/disponible/ya_devuelto; exige la razón en
--    parcial (razon_requerida_en_parcial); e INSERTA la razón como mensaje del
--    prestador/casa en el hilo, antes del 'hecho'.
--  · caso_reconocer_y_resolver pasa la razón TAL CUAL en parcial (sin default que
--    enmascare el requisito); el default sólo aplica a total/sin_devolucion.
--
-- 76(g) NO RIGE. Reversa ANTES.

-- ── lo ya devuelto sobre el mismo objeto (otros casos resueltos) ────────────
CREATE OR REPLACE FUNCTION public._caso_ya_devuelto(p_tipo text, p_id uuid, p_excluir uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(sum(monto_devuelto), 0)::numeric
    FROM casos_postventa
   WHERE objeto_tipo = p_tipo AND objeto_id = p_id
     AND id <> p_excluir
     AND resuelto_en IS NOT NULL;
$fn$;
REVOKE ALL ON FUNCTION public._caso_ya_devuelto(text, uuid, uuid) FROM anon, PUBLIC;

-- ── leer_caso: objeto gana total y disponible_devolver ──────────────────────
CREATE OR REPLACE FUNCTION public.leer_caso(p_caso_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_c record; v_o record; v_en_esc boolean; v_total numeric; v_ya numeric;
BEGIN
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','no_existe'); END IF;
  IF NOT (v_c.familia_user_id = auth.uid()
          OR (v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id))
          OR is_admin()) THEN
    RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');
  END IF;
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id);
  SELECT en_escalera INTO v_en_esc FROM cat_estados_caso WHERE etapa=v_c.etapa;
  v_total := _caso_monto_objeto(v_c.objeto_tipo, v_c.objeto_id);
  v_ya := _caso_ya_devuelto(v_c.objeto_tipo, v_c.objeto_id, v_c.id);
  RETURN jsonb_build_object('ok', true, 'caso_id', v_c.id, 'etapa', v_c.etapa,
    'clase', v_c.clase, 'motivo', v_c.motivo_codigo,
    'en_escalera', v_en_esc,
    'etapa_en_escalera', CASE WHEN v_en_esc THEN v_c.etapa ELSE v_c.etapa_previa END,
    'final', v_c.estado_final,
    'cerrado', (SELECT es_final FROM cat_estados_caso WHERE etapa=v_c.etapa),
    'plazo_hasta', v_c.plazo_prestador_hasta,
    'objeto', jsonb_build_object('tipo', v_c.objeto_tipo, 'id', v_c.objeto_id,
                                 'titulo', v_o.titulo, 'fecha', v_o.cerrado_en,
                                 -- 🔴 el total del objeto (de la fuente del cobro) y
                                 -- lo que QUEDA por devolver = total − ya_devuelto.
                                 -- NULL cuando el total no se conoce (estadía sin devengo).
                                 'total', v_total,
                                 'disponible_devolver',
                                   CASE WHEN v_total IS NULL THEN NULL
                                        ELSE GREATEST(v_total - v_ya, 0) END),
    'resolucion', jsonb_build_object('alcance', v_c.resolucion_alcance,
                    'monto', v_c.monto_devuelto, 'camino', v_c.camino,
                    'destino', v_c.destino, 'destino_estado', v_c.destino_estado),
    'accion_pendiente', CASE WHEN v_c.resuelto_en IS NOT NULL AND v_c.destino IS NULL
                              AND COALESCE(v_c.monto_devuelto,0) > 0
                             THEN 'elegir_devolucion' ELSE NULL END);
END $function$;
REVOKE ALL ON FUNCTION public.leer_caso(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.leer_caso(uuid) TO authenticated;

-- ── caso_resolver: tope = disponible, razón obligatoria en parcial y al hilo ─
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
  -- 🔴 la razón es obligatoria en parcial (firma founder: una línea de por qué,
  -- que entra al hilo). No se enmascara con el default: acá tiene que venir.
  IF p_alcance = 'parcial' AND (p_motivo IS NULL OR btrim(p_motivo) = '') THEN
    RETURN jsonb_build_object('ok',false,'codigo','razon_requerida_en_parcial');
  END IF;

  IF v_actor = 'casa' AND v_c.etapa <> 'con_casa' THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_no_tomado');
  END IF;
  IF v_actor = 'prestador' AND v_c.etapa <> 'con_prestador' THEN
    RETURN jsonb_build_object('ok',false,'codigo','etapa_incorrecta');
  END IF;

  -- 🔴 EL TOPE DEL PARCIAL = lo que QUEDA por devolver (total − ya_devuelto).
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

  -- 🔴 LA RAZÓN ENTRA AL HILO como mensaje del prestador/casa, en ESTA transacción
  -- (antes del 'hecho'). Sólo cuando es una razón REAL — no el default interno.
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

-- ── caso_reconocer_y_resolver: la razón va TAL CUAL en parcial (sin default) ─
CREATE OR REPLACE FUNCTION public.caso_reconocer_y_resolver(
  p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT public.caso_resolver(p_caso_id, p_alcance, p_monto,
    CASE WHEN p_alcance = 'parcial'
         THEN p_motivo   -- obligatoria: caso_resolver rebota si viene vacía
         ELSE COALESCE(NULLIF(btrim(p_motivo), ''), 'el prestador lo reconoció') END);
$fn$;
REVOKE ALL ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_reconocer_y_resolver(uuid,text,numeric,text) TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_def text; v_ejemplo jsonb; v_caso uuid;
BEGIN
  v_def := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_def NOT ILIKE '%razon_requerida_en_parcial%' THEN RAISE EXCEPTION 'CINTURÓN: falta razon_requerida_en_parcial'; END IF;
  IF v_def NOT ILIKE '%_caso_ya_devuelto%' THEN RAISE EXCEPTION 'CINTURÓN: el tope no descuenta lo ya devuelto'; END IF;
  IF v_def NOT ILIKE '%''mensaje''%' THEN RAISE EXCEPTION 'CINTURÓN: la razón no entra al hilo como mensaje'; END IF;

  -- leer_caso da total y disponible_devolver sobre un caso real
  SELECT id INTO v_caso FROM casos_postventa WHERE objeto_tipo='cita' LIMIT 1;
  v_ejemplo := leer_caso(v_caso);
  IF NOT (v_ejemplo->'objeto' ? 'total') OR NOT (v_ejemplo->'objeto' ? 'disponible_devolver') THEN
    RAISE EXCEPTION 'CINTURÓN: leer_caso no expone total/disponible_devolver · %', v_ejemplo->'objeto';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · tope = total − ya_devuelto · razón obligatoria en parcial y al hilo · leer_caso da total y disponible_devolver';
END $cinturon$;

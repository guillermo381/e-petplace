-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B9 — LA COMPRA RECURRENTE: EL ESQUELETO, CON CERO COBRO REAL
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §6.1 (enmienda a
-- `MODELO_DESPENSA` §11.2 — la recurrencia ENTRA a v1) con sus tres
-- condiciones que la industria aprendió a los golpes:
--   ① AVISO ANTES DEL COBRO — dos o tres días antes, con saltar/mover/
--     cancelar. El cobro sorpresa es la causa número uno de contracargos.
--   ② SE APAGA EN UN TOQUE, desde donde se prendió. Nunca por atención al
--     cliente.
--   ③ SI EL MEDIO DE PAGO FALLA, EL PEDIDO NO SE CREA A MEDIAS. Se avisa y
--     se espera. Jamás se envía prometiendo cobrar después.
--
-- 🔴 Y LO QUE NO SE PUEDE ESQUIVAR (D-778): el interruptor se construye,
-- pero **el primer cobro real es el mismo día que exista la pasarela.** Por
-- eso `ejecutar_recurrencias_vencidas()` es un esqueleto que HOY rebota con
-- `pasarela_no_afiliada` y no crea NADA — sin pasarela, el medio de pago
-- "falla" siempre, y la condición ③ dice exactamente qué hacer: se avisa y
-- se espera. Un pedido recurrente simulado sería el pago simulado que jamás
-- puede generar liquidación ni factura (§6.5) — acá directamente no nace.
--
-- Reversa: scripts/s96/2026-08-12-s96-m7-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE** solo en el cinturón: configura una recurrencia real,
-- dispara su aviso, y borra todo por id con residuo 0 — las intenciones del
-- fixture se borran DENTRO de la transacción, antes de que ningún tick de
-- despacho pueda verlas.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE public.pedidos_recurrencias (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  -- EL INTERRUPTOR. Un toque, desde donde se prendió.
  activo              boolean NOT NULL DEFAULT true,
  -- Frecuencia O fecha fija — exactamente una.
  frecuencia_dias     integer CHECK (frecuencia_dias IS NULL OR frecuencia_dias BETWEEN 7 AND 90),
  dia_del_mes         integer CHECK (dia_del_mes IS NULL OR dia_del_mes BETWEEN 1 AND 28),
  CONSTRAINT chk_una_cadencia CHECK (
    (frecuencia_dias IS NOT NULL) <> (dia_del_mes IS NOT NULL)),
  -- Lo que se repite: los ítems con su destino y la entrega, como los recibe
  -- crear_pedido_despensa — el día del cobro real, esto ES la llamada.
  items               jsonb NOT NULL,
  entrega             jsonb NOT NULL,
  metodo_entrega      text NOT NULL DEFAULT 'despacho' CHECK (metodo_entrega IN ('despacho','retiro')),
  -- ① El aviso ANTES del cobro: 2-3 días (el rango de la letra).
  aviso_dias          integer NOT NULL DEFAULT 2 CHECK (aviso_dias BETWEEN 2 AND 3),
  proximo_pedido_fecha date NOT NULL,
  -- Para no re-avisar el mismo ciclo.
  aviso_enviado_para  date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_recurrencias_updated BEFORE UPDATE ON public.pedidos_recurrencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.pedidos_recurrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurrencias_select ON public.pedidos_recurrencias FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.pedidos_recurrencias FROM anon, authenticated;
REVOKE SELECT ON public.pedidos_recurrencias FROM anon;

COMMENT ON TABLE public.pedidos_recurrencias IS
  'S96 · La compra recurrente (LETRA_RECORRIDO §6.1). El interruptor existe; el '
  'primer cobro real espera a la pasarela (D-778). El vendedor NO la ve: es '
  'configuración del cliente, y el pedido que nazca de ella será un pedido normal.';

CREATE FUNCTION public.configurar_recurrencia(
  p_cuenta_comercial_id uuid,
  p_items               jsonb,
  p_entrega             jsonb,
  p_frecuencia_dias     integer DEFAULT NULL,
  p_dia_del_mes         integer DEFAULT NULL,
  p_aviso_dias          integer DEFAULT 2,
  p_metodo_entrega      text DEFAULT 'despacho'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_prox date; v_it jsonb; v_masc uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF (p_frecuencia_dias IS NULL) = (p_dia_del_mes IS NULL) THEN
    RAISE EXCEPTION 'cadencia_invalida: frecuencia O día del mes, exactamente uno'
      USING ERRCODE = '22023';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'recurrencia_sin_items' USING ERRCODE = '22023';
  END IF;
  -- El destino se valida al configurar, igual que al comprar.
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    IF v_masc IS NOT NULL AND NOT _user_es_familia_de_mascota(v_masc, v_uid) AND NOT is_admin() THEN
      RAISE EXCEPTION 'mascota_sin_acceso' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  v_prox := CASE
    WHEN p_frecuencia_dias IS NOT NULL THEN current_date + p_frecuencia_dias
    WHEN extract(day FROM current_date)::int < p_dia_del_mes
      THEN date_trunc('month', current_date)::date + (p_dia_del_mes - 1)
    ELSE (date_trunc('month', current_date) + interval '1 month')::date + (p_dia_del_mes - 1)
  END;

  INSERT INTO pedidos_recurrencias (user_id, cuenta_comercial_id, frecuencia_dias,
                                    dia_del_mes, items, entrega, metodo_entrega,
                                    aviso_dias, proximo_pedido_fecha)
    VALUES (v_uid, p_cuenta_comercial_id, p_frecuencia_dias, p_dia_del_mes,
            p_items, p_entrega, p_metodo_entrega, p_aviso_dias, v_prox)
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'recurrencia_id', v_id,
                            'proximo_pedido_fecha', v_prox,
                            'nota', 'El primer cobro real espera a la pasarela (D-778).');
END $$;

-- ② EL INTERRUPTOR — un toque, del dueño, y de nadie más.
CREATE FUNCTION public.alternar_recurrencia(p_recurrencia_id uuid, p_activo boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid(); v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM pedidos_recurrencias WHERE id = p_recurrencia_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'recurrencia_no_existe' USING ERRCODE = '22023'; END IF;
  IF v_owner <> v_uid AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_es_tu_recurrencia' USING ERRCODE = '42501';
  END IF;
  UPDATE pedidos_recurrencias SET activo = p_activo, updated_at = now()
   WHERE id = p_recurrencia_id;
  RETURN jsonb_build_object('ok', true, 'activo', p_activo);
END $$;

-- ① EL AVISO ANTES DEL COBRO — cron diario; el tipo `pedido_recurrente` ya
--    vive en el catálogo de notificaciones desde S87.
CREATE FUNCTION public.avisar_recurrencias_proximas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_r record; v_n int := 0;
BEGIN
  FOR v_r IN
    SELECT * FROM pedidos_recurrencias
    WHERE activo
      AND proximo_pedido_fecha - aviso_dias <= current_date
      AND proximo_pedido_fecha >= current_date
      AND (aviso_enviado_para IS DISTINCT FROM proximo_pedido_fecha)
  LOOP
    PERFORM registrar_intencion_notificacion(
      'pedido_recurrente', v_r.user_id, NULL, NULL,
      jsonb_build_object('recurrencia_id', v_r.id,
                         'proximo_pedido_fecha', v_r.proximo_pedido_fecha,
                         'puede', 'saltar, mover o cancelar'),
      'recurrencia:' || v_r.id || ':' || v_r.proximo_pedido_fecha);
    UPDATE pedidos_recurrencias SET aviso_enviado_para = proximo_pedido_fecha
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $$;

-- ③ EL EJECUTOR — esqueleto que HOY no ejecuta nada, y lo dice con su código.
CREATE FUNCTION public.ejecutar_recurrencias_vencidas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_pendientes int;
BEGIN
  SELECT count(*) INTO v_pendientes FROM pedidos_recurrencias
   WHERE activo AND proximo_pedido_fecha <= current_date;
  -- 🔴 SIN PASARELA NO HAY COBRO, Y SIN COBRO NO NACE EL PEDIDO (condición ③
  --    de la letra: jamás se envía prometiendo cobrar después). El día que la
  --    pasarela exista (D-778 muere), este cuerpo cobra y llama a
  --    crear_pedido_despensa con los items/entrega guardados.
  RETURN jsonb_build_object('ok', false, 'error', 'pasarela_no_afiliada',
                            'pendientes_de_cobro', v_pendientes,
                            'detalle', 'D-778: el interruptor existe; el primer cobro real espera a la pasarela.',
                            'pedidos_creados', 0);
END $$;

REVOKE ALL ON FUNCTION public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, integer, text) TO authenticated;
REVOKE ALL ON FUNCTION public.alternar_recurrencia(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alternar_recurrencia(uuid, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.avisar_recurrencias_proximas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ejecutar_recurrencias_vencidas() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('avisar-recurrencias', '0 13 * * *',
  $$SELECT public.avisar_recurrencias_proximas()$$);

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_buyer uuid; v_of uuid; v_rec uuid; v_res jsonb;
  v_int_antes int; v_rec_antes int; v_ped_antes int; v_n int;
  v_ok boolean; v_msg text;
BEGIN
  SELECT count(*) INTO v_int_antes FROM notificacion_intencion;
  SELECT count(*) INTO v_rec_antes FROM pedidos_recurrencias;
  SELECT count(*) INTO v_ped_antes FROM pedidos;

  SELECT cc.id INTO v_cc
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id INTO v_of FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  SELECT fm.user_id INTO v_buyer FROM familia_miembro fm
   WHERE fm.hasta IS NULL AND fm.rol IN ('adulto_titular','adulto_autorizado') LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role','authenticated')::text, true);

  -- ── A · las dos cadencias a la vez rebotan; una sola entra ───────────────
  v_ok := true;
  BEGIN
    PERFORM configurar_recurrencia(v_cc,
      jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
      '{"direccion":"x","ciudad":"Quito"}'::jsonb, 30, 15);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'cadencia_invalida%' THEN
    RAISE EXCEPTION 'ABORTA: dos cadencias a la vez entraron (%).', COALESCE(v_msg,'sin error');
  END IF;
  v_res := configurar_recurrencia(v_cc,
    jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
    '{"direccion":"x","ciudad":"Quito"}'::jsonb, 30, NULL, 2);
  v_rec := (v_res->>'recurrencia_id')::uuid;

  -- ── B · el aviso: dentro de la ventana avisa UNA vez ─────────────────────
  UPDATE pedidos_recurrencias SET proximo_pedido_fecha = current_date + 2 WHERE id = v_rec;
  PERFORM avisar_recurrencias_proximas();
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE clave_dedup = 'recurrencia:' || v_rec || ':' || (current_date + 2);
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: el aviso previo no nació (%).', v_n; END IF;
  PERFORM avisar_recurrencias_proximas();
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE clave_dedup LIKE 'recurrencia:' || v_rec || '%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: el aviso se repitió (%).', v_n; END IF;

  -- ── C · el interruptor apaga en un toque, y apagada NO avisa ─────────────
  PERFORM alternar_recurrencia(v_rec, false);
  UPDATE pedidos_recurrencias
     SET proximo_pedido_fecha = current_date + 3, aviso_enviado_para = NULL
   WHERE id = v_rec;
  PERFORM avisar_recurrencias_proximas();
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE clave_dedup = 'recurrencia:' || v_rec || ':' || (current_date + 3);
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: la recurrencia APAGADA avisó igual.'; END IF;

  -- ── D · 🔴 el ejecutor NO crea pedidos: no hay pasarela (D-778) ──────────
  PERFORM alternar_recurrencia(v_rec, true);
  UPDATE pedidos_recurrencias SET proximo_pedido_fecha = current_date WHERE id = v_rec;
  v_res := ejecutar_recurrencias_vencidas();
  IF (v_res->>'ok')::boolean OR v_res->>'error' <> 'pasarela_no_afiliada' THEN
    RAISE EXCEPTION 'ABORTA D-778: el ejecutor no rebotó por pasarela (%).', v_res->>'error';
  END IF;
  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN
    RAISE EXCEPTION 'ABORTA D-778: el ejecutor CREÓ pedidos sin pasarela.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM notificacion_intencion WHERE clave_dedup LIKE 'recurrencia:' || v_rec || '%';
  DELETE FROM pedidos_recurrencias WHERE id = v_rec;

  SELECT count(*) INTO v_n FROM notificacion_intencion;
  IF v_n <> v_int_antes THEN RAISE EXCEPTION 'ABORTA 76(g): intenciones % vs %', v_n, v_int_antes; END IF;
  SELECT count(*) INTO v_n FROM pedidos_recurrencias;
  IF v_n <> v_rec_antes THEN RAISE EXCEPTION 'ABORTA 76(g): recurrencias % vs %', v_n, v_rec_antes; END IF;

  RAISE NOTICE 'CINTURÓN S96-M7: una sola cadencia entra, el aviso nace una vez y respeta el interruptor, y el ejecutor SIN pasarela no crea nada (D-778). Residuo 0.';
END $$;

COMMIT;

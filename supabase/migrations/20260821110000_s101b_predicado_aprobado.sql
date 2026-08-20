-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · UN SOLO PREDICADO DE «APROBADO», PORQUE EL PROVEEDOR HABLA DOS ║
-- ║ VOCABULARIOS SEGÚN EL CANAL                                             ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821110000.sql ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 MEDIDO EN LA PRIMERA CORRIDA REAL DEL BARRIDO (20-ago) ══════════════
--
-- El barrido revisó los **dos débitos aprobados de hoy** y **escaló los dos**.
-- Abrir el crudo —antes de opinar— mostró por qué:
--
--   · el **webhook** manda   `"status": "1"`        (número como texto)
--   · la **consulta activa** manda `"status": "success"` (palabra)
--
-- **El mismo proveedor, el mismo hecho, dos vocabularios según el canal.**
-- Mi resolvedor solo entendía `'1'` ⇒ trataba un cobro aprobado como huérfano.
--
-- *Es la clase de defecto que ningún test escrito por mí iba a encontrar: mi
-- fixture usaba el vocabulario que yo ya conocía. Lo encontró correr contra el
-- proveedor de verdad y **abrir lo que contestó**.*
--
-- 🔴 Y por qué un predicado ÚNICO en vez de dos parches: **dos caminos que
--    deciden lo mismo por separado divergen el día que aparezca un tercer
--    vocabulario** — y ese día uno confirmaría y el otro escalaría el mismo
--    pago. La pregunta «¿este pago está aprobado?» tiene **un solo dueño**.

CREATE OR REPLACE FUNCTION public._pago_aprobado(p_crudo jsonb)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    -- Aprobado si CUALQUIERA de los dos vocabularios lo dice…
    ( lower(coalesce(p_crudo->'transaction'->>'status','')) IN ('1','success')
      OR upper(coalesce(p_crudo->'transaction'->>'current_status','')) = 'APPROVED' )
    -- …y NINGUNO lo desmiente. *Ante señales que se contradicen no se confirma:
    --  un cobro confirmado de más es plata que hay que ir a devolver.*
    AND upper(coalesce(p_crudo->'transaction'->>'current_status','APPROVED'))
        NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED');
$$;

COMMENT ON FUNCTION public._pago_aprobado(jsonb) IS
  'S101-B: único dueño de la pregunta «¿este pago está aprobado?». Existe porque '
  'el proveedor usa status="1" en el webhook y status="success" en la consulta '
  'activa, y dos lectores separados divergirían con el próximo vocabulario.';

-- Los dos caminos pasan a preguntarle a él.
CREATE OR REPLACE FUNCTION public.resolver_consulta_activa(
  p_compra_id uuid, p_crudo jsonb, p_origen text DEFAULT 'barrido'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_tx text; v_auth text; v_monto numeric; v_compra record;
  v_res jsonb; v_user uuid; v_resol text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'consulta_activa_no_es_del_cliente' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_compra.id IS NULL THEN RAISE EXCEPTION 'compra_no_existe' USING ERRCODE='22023'; END IF;
  IF v_compra.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada');
  END IF;

  v_tx    := p_crudo->'transaction'->>'id';
  v_auth  := p_crudo->'transaction'->>'authorization_code';
  v_monto := NULLIF(p_crudo->'transaction'->>'amount','')::numeric;

  IF _pago_aprobado(p_crudo) THEN
    v_res := confirmar_pago_compra(
      p_compra_id => p_compra_id, p_proveedor => 'nuvei', p_referencia => v_tx,
      p_clave_idempotencia => 'ca:' || COALESCE(v_tx, p_compra_id::text),
      p_payload => p_crudo, p_confirmado_por => 'consulta_activa',
      p_transaction_id => v_tx, p_monto => v_monto, p_authorization_code => v_auth,
      p_marca => p_crudo->'card'->>'type', p_bin => p_crudo->'card'->>'bin',
      p_ultimos4 => p_crudo->'card'->>'number');
    v_resol := 'confirmado_tardio';

    IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
      SELECT user_id INTO v_user FROM compras WHERE id = p_compra_id;
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => jsonb_build_object('transaction_id', v_tx,
                     'authorization_code', v_auth, 'monto', v_monto,
                     'moneda', v_compra.moneda, 'compra_id', p_compra_id),
        p_clave_dedup => 'comprobante:' || p_compra_id::text);
    END IF;
  ELSE
    -- 🔴 SE ESCALA, NO SE DECIDE. La compra no se marca de ninguna forma.
    v_resol := 'huerfano_escalado';
  END IF;

  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
  SELECT i.id, 'nuvei', 'consulta_activa',
         jsonb_build_object('crudo', p_crudo, 'resolucion', v_resol, 'origen', p_origen),
         'ca:' || COALESCE(v_tx, p_compra_id::text) || ':' || i.id::text || ':' || v_resol, now()
    FROM pagos_intentos i WHERE i.compra_id = p_compra_id
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'resolucion', v_resol,
                            'compra_id', p_compra_id, 'transaction_id', v_tx);
END $$;

REVOKE ALL ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) TO service_role;

DO $$
BEGIN
  -- Los DOS vocabularios medidos, y el desmentido.
  IF NOT _pago_aprobado('{"transaction":{"status":"1"}}'::jsonb) THEN
    RAISE EXCEPTION 'CINTURON: no reconoce el vocabulario del webhook'; END IF;
  IF NOT _pago_aprobado('{"transaction":{"status":"success","current_status":"APPROVED"}}'::jsonb) THEN
    RAISE EXCEPTION 'CINTURON: no reconoce el vocabulario de la consulta activa'; END IF;
  IF _pago_aprobado('{"transaction":{"status":"2","current_status":"CANCELLED"}}'::jsonb) THEN
    RAISE EXCEPTION 'CINTURON: confirma un cancelado'; END IF;
  IF _pago_aprobado('{"transaction":{"status":"success","current_status":"CANCELLED"}}'::jsonb) THEN
    RAISE EXCEPTION 'CINTURON: confirma con senales que se contradicen'; END IF;
  RAISE NOTICE 'cinturon verde: los dos vocabularios, y ninguna senal contradictoria confirma';
END $$;

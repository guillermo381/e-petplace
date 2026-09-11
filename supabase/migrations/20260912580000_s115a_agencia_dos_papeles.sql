-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA COMPUERTA EN AGENCIA PIDE LOS DOS PAPELES — y su RESTA
--   Firma del founder (10-sep-2026) · `MODELO_FISCAL` E7.
--
-- 🔴 LO QUE FALTABA EN `20260912470000`. Esa migración acertó el diagnóstico —la
--    clínica no le vende nada a Satori, así que su factura a Satori no existe—
--    y se quedó a mitad: pedía sólo la comisión emitida. **Pero el pago en
--    agencia tampoco puede girarse sin papel.** Lo que respalda esa plata es la
--    factura que la clínica le emitió A LA FAMILIA.
--
-- LA IDENTIDAD, que no es una convención elegida sino la aritmética de la
-- agencia: la familia pagó el bruto, Satori se quedó con su comisión, y lo que
-- queda es del tercero.
--
--     Σ factura_tercero_cliente  −  Σ comision_prestador  =  monto_neto_a_pagar
--
-- *Si los dos papeles están y la resta no da, algo se cobró o se facturó mal —
-- y el momento de verlo es antes de girar, no en la conciliación del mes.*
--
-- 🔴 «VALIDADA» NO ES «MARCADA COMO AUTORIZADA». Para la factura del tercero se
--    exige `sri_numero_autorizacion IS NOT NULL`: ese número lo escribe
--    `fiscal-validar-clave` cuando el web service contesta, y **no hay forma de
--    ponerlo a mano sin haber preguntado**. Un `estado='autorizada'` puede
--    escribirlo cualquiera con acceso; el número de autorización, no.
--
-- Cierra un circuito que ya existía y al que nadie le había atado las puntas:
-- la fila `recibido · pendiente_manual` ya nace con el pago (outbox fiscal) y
-- `fiscal-validar-clave` ya la valida. Faltaba quien exigiera las dos cosas.
--
-- 76(g) — VEDA: NO RIGE (reemplazo de dos funciones; 0 liquidaciones).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.liquidacion_respaldo(p_liquidacion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_l public.liquidaciones; v_modelo text; v_tol numeric; v_neto numeric;
  v_prov numeric; v_n_prov int;
  v_tercero numeric; v_n_tercero int;
  v_comision numeric; v_n_comision int;
  v_suma numeric; v_codigo text; v_pide text;
BEGIN
  SELECT * INTO v_l FROM public.liquidaciones WHERE id = p_liquidacion_id;
  IF v_l.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'liquidacion_no_existe');
  END IF;
  v_neto := COALESCE(v_l.monto_neto_a_pagar, 0);

  SELECT modelo_comercial::text INTO v_modelo
    FROM public.cuentas_comerciales WHERE id = v_l.cuenta_comercial_id;
  IF v_modelo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cuenta_sin_modelo_comercial',
      'detalle', 'Sin saber si es reventa o agencia no se sabe qué papel pedir.');
  END IF;

  SELECT COALESCE(valor::numeric, 0) INTO v_tol
    FROM public.app_config WHERE clave = 'liquidacion_tolerancia_comprobante';
  v_tol := COALESCE(v_tol, 0);

  IF v_modelo = 'reventa_pura' THEN
    v_pide := 'recibido/comprobante_proveedor';
    SELECT COALESCE(sum(total),0), count(*) INTO v_prov, v_n_prov
      FROM public.documentos_fiscales
     WHERE liquidacion_id = p_liquidacion_id
       AND sentido = 'recibido' AND rol = 'comprobante_proveedor'
       AND estado = 'autorizada';
    v_suma := v_prov;
    v_codigo := CASE WHEN v_n_prov = 0 THEN 'sin_comprobante'
                     WHEN abs(v_suma - v_neto) > v_tol THEN 'no_cuadra'
                     ELSE 'respaldada' END;

    RETURN jsonb_build_object(
      'ok', v_codigo = 'respaldada', 'modelo', v_modelo, 'papel_que_se_pide', v_pide,
      'comprobantes', v_n_prov, 'suma_comprobantes', v_suma,
      'neto_a_pagar', v_neto, 'diferencia', round(v_suma - v_neto, 2),
      'tolerancia', v_tol, 'codigo', v_codigo);
  END IF;

  -- ── AGENCIA: los DOS papeles, y su resta ────────────────────────────────
  v_pide := 'recibido/factura_tercero_cliente (con clave validada) − emitido/comision_prestador';

  SELECT COALESCE(sum(total),0), count(*) INTO v_tercero, v_n_tercero
    FROM public.documentos_fiscales
   WHERE liquidacion_id = p_liquidacion_id
     AND sentido = 'recibido' AND rol = 'factura_tercero_cliente'
     AND estado = 'autorizada'
     /* 🔴 «validada» = el SRI contestó. Ese número lo escribe fiscal-validar-clave
        y no se puede poner a mano sin haber preguntado. */
     AND sri_numero_autorizacion IS NOT NULL;

  SELECT COALESCE(sum(total),0), count(*) INTO v_comision, v_n_comision
    FROM public.documentos_fiscales
   WHERE liquidacion_id = p_liquidacion_id
     AND sentido = 'emitido' AND rol = 'comision_prestador'
     AND estado = 'autorizada';

  v_suma := v_tercero - v_comision;
  v_codigo := CASE
    WHEN v_n_tercero = 0  THEN 'sin_factura_del_tercero'
    WHEN v_n_comision = 0 THEN 'sin_factura_de_comision'
    WHEN abs(v_suma - v_neto) > v_tol THEN 'no_cuadra'
    ELSE 'respaldada' END;

  RETURN jsonb_build_object(
    'ok', v_codigo = 'respaldada', 'modelo', v_modelo, 'papel_que_se_pide', v_pide,
    'facturas_del_tercero', v_n_tercero, 'suma_del_tercero', v_tercero,
    'facturas_de_comision', v_n_comision, 'suma_de_comision', v_comision,
    'suma_comprobantes', v_suma,          -- la RESTA: es lo que se compara
    'neto_a_pagar', v_neto, 'diferencia', round(v_suma - v_neto, 2),
    'tolerancia', v_tol, 'codigo', v_codigo,
    'identidad', 'tercero_al_cliente − comision_de_satori = neto_del_tercero');
END $$;

-- La puerta de adjuntar acepta, en agencia, LOS DOS papeles.
CREATE OR REPLACE FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(
  p_documento_id uuid, p_liquidacion_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_d public.documentos_fiscales; v_l public.liquidaciones; v_modelo text; v_vale boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'solo_admin');
  END IF;
  SELECT * INTO v_d FROM public.documentos_fiscales WHERE id = p_documento_id;
  SELECT * INTO v_l FROM public.liquidaciones WHERE id = p_liquidacion_id;
  IF v_d.id IS NULL OR v_l.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_o_liquidacion_no_existe');
  END IF;
  IF v_d.cuenta_comercial_id IS DISTINCT FROM v_l.cuenta_comercial_id THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comprobante_de_otra_cuenta');
  END IF;

  SELECT modelo_comercial::text INTO v_modelo
    FROM public.cuentas_comerciales WHERE id = v_l.cuenta_comercial_id;

  v_vale := CASE
    WHEN v_modelo = 'reventa_pura'
      THEN v_d.sentido = 'recibido' AND v_d.rol = 'comprobante_proveedor'
    ELSE (v_d.sentido = 'recibido' AND v_d.rol = 'factura_tercero_cliente')
      OR (v_d.sentido = 'emitido'  AND v_d.rol = 'comision_prestador')
  END;

  IF NOT v_vale THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'papel_que_no_corresponde',
      'modelo', v_modelo, 'trajo', v_d.sentido::text || '/' || v_d.rol::text,
      'espera', CASE WHEN v_modelo = 'reventa_pura'
                     THEN 'recibido/comprobante_proveedor'
                     ELSE 'recibido/factura_tercero_cliente o emitido/comision_prestador' END);
  END IF;

  /* En agencia, la factura del tercero se adjunta SÓLO si ya está validada: dejar
     adjuntar una sin validar y descubrirlo al pagar sería llegar tarde. */
  IF v_modelo <> 'reventa_pura' AND v_d.rol = 'factura_tercero_cliente'
     AND v_d.sri_numero_autorizacion IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'factura_del_tercero_sin_validar',
      'detalle', 'Corré fiscal-validar-clave sobre este documento: sin número de '
              || 'autorización del SRI no se puede saber que la venta existió.');
  END IF;

  UPDATE public.documentos_fiscales SET liquidacion_id = p_liquidacion_id
   WHERE id = p_documento_id;
  RETURN public.liquidacion_respaldo(p_liquidacion_id) || jsonb_build_object('adjuntado', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.liquidacion_respaldo(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.liquidacion_respaldo(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(uuid, uuid) TO authenticated, service_role;

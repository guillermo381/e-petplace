-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA TOMA DEL SECUENCIAL Y SU PERSISTENCIA SON EL MISMO HECHO
--
-- 🔴 EL DEFECTO, que encontró el e2e de E contra la edge REAL y que es MÍO:
--    con la numeración en un RPC y la persistencia en un UPDATE aparte, entre
--    los dos hay una ventana. Si el UPDATE no entra —y no entró—, **el número
--    quedó consumido y no vive en ninguna fila**. Medido: `ultimo_secuencial=2`
--    con `documentos_fiscales` en CERO filas. *Un secuencial que se toma y no
--    queda en ninguna fila es un hueco que hay que explicarle al SRI.*
--
-- 🔴 Y LA CAUSA RAÍZ ES DE OTRA CLASE, peor y reproducida:
--    `20260912440000` puso el trigger que exige que una clave traiga sus siete
--    insumos, y la edge **desplegada** (versión 1, de la tanda 1) no escribe
--    `ruc_emisor` — esa columna la empecé a escribir hoy **y nunca desplegué**.
--    Reproducido: el UPDATE de la v1 rebota con `clave_sin_insumos` y la fila
--    queda en `borrador`. **Apliqué una migración que invalida las escrituras de
--    la función viva y no moví la función.** Es `D-662` un piso más arriba —el
--    canon la escribió para BUNDLES— y por eso su lección se deposita aparte.
--
-- LA CURA NO ES UN REINTENTO: es que el hecho sea UNO. Este RPC toma el número,
-- calcula la clave y escribe la fila **en la misma transacción**. Si algo
-- rebota, `tomar_secuencial_fiscal` rueda atrás con todo (usa `FOR UPDATE`
-- sobre una fila, no una `sequence`, que es lo que lo hace reversible) y **el
-- número NO se consume**. O la fila queda con su número, o no hay número.
--
-- 76(g) — VEDA: NO RIGE (función nueva; 0 documentos).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fiscal_reservar_numero(
  p_documento_id     uuid,
  p_canonico         jsonb,
  p_canonico_version integer,
  p_proveedor        text,
  p_subtotal_0       numeric,
  p_subtotal_15      numeric,
  p_iva              numeric,
  p_total            numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_d public.documentos_fiscales; v_e public.fiscal_emisor;
  v_sec text; v_clave text; v_amb text; v_filas int;
BEGIN
  SELECT * INTO v_d FROM public.documentos_fiscales WHERE id = p_documento_id FOR UPDATE;
  IF v_d.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_no_existe');
  END IF;

  /* IDEMPOTENTE: si ya tiene número, se devuelve el que tiene. Un reintento
     que toma número nuevo no es un reintento — es un documento nuevo, y el
     anterior queda como hueco. */
  IF v_d.secuencial IS NOT NULL AND v_d.clave_acceso IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_tenia',
      'secuencial', v_d.secuencial, 'clave_acceso', v_d.clave_acceso);
  END IF;

  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;
  IF v_e.ruc IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_emisor_configurado');
  END IF;
  v_amb := CASE v_e.ambiente WHEN 1 THEN 'pruebas' WHEN 2 THEN 'produccion' ELSE NULL END;
  IF v_amb IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ambiente_invalido', 'valor', v_e.ambiente);
  END IF;

  /* ① El número. Dentro de ESTA transacción: si algo de abajo rebota, vuelve. */
  v_sec := public.tomar_secuencial_fiscal(v_e.ruc, v_e.establecimiento, v_e.punto_emision, v_d.tipo);

  /* ② La clave, derivada — la MISMA función que el CHECK usa para verificarla.
        Si acá diera NULL, el UPDATE de abajo rebotaría; se corta antes y con
        nombre, para no dejar el diagnóstico en un código de constraint. */
  v_clave := public.fiscal_clave_acceso(v_d.fecha_emision, v_d.tipo, v_e.ruc, v_amb,
                                        v_e.establecimiento, v_e.punto_emision, v_sec);
  IF v_clave IS NULL THEN
    RAISE EXCEPTION 'clave_no_derivable'
      USING ERRCODE = '22023',
            DETAIL = format('ruc=%s amb=%s estab=%s punto=%s sec=%s fecha=%s',
                            v_e.ruc, v_amb, v_e.establecimiento, v_e.punto_emision,
                            v_sec, v_d.fecha_emision);
  END IF;

  /* ③ La fila, con TODO lo que la vuelve reconstruible. */
  UPDATE public.documentos_fiscales SET
    estado = 'emitiendo',
    establecimiento = v_e.establecimiento,
    punto_emision   = v_e.punto_emision,
    secuencial      = v_sec,
    clave_acceso    = v_clave,
    ruc_emisor      = v_e.ruc,
    razon_social_emisor = v_e.razon_social,
    direccion_emisor    = v_e.direccion_matriz,
    sri_ambiente    = v_amb,
    canonico         = p_canonico,
    canonico_version = p_canonico_version,
    proveedor        = p_proveedor,
    subtotal_0  = p_subtotal_0,
    subtotal_15 = p_subtotal_15,
    iva         = p_iva,
    total       = COALESCE(p_total, total)
  WHERE id = p_documento_id;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  /* 🔴 CERO FILAS ES UN ROJO, NO UN SILENCIO. Es el modo de falla que produjo
     todo esto: en supabase-js un update que afecta 0 filas no es error. Acá
     LANZA, y al lanzar el secuencial vuelve. */
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'persistencia_afecto_% _filas', v_filas
      USING ERRCODE = '25000',
            DETAIL = 'La reserva del número no llegó a la fila. El secuencial NO se consume.';
  END IF;

  RETURN jsonb_build_object('ok', true, 'codigo', 'reservado',
    'secuencial', v_sec, 'clave_acceso', v_clave, 'filas', v_filas);
END $$;

COMMENT ON FUNCTION public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric) IS
  'Toma el secuencial, deriva la clave y persiste la fila EN UN SOLO HECHO. '
  'O la fila queda con su número, o el número no se consume. Idempotente.';

REVOKE EXECUTE ON FUNCTION public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- CINTURÓN — el rojo es que un fallo NO consuma el número.
-- ─────────────────────────────────────────────────────────────────────────
DO $c$
DECLARE
  v_id uuid; v_ocupa uuid; v_r jsonb; v_antes bigint; v_despues bigint;
  v_e public.fiscal_emisor; v_paso boolean; v_prox text;
BEGIN
  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;

  -- ── (a) 🔴 EL ROJO, y con un fallo REAL, no fabricado: otro documento ya
  --        ocupa el secuencial que sigue. El UPDATE choca contra
  --        `uq_documento_fiscal_secuencial` — que es una carrera que puede
  --        pasar de verdad — y el número NO se puede consumir.
  SELECT ultimo_secuencial INTO v_antes FROM fiscal_sequences
   WHERE ruc=v_e.ruc AND establecimiento=v_e.establecimiento
     AND punto_emision=v_e.punto_emision AND tipo_documento='factura';
  v_prox := lpad((v_antes + 1)::text, 9, '0');

  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero, items,
     fecha_emision, ruc_emisor, sri_ambiente, establecimiento, punto_emision, secuencial)
  VALUES ('EC','factura',1,'emitiendo','emitido','venta_cliente',false,'[]'::jsonb,
          public.fiscal_hoy(), v_e.ruc,
          CASE v_e.ambiente WHEN 1 THEN 'pruebas' ELSE 'produccion' END,
          v_e.establecimiento, v_e.punto_emision, v_prox)
  RETURNING id INTO v_ocupa;

  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero, items, fecha_emision)
  VALUES ('EC','factura',10,'borrador','emitido','venta_cliente',false,'[]'::jsonb, public.fiscal_hoy())
  RETURNING id INTO v_id;

  BEGIN
    v_r := public.fiscal_reservar_numero(v_id, '{}'::jsonb, 3, 'simulador', 0,0,0,10);
    v_paso := COALESCE((v_r->>'ok')::boolean, false);
  EXCEPTION WHEN OTHERS THEN v_paso := false;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: reservó sobre un secuencial ya ocupado';
  END IF;

  SELECT ultimo_secuencial INTO v_despues FROM fiscal_sequences
   WHERE ruc=v_e.ruc AND establecimiento=v_e.establecimiento
     AND punto_emision=v_e.punto_emision AND tipo_documento='factura';
  IF v_despues <> v_antes THEN
    RAISE EXCEPTION 'cinturon 🔴: el fallo QUEMO un secuencial (% → %). Ese es '
                    'exactamente el defecto que esta migracion cura.', v_antes, v_despues;
  END IF;
  IF EXISTS (SELECT 1 FROM documentos_fiscales WHERE id=v_id AND secuencial IS NOT NULL) THEN
    RAISE EXCEPTION 'cinturon: la fila quedo a medias';
  END IF;

  DELETE FROM public.documentos_fiscales WHERE id = v_ocupa;

  -- ── (b) EL VERDE: reserva, y la fila QUEDA con su número y su clave ──────
  v_r := public.fiscal_reservar_numero(v_id, '{"v":3}'::jsonb, 3, 'simulador', 10,0,0,10);
  IF NOT (v_r->>'ok')::boolean THEN
    RAISE EXCEPTION 'cinturon: la reserva legitima fallo: %', v_r::text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM documentos_fiscales
                  WHERE id=v_id AND secuencial = v_r->>'secuencial'
                    AND clave_acceso = v_r->>'clave_acceso' AND ruc_emisor IS NOT NULL) THEN
    RAISE EXCEPTION 'cinturon 🔴: la funcion dijo que reservo y la fila no lo tiene. '
                    'Es el mismo defecto con otra ropa.';
  END IF;

  -- ── (c) IDEMPOTENTE: la segunda llamada NO toma otro número ──────────────
  SELECT ultimo_secuencial INTO v_antes FROM fiscal_sequences
   WHERE ruc=v_e.ruc AND establecimiento=v_e.establecimiento
     AND punto_emision=v_e.punto_emision AND tipo_documento='factura';
  v_r := public.fiscal_reservar_numero(v_id, '{"v":3}'::jsonb, 3, 'simulador', 10,0,0,10);
  SELECT ultimo_secuencial INTO v_despues FROM fiscal_sequences
   WHERE ruc=v_e.ruc AND establecimiento=v_e.establecimiento
     AND punto_emision=v_e.punto_emision AND tipo_documento='factura';
  IF v_r->>'codigo' <> 'ya_tenia' OR v_despues <> v_antes THEN
    RAISE EXCEPTION 'cinturon 🔴: la segunda llamada tomo otro numero (% → %)', v_antes, v_despues;
  END IF;

  DELETE FROM public.documentos_fiscales WHERE id = v_id;
  IF (SELECT count(*) FROM documentos_fiscales) <> 0 THEN
    RAISE EXCEPTION 'cinturon: residuo';
  END IF;
  RAISE NOTICE 'cinturon VERDE: el fallo NO quema numero · la reserva queda EN LA FILA · idempotente';
END $c$;

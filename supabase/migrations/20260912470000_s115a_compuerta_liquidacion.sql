-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA COMPUERTA DE LA LIQUIDACIÓN
--   Sin comprobante validado del período que CUADRE con el neto, no se paga.
--
-- 🔴 DÓNDE VA LA COMPUERTA, medido antes de escribir: **nadie escribe
--    `liquidaciones.estado` desde una función.** El censo por cuerpo devolvió
--    cero, y las policies dicen por qué: `admin_all_liquidaciones · ALL`. El
--    estado lo mueve un UPDATE directo del admin. *Poner el guard dentro de una
--    función que nadie llama habría sido motor sin puerta* — va en un TRIGGER,
--    que es el único lugar por donde ese UPDATE pasa.
--
-- 🔴 Y LA REGLA NO ES UNA PARA TODOS, porque el papel que respalda el giro
--    depende del modelo comercial de la cuenta (medido: 10 reventa · 5 fachada):
--
--    · REVENTA — Satori compra y revende. El prestador le factura A SATORI, y
--      esa factura recibida es el respaldo del pago: `sentido='recibido'`,
--      `rol='comprobante_proveedor'`, `estado='autorizada'`.
--
--    · AGENCIA — la clínica facturó al cliente; Satori nunca le compró nada, así
--      que **no hay ni va a haber factura del prestador a Satori**. Exigirla acá
--      bloquearía el pago para siempre. Lo que Satori sí tiene que haber emitido
--      es SU COMISIÓN: `sentido='emitido'`, `rol='comision_prestador'`.
--      ⚠️ ESTA RAMA ES INTERPRETACIÓN FISCAL, NO MEDICIÓN — la mesa la ratifica
--      o la corrige. Se implementa así porque la alternativa (no pedir nada) es
--      girar plata de terceros sin ningún papel, y eso no puede ser el default.
--
-- NO HAY ESCAPE. No se construyó override: si hace falta pagar sin comprobante,
-- es una decisión que tiene que verse, no una perilla. *Una compuerta con una
-- salida de emergencia sin firma es una compuerta que se abre el día que apura.*
--
-- 76(g) — VEDA: **NO RIGE.** DDL + trigger. `liquidaciones` tiene 0 filas.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① EL VÍNCULO EXPLÍCITO. Un comprobante NO se ata por fecha —el prestador
--    factura DESPUÉS de que el período cierra, y una ventana de fechas o deja
--    afuera lo legítimo o deja entrar lo ajeno—. Se ata a mano, y ese acto es
--    parte de aprobar la liquidación.
ALTER TABLE public.documentos_fiscales
  ADD COLUMN IF NOT EXISTS liquidacion_id uuid REFERENCES public.liquidaciones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_fiscales_liquidacion
  ON public.documentos_fiscales (liquidacion_id) WHERE liquidacion_id IS NOT NULL;

COMMENT ON COLUMN public.documentos_fiscales.liquidacion_id IS
  'La liquidación que este comprobante respalda. Se ata a mano: atarlo por rango '
  'de fechas dejaría afuera la factura que el prestador emite después del corte.';

-- ② LA TOLERANCIA ES DATO (D-759). Nace en CERO —cuadrar es cuadrar— y existe
--    para que el día que el contador diga «un centavo de redondeo es aceptable»
--    sea una fila y no un deploy.
INSERT INTO public.app_config (clave, valor, tipo, categoria, es_publico, descripcion)
VALUES ('liquidacion_tolerancia_comprobante', '0', 'numero', 'legal', false,
        'Diferencia maxima admitida entre el neto de una liquidacion y el total de '
        'sus comprobantes de respaldo, en la moneda de la liquidacion. Nace en 0: '
        'cuadrar es cuadrar. Subirlo es decision del contador, no del que paga.')
ON CONFLICT (clave) DO NOTHING;

-- ③ EL LECTOR — se puede preguntar ANTES de intentar pagar, y dice lo mismo que
--    va a decir el guard. *Un guard que sólo habla cuando ya rebotaste obliga a
--    descubrir el requisito chocando contra él.*
CREATE OR REPLACE FUNCTION public.liquidacion_respaldo(p_liquidacion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_l public.liquidaciones; v_modelo text; v_tol numeric;
  v_sum numeric; v_n int; v_rol public.fiscal_rol_enum; v_sentido public.fiscal_sentido_enum;
BEGIN
  SELECT * INTO v_l FROM public.liquidaciones WHERE id = p_liquidacion_id;
  IF v_l.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'liquidacion_no_existe');
  END IF;

  SELECT modelo_comercial::text INTO v_modelo
    FROM public.cuentas_comerciales WHERE id = v_l.cuenta_comercial_id;
  IF v_modelo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cuenta_sin_modelo_comercial',
      'detalle', 'Sin saber si es reventa o agencia no se sabe qué papel pedir.');
  END IF;

  IF v_modelo = 'reventa_pura' THEN
    v_sentido := 'recibido'; v_rol := 'comprobante_proveedor';
  ELSE
    v_sentido := 'emitido';  v_rol := 'comision_prestador';
  END IF;

  SELECT COALESCE(sum(total), 0), count(*) INTO v_sum, v_n
    FROM public.documentos_fiscales
   WHERE liquidacion_id = p_liquidacion_id
     AND sentido = v_sentido AND rol = v_rol
     AND estado = 'autorizada';

  SELECT COALESCE(valor::numeric, 0) INTO v_tol
    FROM public.app_config WHERE clave = 'liquidacion_tolerancia_comprobante';
  v_tol := COALESCE(v_tol, 0);

  RETURN jsonb_build_object(
    'ok', v_n > 0 AND abs(v_sum - COALESCE(v_l.monto_neto_a_pagar,0)) <= v_tol,
    'modelo', v_modelo,
    'papel_que_se_pide', v_sentido::text || '/' || v_rol::text,
    'comprobantes', v_n,
    'suma_comprobantes', v_sum,
    'neto_a_pagar', COALESCE(v_l.monto_neto_a_pagar, 0),
    'diferencia', round(v_sum - COALESCE(v_l.monto_neto_a_pagar,0), 2),
    'tolerancia', v_tol,
    'codigo', CASE WHEN v_n = 0 THEN 'sin_comprobante'
                   WHEN abs(v_sum - COALESCE(v_l.monto_neto_a_pagar,0)) > v_tol THEN 'no_cuadra'
                   ELSE 'respaldada' END);
END $$;

-- ④ LA PUERTA PARA ATAR EL COMPROBANTE (admin). Verifica que el papel sea del
--    tipo que esa cuenta necesita — atar el papel equivocado y descubrirlo al
--    pagar sería llegar tarde.
CREATE OR REPLACE FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(
  p_documento_id uuid, p_liquidacion_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_d public.documentos_fiscales; v_l public.liquidaciones; v_modelo text;
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
  IF (v_modelo = 'reventa_pura'
        AND NOT (v_d.sentido = 'recibido' AND v_d.rol = 'comprobante_proveedor'))
     OR (v_modelo <> 'reventa_pura'
        AND NOT (v_d.sentido = 'emitido' AND v_d.rol = 'comision_prestador')) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'papel_que_no_corresponde',
      'modelo', v_modelo, 'trajo', v_d.sentido::text || '/' || v_d.rol::text);
  END IF;

  UPDATE public.documentos_fiscales SET liquidacion_id = p_liquidacion_id
   WHERE id = p_documento_id;
  RETURN public.liquidacion_respaldo(p_liquidacion_id) || jsonb_build_object('adjuntado', true);
END $$;

-- ⑤ EL GUARD — donde el UPDATE de verdad pasa.
CREATE OR REPLACE FUNCTION public._trg_liquidacion_exige_comprobante()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v jsonb;
BEGIN
  IF NEW.estado <> 'pagado' OR COALESCE(OLD.estado::text,'') = 'pagado' THEN
    RETURN NEW;
  END IF;

  v := public.liquidacion_respaldo(NEW.id);

  IF COALESCE((v->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'liquidacion_sin_respaldo_fiscal'
      USING ERRCODE = '42501',
            DETAIL = v::text,
            HINT = 'Se atan los comprobantes con fiscal_adjuntar_comprobante_liquidacion() '
                   'y se consulta el estado con liquidacion_respaldo(). No hay override: '
                   'pagar sin papel es una decision que tiene que verse.';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_liquidacion_exige_comprobante
  BEFORE UPDATE OF estado ON public.liquidaciones
  FOR EACH ROW EXECUTE FUNCTION public._trg_liquidacion_exige_comprobante();

-- ⑥ L-140
REVOKE EXECUTE ON FUNCTION public.liquidacion_respaldo(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_liquidacion_exige_comprobante() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.liquidacion_respaldo(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fiscal_adjuntar_comprobante_liquidacion(uuid, uuid) TO authenticated, service_role;

-- S115-A · TANDA 1 (③) — LA EMISIÓN, COLGADA DEL PUNTO ÚNICO
-- Letra: MODELO_FISCAL v0.3 §2 («la factura de venta cuelga del arco de pagos») · v0.4 E1/E6.
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912270000-outbox-fiscal.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DÓNDE SE COLGÓ, Y POR QUÉ NO DONDE LA LETRA DICE LITERAL.
--    La letra dice «en `aplicar_evento_de_pago`». Medido: esa función tiene ~1000
--    líneas y **cuatro** `UPDATE ... SET estado='aprobado'` distintos (uno por
--    familia de sujeto) más una delegación a `confirmar_pago_compra`. Colgar el
--    outbox ahí serían CINCO injertos en el motor de pagos, y **el que se olvide
--    no falla: simplemente no factura ese sujeto**, en silencio.
--    ⇒ Se cuelga de un TRIGGER sobre la transición de `pagos_intentos`. Es la misma
--    transacción que lleva el pago a pagado —que es lo que la letra pide— y es un
--    SUPERCONJUNTO del punto único: atrapa también `confirmar_pago_compra`,
--    `confirmar_pago_pedido` y cualquier camino futuro. *Un sujeto nuevo nace
--    facturado sin que nadie se acuerde de acordarse.* Mismo precedente que
--    `_trg_reverso_mueve_sujeto`, que S105 puso por trigger justamente porque
--    cablearlo por riel es cómo el segundo riel se olvida.
--
-- 🔴 Y NO PUEDE ROMPER EL COBRO. El pago YA OCURRIÓ cuando este trigger corre.
--    Si el outbox lanza, la excepción revertiría la marca del pago y el proveedor
--    reintentaría contra plata ya cobrada. ⇒ se ATRAPA, y el fallo se escribe con
--    su nombre en una fila `pendiente_manual` — mismo criterio que el ACTO 2.

BEGIN;

-- ── QUIÉN RECIBE EL COMPROBANTE ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_receptor_fiscal(p_user_id uuid, p_monto numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_tope numeric; v_tp public.tax_profiles;
BEGIN
  SELECT valor::numeric INTO v_tope FROM public.app_config
   WHERE clave = 'fiscal_tope_consumidor_final';
  IF v_tope IS NULL THEN
    /* Sin tope configurado no se adivina uno: se dice. */
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'sin_tope_configurado');
  END IF;

  SELECT * INTO v_tp FROM public.tax_profiles
   WHERE user_id = p_user_id AND es_predeterminado LIMIT 1;

  IF v_tp.id IS NOT NULL THEN
    RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', v_tp.id,
      'tipo_identificacion', v_tp.tipo_identificacion, 'identificacion', v_tp.identificacion,
      'razon_social', v_tp.razon_social, 'direccion', v_tp.direccion, 'email', v_tp.email);
  END IF;

  /* 🔴 POR ENCIMA DEL TOPE NO SE INVENTA UN CONSUMIDOR FINAL. La captura de la
     cédula todavía no existe (es de C) ⇒ el documento ESPERA. *Facturar a
     «consumidor final» algo que por ley exige identificación es emitir mal a
     propósito para no dejar un hueco visible.* */
  IF p_monto > v_tope THEN
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'supera_tope_sin_identificacion', 'tope', v_tope);
  END IF;

  RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', NULL,
    'tipo_identificacion', 'consumidor_final', 'identificacion', '9999999999999',
    'razon_social', 'CONSUMIDOR FINAL', 'direccion', NULL, 'email', NULL);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.resolver_receptor_fiscal(uuid, numeric) FROM PUBLIC, anon;

-- ── EL OUTBOX ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_pago_aprobado_outbox_fiscal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_cuenta uuid; v_modelo text; v_user uuid; v_pagado numeric;
  v_rec jsonb; v_estado public.fiscal_estado_enum; v_sentido public.fiscal_sentido_enum;
  v_rol public.fiscal_rol_enum; v_saldo numeric := 0;
BEGIN
  IF NEW.estado <> 'aprobado' OR OLD.estado = 'aprobado' THEN RETURN NEW; END IF;

  BEGIN
    -- La cuenta comercial del sujeto: es quien define el MODELO (v0.4 E1).
    SELECT COALESCE(
      (SELECT p.cuenta_comercial_id FROM pedidos p
        WHERE (NEW.compra_id IS NOT NULL AND p.compra_id = NEW.compra_id)
           OR (NEW.compra_id IS NULL AND p.id = NEW.pedido_id) LIMIT 1),
      (SELECT pr.cuenta_comercial_id FROM evento_cita_servicio c
         JOIN prestadores pr ON pr.id = c.prestador_id WHERE c.id = NEW.cita_id),
      (SELECT pr.cuenta_comercial_id FROM bonos b
         JOIN prestadores pr ON pr.id = b.prestador_id WHERE b.id = NEW.bono_id),
      (SELECT pr.cuenta_comercial_id FROM programas_contratados pc
         JOIN prestadores pr ON pr.id = pc.prestador_id WHERE pc.id = NEW.programa_contratado_id),
      (SELECT pr.cuenta_comercial_id FROM guarderia_suscripciones g
         JOIN prestadores pr ON pr.id = g.prestador_id WHERE g.id = NEW.guarderia_suscripcion_id),
      (SELECT pr.cuenta_comercial_id FROM suscripciones_servicio s
         JOIN prestadores pr ON pr.id = s.prestador_id WHERE s.id = NEW.suscripcion_servicio_id)
    ) INTO v_cuenta;

    SELECT modelo_comercial::text INTO v_modelo FROM cuentas_comerciales WHERE id = v_cuenta;

    v_user := COALESCE(NEW.pagador_user_id, (SELECT user_id FROM compras WHERE id = NEW.compra_id));
    SELECT COALESCE(saldo_aplicado,0) INTO v_saldo FROM compras WHERE id = NEW.compra_id;
    v_pagado := NEW.monto + COALESCE(v_saldo,0);   -- el documento es por el TOTAL

    IF v_modelo IS NULL THEN
      v_sentido := 'emitido'; v_rol := 'venta_cliente'; v_estado := 'pendiente_manual';
      v_rec := jsonb_build_object('resuelto', false, 'motivo', 'cuenta_o_modelo_no_resuelto');

    ELSIF v_modelo = 'marketplace_fachada' THEN
      /* 🔴 AGENCIA: Satori NO factura. La clínica le factura al cliente y la casa
         archiva ese documento con su clave (tanda 2). Nace `recibido` y a mano. */
      v_sentido := 'recibido'; v_rol := 'factura_tercero_cliente'; v_estado := 'pendiente_manual';
      v_rec := jsonb_build_object('resuelto', false, 'motivo', 'agencia_factura_el_tercero');

    ELSE
      v_sentido := 'emitido'; v_rol := 'venta_cliente';
      v_rec := public.resolver_receptor_fiscal(v_user, v_pagado);
      v_estado := CASE WHEN (v_rec->>'resuelto')::boolean
                       THEN 'borrador'::public.fiscal_estado_enum
                       ELSE 'esperando_receptor'::public.fiscal_estado_enum END;
    END IF;

    INSERT INTO public.documentos_fiscales
      (pago_intento_id, user_id, cuenta_comercial_id, country_code, tipo, total, moneda,
       estado, sentido, rol, emitida_por_tercero, tax_profile_id,
       tipo_identificacion, identificacion, razon_social, direccion, email, motivo_rechazo)
    VALUES (NEW.id, v_user, v_cuenta, 'EC', 'factura', v_pagado, COALESCE(NEW.moneda,'USD'),
            v_estado, v_sentido, v_rol, (v_sentido = 'recibido'),
            NULLIF(v_rec->>'tax_profile_id','')::uuid,
            v_rec->>'tipo_identificacion', v_rec->>'identificacion',
            v_rec->>'razon_social', v_rec->>'direccion', v_rec->>'email',
            CASE WHEN (v_rec->>'resuelto')::boolean IS NOT TRUE THEN v_rec->>'motivo' END)
    ON CONFLICT (pago_intento_id) WHERE pago_intento_id IS NOT NULL DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    /* 🔴 EL COBRO YA OCURRIÓ: no se deja caer la excepción. Pero TAMPOCO se calla —
       queda una fila que dice qué pasó, con su nombre. *Un pago sin documento y sin
       rastro es la única forma de perder una obligación tributaria sin enterarse.* */
    BEGIN
      INSERT INTO public.documentos_fiscales
        (pago_intento_id, country_code, tipo, total, estado, sentido, rol,
         emitida_por_tercero, motivo_rechazo)
      VALUES (NEW.id, 'EC', 'factura', NEW.monto, 'pendiente_manual', 'emitido',
              'venta_cliente', false, 'outbox_fallo: ' || left(SQLERRM, 160))
      ON CONFLICT (pago_intento_id) WHERE pago_intento_id IS NOT NULL DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;  -- ni el rastro pudo: el pago no se toca igual
    END;
  END;

  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public._trg_pago_aprobado_outbox_fiscal() FROM PUBLIC, anon;

CREATE TRIGGER trg_pago_aprobado_outbox_fiscal
  AFTER UPDATE OF estado ON public.pagos_intentos
  FOR EACH ROW EXECUTE FUNCTION public._trg_pago_aprobado_outbox_fiscal();

COMMIT;

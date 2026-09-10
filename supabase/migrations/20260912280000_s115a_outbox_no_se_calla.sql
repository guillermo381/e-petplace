-- S115-A · TANDA 1 (③·2) — LA COLUMNA QUE FALTABA Y EL SILENCIO QUE LA TAPÓ
-- Reversa: cubierta por la de (③).
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DEFECTO PROPIO, CAZADO EJERCIENDO — y su forma es la lección:
--    (a) omití `motivo_rechazo` al escribir el libro: la letra la pide y la tabla
--        sólo tenía `sri_error`. El INSERT del outbox la nombraba ⇒ fallaba SIEMPRE.
--    (b) y el `EXCEPTION WHEN OTHERS THEN NULL` del respaldo **se tragó el error de
--        esquema entero**. Resultado medido: el outbox no escribía NADA, para NINGÚN
--        pago, y no había ni una traza. *Mi propia red de seguridad —puesta para que
--        un fallo no rompiera el cobro— fue lo que hizo invisible el fallo.*
--        Es la falla exacta que el comentario de esa función decía estar evitando.
--
--    LA CURA ES DOBLE, porque el defecto era doble:
--      ① la columna existe;
--      ② el respaldo usa SÓLO columnas garantizadas y escribe el motivo en
--         `sri_error`, y además `RAISE WARNING` — si ni eso entra, al menos queda
--         en el log del motor. Y nace un LECTOR (`pagos_aprobados_sin_documento`)
--         que vuelve AUDIBLE el silencio: un cero ahí es una medición, no una fe.

BEGIN;

ALTER TABLE public.documentos_fiscales ADD COLUMN motivo_rechazo text;
COMMENT ON COLUMN public.documentos_fiscales.motivo_rechazo IS
  'Por qué NO se pudo emitir, en voz nuestra. `sri_error` es lo que dijo el SRI; esto es lo que decimos nosotros. Son dos cosas y no se mezclan.';

CREATE OR REPLACE FUNCTION public._trg_pago_aprobado_outbox_fiscal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_cuenta uuid; v_modelo text; v_user uuid; v_pagado numeric;
  v_rec jsonb; v_estado public.fiscal_estado_enum; v_sentido public.fiscal_sentido_enum;
  v_rol public.fiscal_rol_enum; v_saldo numeric := 0; v_err text;
BEGIN
  IF NEW.estado <> 'aprobado' OR OLD.estado = 'aprobado' THEN RETURN NEW; END IF;

  BEGIN
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
    v_pagado := NEW.monto + COALESCE(v_saldo,0);

    IF v_modelo IS NULL THEN
      v_sentido := 'emitido'; v_rol := 'venta_cliente'; v_estado := 'pendiente_manual';
      v_rec := jsonb_build_object('resuelto', false, 'motivo', 'cuenta_o_modelo_no_resuelto');
    ELSIF v_modelo = 'marketplace_fachada' THEN
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
    v_err := left(SQLSTATE || ': ' || SQLERRM, 180);
    /* El cobro YA ocurrió: no se deja caer. Pero SE GRITA por los tres lugares
       donde alguien puede oírlo, y el respaldo usa sólo columnas garantizadas y
       CERO lookups — todo lo que pueda fallar ya falló arriba. */
    RAISE WARNING 'outbox_fiscal_fallo intento=% %', NEW.id, v_err;
    BEGIN
      INSERT INTO public.documentos_fiscales
        (pago_intento_id, country_code, tipo, total, estado, sentido, rol,
         emitida_por_tercero, sri_error)
      VALUES (NEW.id, 'EC', 'factura', NEW.monto, 'pendiente_manual', 'emitido',
              'venta_cliente', false, 'outbox_fallo: ' || v_err)
      ON CONFLICT (pago_intento_id) WHERE pago_intento_id IS NOT NULL DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      /* Ni el respaldo entró. NO se calla: queda en el log del motor, y el lector
         de abajo lo va a contar igual — porque cuenta pagos SIN documento, no
         documentos con error. *Un lector que sólo ve lo que se escribió no puede
         ver lo que no se escribió.* */
      RAISE WARNING 'outbox_fiscal_sin_rastro intento=% %', NEW.id, v_err;
    END;
  END;

  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public._trg_pago_aprobado_outbox_fiscal() FROM PUBLIC, anon;

-- ── EL LECTOR QUE VUELVE AUDIBLE EL SILENCIO ────────────────────────────────
CREATE OR REPLACE FUNCTION public.pagos_aprobados_sin_documento(p_desde timestamptz DEFAULT NULL)
RETURNS TABLE (intento_id uuid, proveedor text, monto numeric, aprobado_en timestamptz, sujeto text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT pi.id, pi.proveedor, pi.monto, pi.actualizado_en,
         CASE WHEN pi.cita_id IS NOT NULL THEN 'cita'
              WHEN pi.compra_id IS NOT NULL OR pi.pedido_id IS NOT NULL THEN 'compra'
              WHEN pi.bono_id IS NOT NULL THEN 'bono'
              WHEN pi.programa_contratado_id IS NOT NULL THEN 'programa'
              WHEN pi.guarderia_suscripcion_id IS NOT NULL THEN 'guarderia'
              WHEN pi.suscripcion_servicio_id IS NOT NULL THEN 'suscripcion'
              WHEN pi.recurrencia_id IS NOT NULL THEN 'recurrencia'
              ELSE 'desconocido' END
    FROM public.pagos_intentos pi
   WHERE pi.estado = 'aprobado'
     AND (p_desde IS NULL OR pi.actualizado_en >= p_desde)
     AND NOT EXISTS (SELECT 1 FROM public.documentos_fiscales d WHERE d.pago_intento_id = pi.id)
   ORDER BY pi.actualizado_en DESC;
$fn$;
COMMENT ON FUNCTION public.pagos_aprobados_sin_documento(timestamptz) IS
  'Pagos cobrados que NO tienen documento fiscal. Cuenta lo que NO se escribió, no lo que se escribió con error: es la única forma de ver un outbox que se calla. Un cero acá es una medición.';
REVOKE EXECUTE ON FUNCTION public.pagos_aprobados_sin_documento(timestamptz) FROM PUBLIC, anon;

COMMIT;

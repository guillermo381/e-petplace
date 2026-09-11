-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL CABLE QUE FALTABA, Y EL CORREO DEL CONSUMIDOR FINAL
--
-- ① `escribir_lineas_del_intento` tenia CERO llamadores (medido: ninguna
--    funcion SQL, ninguna edge). Sin eso, todo pago aprobado creaba un
--    documento sin base imponible que `fiscal-emitir` mandaba a
--    `pendiente_manual`. El motor fiscal estaba entero salvo su cimiento.
-- ② El consumidor final se quedaba SIN correo, y el proveedor lo exige. Cae al
--    de la cuenta —el que la persona nos dio— y fail-closed si no hay ninguno.
--
-- EDGES A DESPLEGAR (`L-536`): ninguna — las dos son de motor.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912660000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._trg_pago_aprobado_outbox_fiscal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

    /* ── LA BASE IMPONIBLE, EN SU PROPIO BLOQUE ────────────────────────────
       🔴 EL CABLE QUE FALTABA. `escribir_lineas_del_intento` existia completo
       y con CERO llamadores: medido, ninguna funcion SQL y ninguna edge. Es
       `L-318` —motor sin puerta— en el cimiento del motor fiscal: el trigger
       creaba el documento y nadie escribia sus lineas, asi que **todo pago
       aprobado producia un documento que `fiscal-emitir` mandaba a
       `pendiente_manual` por `sin_lineas_fiscales`**. Y el silencio era de los
       buenos: la fila EXISTE, las tablas se ven pobladas, y la falla solo
       aparece leyendo `motivo_rechazo`.

       🔴 BLOQUE PROPIO, y es la decision: si las lineas se escribieran en el
       bloque de arriba, un `compra_sin_items` haria rollback TAMBIEN del
       documento —y con el, del receptor ya resuelto—. Aca el documento
       sobrevive con su receptor y la falta de base queda anotada EN EL. */
    BEGIN
      PERFORM public.escribir_lineas_del_intento(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'lineas_fiscales_fallo intento=% %', NEW.id, left(SQLERRM, 140);
      UPDATE public.documentos_fiscales
         SET estado = 'pendiente_manual',
             motivo_rechazo = left('sin_base_imponible: ' || SQLERRM, 400)
       WHERE pago_intento_id = NEW.id;
    END;

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
END $function$;

CREATE OR REPLACE FUNCTION public.resolver_receptor_fiscal(p_user_id uuid, p_monto numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  /* ── EL CORREO DEL CONSUMIDOR FINAL ───────────────────────────────────────
     🔴 TRES FUENTES, EN ORDEN, Y NINGUNA INVENTADA:
       ① `tax_profiles.email` — el perfil fiscal. Ya resolvio arriba.
       ② `auth.users.email` — **el correo con el que la persona entro**. Cubre
          93 de los 107 pagos aprobados (medido). *No es inventar: es el unico
          correo que la persona nos dio, y es a donde ya le llega todo lo demas.*
       ③ no hay tercera. Para un invitado real —14 de 107, sin usuario por
          ninguna via— **no existe un correo en ninguna tabla**: `compras` y
          `pedidos` no tienen columna de email.

     Con ③ el documento NO se emite: queda `esperando_receptor`, igual que por
     encima del tope. *Mandar la factura a una casilla de la casa haria que
     recibamos las facturas de nuestros clientes; a una inventada, que el
     comprobante viaje a una direccion que no es de nadie.* La cura de raiz es
     de producto y esta nombrada: **el checkout de invitado pide un correo** —
     que hace falta igual para mandarle su factura, con Factuplan o sin el. */
  DECLARE v_mail text;
  BEGIN
    SELECT au.email INTO v_mail FROM auth.users au
     WHERE au.id = p_user_id AND au.email IS NOT NULL AND au.email <> '';
  END;

  IF v_mail IS NULL THEN
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'sin_correo_para_el_receptor',
      'detalle', 'Compra de invitado sin correo: no hay a quien enviarle el comprobante.');
  END IF;

  RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', NULL,
    'tipo_identificacion', 'consumidor_final', 'identificacion', '9999999999999',
    'razon_social', 'CONSUMIDOR FINAL', 'direccion', NULL, 'email', v_mail);
END $function$;

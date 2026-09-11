-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL 14 NO ERAN INVITADOS — corrección de una etiqueta, no del código
--
-- 🔴 El comportamiento NO cambia: esta migración sólo reescribe la explicación
--    que vive dentro de `resolver_receptor_fiscal`. Se hace igual, y con su
--    propia migración, porque **una explicación falsa dentro del motor
--    sobrevive a quien la escribió** y el próximo la lee como medición.
--
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912680000-etiqueta-14.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resolver_receptor_fiscal(p_user_id uuid, p_monto numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_tope numeric; v_tp public.tax_profiles; v_mail text;
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
       ③ no hay tercera, y HOY no hay nadie ahi: 182 profiles, CERO sin email
          y CERO fantasmas (medido por A y por C, por separado).

     ⏪ CORRECCION DE UN NUMERO QUE YO MISMO PUSE ACA: decia «un invitado real
        —14 de 107, sin usuario por ninguna via—». **El 14 era real y la
        etiqueta era falsa.** La consulta corria sobre `pagos_intentos`, no
        sobre `compras`, y esos 14 son intentos SIN SUJETO —ni compra, ni cita,
        ni bono— del 12 al 18 de agosto, que **violarian el CHECK
        `chk_intento_un_solo_sujeto` si se insertaran hoy**: restos de arnes,
        no personas. *Etiquete una poblacion con el nombre de otra, en el mismo
        acto de medirla* (`L-544`). Lo pidio C, que no pudo reproducirlo.

     🔴 QUIEN SI PRODUCE PERSONAS SIN CORREO —hallazgo de C, y es otro camino:
        el alta del MOSTRADOR (`crear_cliente_walkin`) acepta `email` **o**
        `telefono`. A quien el veterinario da de alta por telefono le falta el
        correo, y **esa persona no pasa por el checkout del cliente**, asi que
        ninguna cura de esa pantalla la alcanza. Hoy son CERO —el camino existe
        y nadie lo transito sin correo todavia—, y por eso esta rama es
        prevencion y no reparacion: *cero observaciones no es cero productores.*
        Su arreglo vive en el mostrador del prestador y es otra tanda.

     Con ③ el documento NO se emite: queda `esperando_receptor`, igual que por
     encima del tope. *Mandar la factura a una casilla de la casa haria que
     recibamos las facturas de nuestros clientes; a una inventada, que el
     comprobante viaje a una direccion que no es de nadie.* La cura de raiz es
     de producto y esta nombrada: **el checkout de invitado pide un correo** —
     que hace falta igual para mandarle su factura, con Factuplan o sin el. */
  SELECT au.email INTO v_mail FROM auth.users au
   WHERE au.id = p_user_id AND au.email IS NOT NULL AND au.email <> '';

  IF v_mail IS NULL THEN
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'sin_correo_para_el_receptor',
      'detalle', 'Compra de invitado sin correo: no hay a quien enviarle el comprobante.');
  END IF;

  RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', NULL,
    'tipo_identificacion', 'consumidor_final', 'identificacion', '9999999999999',
    'razon_social', 'CONSUMIDOR FINAL', 'direccion', NULL, 'email', v_mail);
END $function$;

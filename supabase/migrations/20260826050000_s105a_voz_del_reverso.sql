-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · LA VOZ DEL REVERSO ENTRA DONDE SE FIRMAN LAS VOCES
--
-- LA INCONSISTENCIA, medida sobre mi propio trabajo de hace un rato:
-- `mover_sujeto_por_reverso` pasaba título y mensaje **inline en `p_datos`**.
-- **Quince productores usan `_voz_notificacion` y el mío no.** Funcionaba —
-- y quedaba **fuera del único lugar donde las voces se firman y se traducen**.
-- *Un aviso que nace donde nadie lo revisa nace en español y se queda en
-- español.*
--
-- UN TIPO, DOS DESTINATARIOS: el texto bifurca por `p_extra->>'sujeto'`.
-- *El prestador y el vendedor no necesitan enterarse de lo mismo — uno
-- recupera una hora de su agenda, el otro tiene que NO despachar mercadería.*
--
-- 🔴 LA DECISIÓN DE FONDO DEL TEXTO: dice **«el banco devolvió el pago»**, no
-- «el cliente pidió la devolución». Un reverso puede venir del cliente o del
-- banco y **nosotros no sabemos cuál** — nombrar al cliente sería acusarlo de
-- algo que no medimos, en un correo que le llega a su prestador.
--
-- SIGUE EN SOMBRA hasta la firma del founder. Se enciende con:
--     UPDATE cat_notificacion_tipos SET en_sombra=false WHERE codigo='pago_reversado';
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro. El cinturón sólo lee.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826050000.sql`
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._voz_notificacion(p_tipo text, p_user_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_extra jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_idioma  text;
  v_m       text;   -- nombre de la mascota, o NULL
  v_de_m    text;   -- «de Thor» / «'s», o el genérico
  v_en_m    text;
BEGIN
  SELECT up.idioma INTO v_idioma FROM user_preferencias up WHERE up.user_id = p_user_id;
  IF v_idioma IS NULL OR v_idioma NOT IN ('es','en') THEN v_idioma := 'es'; END IF;

  IF p_mascota_id IS NOT NULL THEN
    SELECT m.nombre INTO v_m FROM mascotas m WHERE m.id = p_mascota_id;
  END IF;
  -- El sujeto, SIN INVENTAR: con nombre lo usa; sin nombre cae al genérico
  -- que el founder firmó («tu plan de paseos» / "your walk plan").
  v_de_m := coalesce('de ' || v_m, '');
  v_en_m := coalesce(v_m || '''s ', '');

  CASE p_tipo

    -- ✅ FIRMADA S88 (la primera, ya en producción)
    WHEN 'plan_renovado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your walk plan renewed',
        'mensaje','We renewed ' || coalesce(v_m || '''s walk plan','your walk plan') ||
                  ' for another month. It''s active now and we charged your usual ' ||
                  'payment method. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Tu plan de paseos se renovó',
        'mensaje','Renovamos ' || coalesce('el plan de paseos de ' || v_m,'tu plan de paseos') ||
                  ' por un mes más. Ya está activo y el cobro se hizo con tu método ' ||
                  'habitual. Puedes ver el detalle en la app.') END;

    -- ✅ LOTE S88 · 1/6 — el aviso de 72 h.
    --    Lleva LA SALIDA a propósito: avisar sin dar salida sería avisar de
    --    adorno, y la letra de la categoría dice que un cobro sorpresa no se
    --    deshace (criterio firmado).
    WHEN 'plan_renovacion_proxima' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your walk plan renews in 3 days',
        'mensaje', v_en_m || 'walk plan renews' ||
                   coalesce(' on ' || (p_extra->>'fecha'), '') ||
                   ' and we''ll charge your usual payment method. If you''d rather ' ||
                   'stop it, you can pause it in the app before then.')
      ELSE jsonb_build_object(
        'titulo','Tu plan de paseos se renueva en 3 días',
        'mensaje','El plan de paseos ' || v_de_m || ' se renueva' ||
                  coalesce(' el ' || (p_extra->>'fecha'), '') ||
                  ' y se va a cobrar con tu método habitual. Si no quieres que siga, ' ||
                  'puedes pausarlo desde la app antes de esa fecha.') END;

    -- ✅ 2/6
    WHEN 'paquete_vence' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','You have ' || coalesce(p_extra->>'restantes','some') || ' walks left',
        'mensaje', v_en_m || 'walk package expires' ||
                   coalesce(' on ' || (p_extra->>'vence'),'') || ' and you still have ' ||
                   coalesce(p_extra->>'restantes','walks') || ' walks. You can book them in the app.')
      ELSE jsonb_build_object(
        'titulo','Te quedan ' || coalesce(p_extra->>'restantes','salidas') || ' salidas por usar',
        'mensaje','El paquete de paseos ' || v_de_m || ' vence' ||
                  coalesce(' el ' || (p_extra->>'vence'),'') || ' y todavía te quedan ' ||
                  coalesce(p_extra->>'restantes','salidas') || ' salidas. Puedes reservarlas desde la app.') END;

    -- ✅ 3/6
    WHEN 'programa_vence' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s program','Your program') || ' still has sessions left',
        'mensaje', v_en_m || 'training program expires' ||
                   coalesce(' on ' || (p_extra->>'vence'),'') ||
                   '. You can schedule the remaining sessions in the app.')
      ELSE jsonb_build_object(
        'titulo','Al programa ' || coalesce(v_de_m,'') || ' le quedan sesiones',
        'mensaje','El programa de adiestramiento ' || v_de_m || ' vence' ||
                  coalesce(' el ' || (p_extra->>'vence'),'') ||
                  '. Coordina las sesiones que faltan desde la app.') END;

    -- ✅ 4/6 — HAY PLATA: se nombra, no se esconde
    WHEN 'programa_vencido_reembolso' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We refunded ' || coalesce(p_extra->>'monto','your balance') ||
                 coalesce(' from ' || v_m || '''s program',''),
        'mensaje', v_en_m || 'training program expired with ' ||
                   coalesce(p_extra->>'sesiones','unused') || ' unused sessions. We refunded ' ||
                   coalesce(p_extra->>'monto','the balance') || ' to your payment method.')
      ELSE jsonb_build_object(
        'titulo','Te devolvimos ' || coalesce(p_extra->>'monto','tu saldo') ||
                 coalesce(' del programa de ' || v_m,''),
        'mensaje','El programa de adiestramiento ' || v_de_m || ' venció con ' ||
                  coalesce(p_extra->>'sesiones','sesiones') || ' sesiones sin usar. Te devolvimos ' ||
                  coalesce(p_extra->>'monto','el saldo') || ' a tu método de pago.') END;

    -- ✅ 5/6 — HAY PLATA
    WHEN 'plan_vencido_reembolso' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We refunded ' || coalesce(p_extra->>'monto','your balance') ||
                 coalesce(' from ' || v_m || '''s plan',''),
        'mensaje', v_en_m || 'walk plan ended with ' ||
                   coalesce(p_extra->>'citas','unused') || ' unused walks. We refunded ' ||
                   coalesce(p_extra->>'monto','the balance') || ' to your payment method.')
      ELSE jsonb_build_object(
        'titulo','Te devolvimos ' || coalesce(p_extra->>'monto','tu saldo') ||
                 coalesce(' del plan de ' || v_m,''),
        'mensaje','El plan de paseos ' || v_de_m || ' terminó con ' ||
                  coalesce(p_extra->>'citas','salidas') || ' salidas sin usar. Te devolvimos ' ||
                  coalesce(p_extra->>'monto','el saldo') || ' a tu método de pago.') END;

    -- ✅ 6/6 — el negocio lo pasa el productor (④): un aviso de un
    --    procedimiento que no dice DÓNDE obliga a abrir la app para saber lo básico.
    WHEN 'procedimiento_agendado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s procedure','Your procedure') || ' is scheduled',
        'mensaje', coalesce(p_extra->>'negocio','The clinic') || ' confirmed the date: ' ||
                   coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                   '. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Quedó agendado el procedimiento ' || v_de_m,
        'mensaje', coalesce(p_extra->>'negocio','La clínica') || ' confirmó la fecha: ' ||
                   coalesce(p_extra->>'fecha','') || coalesce(' a las ' || (p_extra->>'hora'),'') ||
                   '. Puedes ver el detalle en la app.') END;


    -- ✅ LOTE S88 · las dos del alta asistida. El hecho es UNO —el cliente
    --    completó su registro— y las audiencias son DOS, las dos del NEGOCIO.
    --    Se nombra al CLIENTE porque es el sujeto; no hay plata en juego.
    WHEN 'registro_completado_prestador' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','Your client') || ' completed their registration',
        'mensaje', coalesce(p_extra->>'cliente','Your client') ||
                   ' now has an e-PetPlace account and their pets are under their name. ' ||
                   'They can see the records and book from now on.')
      ELSE jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','Tu cliente') || ' completó su registro',
        'mensaje', coalesce(p_extra->>'cliente','Tu cliente') ||
                   ' ya tiene su cuenta en e-PetPlace y sus mascotas quedaron a su nombre. ' ||
                   'Desde ahora ve su expediente y puede reservar.') END;

    -- ⚠️ `_operador`, no `_cliente`: RENOMBRADO S88 porque el nombre mentía —
    --    se llamaba por el SUJETO del hecho y se leía como el DESTINATARIO.
    --    Va a QUIEN HIZO EL ALTA, y por eso su voz habla de SU trabajo.
    WHEN 'registro_completado_operador' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','The client') || ' completed the registration you started',
        'mensaje','The pets you added are now in their account. The handoff is done.')
      ELSE jsonb_build_object(
        'titulo', coalesce(p_extra->>'cliente','El cliente') || ' completó el registro que iniciaste',
        'mensaje','Las mascotas que cargaste ya están en su cuenta. El alta quedó cerrada.') END;


    -- 🕯️ S89 · D-673 — LAS TRES DE CITA: EN SOMBRA, VOZ SIN FIRMA (el lote
    --    para la pasada de firma quedó depositado a D). Tuteo neutro por firma
    --    founder 6-ago-2026; la divergencia con el acento del lote S88 es
    --    territorio D-539 y se arbitra en esa pasada.
    WHEN 'cita_confirmada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s appointment','Your appointment') || ' is confirmed',
        'mensaje','The appointment ' || coalesce('for ' || v_m || ' ','') || 'with ' ||
                  coalesce(p_extra->>'negocio','the provider') || ' is confirmed for ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                  '. You can see the details in the app.')
      ELSE jsonb_build_object(
        'titulo','Tu cita quedó confirmada',
        'mensaje','La cita ' || v_de_m || ' con ' || coalesce(p_extra->>'negocio','el prestador') ||
                  ' quedó confirmada para el ' || coalesce(p_extra->>'fecha','') ||
                  coalesce(' a las ' || (p_extra->>'hora'),'') ||
                  '. Puedes ver el detalle en la app.') END;

    -- audiencia PRESTADOR: la reserva que le cae al negocio.
    WHEN 'cita_solicitada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','You have a new booking',
        'mensaje','A booking came in' || coalesce(' for ' || v_m,'') || ': ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' at ' || (p_extra->>'hora'),'') ||
                  '. It''s already on your schedule as a firm appointment.')
      ELSE jsonb_build_object(
        'titulo','Te llegó una nueva reserva',
        'mensaje','Reservaron' || coalesce(' para ' || v_m,'') || ': ' ||
                  coalesce(p_extra->>'fecha','') || coalesce(' a las ' || (p_extra->>'hora'),'') ||
                  '. Ya está en tu agenda como cita firme.') END;

    -- los DOS toques del recordatorio comparten tipo; `toque` decide la voz.
    WHEN 'cita_recordatorio' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(v_m || '''s appointment','Your appointment') || ' is ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'tomorrow' ELSE 'today' END,
        'mensaje','A reminder: the appointment' || coalesce(' for ' || v_m,'') ||
                  coalesce(' with ' || (p_extra->>'negocio'),'') || ' is ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'tomorrow' ELSE 'today' END ||
                  coalesce(' at ' || (p_extra->>'hora'),'') || '.')
      ELSE jsonb_build_object(
        'titulo','La cita ' || v_de_m || ' es ' ||
                 CASE WHEN p_extra->>'toque'='previo' THEN 'mañana' ELSE 'hoy' END,
        'mensaje','Te recordamos la cita' || coalesce(' de ' || v_m,'') ||
                  coalesce(' con ' || (p_extra->>'negocio'),'') || ': es ' ||
                  CASE WHEN p_extra->>'toque'='previo' THEN 'mañana' ELSE 'hoy' END ||
                  coalesce(' a las ' || (p_extra->>'hora'),'') || '.') END;


    -- 🕯️ S89 · D-669 — nace CON la cura de la gracia. EN SOMBRA, sin firma
    --    (va al lote de D). Tuteo neutro.
    WHEN 'plan_renovacion_fallida' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','We couldn''t renew your walk plan',
        'mensaje', v_en_m || 'walk plan renewal payment didn''t go through. ' ||
                   'We''ll keep retrying' || coalesce(' until ' || (p_extra->>'hasta'),'') ||
                   '. Please check your payment method so the schedule isn''t lost.')
      ELSE jsonb_build_object(
        'titulo','No pudimos renovar tu plan de paseos',
        'mensaje','El cobro de la renovación del plan ' || v_de_m || ' no pasó. ' ||
                  'Vamos a seguir reintentando' || coalesce(' hasta el ' || (p_extra->>'hasta'),'') ||
                  '. Revisa tu método de pago para que la agenda no se pierda.') END;

    -- ── S97-A · D-815: EL HANDSHAKE DEL MOSTRADOR ──────────────────────────
    -- Nace con voz PROPIA porque el genérico no sirve acá: «tienes una
    -- novedad» es una invitación a mirar después, y del otro lado hay un
    -- profesional PARADO esperando la respuesta. La voz dice QUIÉN pide,
    -- PARA QUÉ, y que la espera es AHORA.
    -- El negocio viaja en p_extra->>'negocio'; si faltara dice «un negocio»
    -- — jamás inventa un nombre.
    WHEN 'autorizacion_mostrador_solicitada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce(p_extra->>'negocio','A business') ||
                  CASE WHEN p_extra->>'tipo' = 'alta_mascota'
                       THEN ' wants to add a pet to your family'
                       ELSE ' is asking to see ' || coalesce(v_m || '''s record','your pet''s record') END,
        'mensaje', CASE WHEN p_extra->>'tipo' = 'alta_mascota'
                        THEN coalesce(p_extra->>'negocio','A business') ||
                             ' is registering a new pet under your family. ' ||
                             'They''re waiting at the counter — open the app to approve or decline.'
                        ELSE coalesce(p_extra->>'negocio','A business') ||
                             ' needs your OK to open ' || coalesce(v_en_m,'your pet''s ') ||
                             'record for this visit. They''re waiting at the counter — ' ||
                             'open the app to approve or decline.' END)
      ELSE jsonb_build_object(
        'titulo', coalesce(p_extra->>'negocio','Un negocio') ||
                  CASE WHEN p_extra->>'tipo' = 'alta_mascota'
                       THEN ' quiere sumar una mascota a tu familia'
                       ELSE ' pide ver el expediente ' || coalesce(v_de_m,'de tu mascota') END,
        'mensaje', CASE WHEN p_extra->>'tipo' = 'alta_mascota'
                        THEN coalesce(p_extra->>'negocio','Un negocio') ||
                             ' está registrando una mascota nueva en tu familia. ' ||
                             'Te están esperando en el mostrador: abre la app para aprobar o rechazar.'
                        ELSE coalesce(p_extra->>'negocio','Un negocio') ||
                             ' necesita tu OK para abrir el expediente ' ||
                             coalesce(v_de_m,'de tu mascota') || ' en esta visita. ' ||
                             'Te están esperando en el mostrador: abre la app para aprobar o rechazar.' END) END;

    -- ── S97-A · D-822 · LA PRIMERA OLA DE AVISOS AL NEGOCIO ────────────────
    -- Firma del founder: cinco motivos. Cuatro tienen acto donde colgarse;
    -- el quinto (la expiración) NO, y está declarado en su ficha.
    -- Las cuatro voces dicen QUÉ pasó y QUÉ hacer — el genérico «tenés una
    -- novedad» no se acepta (L-815).

    -- ① LA VITRINA VENDIÓ.
    WHEN 'pedido_nuevo_vendedor' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','New order' || coalesce(' · $' || (p_extra->>'total'), ''),
        'mensaje','You sold' || coalesce(' ' || (p_extra->>'items') || ' item(s)','') ||
                  '. Open the app to prepare it.')
      ELSE jsonb_build_object(
        'titulo','Pedido nuevo' || coalesce(' · $' || (p_extra->>'total'), ''),
        'mensaje','Vendiste' || coalesce(' ' || (p_extra->>'items') || ' producto(s)','') ||
                  '. Abre la app para prepararlo.') END;

    -- ② «YA PODÉS VENDER».
    WHEN 'naturaleza_venta_aprobada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your store is active',
        'mensaje','e-PetPlace approved ' || coalesce(p_extra->>'negocio','your business') ||
                  ' to sell products. You can set it up in the app now.')
      ELSE jsonb_build_object(
        'titulo','Tu tienda ya está activa',
        'mensaje','e-PetPlace aprobó a ' || coalesce(p_extra->>'negocio','tu negocio') ||
                  ' para vender productos. Ya puedes configurarla en la app.') END;

    -- ③ EL HUECO EN LA AGENDA DE HOY AVISA HOY.
    WHEN 'cita_cancelada_cliente' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','A client cancelled' || coalesce(' · ' || (p_extra->>'cuando'), ''),
        'mensaje',coalesce(v_m || '''s appointment','An appointment') ||
                  ' was cancelled by the family' || coalesce(' (' || (p_extra->>'cuando') || ')','') ||
                  '. That slot is free again.')
      ELSE jsonb_build_object(
        'titulo','Se canceló una cita' || coalesce(' · ' || (p_extra->>'cuando'), ''),
        'mensaje','La familia canceló la cita ' || coalesce(v_de_m,'de su mascota') ||
                  coalesce(' (' || (p_extra->>'cuando') || ')','') ||
                  '. Ese espacio quedó libre.') END;

    -- ⑤ LA EXPIRACIÓN VIBRA, no solo se lista.
    --    Su destinatario NO está mirando la lista: está parado en el
    --    mostrador esperando. Por eso la voz dice qué pasó Y qué queda —
    --    la visita no se pierde, sigue como registro.
    WHEN 'solicitud_mostrador_expirada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','The family didn''t reply in time',
        'mensaje',coalesce(v_m || '''s family','The family') ||
                  ' didn''t authorize the record for this visit. ' ||
                  'The visit still counts as a counter record.')
      ELSE jsonb_build_object(
        'titulo','La familia no respondió a tiempo',
        'mensaje','La familia ' || coalesce(v_de_m,'de la mascota') ||
                  ' no autorizó el expediente para esta visita. ' ||
                  'La visita sigue como registro del mostrador.') END;

    -- ④ EL WIZARD SE DESTRABA SOLO — o dice por qué no.
    WHEN 'documento_aprobado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Document approved',
        'mensaje','We approved your ' || coalesce(p_extra->>'documento','document') ||
                  '. One less step to finish setting up.')
      ELSE jsonb_build_object(
        'titulo','Documento aprobado',
        'mensaje','Aprobamos tu ' || coalesce(p_extra->>'documento','documento') ||
                  '. Un paso menos para terminar de configurarte.') END;

    WHEN 'documento_rechazado' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Document needs a new photo',
        'mensaje','We couldn''t validate your ' || coalesce(p_extra->>'documento','document') ||
                  coalesce('. Reason: ' || (p_extra->>'motivo'), '') ||
                  '. Upload it again from the app.')
      ELSE jsonb_build_object(
        'titulo','Tu documento necesita otra foto',
        'mensaje','No pudimos validar tu ' || coalesce(p_extra->>'documento','documento') ||
                  coalesce('. Motivo: ' || (p_extra->>'motivo'), '') ||
                  '. Vuelve a subirlo desde la app.') END;

    /* ✅ FIRMADA S105 (25-ago-2026) · `pago_reversado`
       UN tipo, DOS destinatarios — y por eso el texto se bifurca por
       `p_extra->>'sujeto'`. *El prestador y el vendedor no necesitan enterarse
       de lo mismo: uno recupera una hora de su agenda, el otro tiene que NO
       despachar mercadería.* Un texto solo para los dos diría poco a ambos.

       🔴 «El banco devolvió el pago» y no «el cliente pidió la devolución»:
       un reverso puede venir del cliente o del banco y **nosotros no sabemos
       cuál** — nombrar al cliente sería acusarlo de algo que no medimos. */
    WHEN 'pago_reversado' THEN
      IF coalesce(p_extra->>'sujeto','') = 'cita' THEN
        RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
          'titulo','An appointment was cancelled',
          'mensaje','The bank returned the payment, so the appointment was ' ||
                    'cancelled and the time slot is free again. You don''t ' ||
                    'need to do anything.')
        ELSE jsonb_build_object(
          'titulo','Una cita quedó cancelada',
          'mensaje','El banco devolvió el pago, así que la cita se canceló y ' ||
                    'el horario volvió a quedar libre. No tienes que hacer nada.') END;
      ELSE
        RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
          'titulo','Don''t ship this order',
          'mensaje','The bank returned the payment for order ' ||
                    coalesce(p_extra->>'numero_orden','') ||
                    ', so it was cancelled. If you already prepared it, put the ' ||
                    'items back in stock.')
        ELSE jsonb_build_object(
          'titulo','No despaches este pedido',
          'mensaje','El banco devolvió el pago del pedido ' ||
                    coalesce(p_extra->>'numero_orden','') ||
                    ', así que quedó cancelado. Si ya lo preparaste, devuelve ' ||
                    'los productos al stock.') END;
      END IF;

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mover_sujeto_por_reverso(p_intento_id uuid, p_motivo text DEFAULT 'reverso del proveedor'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_id uuid; v_ahora timestamptz := now();
  v_ped record; v_dest uuid; v_negocio text; v_prest uuid; v_avisos int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','intento_no_existe'); END IF;

  /* 🔴 SÓLO SOBRE UN INTENTO YA REVERSADO. *Mover el sujeto de un intento vivo
     sería cancelar un pedido pagado por una llamada equivocada* — y esta
     función tiene poder para hacerlo. El estado terminal ES la autorización. */
  IF v_i.estado NOT IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'codigo','intento_no_reversado','estado', v_i.estado);
  END IF;

  -- ¿QUÉ SUJETO? — del intento, sin `else` que asuma (el CHECK admite cuatro)
  IF    v_i.cita_id IS NOT NULL THEN v_sujeto := 'cita';         v_id := v_i.cita_id;
  ELSIF v_i.compra_id IS NOT NULL THEN v_sujeto := 'compra';     v_id := v_i.compra_id;
  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN v_sujeto := 'suscripcion'; v_id := v_i.suscripcion_servicio_id;
  ELSIF v_i.recurrencia_id IS NOT NULL THEN v_sujeto := 'recurrencia'; v_id := v_i.recurrencia_id;
  ELSE RETURN jsonb_build_object('ok', false, 'codigo','sujeto_indeterminado'); END IF;

  -- ══ CITA ══ se cancela, libera el horario, y el PRESTADOR se entera
  IF v_sujeto = 'cita' THEN
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* El aviso va al PRESTADOR: *es su agenda y su tiempo.* Se resuelve el
       destinatario desde el prestador, no desde la cita, porque la cita no
       guarda a quién avisarle. */
    SELECT c.prestador_id INTO v_prest FROM evento_cita_servicio c WHERE c.id = v_id;
    SELECT p.user_id INTO v_dest FROM prestadores p WHERE p.id = v_prest;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
        p_mascota_id => NULL, p_evento_id => NULL,
        /* 🔴 EL TEXTO SE PIDE, NO SE ESCRIBE ACÁ. Antes viajaba inline y eso
           lo dejaba **fuera del único lugar donde las voces se firman y se
           traducen** — quince productores usan `_voz_notificacion` y éste no.
           *Un aviso que nace donde nadie lo revisa nace en español y se queda
           en español.* */
        p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                     jsonb_build_object('sujeto','cita'))
                   || jsonb_build_object('sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:cita:' || v_id::text);
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ COMPRA + PEDIDOS ══ por la PUERTA, que además libera el inventario
  ELSIF v_sujeto = 'compra' THEN
    FOR v_ped IN SELECT p.* FROM pedidos p WHERE p.compra_id = v_id
                  AND p.estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
    LOOP
      /* 🔴 EL FALLO DE UN PEDIDO NO TUMBA LA CANCELACIÓN DE LOS OTROS ni la de
         la compra: *la plata ya volvió y el estado tiene que reflejarlo aunque
         una transición puntual rebote.* El motivo queda escrito igual. */
      BEGIN
        PERFORM cancelar_pedido_despensa(v_ped.id, 'admin', p_motivo);
      EXCEPTION WHEN OTHERS THEN
        UPDATE pedidos SET notas_admin = COALESCE(notas_admin,'') ||
               ' · reverso no pudo cancelar: ' || SQLERRM WHERE id = v_ped.id;
      END;

      -- si estaba en preparación o más allá, el VENDEDOR se entera
      IF v_ped.estado IN ('liberado_preparacion','documentado','en_reparto','hacia_destino') THEN
        SELECT cc.nombre_comercial INTO v_negocio FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        SELECT cc.owner_profile_id INTO v_dest FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        IF v_dest IS NOT NULL THEN
          PERFORM registrar_intencion_notificacion(
            p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
            p_mascota_id => NULL, p_evento_id => NULL,
            /* Mismo tipo, otro destinatario: la voz bifurca por `sujeto`.
               Va el `numero_orden` porque **es lo que el vendedor tiene
               pegado en la caja** — un uuid no le sirve para encontrarla. */
            p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                         jsonb_build_object('sujeto','pedido',
                           'numero_orden', v_ped.numero_orden))
                       || jsonb_build_object('sujeto','pedido','sujeto_id', v_ped.id,
                            'negocio', v_negocio, 'motivo', p_motivo),
            p_clave_dedup => 'reverso:pedido:' || v_ped.id::text);
          v_avisos := v_avisos + 1;
        END IF;
      END IF;
    END LOOP;

    UPDATE compras SET estado = 'cancelada', updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ SUSCRIPCIÓN ══ se corta y NO renueva
  ELSIF v_sujeto = 'suscripcion' THEN
    UPDATE suscripciones_servicio
       SET estado = 'cancelada', auto_renovar = false,
           cancelado_en = v_ahora, motivo_cancelacion = p_motivo
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ RECURRENCIA ══
  ELSE
    UPDATE pedidos_recurrencias SET estado = 'cancelada' WHERE id = v_id AND estado <> 'cancelada';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujeto', v_sujeto, 'sujeto_id', v_id,
                            'avisos', v_avisos, 'motivo', p_motivo);
END $function$
;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — sólo lee. Su brazo importante es el TERCERO: que las voces
-- viejas no se hayan movido.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_es_cita jsonb; v_es_ped jsonb; v_en jsonb; v_vieja jsonb; v_usa boolean; v_user uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users LIMIT 1;

  v_es_cita := _voz_notificacion('pago_reversado', v_user, NULL, '{"sujeto":"cita"}'::jsonb);
  v_es_ped  := _voz_notificacion('pago_reversado', v_user, NULL,
                 '{"sujeto":"pedido","numero_orden":"P-TEST"}'::jsonb);

  -- ① las dos voces existen y NO son la misma
  IF v_es_cita->>'titulo' IS NULL OR v_es_ped->>'titulo' IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: falta una de las dos voces';
  END IF;
  IF v_es_cita->>'titulo' = v_es_ped->>'titulo' THEN
    RAISE EXCEPTION 'CINTURÓN: prestador y vendedor reciben el MISMO texto — la bifurcación no rige';
  END IF;

  -- ② el número de orden llega al vendedor (es lo que tiene pegado en la caja)
  IF v_es_ped->>'mensaje' NOT LIKE '%P-TEST%' THEN
    RAISE EXCEPTION 'CINTURÓN: el aviso al vendedor no nombra el pedido — %', v_es_ped->>'mensaje';
  END IF;

  -- ③ 🔴 LO QUE NO SE PUEDE HABER ROTO: una voz vieja, intacta
  v_vieja := _voz_notificacion('plan_renovado', v_user, NULL, '{}'::jsonb);
  IF v_vieja->>'titulo' IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: se rompió una voz que ya estaba firmada (plan_renovado)';
  END IF;

  -- ④ el productor la USA (dejó de escribir el texto por su cuenta)
  SELECT prosrc ILIKE '%_voz_notificacion(''pago_reversado''%'
    INTO v_usa FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='mover_sujeto_por_reverso';
  IF NOT v_usa THEN
    RAISE EXCEPTION 'CINTURÓN: el productor sigue escribiendo el texto inline';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · cita=%  |  pedido=%  |  voz vieja intacta=%  |  productor la usa=%',
    v_es_cita->>'titulo', v_es_ped->>'titulo', (v_vieja->>'titulo' IS NOT NULL), v_usa;
END $cint$;

-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260907640000_s111a_las_cinco_voces_del_durante.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- 🔴 QUÉ **NO** DESHACE, y se dice para que nadie la corra creyendo que sí:
--   · Las intenciones de notificación YA NACIDAS con voz y con `ruta` se
--     quedan como están. Revertir el catálogo no reescribe lo que se emitió.
--   · Las push YA ENTREGADAS no se pueden retirar de ningún teléfono.
--   · Revertir DEVUELVE a los cinco actos su voz genérica —«Tienes una novedad
--     en e-PetPlace»— que es el defecto que esta migración vino a curar.
--     **No es un estado neutro: es el estado malo.**
-- ══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ① el acto `retorno` deja de avisar
UPDATE public.cat_guarderia_transiciones SET tipo_notificacion = NULL WHERE acto = 'retorno';

-- ② el tipo sale del catálogo (sólo si ninguna intención lo usó)
DELETE FROM public.cat_notificacion_tipos
 WHERE codigo = 'guarderia_retorno'
   AND NOT EXISTS (SELECT 1 FROM public.notificacion_intencion WHERE tipo = 'guarderia_retorno');

-- ③ el CHECK vuelve a los cuatro
ALTER TABLE public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE public.notificaciones ADD CONSTRAINT notificaciones_tipo_check CHECK (tipo = ANY (ARRAY[
  'pedido_estado','cita_recordatorio','cita_confirmada','vacuna_vencida','wearable_alerta',
  'mensaje_nuevo','promocion','sistema','pago_confirmado','devolucion_estado','pedido_recurrente',
  'cita_rechazada','cita_completada','cita_no_show','cita_solicitada','cita_cancelada_cliente',
  'cita_calificada','prestador_aprobado','prestador_rechazado','prestador_suspendido',
  'documento_aprobado','documento_rechazado','liquidacion_disponible',
  'alta_asistida_pendiente_enviar_email','alta_asistida_completada_por_cliente',
  'alta_asistida_vencida_soporte','pedido_confirmado','pedido_en_camino','pedido_hacia_destino',
  'pedido_entregado','pedido_entrega_fallida',
  'adopcion_solicitud_nueva','adopcion_mensaje_nuevo','adopcion_solicitud_respondida',
  'adopcion_sin_respuesta','padrinazgo_ahijado_adoptado','padrinazgo_refugio_inactivo',
  'guarderia_a_bordo','guarderia_llegada','guarderia_entregada','guarderia_no_recogida']));

-- ④ los DOS cuerpos vuelven BYTE-IDÉNTICOS a como estaban antes
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
    /* ═══ S108-A-3 · LA RENOVACIÓN DE LA MENSUALIDAD DE GUARDERÍA ═════════
       Dice las TRES cosas que el founder pidió —cuánto, qué día, y cómo
       cortarlo— y **nombra la pantalla donde se corta**. *Un aviso de cobro que
       dice «podés cancelar» sin decir dónde obliga a buscar, y el que busca con
       apuro es justamente el que no quiere que le cobren.* */
    WHEN 'guarderia_renovacion_proxima' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo','Your daycare plan renews in 3 days',
        'mensaje','We''ll charge ' ||
                  coalesce((p_extra->>'moneda') || ' ' || (p_extra->>'monto'), 'your monthly plan') ||
                  coalesce(' on ' || (p_extra->>'fecha'), '') ||
                  ' to your usual payment method. If you''d rather stop it, you can ' ||
                  'cancel it in Account › Recurring payments and subscriptions before then.')
      ELSE jsonb_build_object(
        'titulo','Tu plan de guardería se renueva en 3 días',
        'mensaje','Vamos a cobrar ' ||
                  coalesce((p_extra->>'moneda') || ' ' || (p_extra->>'monto'), 'tu plan mensual') ||
                  coalesce(' el ' || (p_extra->>'fecha'), '') ||
                  ' con tu método habitual. Si no quieres que siga, puedes cancelarlo ' ||
                  'en Cuenta › Pagos recurrentes y suscripciones antes de esa fecha.') END;

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
    /* S106 · LA REASIGNACIÓN. La familia se entera de que la atiende otra
       persona **cuando pasa**, no el día de la cita.
       ⚠️ Nombra a QUIÉN va a atender, no a quién dejó de atender: *decir «ya
       no te atiende X» convierte un cambio de agenda en una noticia sobre una
       persona.* */
    WHEN 'cita_reasignada' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', 'A change in ' || coalesce(v_m || '''s appointment','your appointment'),
        'mensaje', coalesce(p_extra->>'persona','Another professional') ||
                   ' will be seeing ' || coalesce(v_m,'your pet') ||
                   coalesce(' on ' || (p_extra->>'fecha'),'') ||
                   coalesce(' at ' || (p_extra->>'hora'),'') || '.')
      ELSE jsonb_build_object(
        'titulo', 'Un cambio en la cita' || coalesce(' de ' || v_m,''),
        'mensaje', coalesce(p_extra->>'persona','Otro profesional') ||
                   ' va a atender a ' || coalesce(v_m,'tu mascota') ||
                   coalesce(' el ' || (p_extra->>'fecha'),'') ||
                   coalesce(' a las ' || (p_extra->>'hora'),'') || '.')
      END;

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

    /* ✅ FIRMADA S107 (27-ago-2026) · `pago_reversado`
       UN tipo, **TRES destinatarios**: familia · prestador · vendedor. Antes
       bifurcaba solo por SUJETO (cita vs pedido) y por eso el texto de cita
       —escrito para quien paga— le llegaba al PRESTADOR, a quien la frase de
       plata le decia que perdia un cobro.

       🔴 EL LIMITE DEL PRESTADOR, firmado: se entera del HECHO y nada mas.
       Ni causa, ni monto, ni mencion de pago. *Decirle que se revirtio el pago
       expone un movimiento financiero del cliente* — que es exactamente lo que
       su propia pantalla (`cita-no-disponible.tsx`) ya declaraba y su aviso
       contradecia.

       🔴 «El banco devolvio el pago» y no «el cliente pidio la devolucion»:
       un reverso puede venir del cliente o del banco y **no sabemos cual**.
       Ese marco lo eligio C y se conserva palabra por palabra, para que la
       pantalla y el aviso cuenten el mismo hecho con el mismo vocabulario.

       ⚠️ FALLBACK FAIL-CLOSED: sin `para`, cita cae en el texto del PRESTADOR
       —el que menos dice—. *Un llamador nuevo que se olvide del destinatario
       no puede filtrar plata por omision.* */
    WHEN 'pago_reversado' THEN
      IF coalesce(p_extra->>'sujeto','') = 'cita' THEN
        IF coalesce(p_extra->>'para','') = 'familia' THEN
          RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
            'titulo','Your booking was cancelled',
            'mensaje','This booking was cancelled because the bank returned ' ||
                      'the payment. We didn''t charge you.')
          ELSE jsonb_build_object(
            'titulo','Tu reserva quedo cancelada',
            /* Literal de C (`apps/cliente/src/i18n/es.ts:1383`), adaptado de
               «Esta reserva» a la voz del aviso. NO se inventa uno nuevo. */
            'mensaje','Esta reserva se cancelo porque el banco devolvio el ' ||
                      'pago. No te cobramos nada.') END;
        ELSE
          RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
            'titulo','An appointment was cancelled',
            'mensaje','The booking was cancelled and your time slot is free again.')
          ELSE jsonb_build_object(
            'titulo','Una cita quedo cancelada',
            'mensaje','La reserva se cancelo y tu horario volvio a quedar libre.') END;
        END IF;
      ELSE
        RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
          'titulo','Don''t ship this order',
          'mensaje','The bank returned the payment for order ' ||
                    coalesce(p_extra->>'numero_orden','') ||
                    ', so it was cancelled. If you already prepared it, put the ' ||
                    'items back in stock.')
        ELSE jsonb_build_object(
          'titulo','No despaches este pedido',
          'mensaje','El banco devolvio el pago del pedido ' ||
                    coalesce(p_extra->>'numero_orden','') ||
                    ', asi que quedo cancelado. Si ya lo preparaste, devuelve ' ||
                    'los productos al stock.') END;
      END IF;

    /* ── S107-A · EL DIGEST DE LA MEDIA DE GUARDERÍA ───────────────────────
       🔴 **SIN NÚMERO, Y ES DECISIÓN, NO PEREZA.** El contrato de media lo
       había escrito como «3 fotos nuevas de Thor». **Medido el mecanismo, ese
       número no puede ser cierto:** la voz se compone AL ENCOLAR y el dedup
       deja UNA intención por (mascota, día) — así que las fotos que llegan
       después ya no mueven el texto. *Un aviso que dice «3 fotos» cuando ya
       hay siete es falso; «hay fotos nuevas» es cierto todo el día.*
       ⇒ el conteo lo resuelve la pantalla al abrir, que es donde el dato está
       vivo. La voz dice el HECHO; la app dice el número.
       Tuteo (R66). Sin nombre de mascota cae al genérico, sin inventar. */
    WHEN 'guarderia_media_resumen' THEN
      RETURN CASE WHEN v_idioma='en' THEN jsonb_build_object(
        'titulo', coalesce('New photos of ' || v_m, 'New photos from daycare'),
        'mensaje', coalesce('The daycare shared new photos of ' || v_m || '.',
                            'The daycare shared new photos.'))
      ELSE jsonb_build_object(
        'titulo', coalesce('Hay fotos nuevas de ' || v_m, 'Hay fotos nuevas de la guardería'),
        'mensaje', coalesce('La guardería compartió fotos nuevas ' || v_de_m || '.',
                            'La guardería compartió fotos nuevas.')) END;

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public._guarderia_aplicar_acto(p_estadia_id uuid, p_acto text, p_ocurrido_en timestamp with time zone, p_motivo text DEFAULT NULL::text, p_detalle text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE t record; v_estado text; v_prev record; v_user uuid; v_masc uuid;
BEGIN
  SELECT * INTO t FROM cat_guarderia_transiciones WHERE acto = p_acto;
  IF t IS NULL THEN RAISE EXCEPTION 'acto_invalido' USING ERRCODE='22023'; END IF;
  IF p_ocurrido_en IS NULL THEN
    RAISE EXCEPTION 'falta_hora_de_la_puerta' USING ERRCODE='22023';
  END IF;
  IF p_ocurrido_en > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'hora_de_la_puerta_en_el_futuro' USING ERRCODE='22023';
  END IF;

  SELECT estado INTO v_estado FROM guarderia_estadias WHERE id = p_estadia_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;

  /* IDEMPOTENCIA POR (ESTADÍA, ACTO): devuelve el original y NO escribe nada —
     tampoco un segundo aviso. */
  SELECT * INTO v_prev FROM guarderia_estadia_actos
   WHERE estadia_id = p_estadia_id AND acto = p_acto;
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'movida', false, 'ya_estaba', true,
      'estado', v_estado, 'ocurrido_en', v_prev.ocurrido_en,
      'registrado_en', v_prev.registrado_en);
  END IF;

  IF v_estado <> t.desde THEN
    IF v_estado = 'cancelada' THEN
      RAISE EXCEPTION 'estadia_cancelada' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM cat_guarderia_estados WHERE estado = v_estado AND es_terminal) THEN
      RAISE EXCEPTION 'estadia_en_estado_final: %', v_estado USING ERRCODE='22023';
    END IF;
    RAISE EXCEPTION 'transicion_ilegal: % (esperaba %, acto %)', v_estado, t.desde, p_acto
      USING ERRCODE='22023';
  END IF;

  IF t.exige_tramo IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM guarderia_estadias e JOIN guarderia_tramos tr
        ON tr.id = CASE t.exige_tramo WHEN 'recogida' THEN e.tramo_recogida_id
                                      ELSE e.tramo_devolucion_id END
       WHERE e.id = p_estadia_id AND tr.estado = 'abierto')
    THEN
      RAISE EXCEPTION 'sin_tramo_abierto: no hay tramo de % abierto para esta estadia', t.exige_tramo
        USING ERRCODE='22023';
    END IF;
  END IF;

  IF p_acto = 'no_recogida' THEN
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, '
                   'no_recogida_motivo = $4, no_recogida_detalle = $5, '
                   'updated_at = now() WHERE id = $3', t.columna_ts)
      USING t.hasta, p_ocurrido_en, p_estadia_id, p_motivo, p_detalle;
  ELSE
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, updated_at = now() WHERE id = $3',
                   t.columna_ts) USING t.hasta, p_ocurrido_en, p_estadia_id;
  END IF;

  INSERT INTO guarderia_estadia_actos (estadia_id, acto, ocurrido_en, actor_user_id)
       VALUES (p_estadia_id, p_acto, p_ocurrido_en, auth.uid())
    RETURNING * INTO v_prev;

  /* ══ S111-A · EL AVISO — décimo hallazgo del gate ═══════════════════════
     🔴 Va DESPUÉS de la escritura y del renglón de auditoría, a propósito: si
     algo de arriba rebota, **no sale un aviso sobre un acto que no ocurrió**.
     Y va DENTRO del brazo que movió: el reintento retorna antes y **no vuelve a
     avisar**. */
  IF t.tipo_notificacion IS NOT NULL THEN
    SELECT c.user_id, c.mascota_id INTO v_user, v_masc
      FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE g.id = p_estadia_id;
    IF v_user IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => t.tipo_notificacion,
        p_destinatario_user_id => v_user,
        p_mascota_id           => v_masc,
        p_datos                => jsonb_build_object(
                                    'estadiaId', p_estadia_id,
                                    'acto', p_acto,
                                    /* la hora de la PUERTA, que es la que se muestra */
                                    'ocurridoEn', p_ocurrido_en)
                                  || _voz_notificacion(t.tipo_notificacion, v_user, v_masc, '{}'::jsonb),
        /* La clave es (estadía, acto): el acto ya es idempotente, así que el
           aviso también. *La idempotencia sale de la clave, no de una columna.* */
        p_clave_dedup          => 'guarderia-acto:' || p_estadia_id || ':' || p_acto);
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'movida', true, 'ya_estaba', false,
    'estado', t.hasta, 'ocurrido_en', v_prev.ocurrido_en,
    'registrado_en', v_prev.registrado_en);
END $function$;

COMMIT;

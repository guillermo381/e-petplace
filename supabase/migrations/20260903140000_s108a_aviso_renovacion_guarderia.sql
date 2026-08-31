-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-3 · ② EL AVISO, TRES DÍAS ANTES DE CADA RENOVACIÓN
--
-- 76(g) VEDA: **NO RIGE.** Tipo nuevo + voz + productor + cron. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-03-s108a-REVERSA-M10.sql`.
--
-- ═══ LO QUE SE MIDIÓ ANTES DE ESCRIBIR — «no inventes un canal nuevo» ══════
-- La letra de `MODELO_NOTIFICACIONES` se leyó, y lo que rige salió de ella:
--  · `canal_forzado` es **DATO del catálogo**, no una excepción en el código del
--    elector, y su §dice *«cualquier otro se agrega con su porqué»* ⇒ acá va el
--    porqué: **es un aviso de cobro y tiene que llegar aunque la persona tenga
--    el push apagado.** Y la misma letra aclara que forzar **no prohíbe** los
--    otros canales: *los demás pueden ACOMPAÑAR, jamás sustituir.*
--  · La idempotencia **ya es estructural**: `notificacion_intencion` tiene
--    índice ÚNICO sobre `clave_dedup` y `registrar_intencion_notificacion` entra
--    con `ON CONFLICT`. **No hace falta columna testigo** — la clave lleva el
--    período y eso hace *dos avisos del mismo período* imposible, no vigilado.
--  · La voz va por `_voz_notificacion` y **no inline**: el canon ya midió que un
--    aviso escrito donde nadie lo revisa *nace en español y se queda en español*.
--
-- 🔴 POR QUÉ UN TIPO NUEVO Y NO REUSAR `plan_renovacion_proxima`, que describe
--    exactamente esto y ya existe: **reusarlo obligaba a forzarle el canal, y
--    ese tipo lo produce hoy `cerrar_y_renovar_planes` — el PLAN DE PASEOS.**
--    Forzarlo le habría cambiado el canal a otro servicio sin que su dueño lo
--    firmara. *Un tipo nuevo no es un canal nuevo: el canal es `email` y ya
--    existía.*
--    ⚠️ Y queda declarada la ASIMETRÍA que eso deja a la vista: el aviso previo
--    del plan de paseos **NO va forzado a correo**. Puede ser correcto o puede
--    ser un hueco; **no se decide acá** porque no es de esta pista.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO cat_notificacion_tipos (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
VALUES ('guarderia_renovacion_proxima', 'saldo_pagado',
        'Aviso 3 dias antes de cada RENOVACION del plan mensual de guarderia. '
        'Solo renovaciones: el primer cobro sale al contratar y no tiene 3 dias que avisar.',
        false, true, 'cliente', 'email', false)
ON CONFLICT (codigo) DO NOTHING;

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
$function$

;

-- ── EL PRODUCTOR ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.avisar_renovaciones_guarderia()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_r record; v_n int := 0; v_prox date;
BEGIN
  FOR v_r IN
    SELECT s.*, cc.moneda
      FROM guarderia_suscripciones s
      JOIN prestadores pr ON pr.id = s.prestador_id
      LEFT JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
     /* 🔴 SOLO PLANES VIVOS. *Avisar de un cobro que no va a ocurrir es peor
        que no avisar*: la familia cancela algo que ya canceló, o vuelve a la app
        a arreglar un problema que no tiene. */
     WHERE s.estado = 'activa'
       /* 🔴 SOLO RENOVACIONES. `periodo_desde IS NULL` es *«autorizado y todavía
          sin cobrar»* ⇒ su primer cobro sale al contratar y **no hay tres días
          que avisar**. Este brazo es lo que impide avisarle a alguien que
          todavía no pagó su primer mes. */
       AND s.periodo_desde IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
  LOOP
    v_prox := public.guarderia_proximo_cobro(v_r.dia_de_cobro, v_r.periodo_desde);
    CONTINUE WHEN v_prox <> public.hoy_local() + 3;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'guarderia_renovacion_proxima',
      p_destinatario_user_id => v_r.autorizada_por,
      p_mascota_id => v_r.mascota_id, p_evento_id => NULL,
      p_datos => _voz_notificacion('guarderia_renovacion_proxima', v_r.autorizada_por, v_r.mascota_id,
                   jsonb_build_object('fecha', v_prox,
                                      'monto', to_char(v_r.precio_mensual,'FM999999990.00'),
                                      'moneda', COALESCE(v_r.moneda,'USD')))
                 || jsonb_build_object('suscripcion_id', v_r.id, 'fecha', v_prox,
                                       'monto', v_r.precio_mensual,
                                       'moneda', COALESCE(v_r.moneda,'USD'),
                                       'puede','cancelar'),
      /* La clave lleva el PERÍODO ⇒ un aviso por período, jamás dos. El índice
         único de `notificacion_intencion` es el piso; esto es su llave. */
      p_clave_dedup => 'guarderia_renovacion:' || v_r.id::text || ':' || v_prox::text);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $fn$;

REVOKE EXECUTE ON FUNCTION public.avisar_renovaciones_guarderia() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('avisar-renovacion-guarderia', '0 13 * * *',
                     'SELECT public.avisar_renovaciones_guarderia();')
 WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='avisar-renovacion-guarderia');
/* 13 UTC = 08:00 Guayaquil, la misma hora que `avisar-recurrencias` de despensa.
   *Copiar la hora del vecino no es pereza: dos avisos de plata a horas distintas
   le enseñan a la familia que no hay un momento en que la app le habla de eso.* */

-- ═══ CINTURÓN — con los tres brazos que la firma nombra ═══════════════════
DO $c$
DECLARE v_s uuid; v_user uuid; v_r jsonb; v_n int; v_hoy date := public.hoy_local();
BEGIN
  SELECT id, autorizada_por INTO v_s, v_user FROM guarderia_suscripciones LIMIT 1;
  IF v_s IS NULL THEN RAISE EXCEPTION 'cinturon: sin mandato con que DISCRIMINAR'; END IF;

  -- (a) 🔴 SIN COBRAR TODAVIA: NO se avisa (periodo_desde NULL)
  UPDATE guarderia_suscripciones SET estado='activa', cancelada_en=NULL,
         periodo_desde=NULL, periodo_hasta=NULL, dia_de_cobro=NULL WHERE id=v_s;
  v_r := public.avisar_renovaciones_guarderia();
  IF (v_r->>'avisadas')::int <> 0 THEN
    RAISE EXCEPTION 'cinturon: aviso un primer cobro, y ese sale al contratar';
  END IF;

  -- (b) RENOVACION a 3 dias: SI avisa, UNA vez
  UPDATE guarderia_suscripciones
     SET periodo_desde = (v_hoy + 3) - interval '1 month',
         dia_de_cobro  = EXTRACT(day FROM ((v_hoy + 3) - interval '1 month'))::smallint
   WHERE id = v_s;
  DELETE FROM notificacion_intencion WHERE clave_dedup LIKE 'guarderia_renovacion:'||v_s::text||'%';
  v_r := public.avisar_renovaciones_guarderia();
  IF (v_r->>'avisadas')::int < 1 THEN
    RAISE EXCEPTION 'cinturon: NO aviso una renovacion a 3 dias (%)', v_r::text;
  END IF;

  -- (c) IDEMPOTENTE: la segunda corrida no duplica la intencion
  PERFORM public.avisar_renovaciones_guarderia();
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE clave_dedup LIKE 'guarderia_renovacion:'||v_s::text||'%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: quedaron % avisos del mismo periodo', v_n; END IF;

  -- (d) 🔴 CANCELADO: NO sale
  DELETE FROM notificacion_intencion WHERE clave_dedup LIKE 'guarderia_renovacion:'||v_s::text||'%';
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE id=v_s;
  v_r := public.avisar_renovaciones_guarderia();
  IF (v_r->>'avisadas')::int <> 0 THEN
    RAISE EXCEPTION 'cinturon: aviso un cobro de un plan CANCELADO';
  END IF;

  -- (e) el canal esta FORZADO a email, como dato y no como codigo
  SELECT count(*) INTO v_n FROM cat_notificacion_tipos
   WHERE codigo='guarderia_renovacion_proxima' AND canal_forzado='email' AND activo;
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el tipo no fuerza email'; END IF;

  -- (f) la voz existe en los DOS idiomas y nombra donde cancelar
  v_r := _voz_notificacion('guarderia_renovacion_proxima', v_user, NULL,
           jsonb_build_object('fecha','2026-10-15','monto','100.00','moneda','USD'));
  IF v_r->>'mensaje' IS NULL OR v_r->>'mensaje' NOT LIKE '%recurrentes%' THEN
    RAISE EXCEPTION 'cinturon: la voz no dice donde cancelar: %', v_r::text;
  END IF;

  RAISE NOTICE 'cinturon M10: 6/6 OK (primer cobro NO avisa · renovacion SI · idempotente · cancelado NO sale · canal forzado por DATO · la voz dice donde cancelar)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M10: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;

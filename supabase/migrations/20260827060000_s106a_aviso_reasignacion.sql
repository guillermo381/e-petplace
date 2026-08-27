-- ============================================================================
-- S106-A · EL AVISO DE REASIGNACIÓN — y con él se abre el gate de la vitrina
--
-- ── LA FIRMA (founder, 27-ago-2026) ────────────────────────────────────────
-- > *Lo que se firma **NO es «exponer al equipo»: es «permitir que un negocio
-- > elija exponerlo»**.*
--
-- Sostenida por medición, no por confianza: `expone_personas` es
-- **`DEFAULT false`**, hay **11 de 11 prestadores apagados**, los nuevos nacen
-- apagados, y lo que se expone son **tres campos con uno solo identificatorio**
-- (`empleado_id · nombre · tiene_jornada`). **Encenderlo no mueve un pixel en
-- la app de ninguna familia hasta que un titular toque su interruptor.**
--
-- ── POR QUÉ CONSTRUIR ESTO ABRE DOS COSAS, Y ESTÁ BIEN ─────────────────────
-- `trg_prestadores_gate_vitrina` (S78) verifica literalmente
-- `to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)')`. Su
-- migración lo dice: *«el día que alguien construya esa función, este gate se
-- abre solo»*. **S78 eligió esta función como llave a propósito**, y darle al
-- aviso otra firma para no abrirla dejaría un gate que ya no vigila nada.
--
-- ── ⚠️ LA CONSECUENCIA, RATIFICADA COMO CORRECTA Y NO COMO EFECTO LATERAL ──
-- Si un negocio enciende la vitrina, la familia **elige persona al reservar** y
-- esa cita nace con `empleado_id` explícito — que **gana sobre la continuidad y
-- sobre el titular**.
--
-- > *Si la familia eligió, eligió.* Es la misma lógica que la firma de la
-- > asignación: **lo arbitrario se deroga, lo decidido manda.**
--
-- ── LAS CINCO PIEZAS ───────────────────────────────────────────────────────
-- ① la fila de vocabulario · ② su voz · ③ `notificar_reasignacion_cita` ·
-- ④ la llamada desde `asignar_cita_a_persona`, **levantando el freno** ·
-- ⑤ su lote de strings, que va al gate del founder aparte.
--
-- ── ✅ EL FRENO SE LEVANTA, NO SE ABLANDA ──────────────────────────────────
-- `asignar_cita_a_persona` rechazaba con *«reasignar exige el aviso a la
-- familia, que aún no existe»*. **Cumplió su trabajo: el aviso existe y por eso
-- sale.** *Ablandarlo antes habría dejado a una familia enterándose el día de
-- la cita de que la atiende otra persona.*
--
-- ── VEDA 76(g): NO RIGE. Fila de catálogo + funciones. Cero backfill.
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-aviso-reasignacion.sql
--    ⚠️ y NO es neutra: borrar la función **cierra el gate de la vitrina de
--    vuelta**, dejando expuesto a quien ya la hubiera encendido.
-- ============================================================================

-- ── ① EL VOCABULARIO ───────────────────────────────────────────────────────
INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion, en_sombra, activo, audiencia)
VALUES ('cita_reasignada', 'operacion',
        'La cita pasó a otra persona del equipo. Se avisa a la familia.',
        false, true, 'cliente')
ON CONFLICT (codigo) DO UPDATE
  SET categoria = EXCLUDED.categoria, en_sombra = false, activo = true, audiencia = 'cliente';

-- ── ② LA VOZ ───────────────────────────────────────────────────────────────
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
          /* 🔴 ENMIENDA DEL FOUNDER (25-ago-2026): decía «no tienes que hacer
             nada». *Su preocupación real no es si hay un trámite — es si esa
             cita le suma o le resta plata, y el texto anterior dejaba la duda
             abierta justo donde importa.* */
        'mensaje','The bank returned the payment, so the appointment was ' ||
                    'cancelled and the time slot is free again. You won''t be ' ||
                    'charged for this appointment.')
        ELSE jsonb_build_object(
          'titulo','Una cita quedó cancelada',
          'mensaje','El banco devolvió el pago, así que la cita se canceló y ' ||
                    'el horario volvió a quedar libre. No se te cobrará nada ' ||
                    'por esta cita.') END;
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

-- ── ③ EL AVISO ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notificar_reasignacion_cita(p_cita_id uuid, p_empleado_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c record; v_persona text; v_negocio text;
BEGIN
  SELECT c.id, c.user_id, c.mascota_id, c.prestador_id, c.fecha, c.hora
    INTO v_c
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  IF NOT FOUND OR v_c.user_id IS NULL THEN RETURN; END IF;

  /* 🔴 EL NOMBRE DE QUIEN VA A ATENDER, no el de quien dejó de hacerlo.
     *Decir «ya no te atiende X» convierte un cambio de agenda en una noticia
     sobre una persona.* */
  SELECT coalesce(pf.nombre, 'Otro profesional') INTO v_persona
  FROM prestador_empleados pe LEFT JOIN profiles pf ON pf.id = pe.user_id
  WHERE pe.id = p_empleado_id;

  SELECT pr.nombre_comercial INTO v_negocio FROM prestadores pr WHERE pr.id = v_c.prestador_id;

  PERFORM public.registrar_intencion_notificacion(
    p_tipo                 => 'cita_reasignada',
    p_destinatario_user_id => v_c.user_id,
    p_mascota_id           => v_c.mascota_id,
    p_evento_id            => NULL,
    p_datos                => jsonb_build_object(
                                'cita_id', v_c.id,
                                'persona', v_persona,
                                'negocio', v_negocio,
                                'fecha',   to_char(v_c.fecha,'DD/MM'),
                                'hora',    to_char(v_c.hora,'HH24:MI'))
                              || public._voz_notificacion('cita_reasignada', v_c.user_id, v_c.mascota_id,
                                   jsonb_build_object('persona', v_persona,
                                                      'fecha', to_char(v_c.fecha,'DD/MM'),
                                                      'hora',  to_char(v_c.hora,'HH24:MI'))),
    /* Dedup por cita Y POR PERSONA: si la reasignan dos veces a personas
       distintas, la familia se entera de las dos. *Una clave sólo por cita
       silenciaría el segundo cambio, que es el que vale.* */
    p_clave_dedup          => 'cita-reasignada:' || v_c.id || ':' || p_empleado_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notificar_reasignacion_cita(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ── ④ LA PUERTA, con el freno levantado ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.asignar_cita_a_persona(p_cita_id uuid, p_empleado_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_reasignacion boolean := false;
  v_uid           uuid := auth.uid();
  v_prestador     uuid;
  v_tipo          text;
  v_estado        text;
  v_empleado_hoy  uuid;
  v_es_futura     boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- ── LA CITA EXISTE ────────────────────────────────────────────────────
  SELECT c.prestador_id, c.tipo_servicio, c.estado, c.empleado_id,
         (c.fecha + c.hora) > (now() AT TIME ZONE 'America/Guayaquil')
    INTO v_prestador, v_tipo, v_estado, v_empleado_hoy, v_es_futura
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  -- ── GATE 1 · EL ROL ───────────────────────────────────────────────────
  -- Acá rebota el profesional puro. La ventanilla gatea por MEMBRESÍA
  -- (ley madre S76) y ruteo es ventanilla, no acto clínico.
  IF NOT public.empleado_puede_asignar_citas(v_prestador) THEN
    RAISE EXCEPTION 'rol_sin_asignacion: quien rutea es la recepción, el administrador o el titular'
      USING ERRCODE = '42501';
  END IF;

  -- ── GATE 2 · LA CITA NO TIENE PERSONA ─────────────────────────────────
  -- REASIGNAR ES OTRO VERBO, y su precondición es el aviso a la familia
  -- que todavía NO EXISTE (`notificar_reasignacion_cita`, medido: ausente
  -- — es el mismo artefacto que gatea la vitrina desde S78).
  -- Mover una cita YA asignada sin avisar sería cambiarle el profesional a
  -- una familia por la espalda.
  /* ✅ EL FRENO SE LEVANTA — S106, firma del founder 27-ago.
     Decía: *«reasignar exige el aviso a la familia, que aún no existe»*. **El
     aviso existe** (`notificar_reasignacion_cita`), así que el freno cumplió su
     trabajo y sale. *Un gate mecánico con su precondición escrita se abre solo
     el día que la precondición existe — no se ablanda antes.* */
  v_reasignacion := v_empleado_hoy IS NOT NULL AND v_empleado_hoy IS DISTINCT FROM p_empleado_id;

  -- ── GATE 3 · LA CITA ES RUTEABLE ──────────────────────────────────────
  -- Espeja EXACTAMENTE `_cita_despegable`: estado pendiente/confirmada y en
  -- el futuro. El conjunto de lo ASIGNABLE == el conjunto de lo DESPEGABLE,
  -- a propósito: el verbo no debe alcanzar nada que el despegue no produzca.
  -- Una cita pasada sin persona se queda «de la clínica» — que es lo que
  -- §11(a) firmó — y jamás se reescribe quién la atendió.
  IF v_estado NOT IN ('pendiente', 'confirmada') THEN
    RAISE EXCEPTION 'cita_no_asignable: estado %; solo se rutea lo pendiente o confirmado',
      v_estado USING ERRCODE = '22023';
  END IF;

  IF NOT v_es_futura THEN
    RAISE EXCEPTION 'cita_no_asignable: la cita ya ocurrió; asignarla reescribiría quién atendió'
      USING ERRCODE = '22023';
  END IF;

  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'cita_sin_tipo_servicio: sin oficio no se puede verificar el chip de la persona'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 4 · LA PERSONA ES DE ESTE NEGOCIO Y ESTÁ ACTIVA ──────────────
  IF NOT EXISTS (
    SELECT 1 FROM prestador_empleados pe
    WHERE pe.id = p_empleado_id
      AND pe.prestador_id = v_prestador
      AND pe.activo = true
  ) THEN
    RAISE EXCEPTION 'persona_no_es_del_negocio: no hay vínculo activo con este negocio'
      USING ERRCODE = '22023';
  END IF;

  -- ── GATE 5 · LA PERSONA TIENE EL OFICIO ───────────────────────────────
  -- Espeja el tercer brazo de `cita_update_prestador` (S77): el chip es por
  -- TIPO de servicio, que es equivalente por construcción a la oferta —
  -- los chips se dan y se quitan a oficio completo.
  IF NOT EXISTS (
    SELECT 1
    FROM prestador_empleado_servicios pes
    JOIN prestador_servicios ps ON ps.id = pes.servicio_id
    WHERE pes.empleado_id = p_empleado_id
      AND ps.tipo_servicio = v_tipo
  ) THEN
    RAISE EXCEPTION 'persona_sin_oficio: no tiene el chip de % en este negocio', v_tipo
      USING ERRCODE = '22023';
  END IF;

  -- ── EL ACTO ───────────────────────────────────────────────────────────
  -- De los 5 triggers de la tabla, este UPDATE dispara SOLO
  -- `trg_evento_cita_servicio_updated_at` (los otros tres son `UPDATE OF
  -- estado` y el quinto es AFTER INSERT) — medido en S77 y citado acá para
  -- que nadie lo vuelva a medir.
    -- D-676 (S89, firma founder): la matrícula es CONDICIÓN DE ELEGIBILIDAD
  -- para recibir citas médicas, no dato decorativo. Un papel firmable exige
  -- firmante completo.
  IF NOT public._empleado_matricula_ok(p_empleado_id, v_tipo) THEN
    RAISE EXCEPTION 'matricula_profesional_faltante' USING ERRCODE = '22023';
  END IF;

UPDATE evento_cita_servicio
  SET empleado_id = p_empleado_id
  WHERE id = p_cita_id;

  /* ── EL AVISO, DESPUÉS del UPDATE y sólo si de verdad CAMBIÓ de persona ──
     🔴 Después, porque *avisar de un cambio que todavía puede fallar es
     prometer algo que quizá no pasó.*
     Y sólo si cambió: no se avisa una asignación que llena un hueco vacío —
     *decirle «hubo un cambio» a una familia que no tenía nadie asignado la
     asusta por nada.* */
  IF v_reasignacion THEN
    PERFORM public.notificar_reasignacion_cita(p_cita_id, p_empleado_id);
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'cita_id',      p_cita_id,
    'empleado_id',  p_empleado_id,
    'reasignacion', v_reasignacion
  );
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.asignar_cita_a_persona(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.asignar_cita_a_persona(uuid, uuid) TO authenticated;

-- ── CINTURÓN: LA REASIGNACIÓN REAL, Y LA FILA DEL AVISO ────────────────────
-- ⚠️ *Un aviso que se registra y no se despacha se ve exactamente igual que uno
-- que sí* ⇒ acá no se mira el retorno de la RPC: **se mira la fila.**
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_cita uuid; v_antes uuid; v_nuevo uuid; v_titular uuid; v_recep uuid; v_pr uuid;
  v_out jsonb; v_n int; v_voz text; v_gate boolean;
BEGIN
  IF has_function_privilege('authenticated','public.notificar_reasignacion_cita(uuid,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el aviso quedo alcanzable desde una app';
  END IF;

  -- 🔴 EL GATE DE LA VITRINA TIENE QUE HABER ABIERTO — es la consecuencia
  --    firmada, y se verifica en vez de suponerse.
  SELECT public.puede_encender_vitrina() INTO v_gate;
  IF v_gate IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'cinturon: el gate de la vitrina NO abrio con el aviso construido';
  END IF;

  /* 🔴 LA CITA SE CREA DENTRO DEL BLOQUE, POR LA PUERTA REAL. El primer intento
     tomaba la última existente y el motor la rechazó bien:
     *«la cita ya ocurrió; asignarla reescribiría quién atendió»* — un guard
     correcto que el fixture estaba pisando. **Se ejerce sobre una cita futura,
     no sobre el pasado de nadie.** */
  SELECT pr.id INTO v_pr FROM prestadores pr WHERE pr.nombre_comercial ILIKE '%Aurora%';

  -- Quien rutea (titular) y a quién se mueve (otro que califique).
  SELECT pe.user_id INTO v_recep FROM prestador_empleados pe
  WHERE pe.prestador_id=v_pr AND pe.rol='dueño' AND pe.activo LIMIT 1;

  BEGIN
    -- La cita futura, por `crear_bloqueo_agenda`, con la familia real.
    DECLARE v_serv uuid; v_mas uuid; v_fam uuid; v_f date; v_h time;
    BEGIN
      SELECT ps.id INTO v_serv FROM prestador_servicios ps
      WHERE ps.prestador_id=v_pr AND ps.tipo_servicio='telemedicina' AND ps.activo LIMIT 1;
      SELECT m.id, fm.user_id INTO v_mas, v_fam
      FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id AND fm.hasta IS NULL
      WHERE m.especie='perro' AND m.estado_vida='activa' LIMIT 1;
      v_f := (now() AT TIME ZONE 'America/Guayaquil')::date + 1;

      EXECUTE format('SET LOCAL request.jwt.claims = %L',
                     json_build_object('sub', v_fam, 'role','authenticated')::text);
      SET LOCAL ROLE authenticated;
      SELECT min(x) INTO v_h FROM public.obtener_inicios_vet_disponibles(v_f,'telemedicina',v_mas,NULL) t(x);
      IF v_h IS NULL THEN
        EXECUTE format('SET LOCAL ROLE %I', v_rol);
        RAISE EXCEPTION 'cinturon: no hay hueco mañana para ejercer';
      END IF;
      SELECT (public.crear_bloqueo_agenda(v_pr, v_serv, v_mas, v_f, v_h, NULL, NULL, true)->>'cita_id')::uuid
        INTO v_cita;
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      SELECT empleado_id INTO v_antes FROM evento_cita_servicio WHERE id=v_cita;
    END;

    -- Y el destino tiene que ser OTRO que el asignado.
    SELECT pe.id INTO v_nuevo FROM prestador_empleados pe
    WHERE pe.prestador_id=v_pr AND pe.activo AND pe.id IS DISTINCT FROM v_antes LIMIT 1;
    IF v_nuevo IS NULL THEN RAISE EXCEPTION 'cinturon: no hay otra persona a la que mover'; END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_recep, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_out := public.asignar_cita_a_persona(v_cita, v_nuevo);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF (v_out->>'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'cinturon: la reasignacion rebotó — %', v_out::text;
    END IF;
    IF (v_out->>'reasignacion') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'cinturon: no se reconoció como reasignación — %', v_out::text;
    END IF;

    -- 🔴 LA FILA, no el retorno.
    SELECT count(*), max(i.datos->>'titulo') INTO v_n, v_voz
    FROM notificacion_intencion i
    WHERE i.tipo='cita_reasignada' AND i.clave_dedup = 'cita-reasignada:'||v_cita||':'||v_nuevo;

    IF v_n <> 1 THEN
      RAISE EXCEPTION 'cinturon: la intención del aviso NO nació (% filas)', v_n;
    END IF;
    /* Y que la voz tenga contenido: *una fila con el título vacío es un aviso
       que va a llegar mudo, y en el ledger se ve igual de bien.* */
    IF coalesce(btrim(v_voz),'') = '' THEN
      RAISE EXCEPTION 'cinturon: la intención nació SIN VOZ';
    END IF;
    -- Y que no esté en sombra, que es lo que la haría no salir nunca.
    IF EXISTS (SELECT 1 FROM notificacion_intencion i
               WHERE i.clave_dedup='cita-reasignada:'||v_cita||':'||v_nuevo AND i.en_sombra) THEN
      RAISE EXCEPTION 'cinturon: el aviso nació EN SOMBRA — se registra y no sale';
    END IF;

    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'cinturon aviso: OK · la reasignación pasó · la intención nació CON VOZ y fuera de sombra · el gate de la vitrina abrió';
END;
$cinturon$;

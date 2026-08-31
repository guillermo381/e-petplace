/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL PRODUCTOR DEL DIGEST DE MEDIA DE GUARDERÍA
   ═══════════════════════════════════════════════════════════════════════════

   **Cierra el HECHO de D:** se sube media del durante y el dueño se entera,
   AGRUPADO, sin una push por foto (que la firma prohíbe).

   ── 🔴 EL HALLAZGO DE D, VERIFICADO CONTRA EL OBJETO ANTES DE ESCRIBIR ─────
   **El TIPO no alcanzaba.** `registrar_intencion_notificacion` decide el
   consentimiento con `preferencia_efectiva`, y ésa es
   `COALESCE(fila del usuario, default_habilitada de la categoría, false)`.
   Medido: **`resumen.default_habilitada = false` y CERO filas de `resumen`
   en `user_notificacion_prefs`** ⇒ el día que existiera el tipo, el aviso
   habría nacido `descartada_sin_consentimiento` **para todos, en silencio**.

   > *Y en el gate se habría leído como «el cableado de D no avisa» —
   > que es el defecto de esta casa que más caro sale: el que no falla,
   > el que omite.*

   ── LOS DOS ACTOS, SEPARADOS A PROPÓSITO (firma de la mesa) ───────────────
   **① Acá:** se crea el tipo Y se habilita `resumen` **en las cuentas del
   gate**, una fila por persona. Cierra el HECHO sin tocar producto.
   **② APARTE:** el `default_habilitada = false` de la categoría queda como
   decisión de mesa con su ficha. **Se escribió para el volumen de La
   Despensa, no para la media de una guardería** — y *un default de
   privacidad no se cambia para que un gate salga verde.*

   ── LA CATEGORÍA NO SE INVENTA: SE ESTRENA ───────────────────────────────
   `resumen` ya existía en `cat_notificacion_categorias` con **techo propio
   (20 / 24 h)**, separado del de `operacion`. Por eso el digest **no compite
   con los avisos de tramo ni con los de acta** — que es exactamente por qué
   esa categoría existe. *El criterio ya estaba escrito; el trabajo era leer.*

   ── VEDA 76(g) ───────────────────────────────────────────────────────────
   **NO RIGE.** No hay backfill de datos de negocio ni anclas que se muevan:
   una fila de catálogo, una función nueva, un `CREATE OR REPLACE` de la voz
   y una siembra de preferencias acotada y marcada. **Nada de esto reescribe
   historia.**

   ── REVERSA ──────────────────────────────────────────────────────────────
   **ESCRITA ANTES DE APLICAR:**
   `docs/relevamientos/S107-A-REVERSA-digest-media-guarderia.sql`, con el
   cuerpo previo de la voz guardado al lado
   (`S107-A-REVERSA-voz-antes-del-digest.sql`).
   **Declara qué NO deshace:** las intenciones ya encoladas se conservan
   —*un ledger de avisos no se corrige borrando filas*— y el DELETE de
   preferencias está acotado por `evidencia->>'origen'` para no llevarse por
   delante la elección de alguien que la haya tocado después.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL TIPO ════════════════════════════════════════════════════════════
-- `en_sombra = false`: en sombra se registra y NO se envía, así que el gate
-- no podría firmarlo. Los 28 tipos que despachan de verdad están así.
-- `audiencia = 'cliente'`: es un aviso para la familia. El prestador ya sabe
-- que subió la foto — se la sacó él.
INSERT INTO public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, ignora_techo)
VALUES
  ('guarderia_media_resumen', 'resumen',
   'La guardería compartió fotos o clips del día. Se agrupa: UNA intención por mascota y día, jamás una por archivo.',
   false, true, 'cliente', false)
ON CONFLICT (codigo) DO NOTHING;

-- ══ ② LA VOZ — el brazo del tipo nuevo ═══════════════════════════════════
-- El cuerpo se REGENERÓ del objeto con `pg_get_functiondef` y se le insertó
-- UN brazo antes del `ELSE`. No se tipeó de nuevo: los otros ~30 brazos
-- viajan byte-idénticos, que es la única forma de tocar una función de 400
-- líneas sin arriesgar a los tipos vivos.
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


-- ══ ③ EL BARRIDO ═════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.encolar_resumen_media_guarderia()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
/* Agrupa en el SERVIDOR, que es donde se puede: dos teléfonos subiendo media
   del mismo animal no pueden coordinar un digest entre ellos (§④bis del
   contrato de media).

   🔴 **EL DEDUP ES EL AGRUPADOR.** `clave_dedup` es UNIQUE, así que la
   primera media de (mascota, día) crea la intención y las siguientes caen en
   el `ON CONFLICT DO NOTHING` de `registrar_intencion_notificacion`.
   ⇒ **diez fotos = UN aviso**, sin contador, sin estado y sin marca en
   `guarderia_media`. *La idempotencia sale de la clave, no de una columna
   que alguien tenga que acordarse de escribir.*

   **La ventana de 15 minutos** existe para que el aviso no salga con la
   primera foto del día: junta lo que llegó en ese rato. No es un retardo de
   entrega — es el tiempo mínimo para que «agrupado» signifique algo.

   **Mira dos días** (hoy y ayer) porque el barrido puede correr pasada la
   medianoche local sobre media de una jornada que todavía se está cerrando.
   El dedup impide que eso produzca un segundo aviso del mismo día. */
DECLARE
  v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;   -- D-320
  r     record;
  v_n   int := 0;
  v_vistos int := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT et.mascota_id, gm.fecha, ec.user_id
      FROM public.guarderia_media gm
      JOIN public.guarderia_media_etiquetas et ON et.media_id = gm.id
      JOIN public.guarderia_estadias ge        ON ge.id = et.estadia_id
      JOIN public.evento_cita_servicio ec      ON ec.id = ge.cita_id
     WHERE gm.created_at <= now() - interval '15 minutes'
       AND gm.fecha BETWEEN v_hoy - 1 AND v_hoy
       AND ec.user_id IS NOT NULL
  LOOP
    v_vistos := v_vistos + 1;
    IF public.registrar_intencion_notificacion(
         p_tipo                 => 'guarderia_media_resumen',
         p_destinatario_user_id => r.user_id,
         p_mascota_id           => r.mascota_id,
         p_datos                => jsonb_build_object('fecha', r.fecha)
                                || public._voz_notificacion(
                                     'guarderia_media_resumen', r.user_id,
                                     r.mascota_id, '{}'::jsonb),
         p_clave_dedup          => 'guarderia-media:' || r.mascota_id || ':' || r.fecha
       ) IS NOT NULL THEN
      v_n := v_n + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'encoladas', v_n,
                            'grupos_vistos', v_vistos, 'corrido_en', now());
END
$fn$;

-- L-140: toda función nace con EXECUTE para anon y `REVOKE FROM PUBLIC` no lo
-- quita — es un grant explícito en `proacl`. Se cierra y se declara.
REVOKE EXECUTE ON FUNCTION public.encolar_resumen_media_guarderia() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.encolar_resumen_media_guarderia() TO service_role;

-- ══ ④ LA SIEMBRA DEL GATE ════════════════════════════════════════════════
/* 🔴 **SÓLO `in_app`, y es decisión.** In-app es el piso: se ve al abrir la
   app y no interrumpe a nadie. **Sembrar `push` le metería una notificación
   en el bolsillo a gente que no la pidió** — y una de las cuentas medidas
   tiene push de `operacion` APAGADO a propósito: pisarle eso con un resumen
   sería usar un gate para revertir el gesto de una persona.
   *El gate necesita que el aviso EXISTA y se lea, no que suene.*

   **A quién:** las cuentas medidas del circuito — el/los prestadores con
   oferta de guardería, y las cuentas que ya tienen preferencias guardadas
   (equipo real y activo). **No se siembra a toda la base.**

   **Marcada en `evidencia`** para que la reversa pueda distinguir esta
   siembra de una elección real. *La columna ya existía: es donde el opt-in
   de WhatsApp guarda su procedencia. No hizo falta una columna nueva —
   hizo falta leer la que estaba.* */
INSERT INTO public.user_notificacion_prefs (user_id, categoria, canal, habilitada, evidencia)
SELECT u, 'resumen', 'in_app', true,
       jsonb_build_object('origen', 's107a-gate',
                          'porque', 'habilitar el digest de media de guarderia para el gate del 1-sep',
                          'sembrada_en', now())
  FROM (
    SELECT p.user_id AS u
      FROM public.prestador_servicios ps
      JOIN public.prestadores p ON p.id = ps.prestador_id
     WHERE ps.tipo_servicio = 'guarderia_dia' AND p.user_id IS NOT NULL
    UNION
    SELECT DISTINCT pr.user_id FROM public.user_notificacion_prefs pr
  ) s
ON CONFLICT (user_id, categoria, canal) DO NOTHING;

-- ══ ⑤ EL RELOJ ═══════════════════════════════════════════════════════════
-- `*/15`, el mismo pulso que `recordatorios-cita`. SQL directo: no llama a
-- ninguna edge function, así que no necesita secreto de despacho.
SELECT cron.unschedule('resumen-media-guarderia')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resumen-media-guarderia');
SELECT cron.schedule('resumen-media-guarderia', '*/15 * * * *',
                     $cron$SELECT public.encolar_resumen_media_guarderia();$cron$);


-- ══ ⑥ CINTURÓN — con DISCRIMINADOR, y escribe en subtransacción que se
--       deshace sola (L-406: un arnés que para probar el circuito lo ejecuta
--       de verdad es un arnés que hace lo que vino a vigilar).
DO $cint$
DECLARE
  v_cat        text;
  v_voz        jsonb;
  v_sembradas  int;
  v_con        uuid;    -- usuario CON preferencia sembrada
  v_sin        uuid;    -- usuario SIN ella  → el otro brazo del discriminador
  v_id_con     uuid;
  v_id_sin     uuid;
  v_estado_con text;
  v_estado_sin text;
  v_acl        text;
  v_cron       int;
  v_res        jsonb;
BEGIN
  -- ① el tipo, con su categoría
  SELECT categoria INTO v_cat FROM public.cat_notificacion_tipos
   WHERE codigo = 'guarderia_media_resumen' AND activo;
  IF v_cat IS DISTINCT FROM 'resumen' THEN
    RAISE EXCEPTION 'CINTURON ①: el tipo no existe o no cayo en resumen (categoria=%)', v_cat;
  END IF;

  -- ② la voz DICE algo. Sin el brazo, `_voz_notificacion` devuelve '{}' y el
  --    aviso saldria MUDO — que pasa todos los gates y no se ve hasta el
  --    telefono.
  v_voz := public._voz_notificacion('guarderia_media_resumen', NULL, NULL, '{}'::jsonb);
  IF coalesce(v_voz->>'titulo','') = '' OR coalesce(v_voz->>'mensaje','') = '' THEN
    RAISE EXCEPTION 'CINTURON ②: la voz salio vacia (%)', v_voz;
  END IF;

  -- ③ la siembra
  SELECT count(*) INTO v_sembradas FROM public.user_notificacion_prefs
   WHERE categoria = 'resumen' AND evidencia->>'origen' = 's107a-gate';
  IF v_sembradas = 0 THEN
    RAISE EXCEPTION 'CINTURON ③: no se sembro ninguna preferencia de resumen';
  END IF;

  -- ④ 🔴 EL DISCRIMINADOR — el hallazgo de D, probado en los DOS sentidos.
  --    Sin este par, un verde diria "encolo" sin probar que el consentimiento
  --    era lo que faltaba.
  SELECT user_id INTO v_con FROM public.user_notificacion_prefs
   WHERE categoria='resumen' AND canal='in_app' AND habilitada
     AND evidencia->>'origen'='s107a-gate' LIMIT 1;
  SELECT u.id INTO v_sin FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM public.user_notificacion_prefs p
                      WHERE p.user_id = u.id AND p.categoria='resumen')
   LIMIT 1;
  IF v_con IS NULL OR v_sin IS NULL THEN
    RAISE EXCEPTION 'CINTURON ④: falta un brazo del par (con=% sin=%)', v_con, v_sin;
  END IF;

  BEGIN   -- ← subtransaccion: todo lo que escribe de aca abajo se deshace
    v_id_con := public.registrar_intencion_notificacion(
      'guarderia_media_resumen', v_con, NULL, NULL,
      '{"cinturon":true}'::jsonb, 'cinturon-s107a-con:' || gen_random_uuid());
    v_id_sin := public.registrar_intencion_notificacion(
      'guarderia_media_resumen', v_sin, NULL, NULL,
      '{"cinturon":true}'::jsonb, 'cinturon-s107a-sin:' || gen_random_uuid());

    SELECT estado INTO v_estado_con FROM public.notificacion_intencion WHERE id = v_id_con;
    SELECT estado INTO v_estado_sin FROM public.notificacion_intencion WHERE id = v_id_sin;

    IF v_estado_con IS DISTINCT FROM 'nacida' THEN
      RAISE EXCEPTION 'CINTURON ④a: CON preferencia el aviso no nacio (estado=%)', v_estado_con;
    END IF;
    IF v_estado_sin IS DISTINCT FROM 'descartada' THEN
      RAISE EXCEPTION 'CINTURON ④b: SIN preferencia el aviso NO fue descartado (estado=%) — el discriminador no discrimina', v_estado_sin;
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';   -- deshace las dos intenciones
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  -- ⑤ el barrido CORRE de verdad (con cero estadias devuelve 0 y no escribe)
  v_res := public.encolar_resumen_media_guarderia();
  IF coalesce(v_res->>'ok','') <> 'true' THEN
    RAISE EXCEPTION 'CINTURON ⑤: el barrido no devolvio ok (%)', v_res;
  END IF;

  -- ⑥ L-140 sobre el OBJETO, no sobre la intencion de la migracion
  SELECT array_to_string(proacl, ' ') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='encolar_resumen_media_guarderia';
  IF v_acl ILIKE '%anon=%' THEN
    RAISE EXCEPTION 'CINTURON ⑥: anon quedo con EXECUTE (proacl=%)', v_acl;
  END IF;

  -- ⑦ el reloj
  SELECT count(*) INTO v_cron FROM cron.job WHERE jobname='resumen-media-guarderia';
  IF v_cron <> 1 THEN
    RAISE EXCEPTION 'CINTURON ⑦: el cron no quedo agendado (n=%)', v_cron;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · tipo en resumen · voz con texto · % preferencia(s) sembrada(s) · discriminador CON=nacida / SIN=descartada · barrido corre · sin anon · cron 1', v_sembradas;
END
$cint$;

COMMIT;

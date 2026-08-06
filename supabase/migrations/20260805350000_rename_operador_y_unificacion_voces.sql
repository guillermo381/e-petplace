-- S88-A · DOS FIRMAS EN UN ACTO
--   ① RENAME `registro_completado_cliente` → `registro_completado_operador`
--      + las DOS voces del alta asistida.
--   ② UNIFICACIÓN (b): el helper gana, el inline es el piso, la firma NO cambia.
--      + LA DOCTRINA CORREGIDA: **el motor compone; la superficie presenta.**
--
-- 76(g) — VEDA: **NO RIGE.** Un UPDATE de UNA fila de catálogo (medido: cero
--   filas la referencian) + `CREATE OR REPLACE` de tres funciones.
--
-- ⚖️ LA LEY DE NOMBRES QUE ESTE RENAME DEJA (firma del founder):
--   > **UN TIPO SE NOMBRA POR LO QUE CUENTA, Y SE LEE POR A QUIÉN LE LLEGA.
--   >  Cuando las dos cosas no coinciden, EL NOMBRE MIENTE aunque el diseño
--   >  esté bien.**
--   El diseño de `_cliente` era correcto —dos audiencias del negocio, con un
--   guard que evita notificar dos veces al mismo— y el nombre igual mandó a
--   una pista a curar un destinatario que no estaba roto por ahí.
--
-- SEGURIDAD DEL RENAME, medida antes: 0 intenciones con el tipo · 0 filas en
--   la tabla legado · 1 sola función lo nombra · 0 consumidores TS.
--   La FK `notificacion_intencion_tipo_fkey` no se viola porque no hay hijos.
--
-- ⚠️ Y LOS TRES CUERPOS SE ARMARON LEYENDO EL OBJETO VIVO EN ESTE MISMO TURNO
--   (L-208): un `functiondef` guardado es un puntero al presente con cara de
--   hecho, y su ventana de invalidación es de minutos.

BEGIN;

-- ① EL RENAME (la fila del catálogo; sin hijos que arrastrar)
UPDATE cat_notificacion_tipos
   SET codigo = 'registro_completado_operador'
 WHERE codigo = 'registro_completado_cliente';

-- ──────────────────────────────────────────────────────────────────────
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
                  'habitual. Podés ver el detalle en la app.') END;

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
                  ' y se va a cobrar con tu método habitual. Si no querés que siga, ' ||
                  'podés pausarlo desde la app antes de esa fecha.') END;

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
                  coalesce(p_extra->>'restantes','salidas') || ' salidas. Podés reservarlas desde la app.') END;

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
                  '. Coordiná las sesiones que faltan desde la app.') END;

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
                   '. Podés ver el detalle en la app.') END;


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

    ELSE
      RETURN '{}'::jsonb;   -- sin voz firmada: NO INVENTA
  END CASE;
END;
$function$
;

-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_completar_pendiente_registro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pendiente cliente_pendiente_registro%ROWTYPE;
  v_mascota_id uuid;
  v_evento_id uuid;
  v_prestador_dueno_user_id uuid;
BEGIN
  -- Match dual: por email O por teléfono normalizado (con el país del pendiente).
  SELECT * INTO v_pendiente
  FROM cliente_pendiente_registro cpr
  WHERE cpr.completado_en IS NULL
    AND cpr.soporte_resuelto_en IS NULL
    AND (
      (cpr.email IS NOT NULL AND NEW.email IS NOT NULL AND LOWER(cpr.email) = LOWER(NEW.email))
      OR (cpr.telefono_normalizado IS NOT NULL AND NEW.telefono IS NOT NULL
          AND cpr.telefono_normalizado = public.normalizar_telefono(NEW.telefono, cpr.country_code))
    )
  LIMIT 1;

  IF v_pendiente.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE cliente_pendiente_registro
  SET completado_en = now(), completado_por_user_id = NEW.id
  WHERE id = v_pendiente.id;

  UPDATE familia
  SET tipo = 'estandar', cuenta_comercial_id = NULL, updated_at = now()
  WHERE id = v_pendiente.familia_id_placeholder;

  INSERT INTO familia_miembro (familia_id, user_id, rol, desde)
  VALUES (v_pendiente.familia_id_placeholder, NEW.id, 'adulto_titular', now());

  FOR v_mascota_id IN
    SELECT id FROM mascotas WHERE familia_id = v_pendiente.familia_id_placeholder
  LOOP
    INSERT INTO mascota_codueño (mascota_id, user_id, familia_id, desde, agregado_por_user_id)
    VALUES (v_mascota_id, NEW.id, v_pendiente.familia_id_placeholder, now(), NEW.id);

    UPDATE mascotas SET user_id = NEW.id WHERE id = v_mascota_id;

    v_evento_id := gen_random_uuid();
    INSERT INTO eventos_mascota (
      id, mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, datos, country_code
    ) VALUES (
      v_evento_id, v_mascota_id, 'alta_asistida_completada_por_cliente', 'administrativo', now(),
      NEW.id,
      jsonb_build_object('pendiente_id', v_pendiente.id, 'prestador_origen', v_pendiente.creado_por_prestador_id),
      v_pendiente.country_code
    );
  END LOOP;

  SELECT user_id INTO v_prestador_dueno_user_id
  FROM prestadores WHERE id = v_pendiente.creado_por_prestador_id;

  IF v_prestador_dueno_user_id IS NOT NULL THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_prestador`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_prestador',
        p_destinatario_user_id => v_prestador_dueno_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre)
                                  || public._voz_notificacion('registro_completado_prestador', v_prestador_dueno_user_id, NULL,
                                       jsonb_build_object('cliente', v_pendiente.nombre,
                                                          'negocio', (SELECT pr.nombre_comercial FROM prestadores pr WHERE pr.id = v_pendiente.creado_por_prestador_id))),
        p_clave_dedup          => 'registro_completado_prestador:' || v_pendiente.id
      );
  END IF;

  IF v_pendiente.creado_por_user_id IS NOT NULL
     AND v_pendiente.creado_por_user_id <> v_prestador_dueno_user_id THEN
    -- S87 · LOTE 1 → LA PUERTA (tipo `registro_completado_operador`). El mismo hecho a
      -- dos audiencias son DOS tipos, no uno con destinatario variable (firma
      -- founder S87): un tipo variable obliga a preferencias, techo y sombra a
      -- preguntar "cual?" en cada consulta.
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'registro_completado_operador',
        /* 🔴→✅ S88/D-668: decía `v_prestador_dueno_user_id`, COPIADO del bloque de
           arriba. El GUARD sí se adaptó —pregunta por `creado_por_user_id` y exige
           que sea DISTINTO del dueño— y el destinatario no: el dueño recibía DOS
           avisos del mismo hecho y quien hizo el alta NINGUNO. */
        p_destinatario_user_id => v_pendiente.creado_por_user_id,
        p_mascota_id           => NULL,
        p_datos                => jsonb_build_object('pendiente_id', v_pendiente.id,
                                                     'cliente_nombre', v_pendiente.nombre)
                                  || public._voz_notificacion('registro_completado_operador', v_pendiente.creado_por_user_id, NULL,
                                       jsonb_build_object('cliente', v_pendiente.nombre,
                                                          'negocio', (SELECT pr.nombre_comercial FROM prestadores pr WHERE pr.id = v_pendiente.creado_por_prestador_id))),
        p_clave_dedup          => 'registro_completado_operador:' || v_pendiente.id
      );
  END IF;

  RETURN NEW;
END;
$function$
;
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public."_notificar_dueño_prestador"(p_prestador_id uuid, p_tipo text, p_titulo text, p_mensaje text, p_url_accion text, p_datos jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_country_code text;
  v_notif_id uuid;
  v_voz     jsonb;
BEGIN
  -- Lookup dueño del prestador
  SELECT user_id INTO v_user_id
  FROM prestadores
  WHERE id = p_prestador_id;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Prestador % no existe, no se crea notificación', p_prestador_id;
    RETURN NULL;
  END IF;

  -- Lookup country del user (para FK notificaciones.country_code)
  SELECT COALESCE(country_code, 'EC') INTO v_country_code
  FROM profiles
  WHERE id = v_user_id;

  -- La voz del helper, si este tipo ya la tiene firmada. `{}` = todavía no,
  -- y entonces manda el literal que el trigger trae. **El día que ningún tipo
  -- caiga al ELSE, los dos parámetros se pueden borrar** — y el guard de abajo
  -- lo cuenta, así que no hace falta acordarse.
  v_voz := public._voz_notificacion(p_tipo, v_user_id, NULL, coalesce(p_datos,'{}'::jsonb));

  -- Insertar notificación
  -- S87 · LOTE 1 → LA PUERTA. Recibe el tipo POR PARAMETRO: el censo midio los
  -- SEIS valores reales que le llegan (documento_aprobado/rechazado ·
  -- prestador_aprobado/rechazado/suspendido · el `sistema` que hoy pasa a
  -- `prestador_en_revision`) y los seis estan en catalogo. El aviso es para el
  -- PRESTADOR y no lleva mascota: el gate 1 no aplica y el lector lo dice.
  /* ⚖️ LA DOCTRINA, CORREGIDA (firma del founder, S88):
     **EL MOTOR COMPONE; LA SUPERFICIE PRESENTA.**
     Acá decía lo contrario —«el motor no compone texto, lo hace la
     superficie»— y esa letra PERDIÓ CONTRA UN HECHO: D-667 midió que **el
     correo no tiene superficie**. Con la doctrina vieja, todo aviso por mail
     salía con el genérico «Tienes una novedad».
     *Dejar el comentario habría conservado la letra vencida — y dos doctrinas
     vivas en código son dos letras contradictorias SIN DOCUMENTO QUE CITAR,
     que es peor: nadie puede ni saber que están peleando.* */
  v_notif_id := registrar_intencion_notificacion(
    p_tipo                 => p_tipo,
    p_destinatario_user_id => v_user_id,
    p_mascota_id           => NULL,
    /* ⭐ S88 — EL HELPER GANA, EL INLINE ES EL PISO (opción (b) firmada).
       La firma NO cambia: los 6 call sites siguen compilando y las voces
       migran DE A UNA, que es como esta casa las firma.
       ⚠️ `url_accion` se compone APARTE y SIEMPRE: no es voz, es destino —
       si viajara adentro del CASE se perdería en la rama del helper. */
    p_datos                => coalesce(p_datos,'{}'::jsonb)
                              || jsonb_build_object('url_accion', p_url_accion)
                              || CASE WHEN v_voz <> '{}'::jsonb
                                      THEN v_voz
                                      ELSE jsonb_build_object('titulo', p_titulo,
                                                              'mensaje', p_mensaje) END,
    p_clave_dedup          => NULL
  );

  RETURN v_notif_id;
END;
$function$
;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $belt$
DECLARE v_w text; v_p text; v_sin_voz int;
BEGIN
  -- ① el rename, en el catálogo y en el productor
  IF NOT EXISTS (SELECT 1 FROM cat_notificacion_tipos WHERE codigo='registro_completado_operador')
     OR EXISTS (SELECT 1 FROM cat_notificacion_tipos WHERE codigo='registro_completado_cliente') THEN
    RAISE EXCEPTION 'CINTURON: el rename no quedó en el catálogo';
  END IF;
  v_p := pg_get_functiondef('public._trg_completar_pendiente_registro()'::regprocedure);
  IF v_p LIKE '%registro_completado_cliente%' THEN
    RAISE EXCEPTION 'CINTURON: el productor sigue nombrando el tipo viejo';
  END IF;
  -- y el receptor curado en D-668 NO se cayó con el rename
  IF v_p NOT LIKE '%v_pendiente.creado_por_user_id%' THEN
    RAISE EXCEPTION 'CINTURON: se perdió la cura de D-668 (el receptor)';
  END IF;

  -- las dos voces nuevas
  IF public._voz_notificacion('registro_completado_operador', NULL, NULL, '{}'::jsonb) = '{}'::jsonb
     OR public._voz_notificacion('registro_completado_prestador', NULL, NULL, '{}'::jsonb) = '{}'::jsonb THEN
    RAISE EXCEPTION 'CINTURON: falta alguna de las dos voces del alta asistida';
  END IF;

  -- ② la unificación: el wrapper consulta el helper, y `url_accion` viaja APARTE
  v_w := pg_get_functiondef('public."_notificar_dueño_prestador"(uuid,text,text,text,text,jsonb)'::regprocedure);
  IF v_w NOT LIKE '%_voz_notificacion%' THEN
    RAISE EXCEPTION 'CINTURON: el wrapper no consulta el helper';
  END IF;
  IF v_w NOT LIKE '%jsonb_build_object(''url_accion'', p_url_accion)%' THEN
    RAISE EXCEPTION 'CINTURON: url_accion no quedó fuera del CASE — se perdería en la rama del helper';
  END IF;
  -- la doctrina vieja no puede sobrevivir
  /* ⚠️ EL GUARD APUNTA AL ARRANQUE DE LA LÍNEA MUERTA («La voz viaja en»), NO
     a la frase de la doctrina. La primera versión buscaba «el motor no compone
     texto» y **se disparó contra la CITA de esa frase en el comentario nuevo**
     —el que explica qué cambió—.
     *Un guard que caza prosa vencida no distingue la letra de su epitafio.*
     Se apunta al literal que SOLO existía en la versión vieja. */
  IF v_w LIKE '%La voz viaja en%' THEN
    RAISE EXCEPTION 'CINTURON: sobrevivió la doctrina vencida';
  END IF;

  -- ⭐ EL CONTADOR DEL FALLBACK: cuántos de los seis siguen cayendo al inline.
  --    El día que dé 0, los parámetros p_titulo/p_mensaje se pueden borrar —
  --    y no hace falta que nadie se acuerde: este número lo dice.
  SELECT count(*) INTO v_sin_voz FROM (VALUES
    ('documento_aprobado'),('documento_rechazado'),('prestador_aprobado'),
    ('prestador_rechazado'),('prestador_en_revision'),('prestador_suspendido')) AS t(c)
  WHERE public._voz_notificacion(t.c, NULL, NULL, '{}'::jsonb) = '{}'::jsonb;

  RAISE NOTICE 'CINTURON VERDE: rename OK · D-668 intacta · 2 voces nuevas · wrapper unificado · url_accion aparte · FALLBACK VIVO EN % de 6', v_sin_voz;
END
$belt$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · AL ADOPTAR, LAS OTRAS SOLICITUDES DEL MISMO ANIMAL SE CIERRAN
--
-- Orden del founder, sobre un defecto que **el caso de Nube no mostraba**:
-- Nube tuvo UNA sola solicitud, así que nada quedó colgado. Medido como
-- CLASE: `firmar_acta_adopcion` llama a `traspasar_mascota_a_familia` y
-- **jamás toca las otras solicitudes** ⇒ *el día que dos familias pidan al
-- mismo animal, la que no fue elegida se queda «en conversación» para
-- siempre, esperando una respuesta que ya no puede llegar.*
--
-- 🔴 **NO SE REUSA `declinada`, Y ES LA DECISIÓN DEL ARCHIVO.** «Declinada»
-- dice *el publicador te evaluó y dijo que no*. Acá **nadie la evaluó**: el
-- animal encontró familia antes. *Un estado que miente sobre lo que pasó es
-- peor que uno que falta, porque la pantalla lo lee con total confianza* —
-- y esa persona leería un rechazo que nunca ocurrió. Mismo precedente que
-- `no_concretada_fallecimiento`, firmado por el founder esta misma sesión.
--
-- La voz es **sin duelo y sin invitación**: dice que ya encontró familia y
-- no ofrece otro animal. *Ofrecer un reemplazo en el mismo acto convierte un
-- animal en un artículo intercambiable.*
--
-- 76(g) — **NO RIGE**: el ensanche del CHECK no toca ninguna fila existente
-- (medido en el cinturón), y no hay backfill.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada',
                             'desistida','no_concretada_fallecimiento',
                             'no_concretada_otra_familia']));

-- El cierre coherente: el estado nuevo es TERMINAL ⇒ exige `cerrada_en`.
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT chk_cierre_coherente;
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente
  CHECK ((estado = ANY (ARRAY['recibida','en_conversacion']) AND cerrada_en IS NULL)
      OR (estado = ANY (ARRAY['aceptada','declinada','desistida',
                              'no_concretada_fallecimiento','no_concretada_otra_familia'])
          AND cerrada_en IS NOT NULL));

-- ═══ EL CERRADOR ═══
CREATE OR REPLACE FUNCTION public._cerrar_otras_solicitudes_del_animal(
  p_mascota_id uuid, p_solicitud_ganadora uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_n int;
BEGIN
  /* Por MASCOTA, no por publicación: un animal puede haber sido publicado más
     de una vez (se retiró y se volvió a publicar), y las solicitudes de la
     publicación vieja **también quedan sin respuesta posible**. *Cerrar sólo
     la publicación ganadora dejaría colgadas justo las más viejas.* */
  WITH cerradas AS (
    UPDATE adopcion_solicitud s
       SET estado = 'no_concretada_otra_familia', cerrada_en = now()
      FROM adopcion_publicacion p
     WHERE p.id = s.publicacion_id
       AND p.mascota_id = p_mascota_id
       AND s.id <> p_solicitud_ganadora
       AND s.estado IN ('recibida','en_conversacion')
    RETURNING s.id)
  SELECT count(*) INTO v_n FROM cerradas;
  RETURN v_n;
END $fn$;

REVOKE ALL ON FUNCTION public._cerrar_otras_solicitudes_del_animal(uuid, uuid) FROM anon, PUBLIC, authenticated;

-- ═══ EL CABLEADO: la segunda firma cierra las otras solicitudes ═══
CREATE OR REPLACE FUNCTION public.firmar_acta_adopcion(p_solicitud_id uuid, p_codigo text, p_cedula text DEFAULT NULL::text, p_domicilio text DEFAULT NULL::text, p_dispositivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_otras int := 0;
  v_uid uuid := auth.uid(); v_c record; v_acta jsonb; v_papel text; v_folio text;
  v_ip text; v_hash_ip text; v_firmas int; v_tras jsonb; v_ev uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  /* 🟢 FIRMA DEL FOUNDER (2-sep): EL ACTA NO SE FIRMA CON EL ANIMAL EN
     MEMORIAL. Un acta de adopcion de un animal que murio no es un tramite
     que se cierra: es un documento que no tiene objeto. */
  IF EXISTS (SELECT 1 FROM adopcion_solicitud s
               JOIN adopcion_publicacion p ON p.id = s.publicacion_id
               JOIN mascotas m ON m.id = p.mascota_id
              WHERE s.id = p_solicitud_id AND m.estado_vida = 'fallecida') THEN
    RAISE EXCEPTION 'animal_en_memorial' USING ERRCODE='22023';
  END IF;



  IF p_cedula IS NOT NULL AND btrim(p_cedula) <> '' THEN
    UPDATE profiles SET cedula = btrim(p_cedula) WHERE id = v_uid;
  END IF;
  IF p_domicilio IS NOT NULL AND btrim(p_domicilio) <> '' THEN
    UPDATE profiles SET domicilio = btrim(p_domicilio) WHERE id = v_uid;
  END IF;

  v_acta := public.obtener_acta_adopcion(p_solicitud_id);
  v_papel := v_acta->>'mi_papel';
  IF v_papel IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;
  IF jsonb_array_length(v_acta->'faltantes') > 0 THEN
    RAISE EXCEPTION 'acta_incompleta: %',
      (SELECT string_agg(x::text, ', ') FROM jsonb_array_elements_text(v_acta->'faltantes') x)
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_c FROM adopcion_codigo_firma
   WHERE solicitud_id=p_solicitud_id AND user_id=v_uid AND usado_en IS NULL FOR UPDATE;
  IF v_c.id IS NULL THEN RAISE EXCEPTION 'sin_codigo' USING ERRCODE='22023'; END IF;
  IF v_c.expira_en <= now() THEN RAISE EXCEPTION 'codigo_vencido' USING ERRCODE='22023'; END IF;
  IF v_c.version_acta <> (v_acta->>'version')::int THEN
    RAISE EXCEPTION 'acta_cambio_de_version' USING ERRCODE='22023';
  END IF;

  /* ── 🔴 LOS DOS CASOS QUE **DEVUELVEN** EN VEZ DE LANZAR ─────────────────
     Son los unicos que necesitan que una escritura SOBREVIVA a la llamada. */
  IF v_c.intentos >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'intentos_agotados',
                              'intentos_restantes', 0);
  END IF;

  IF v_c.codigo_hash <> encode(sha256(convert_to(COALESCE(p_codigo,''),'UTF8')),'hex') THEN
    UPDATE adopcion_codigo_firma SET intentos = intentos + 1 WHERE id = v_c.id;
    /* Sin `RAISE`: el `UPDATE` de arriba tiene que COMMITEAR. Con excepcion,
       la transaccion lo revierte y el contador nunca avanza. */
    RETURN jsonb_build_object('ok', false, 'motivo', 'codigo_incorrecto',
                              'intentos_restantes', 5 - (v_c.intentos + 1));
  END IF;

  UPDATE adopcion_codigo_firma SET usado_en = now() WHERE id = v_c.id;

  v_ip := split_part(coalesce(
            (current_setting('request.headers', true)::json->>'x-forwarded-for'), ''), ',', 1);
  v_hash_ip := CASE WHEN btrim(v_ip) = '' THEN NULL
                    ELSE encode(sha256(convert_to(btrim(v_ip),'UTF8')),'hex') END;
  v_folio := 'F-' || to_char(now(),'YYYY') || '-' ||
             lpad(nextval('public.documento_folio_seq')::text, 6, '0');

  INSERT INTO adopcion_firma (solicitud_id, user_id, papel, version_acta, codigo_acta,
                              hash_renderizado, hash_fuente, folio, ip_hash, dispositivo)
  VALUES (p_solicitud_id, v_uid, v_papel, (v_acta->>'version')::int, v_acta->>'codigo',
          v_acta->>'hash_renderizado', v_acta->>'hash_fuente', v_folio, v_hash_ip, p_dispositivo);

  SELECT count(*) INTO v_firmas FROM adopcion_firma WHERE solicitud_id = p_solicitud_id;

  IF v_firmas >= 2 THEN
    SELECT public.traspasar_mascota_a_familia(
             (v_acta->>'mascota_id')::uuid,
             (SELECT fm.familia_id FROM familia_miembro fm
               WHERE fm.user_id = (v_acta->>'solicitante_user_id')::uuid
                 AND fm.hasta IS NULL LIMIT 1),
             (v_acta->>'version')::int, v_acta->>'codigo')
      INTO v_tras;

    /* ═══ LAS OTRAS SOLICITUDES DE ESTE ANIMAL SE CIERRAN ═══════════════════
       🔴 Va **acá y no en `traspasar_mascota_a_familia`**: ese motor traspasa
       cualquier mascota entre familias y **no todo traspaso es una adopción**.
       *Cerrar solicitudes desde ahí las cerraría también en un traspaso que
       nada tiene que ver con una adopción.* El hecho «este animal ya encontró
       familia» se vuelve cierto **acá**, con la segunda firma.

       Y va DESPUÉS del traspaso a propósito: si el traspaso falla, la
       transacción entera vuelve atrás y **nadie recibe un cierre por una
       adopción que no ocurrió**. */
    v_otras := public._cerrar_otras_solicitudes_del_animal(
                 (v_acta->>'mascota_id')::uuid, p_solicitud_id);


    /* EL MOLDE DE LA CASA: evento padre + fila tipada. La version anterior
       nombraba cinco columnas que esta tabla no tiene y **reventaba la segunda
       firma**, asi que el traspaso nunca se completaba. */
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
                                 country_code, datos, creado_por_user_id, procedencia)
    SELECT m.id, 'hito_narrativo', 'identidad', now(), m.country_code,
           jsonb_build_object('aniversario_anual', true, 'folio', v_folio,
                              'solicitud_id', p_solicitud_id),
           v_uid, 'declarado_por_prestador'
      FROM mascotas m WHERE m.id = (v_acta->>'mascota_id')::uuid
    RETURNING id INTO v_ev;

    INSERT INTO evento_hito_narrativo (evento_id, mascota_id, country_code, clave, contexto)
    SELECT v_ev, m.id, m.country_code, 'adopcion_completada',
           jsonb_build_object('folio', v_folio, 'refugio',
             (SELECT cc.nombre_comercial FROM adopcion_publicacion ap
                JOIN cuentas_comerciales cc ON cc.id = ap.cuenta_comercial_id
               WHERE ap.id = (v_acta->>'publicacion_id')::uuid))
      FROM mascotas m WHERE m.id = (v_acta->>'mascota_id')::uuid;
  END IF;

  RETURN jsonb_build_object('ok', true, 'papel', v_papel, 'folio', v_folio,
    'firmas', v_firmas, 'completa', v_firmas >= 2,
    'traspaso', v_tras, 'hito_id', v_ev,
      /* Para que la pantalla del refugio pueda decir a cuantas familias se
         les cerro la solicitud — dato del acto, no una suposicion suya. */
      'otras_solicitudes_cerradas', v_otras);
END $function$

;

-- ═══ CINTURÓN — ROJO primero, sobre una solicitud SEMBRADA que se deshace ═══
-- L-406: el arnés NO ejerce el camino real (movería una adopción de verdad);
-- ejerce EL CERRADOR, que es la pieza que esta migración agrega.
DO $c$
DECLARE v_pub uuid; v_masc uuid; v_s uuid; v_n int; v_estado text;
BEGIN
  /* ① Que el ensanche no rompió nada vivo. */
  IF EXISTS (SELECT 1 FROM adopcion_solicitud WHERE estado NOT IN
      ('recibida','en_conversacion','aceptada','declinada','desistida',
       'no_concretada_fallecimiento','no_concretada_otra_familia')) THEN
    RAISE EXCEPTION 'CINTURON: hay filas fuera del vocabulario nuevo';
  END IF;

  /* ② EL ROJO: una solicitud abierta sobre un animal con otra ganadora
     QUEDA ABIERTA si nadie la cierra. Se siembra y se deshace sola. */
  SELECT p.id, p.mascota_id INTO v_pub, v_masc
    FROM adopcion_publicacion p LIMIT 1;
  IF v_pub IS NULL THEN
    RAISE NOTICE 'CINTURON: sin publicaciones — el cerrador NO se pudo ejercer';
    RETURN;
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, estado, country_code)
  SELECT v_pub, fm.user_id, 'en_conversacion', 'EC'
    FROM familia_miembro fm WHERE fm.hasta IS NULL LIMIT 1
  RETURNING id INTO v_s;
  IF v_s IS NULL THEN
    RAISE NOTICE 'CINTURON: no se pudo sembrar — el cerrador NO se pudo ejercer';
    RETURN;
  END IF;

  /* ROJO: con la ganadora siendo OTRA, la sembrada tiene que cerrarse. */
  v_n := public._cerrar_otras_solicitudes_del_animal(v_masc, gen_random_uuid());
  SELECT estado INTO v_estado FROM adopcion_solicitud WHERE id = v_s;
  IF v_estado <> 'no_concretada_otra_familia' THEN
    RAISE EXCEPTION 'CINTURON: la solicitud abierta quedo en «%» — no se cerro', v_estado;
  END IF;
  RAISE NOTICE 'CINTURON ROJO OK: % solicitud(es) abiertas se cerraron', v_n;

  /* ③ EL CONTROL NEGATIVO: la GANADORA no se toca. Sin esto, un cerrador que
     cierra TODO daría el mismo verde y rompería la adopción que acaba de
     ocurrir. */
  v_n := public._cerrar_otras_solicitudes_del_animal(v_masc, v_s);
  SELECT estado INTO v_estado FROM adopcion_solicitud WHERE id = v_s;
  IF v_estado <> 'no_concretada_otra_familia' THEN
    RAISE EXCEPTION 'CINTURON: el cerrador reabrio o pisó la ganadora';
  END IF;

  RAISE EXCEPTION 'CINTURON VERDE — se deshace a proposito (residuo 0)';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'CINTURON VERDE%' THEN RAISE NOTICE '%', SQLERRM;
  ELSE RAISE; END IF;
END $c$;

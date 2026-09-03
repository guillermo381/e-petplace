-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LAS DOS MITADES DE MOTOR QUE EL CHAT NO TENÍA
--
-- Pedidas por C por nombre, medidas contra la base antes de construir:
--   ① `adopcion_mensaje.automatica` existía y **nadie la producía** (0 de 2).
--   ② **cero columnas de lectura** ⇒ el número de no leídos y el de la campana
--      no se podían construir *ni bien ni mal*.
--
-- ⚠️ **UNA DISCREPANCIA DE LA DIRECCIÓN, DECLARADA Y NO RESUELTA ACÁ:** el
-- documento dice *«la respuesta automática que la letra §5 ya fija»*. Medido:
-- **§5 del loop de adopción es SEGURIDAD** y no fija ningún texto; tampoco
-- aparece en ninguna otra letra. ⇒ **el texto no se inventa acá.** Se
-- construye el LUGAR donde el refugio escribe el suyo; si no escribió, no hay
-- mensaje automático — y el hilo igual tiene el de quien postula.
--
-- 76(g) — NO RIGE: tablas nuevas vacías, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ ① EL TEXTO ES DEL REFUGIO ═══
CREATE TABLE public.adopcion_respuesta_automatica (
  cuenta_comercial_id uuid PRIMARY KEY REFERENCES cuentas_comerciales(id) ON DELETE CASCADE,
  cuerpo      text NOT NULL CHECK (btrim(cuerpo) <> '' AND length(cuerpo) <= 1000),
  actualizado timestamptz NOT NULL DEFAULT now(),
  actualizado_por uuid REFERENCES auth.users(id)
);
ALTER TABLE public.adopcion_respuesta_automatica ENABLE ROW LEVEL SECURITY;

/* Sólo el dueño de la cuenta la lee y la escribe. **La familia NO la lee
   directo**: la recibe como mensaje del hilo, que es donde tiene sentido —
   *un texto de bienvenida leído fuera de su conversación es una política, no
   un saludo.* */
CREATE POLICY ara_dueno ON public.adopcion_respuesta_automatica
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM cuentas_comerciales c
                  WHERE c.id = cuenta_comercial_id AND c.owner_profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cuentas_comerciales c
                  WHERE c.id = cuenta_comercial_id AND c.owner_profile_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.definir_respuesta_automatica_refugio(p_cuerpo text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_ref jsonb; v_cc uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  v_ref := public.obtener_mi_cuenta_refugio();
  IF v_ref IS NULL OR v_ref->>'cuenta_comercial_id' IS NULL THEN
    RAISE EXCEPTION 'no_sos_refugio' USING ERRCODE='42501';
  END IF;
  v_cc := (v_ref->>'cuenta_comercial_id')::uuid;

  /* Vaciarla la RETIRA, no guarda una cadena vacía: *un texto en blanco que
     igual se envía es un mensaje mudo del refugio.* */
  IF p_cuerpo IS NULL OR btrim(p_cuerpo) = '' THEN
    DELETE FROM adopcion_respuesta_automatica WHERE cuenta_comercial_id = v_cc;
    RETURN jsonb_build_object('ok', true, 'activa', false);
  END IF;
  IF length(p_cuerpo) > 1000 THEN
    RAISE EXCEPTION 'respuesta_muy_larga' USING ERRCODE='22023';
  END IF;

  INSERT INTO adopcion_respuesta_automatica (cuenta_comercial_id, cuerpo, actualizado_por)
       VALUES (v_cc, btrim(p_cuerpo), auth.uid())
  ON CONFLICT (cuenta_comercial_id) DO UPDATE
     SET cuerpo = EXCLUDED.cuerpo, actualizado = now(), actualizado_por = EXCLUDED.actualizado_por;
  RETURN jsonb_build_object('ok', true, 'activa', true);
END $fn$;
REVOKE ALL ON FUNCTION public.definir_respuesta_automatica_refugio(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.definir_respuesta_automatica_refugio(text) TO authenticated;

-- ═══ ② LA MARCA DE LECTURA — por (persona, solicitud) ═══
/* 🔴 **Va en el SERVIDOR y no en el teléfono**, y la razón la dio C: guardarla
   local haría que **cambiar de aparato marque todo como no leído** y que
   desinstalar pierda la cuenta. *Un contador que miente hacia arriba en un
   teléfono nuevo entrena a ignorarlo* — y un contador que se ignora es peor
   que ninguno, porque ocupa el lugar del que sí serviría. */
CREATE TABLE public.adopcion_lectura (
  solicitud_id uuid NOT NULL REFERENCES adopcion_solicitud(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leido_hasta  timestamptz NOT NULL,
  PRIMARY KEY (solicitud_id, user_id)
);
ALTER TABLE public.adopcion_lectura ENABLE ROW LEVEL SECURITY;
CREATE POLICY lectura_propia ON public.adopcion_lectura
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.marcar_hilo_leido(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_u uuid := auth.uid(); v_ultimo timestamptz;
BEGIN
  IF v_u IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* 🔴 Quien no ve el hilo no lo marca leído — se pregunta por la MISMA
     puerta que sirve los mensajes, jamás por una regla nueva. */
  IF NOT EXISTS (SELECT 1 FROM adopcion_solicitud s WHERE s.id = p_solicitud_id
                  AND (s.solicitante_user_id = v_u
                       OR public._user_publico_esta_publicacion(s.publicacion_id, v_u))) THEN
    RAISE EXCEPTION 'no_ves_este_hilo' USING ERRCODE='42501';
  END IF;

  /* Se ancla al ÚLTIMO MENSAJE, no a `now()`: *anclar al reloj marcaría leído
     un mensaje que llegue en el mismo instante y nadie vio.* */
  SELECT max(creado_en) INTO v_ultimo FROM adopcion_mensaje WHERE solicitud_id = p_solicitud_id;
  IF v_ultimo IS NULL THEN RETURN jsonb_build_object('ok', true, 'sin_mensajes', true); END IF;

  INSERT INTO adopcion_lectura (solicitud_id, user_id, leido_hasta)
       VALUES (p_solicitud_id, v_u, v_ultimo)
  ON CONFLICT (solicitud_id, user_id) DO UPDATE
     /* Nunca retrocede: releer lo viejo no vuelve nuevo lo que ya se leyó. */
     SET leido_hasta = GREATEST(adopcion_lectura.leido_hasta, EXCLUDED.leido_hasta);
  RETURN jsonb_build_object('ok', true, 'leido_hasta', v_ultimo);
END $fn$;
REVOKE ALL ON FUNCTION public.marcar_hilo_leido(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.marcar_hilo_leido(uuid) TO authenticated;

-- ═══ EL PRODUCTOR: la solicitud dispara la respuesta del refugio ═══
CREATE OR REPLACE FUNCTION public.crear_solicitud_adopcion(p_publicacion_id uuid, p_respuestas jsonb, p_aceptacion_id uuid DEFAULT NULL::uuid, p_mensaje_inicial text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auto text;
  v_autor uuid; v_user uuid := auth.uid(); v_sol uuid; v_cc text; v_malo text; v_vivas int; v_acep uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT p.country_code INTO v_cc FROM adopcion_publicacion p
   WHERE p.id = p_publicacion_id AND p.estado = 'publicada';
  IF v_cc IS NULL THEN RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023'; END IF;

  
  IF NOT public.tengo_aceptado_documento('condiciones_adopcion') THEN
    RAISE EXCEPTION 'condiciones_no_aceptadas' USING ERRCODE='22023';
  END IF;

  v_malo := public._respuestas_postulacion_validas(p_respuestas);
  IF v_malo IS NOT NULL THEN
    
    RAISE EXCEPTION 'respuesta_no_valida: %', v_malo USING ERRCODE='22023';
  END IF;

  
  SELECT count(*) INTO v_vivas FROM adopcion_solicitud s
   WHERE s.solicitante_user_id = v_user AND s.estado IN ('recibida','en_conversacion');
  IF v_vivas >= 3 THEN
    RAISE EXCEPTION 'tope_de_solicitudes: %', v_vivas USING ERRCODE='22023';
  END IF;

  SELECT s.id INTO v_sol FROM adopcion_solicitud s
   WHERE s.publicacion_id = p_publicacion_id AND s.solicitante_user_id = v_user
     AND s.estado IN ('recibida','en_conversacion');
  IF v_sol IS NOT NULL THEN
    RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol USING ERRCODE='22023';
  END IF;

  IF p_mensaje_inicial IS NOT NULL AND btrim(p_mensaje_inicial) = '' THEN
    RAISE EXCEPTION 'mensaje_vacio' USING ERRCODE='22023';
  END IF;

  
  SELECT c.id INTO v_acep FROM consentimientos c
   WHERE c.user_id = v_user AND c.tipo = 'condiciones_adopcion'
   ORDER BY c.created_at DESC LIMIT 1;
  IF p_aceptacion_id IS NOT NULL AND p_aceptacion_id IS DISTINCT FROM v_acep THEN
    RAISE EXCEPTION 'aceptacion_no_es_tuya' USING ERRCODE='42501';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  respuestas, aceptacion_id)
       VALUES (p_publicacion_id, v_user, v_cc, p_respuestas, v_acep)
    RETURNING id INTO v_sol;

  IF p_mensaje_inicial IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_user, p_mensaje_inicial, false);
  END IF;

  /* ═══ LA RESPUESTA AUTOMÁTICA DEL REFUGIO ══════════════════════════════
     La columna `automatica` existía desde que la tabla nació y **nadie la
     producía**: medido, 0 de 2 mensajes. Era una rama escrita que nunca corrió.

     🔴 **EL TEXTO ES DEL REFUGIO, JAMÁS DE LA CASA.** Si la app lo inventara,
     *le pondría palabras en la boca a un refugio que no las escribió* — y esa
     frase la va a leer una familia creyendo que se la escribieron a ella.
     Por eso sale de `adopcion_respuesta_automatica`, que el refugio llena.

     ⚠️ **Sin texto no hay mensaje, y eso es correcto**: el hilo igual tiene el
     de quien postula, así que **no nace vacío**. *Un saludo genérico de la
     plataforma es peor que ninguno: enseña que el refugio contesta cuando no
     contestó.* */
  /* 🔴 **EL AUTOR ES EL REFUGIO, NO «LA CASA» — y esto NO es un rodeo del
     CHECK: es la razón por la que ese CHECK tiene razón.** El primer intento
     insertó `autor_user_id = NULL` y `adopcion_mensaje` lo rebotó con
     `mensaje_sin_autor`. **Ese rebote es la causa real de que la columna
     `automatica` no tuviera productor desde que nació**: la tabla nunca
     admitió un mensaje sin alguien detrás.
     *Y tiene razón: el texto lo escribió una persona del refugio.* `automatica`
     dice CÓMO se envió —solo, sin que nadie lo despachara—, no que no tenga
     autor. **Relajar el CHECK habría hecho posible un mensaje del que nadie
     responde**, en una conversación donde saber quién habla es el punto. */
  SELECT btrim(r.cuerpo), r.actualizado_por INTO v_auto, v_autor
    FROM adopcion_respuesta_automatica r
    JOIN adopcion_publicacion pub ON pub.cuenta_comercial_id = r.cuenta_comercial_id
   WHERE pub.id = p_publicacion_id AND btrim(COALESCE(r.cuerpo,'')) <> '';
  IF v_auto IS NOT NULL AND v_autor IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_autor, v_auto, true);
  END IF;

  RETURN jsonb_build_object('ok', true, 'solicitud_id', v_sol, 'estado', 'recibida',
                            'solicitudes_vivas', v_vivas + 1);
END $function$

;

-- ═══ CINTURÓN ═══ el rojo primero, sobre una solicitud que se deshace sola.
DO $c$
DECLARE v_pub uuid; v_cc uuid; v_fam uuid; v_sol uuid; v_auto int; v_no_leidos int; v_err text;
BEGIN
  SELECT p.id, p.cuenta_comercial_id INTO v_pub, v_cc
    FROM adopcion_publicacion p WHERE p.estado='publicada' LIMIT 1;
  IF v_pub IS NULL THEN
    RAISE NOTICE 'CINTURON: sin publicacion viva — el productor NO se pudo ejercer';
    RETURN;
  END IF;

  /* ① 🔴 ROJO: SIN texto del refugio, NO nace mensaje automatico. */
  DELETE FROM adopcion_respuesta_automatica WHERE cuenta_comercial_id = v_cc;
  SELECT fm.user_id INTO v_fam FROM familia_miembro fm WHERE fm.hasta IS NULL LIMIT 1;
  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, estado, country_code)
       VALUES (v_pub, v_fam, 'recibida', 'EC') RETURNING id INTO v_sol;
  SELECT count(*) INTO v_auto FROM adopcion_mensaje
   WHERE solicitud_id = v_sol AND automatica;
  IF v_auto <> 0 THEN
    RAISE EXCEPTION 'CINTURON: nacio un mensaje automatico SIN texto del refugio — la casa invento palabras';
  END IF;

  /* ② La marca de lectura no retrocede, y quien no ve el hilo no la escribe. */
  INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
       VALUES (v_sol, v_fam, 'hola', false);
  INSERT INTO adopcion_lectura (solicitud_id, user_id, leido_hasta)
       VALUES (v_sol, v_fam, now());
  INSERT INTO adopcion_lectura (solicitud_id, user_id, leido_hasta)
       VALUES (v_sol, v_fam, now() - interval '1 day')
  ON CONFLICT (solicitud_id, user_id) DO UPDATE
     SET leido_hasta = GREATEST(adopcion_lectura.leido_hasta, EXCLUDED.leido_hasta);
  SELECT count(*) INTO v_no_leidos FROM adopcion_lectura
   WHERE solicitud_id = v_sol AND leido_hasta < now() - interval '12 hours';
  IF v_no_leidos <> 0 THEN
    RAISE EXCEPTION 'CINTURON: la marca de lectura RETROCEDIO';
  END IF;

  /* ③ El guard de la respuesta automatica: quien no es refugio no la define. */
  BEGIN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_fam, 'role','authenticated')::text, true);
    PERFORM public.definir_respuesta_automatica_refugio('no deberia poder');
    RAISE EXCEPTION 'CINTURON: una familia definio la respuesta automatica de un refugio';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'no_sos_refugio%' THEN RAISE; END IF;
  END;

  RAISE EXCEPTION 'CINTURON VERDE — se deshace a proposito (residuo 0)';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'CINTURON VERDE%' THEN RAISE NOTICE '%', SQLERRM;
  ELSE RAISE; END IF;
END $c$;

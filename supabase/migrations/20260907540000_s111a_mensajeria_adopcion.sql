/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · LA MENSAJERÍA DE ADOPCIÓN — implementación del contrato de D.
   ═══════════════════════════════════════════════════════════════════════════

   > **Yo no la diseñé: la implemento.** El diseño es de la pista D
   > (`docs/loop/buzon/S111-D-para-A-CONTRATO-DB.md`), y la ley del hilo ya está
   > **escrita y ejercida en TS** (`packages/mensajeria/src/solicitud.ts`,
   > `verify:mensajeria` 53/53 con auto-prueba). *Que la ley viva en los dos
   > lados no es duplicación: es que el módulo y el motor puedan no diverger, y
   > que si divergen haya un rojo que lo diga.*

   ── EL FRENO DE D, HONRADO ───────────────────────────────────────────────
   🔴 **NO se reusa `solicitudes_adopcion`** ni ninguna de las cinco legado
   (`D-991`). La tabla es NUEVA y se llama `adopcion_solicitud` **en singular y
   a propósito distinta**, para que un `grep` las separe sin ambigüedad. *Son el
   producto anterior, no un esqueleto sembrado: `solicitudes_adopcion` es
   anterior incluso a `pedidos`, y referencia al animal por NOMBRE en un `text`.*

   ── LAS TRES RAZONES QUE D PIDIÓ CON SU PORQUÉ, y las tres se respetan ───
   **① EL GATE DE PRIVACIDAD ES LA PUBLICACIÓN, NO EL REFUGIO.** §5 dice *«sólo
   lo ve el publicador del ANIMAL SOLICITADO»*. Gatear por organización haría
   que dos personas del mismo refugio vean solicitudes de animales que no
   publicaron — **ensanche por encima de la letra**. El helper
   `_user_publico_esta_publicacion` ya nació con el motor de adopción y **es el
   mismo que usa esta tabla**: una sola definición del predicado.

   **② `automatica` NO ES UN ADORNO: es lo que hace que el reloj funcione.** §5
   manda respuesta automática al postular **y** avisar si no responden en 5
   días. *Si la automática contara como respuesta, el reloj no sonaría nunca y
   la promesa quedaría muerta el día uno.* El barrido las ignora.

   **③ EL UNIQUE VA CON UNA RPC QUE EXPLICA.** Una persona no puede tener dos
   solicitudes vivas sobre el mismo animal — el piso es el índice; el guard
   devuelve **el `solicitud_id` que ya existe**, para poder llevarla ahí en vez
   de decirle que no (`L-424`).

   ── ⚠️ LO QUE EL CONTRATO PIDE Y HOY NO PUEDE OCURRIR, declarado ─────────
   `crear_solicitud_adopcion` debe insertar la respuesta automática *«si el
   publicador la tiene configurada»*. **Esa configuración NO EXISTE**: no hay
   tabla ni columna donde un refugio guarde su texto. ⇒ **hoy no se inserta
   ninguna**, y la columna `automatica` queda esperando su productor.
   🔴 *Se declara en vez de inventarle un casillero: un texto que el refugio
   escribe es contenido de producto, y ninguna letra dijo dónde vive.*

   ── LO QUE **NO** ENTRA, porque D lo pidió así y tiene razón ─────────────
   **Sin adjuntos** (no se pide bucket: *sin bucket la puerta no existe, en vez
   de existir abierta*) · **sin digest** · **sin `app_config`** · **ni una
   palabra de texto legal** — el acta de §5 no es de esta tanda · **cero
   backfill** · **ninguna FK contra las cinco legado**.
   🅿️ **`padrinazgo_ahijado_fallecido` NO se crea** — está estacionado (§5.3 del
   estacionamiento) porque §6 firma el aviso y S88 firmó que el memorial calla.
   *El módulo TS ya lo devuelve `avisa: false`; el cobro se detiene igual.*

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Tablas nuevas vacías + funciones + seis filas de catálogo. **CERO BACKFILL.**
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-mensajeria.sql`, escrita
   ANTES; declara que **dropear destruye los hilos**, que son el material de una
   disputa.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL ANCLA DEL CANAL ═════════════════════════════════════════════════
CREATE TABLE public.adopcion_solicitud (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id uuid NOT NULL REFERENCES public.adopcion_publicacion(id) ON DELETE RESTRICT,
  solicitante_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  estado        text NOT NULL DEFAULT 'recibida'
                CHECK (estado IN ('recibida','en_conversacion','aceptada','declinada')),
  /* 🔑 El reloj de §5 se mide desde acá. */
  creada_en     timestamptz NOT NULL DEFAULT now(),
  cerrada_en    timestamptz,
  /* NULL = todavía no se avisó. Se avisa UNA vez, no en cada tick. */
  aviso_silencio_emitido_en timestamptz,
  country_code  text NOT NULL,
  /* Una solicitud terminal tiene que decir CUÁNDO dejó de estar viva. */
  CONSTRAINT chk_cierre_coherente CHECK (
    (estado IN ('recibida','en_conversacion') AND cerrada_en IS NULL)
 OR (estado IN ('aceptada','declinada')       AND cerrada_en IS NOT NULL))
);
CREATE UNIQUE INDEX uq_solicitud_viva
  ON public.adopcion_solicitud (publicacion_id, solicitante_user_id)
  WHERE estado IN ('recibida','en_conversacion');

-- ══ ② EL HILO — append-only ══════════════════════════════════════════════
CREATE TABLE public.adopcion_mensaje (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id  uuid NOT NULL REFERENCES public.adopcion_solicitud(id) ON DELETE RESTRICT,
  autor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  cuerpo        text NOT NULL CHECK (length(btrim(cuerpo)) > 0),
  /* 🔑 La respuesta automática del publicador va `true`, y el barrido la ignora. */
  automatica    boolean NOT NULL DEFAULT false,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mensaje_por_solicitud ON public.adopcion_mensaje (solicitud_id, creado_en);

-- ══ ③ RLS ════════════════════════════════════════════════════════════════
ALTER TABLE public.adopcion_solicitud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adopcion_mensaje   ENABLE ROW LEVEL SECURITY;

CREATE POLICY adopcion_solicitud_select ON public.adopcion_solicitud
  FOR SELECT TO authenticated USING (
    solicitante_user_id = auth.uid()
    OR public._user_publico_esta_publicacion(publicacion_id, auth.uid())
    OR public.is_admin());
CREATE POLICY adopcion_solicitud_insert ON public.adopcion_solicitud
  FOR INSERT TO authenticated WITH CHECK (solicitante_user_id = auth.uid());
/* 🔴 SIN policy de UPDATE ni de DELETE: el estado se mueve SÓLO por RPC. */

CREATE POLICY adopcion_mensaje_select ON public.adopcion_mensaje
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.adopcion_solicitud s
             WHERE s.id = adopcion_mensaje.solicitud_id
               AND (s.solicitante_user_id = auth.uid()
                    OR public._user_publico_esta_publicacion(s.publicacion_id, auth.uid())
                    OR public.is_admin())));
/* 🔴 SIN policy de INSERT tampoco: el hilo entra por RPC, que es donde vive la
   regla de que un estado terminal no acepta mensajes. *Una policy de INSERT que
   no puede mirar el estado dejaría escribir sobre una solicitud cerrada.*
   Y SIN UPDATE/DELETE: **append-only**, espejo del muro clínico — corregir no
   puede ser editar; si hace falta, es AGREGAR con su autor y su fecha. */

GRANT SELECT ON public.adopcion_solicitud, public.adopcion_mensaje TO authenticated;
GRANT INSERT ON public.adopcion_solicitud TO authenticated;

-- ══ ④ LOS SEIS TIPOS DE NOTIFICACIÓN ═════════════════════════════════════
/* `notificaciones.tipo` tiene CHECK CERRADO ⇒ cada tipo nuevo es migración. */
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
  -- S111-A · los seis de adopción y padrinazgo
  'adopcion_solicitud_nueva','adopcion_mensaje_nuevo','adopcion_solicitud_respondida',
  'adopcion_sin_respuesta','padrinazgo_ahijado_adoptado','padrinazgo_refugio_inactivo']));

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion, audiencia, activo, en_sombra)
VALUES
  ('adopcion_solicitud_nueva',      'relacional', 'Alguien postuló para adoptar a un animal que publicaste.', 'prestador', true, false),
  ('adopcion_mensaje_nuevo',        'relacional', 'Mensaje nuevo en el hilo de una solicitud de adopción.',   'ambas',     true, false),
  ('adopcion_solicitud_respondida', 'relacional', 'El publicador respondió tu solicitud.',                    'cliente',   true, false),
  /* 🔴 `operacion` y NO `relacional`, con el criterio firmado en S87: *la
     categoría la decide de QUIÉN es el hecho*. Este hecho **no lo dice una
     persona: es el ESTADO de un proceso que la familia inició**. Precedente
     exacto: `documento_aprobado` y `prestador_aprobado` fueron a `operacion`
     por esta misma razón. */
  ('adopcion_sin_respuesta',        'operacion',  'Pasaron 5 días sin respuesta a tu solicitud.',             'cliente',   true, false),
  ('padrinazgo_ahijado_adoptado',   'relacional', 'El animal que apadrinás encontró hogar.',                  'cliente',   true, false),
  ('padrinazgo_refugio_inactivo',   'operacion',  'El refugio que recibía tu padrinazgo dejó de operar.',     'cliente',   true, false)
ON CONFLICT (codigo) DO NOTHING;

-- ══ ⑤ LAS CUATRO RPC ═════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.crear_solicitud_adopcion(
  p_publicacion_id uuid, p_mensaje_inicial text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_user uuid := auth.uid(); v_sol uuid; v_cc text; v_estado text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT p.country_code INTO v_cc FROM adopcion_publicacion p
   WHERE p.id = p_publicacion_id AND p.estado = 'publicada';
  IF v_cc IS NULL THEN RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023'; END IF;

  IF p_mensaje_inicial IS NOT NULL AND btrim(p_mensaje_inicial) = '' THEN
    RAISE EXCEPTION 'mensaje_vacio' USING ERRCODE='22023';
  END IF;

  /* 🔴 `L-424` PUESTA ANTES DE QUE SE COBRE: el índice sólo sabe negarse, y sin
     esto la persona recibe un `23505` crudo sobre algo que YA TIENE. El id
     viaja en el mensaje para poder LLEVARLA ahí. */
  SELECT s.id, s.estado INTO v_sol, v_estado FROM adopcion_solicitud s
   WHERE s.publicacion_id = p_publicacion_id AND s.solicitante_user_id = v_user
     AND s.estado IN ('recibida','en_conversacion');
  IF v_sol IS NOT NULL THEN
    RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol USING ERRCODE='22023';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code)
       VALUES (p_publicacion_id, v_user, v_cc) RETURNING id INTO v_sol;

  IF p_mensaje_inicial IS NOT NULL THEN
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_user, p_mensaje_inicial, false);
  END IF;

  /* ⚠️ LA RESPUESTA AUTOMÁTICA DEL PUBLICADOR NO SE INSERTA: su configuración
     no existe todavía (ver cabecera). La columna `automatica` queda esperando
     su productor. *No se le inventa un casillero a un texto que ninguna letra
     ubicó.* */
  RETURN jsonb_build_object('ok', true, 'solicitud_id', v_sol, 'estado', 'recibida');
END $$;

CREATE OR REPLACE FUNCTION public.responder_solicitud_adopcion(
  p_solicitud_id uuid, p_cuerpo text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE
  v_user uuid := auth.uid(); v_estado text; v_pub uuid; v_sol uuid;
  v_es_publicador boolean; v_msg uuid; v_nuevo text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_cuerpo IS NULL OR btrim(p_cuerpo) = '' THEN
    RAISE EXCEPTION 'cuerpo_vacio' USING ERRCODE='22023';
  END IF;

  SELECT s.id, s.estado, s.publicacion_id INTO v_sol, v_estado, v_pub
    FROM adopcion_solicitud s WHERE s.id = p_solicitud_id;
  IF v_sol IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;

  v_es_publicador := public._user_publico_esta_publicacion(v_pub, v_user);
  IF NOT v_es_publicador
     AND NOT EXISTS (SELECT 1 FROM adopcion_solicitud s
                      WHERE s.id = p_solicitud_id AND s.solicitante_user_id = v_user) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado IN ('aceptada','declinada') THEN
    RAISE EXCEPTION 'solicitud_terminal' USING ERRCODE='22023';
  END IF;

  INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
       VALUES (p_solicitud_id, v_user, p_cuerpo, false) RETURNING id INTO v_msg;

  /* 🔑 UN SOLO ACTO, NO DOS. Si el que responde es el publicador y la solicitud
     estaba `recibida`, pasa a `en_conversacion` **en la misma escritura**.
     *Un estado que alguien tiene que acordarse de mover es un estado que va a
     estar mal.* */
  v_nuevo := v_estado;
  IF v_es_publicador AND v_estado = 'recibida' THEN
    UPDATE adopcion_solicitud SET estado = 'en_conversacion' WHERE id = p_solicitud_id;
    v_nuevo := 'en_conversacion';
  END IF;

  RETURN jsonb_build_object('ok', true, 'mensaje_id', v_msg, 'estado', v_nuevo);
END $$;

CREATE OR REPLACE FUNCTION public.cerrar_solicitud_adopcion(
  p_solicitud_id uuid, p_estado_final text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_user uuid := auth.uid(); v_estado text; v_pub uuid; v_sol uuid;
        v_es_publicador boolean; v_es_solicitante boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_estado_final NOT IN ('aceptada','declinada') THEN
    RAISE EXCEPTION 'estado_final_invalido' USING ERRCODE='22023';
  END IF;

  SELECT s.id, s.estado, s.publicacion_id INTO v_sol, v_estado, v_pub
    FROM adopcion_solicitud s WHERE s.id = p_solicitud_id;
  IF v_sol IS NULL THEN RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501'; END IF;

  v_es_publicador  := public._user_publico_esta_publicacion(v_pub, v_user);
  v_es_solicitante := EXISTS (SELECT 1 FROM adopcion_solicitud s
                               WHERE s.id = p_solicitud_id AND s.solicitante_user_id = v_user);
  IF NOT v_es_publicador AND NOT v_es_solicitante THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado IN ('aceptada','declinada') THEN
    RAISE EXCEPTION 'solicitud_terminal' USING ERRCODE='22023';
  END IF;
  /* Sólo el publicador ACEPTA; declinar lo pueden los dos. */
  IF p_estado_final = 'aceptada' AND NOT v_es_publicador THEN
    RAISE EXCEPTION 'rol_no_puede' USING ERRCODE='42501';
  END IF;

  UPDATE adopcion_solicitud
     SET estado = p_estado_final, cerrada_en = now()
   WHERE id = p_solicitud_id;

  /* ⚠️ `aceptada` NO dispara acá el acta ni la transferencia del expediente:
     ese arco es de §5 y no es de esta tanda. *Cablearlo ahora sería cablear
     sobre una letra cuya forma todavía no está medida.* El traspaso vive en
     `traspasar_mascota_a_familia`, con su propio fail-closed. */
  RETURN jsonb_build_object('ok', true, 'estado', p_estado_final);
END $$;

/* ══ EL RELOJ DE 5 DÍAS — el silencio es DERIVABLE, no un estado escrito ══ */
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_en_silencio()
RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, solicitante_user_id uuid,
              creada_en timestamptz, dias_de_silencio int)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF NOT public.is_admin() AND current_user = 'authenticated' THEN
    /* Sólo el barrido (que corre como servicio) y el admin. Es un lector de
       OPERACIÓN, no una superficie. */
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.solicitante_user_id, s.creada_en,
         EXTRACT(day FROM now() - s.creada_en)::int
    FROM adopcion_solicitud s
   WHERE s.estado = 'recibida'
     /* 🔑 Los 5 días son FIRMA de §5, no parámetro: van como literal nombrado. */
     AND now() - s.creada_en >= interval '5 days'
     AND s.aviso_silencio_emitido_en IS NULL
     /* 🔴 `automatica = false`: si la automática contara como respuesta, **el
        reloj no sonaría nunca**. Y el autor tiene que ser OTRO: los mensajes
        del propio solicitante no son la respuesta que espera. */
     AND NOT EXISTS (SELECT 1 FROM adopcion_mensaje m
                      WHERE m.solicitud_id = s.id
                        AND m.automatica = false
                        AND m.autor_user_id <> s.solicitante_user_id)
   ORDER BY s.creada_en;
END $$;

-- ══ ⑥ L-140 ══════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.crear_solicitud_adopcion(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.responder_solicitud_adopcion(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cerrar_solicitud_adopcion(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_solicitudes_en_silencio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_adopcion(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.responder_solicitud_adopcion(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_solicitud_adopcion(uuid,text) TO authenticated;

-- ══ ⑦ CINTURÓN — EL ROJO PRIMERO ═════════════════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_cuenta uuid; v_owner uuid;
  v_otro uuid; v_pub uuid; v_sol uuid; v_r jsonb; v_rojo boolean; v_msg text; v_n int;
BEGIN
  SELECT m.id INTO v_masc FROM mascotas m WHERE m.familia_id IS NOT NULL LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_owner FROM cuentas_comerciales c LIMIT 1;
  SELECT u.id INTO v_otro FROM auth.users u WHERE u.id <> v_owner LIMIT 1;
  IF v_masc IS NULL OR v_cuenta IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin sujetos reales';
  END IF;

  BEGIN
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en)
         VALUES (v_cuenta, 'refugio', 'activo', now());
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_pub := (public.publicar_adoptable(v_masc, v_cuenta)->>'publicacion_id')::uuid;

    -- ══ el SOLICITANTE postula ═════════════════════════════════════════
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_otro, 'role','authenticated')::text);
    v_r := public.crear_solicitud_adopcion(v_pub, 'Hola, me interesa.');
    v_sol := (v_r->>'solicitud_id')::uuid;
    IF v_sol IS NULL THEN RAISE EXCEPTION 'CINTURON: no se creo la solicitud (%)', v_r; END IF;

    -- ══ ROJO ① · DOS SOLICITUDES VIVAS NO, Y EL REBOTE LLEVA EL ID ═════
    v_rojo := false;
    BEGIN PERFORM public.crear_solicitud_adopcion(v_pub, 'otra vez');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'solicitud_ya_viva%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: acepto dos solicitudes vivas (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    IF position(v_sol::text in v_msg) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: el rebote NO lleva el id de la que ya existe — solo sabe negarse (msg=%)', v_msg;
    END IF;

    -- ══ ROJO ② · EL SOLICITANTE NO PUEDE ACEPTAR SU PROPIA SOLICITUD ═══
    v_rojo := false;
    BEGIN PERFORM public.cerrar_solicitud_adopcion(v_sol, 'aceptada');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'rol_no_puede%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: el solicitante se acepto solo (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ══ EL RELOJ · con la solicitud de HOY no suena ════════════════════
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: el reloj sono con una solicitud de hoy'; END IF;

    -- se la envejece 6 días: AHORA sí tiene que sonar
    UPDATE adopcion_solicitud SET creada_en = now() - interval '6 days' WHERE id = v_sol;
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el reloj NO sono a los 6 dias (n=%)', v_n; END IF;

    -- 🔴 EL BRAZO QUE D PIDIÓ: una AUTOMÁTICA no apaga el reloj
    INSERT INTO adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
         VALUES (v_sol, v_owner, 'respuesta automatica del refugio', true);
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x WHERE x.solicitud_id = v_sol;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON: una AUTOMATICA apago el reloj — la promesa de §5 queda muerta el dia uno';
    END IF;

    -- y una respuesta REAL del publicador sí lo apaga, y mueve el estado
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_owner, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_r := public.responder_solicitud_adopcion(v_sol, 'Hola! contame de vos.');
    IF v_r->>'estado' <> 'en_conversacion' THEN
      RAISE EXCEPTION 'CINTURON: responder no movio el estado en el MISMO acto (%)', v_r;
    END IF;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM public.obtener_solicitudes_en_silencio() x WHERE x.solicitud_id = v_sol;
    IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: una respuesta REAL no apago el reloj'; END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  -- L-140 · anon fuera de las tres de escritura
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN
     ('crear_solicitud_adopcion','responder_solicitud_adopcion','cerrar_solicitud_adopcion',
      'obtener_solicitudes_en_silencio')
     AND array_to_string(p.proacl,' ') ILIKE '%anon=%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: anon con EXECUTE (n=%)', v_n; END IF;

  RAISE NOTICE 'CINTURON VERDE · ROJO-1 dos solicitudes vivas NO, y el rebote LLEVA el id de la que ya existe · ROJO-2 el solicitante no se acepta solo · el reloj no suena hoy, SI a los 6 dias, una AUTOMATICA no lo apaga y una respuesta REAL si · responder mueve el estado en el MISMO acto · anon fuera';
END
$cint$;

COMMIT;

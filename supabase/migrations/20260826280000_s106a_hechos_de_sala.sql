-- ============================================================================
-- S106-A tanda 2 · LOS HECHOS DE SALA — registrar sin juzgar
--
-- Firma del founder: el webhook de LiveKit deja **el hecho crudo** contra la
-- cita —quién entró, cuándo, cuándo salió— y **CERO consecuencia automática**.
-- No decide cobros, no marca no-realizable, no atribuye culpa a nadie.
-- Sirve para que soporte resuelva una devolución **con un dato en vez de con
-- un relato**.
--
-- 🔴 ESTO NO CONTRADICE §5 DE LA LETRA, Y CONVIENE DECIR POR QUÉ.
--    §5 firma que *«el sistema no mide la calidad de la conexión de nadie, así
--    que no puede atribuirla»*. **Presencia no es calidad.** Acá se registra
--    que alguien entró y a qué hora; no se registra ni se infiere si su video
--    se veía bien, ni cuánto ancho de banda tuvo, ni de quién fue la culpa.
--    *La frontera es exactamente esa, y está escrita para que la próxima
--    pasada no la corra «de paso» agregando una métrica de red.*
--
-- ── VEDA 76(g): NO RIGE. ────────────────────────────────────────────────────
--    DDL puro más una tabla nueva vacía. **Cero backfill, cero anclas, cero
--    escritura sobre filas existentes.** No hay ventana que declarar.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
--    Escrita ANTES de aplicar:
--    `docs/relevamientos/2026-08-26-s106a-REVERSA-hechos-de-sala.sql`
--    Declara lo que NO deshace: revertir **borra los hechos ya registrados**.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ① LA TABLA
--
-- 🔴 `cita_id` ES NULLABLE A PROPÓSITO, y es la decisión de diseño de esta
--    migración. Una sala que no se puede mapear a una cita **sigue siendo un
--    hecho**, y perderlo es exactamente el modo de falla que el motor de pagos
--    ya nos cobró: el analizador lanzó, el evento se perdió, y del hecho no
--    quedó nada. *Acá el hecho entra primero y el vínculo se resuelve después
--    — si se puede.*
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.videollamada_hechos (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- El nombre de sala tal como lo mandó el proveedor. **Se guarda siempre**,
  -- aunque no se pueda resolver a una cita.
  sala                   text        NOT NULL,

  -- El vínculo, si se pudo resolver. `ON DELETE SET NULL`: si la cita se
  -- borrara, el hecho sobrevive huérfano en vez de desaparecer con ella.
  cita_id                uuid        NULL REFERENCES public.evento_cita_servicio(id) ON DELETE SET NULL,

  -- El tipo de evento, **verbatim del proveedor**. No se traduce ni se
  -- normaliza a un vocabulario nuestro: el día que LiveKit agregue uno, acá
  -- entra solo. *Un CHECK con vocabulario cerrado convertiría un evento nuevo
  -- en un webhook rebotado, y un webhook que rebota no se reintenta para
  -- siempre.*
  evento                 text        NOT NULL,

  -- La identidad del participante según el proveedor, y su resolución a un
  -- usuario nuestro cuando la identidad ES un uuid de `auth.users`.
  participante_identidad text        NULL,
  participante_user_id   uuid        NULL,

  -- Cuándo pasó (lo dice el proveedor) y cuándo lo recibimos (lo decimos
  -- nosotros). **Son dos relojes y no se mezclan**: la diferencia entre ambos
  -- es información sobre el transporte, no sobre la consulta.
  ocurrido_en            timestamptz NOT NULL,
  recibido_en            timestamptz NOT NULL DEFAULT now(),

  -- El payload entero. **Persistir antes de analizar** (lección del motor de
  -- pagos): si mañana hace falta un campo que hoy nadie mira, está acá.
  crudo                  jsonb       NOT NULL,

  -- El id del evento del proveedor. Es lo que vuelve idempotente al webhook.
  livekit_event_id       text        NULL
);

COMMENT ON TABLE public.videollamada_hechos IS
  'S106 · Hechos de sala de teleconsulta. REGISTRAR SIN JUZGAR: cero consecuencia automática. '
  'Presencia, jamás calidad de conexión ni atribución de culpa (LETRA_TELEMEDICINA §5).';

-- Idempotencia: el proveedor reintenta, y un reintento no puede duplicar el
-- hecho. Parcial porque `livekit_event_id` puede faltar.
CREATE UNIQUE INDEX videollamada_hechos_event_id_uq
  ON public.videollamada_hechos (livekit_event_id)
  WHERE livekit_event_id IS NOT NULL;

-- El acceso normal es por cita y por orden cronológico: soporte abre UNA cita.
CREATE INDEX videollamada_hechos_cita_idx
  ON public.videollamada_hechos (cita_id, ocurrido_en)
  WHERE cita_id IS NOT NULL;

-- Y el que hace falta cuando la sala NO resolvió: sin este índice, encontrar
-- los huérfanos obliga a recorrer la tabla entera.
CREATE INDEX videollamada_hechos_sin_cita_idx
  ON public.videollamada_hechos (sala, ocurrido_en)
  WHERE cita_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- ② RLS — nadie lee esto desde una app.
--
-- Son metadatos operacionales para soporte. **No hay policy para el dueño ni
-- para el profesional**, y es deliberado: la letra promete que el registro
-- existe para resolver devoluciones, no que sea una superficie del producto.
-- *El día que se decida mostrárselo a alguien, esa es una decisión de letra y
-- va a necesitar su propia policy — que es justo lo que queremos que cueste.*
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.videollamada_hechos ENABLE ROW LEVEL SECURITY;

CREATE POLICY videollamada_hechos_admin_lee
  ON public.videollamada_hechos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- ③ LA PUERTA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_hecho_de_sala(
  p_sala        text,
  p_evento      text,
  p_ocurrido_en timestamptz,
  p_crudo       jsonb,
  p_participante text DEFAULT NULL,
  p_evento_id   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cita    uuid;
  v_user    uuid;
  v_id      uuid;
  v_ya      boolean := false;
BEGIN
  IF p_sala IS NULL OR btrim(p_sala) = '' THEN
    RAISE EXCEPTION 'sala_requerida';
  END IF;
  IF p_evento IS NULL OR btrim(p_evento) = '' THEN
    RAISE EXCEPTION 'evento_requerido';
  END IF;
  IF p_ocurrido_en IS NULL THEN
    RAISE EXCEPTION 'ocurrido_en_requerido';
  END IF;

  -- ── Resolución del vínculo. **Best-effort y silenciosa a propósito.**
  --    `video-token` usa el id de la cita como nombre de sala, así que el
  --    camino normal resuelve. Si no resuelve, el hecho entra igual con
  --    `cita_id = NULL` — *no se rechaza un hecho por no saber a quién
  --    pertenece.*
  BEGIN
    v_cita := p_sala::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_cita := NULL;
  END;

  IF v_cita IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.evento_cita_servicio c WHERE c.id = v_cita) THEN
    v_cita := NULL;   -- la sala parece un uuid pero no es una cita nuestra
  END IF;

  -- Ídem con el participante: la identidad que emite `video-token` es el uuid
  -- del usuario, pero **no se asume** — si no parsea, queda el texto crudo.
  IF p_participante IS NOT NULL THEN
    BEGIN
      v_user := p_participante::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_user := NULL;
    END;
    IF v_user IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user) THEN
      v_user := NULL;
    END IF;
  END IF;

  INSERT INTO public.videollamada_hechos
    (sala, cita_id, evento, participante_identidad, participante_user_id,
     ocurrido_en, crudo, livekit_event_id)
  VALUES
    (p_sala, v_cita, p_evento, p_participante, v_user,
     p_ocurrido_en, p_crudo, p_evento_id)
  ON CONFLICT (livekit_event_id) WHERE livekit_event_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;

  -- 🔴 `DO NOTHING` NO DEVUELVE FILA, y eso NO es un error: es el reintento
  --    del proveedor haciendo su trabajo. **Se dice cuál de los dos casos
  --    fue** en vez de contestar lo mismo para ambos — *una puerta que
  --    contesta igual ante «lo guardé» y ante «ya estaba» le impide a quien
  --    la llama saber si su reintento sirvió de algo.*
  IF v_id IS NULL THEN
    v_ya := true;
    SELECT id INTO v_id
    FROM public.videollamada_hechos
    WHERE livekit_event_id = p_evento_id;
  END IF;

  -- **Y acá termina.** No se toca la cita, no se cambia ningún estado, no se
  -- dispara ningún aviso. Registrar sin juzgar es una firma, no una intención.
  RETURN jsonb_build_object(
    'ok', true,
    'id', v_id,
    'ya_estaba', v_ya,
    'cita_resuelta', v_cita IS NOT NULL
  );
END;
$$;

COMMENT ON FUNCTION public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text) IS
  'S106 · Recibe un hecho de sala del webhook de LiveKit. Idempotente por livekit_event_id. '
  'CERO consecuencia: no cambia estado de la cita ni atribuye responsabilidad.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ④ PERMISOS · L-140, con las TRES revocaciones.
--
--    `authenticated` va en la lista por decisión, no por prolijidad: esta
--    función escribe un registro que después se usa para resolver plata. *Si
--    la pudiera llamar cualquier sesión, cualquiera podría fabricar la
--    evidencia de que estuvo en una consulta a la que no entró.*
--    La llama la edge con `service_role` y nadie más.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text)
  TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- ⑤ CINTURÓN — se prueba la DEFENSA, no la lista.
-- ─────────────────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_rol_origen constant text := current_user;
  v_firma      constant text := 'public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text)';
  v_res        jsonb;
  v_n          integer;
BEGIN
  -- (a) Los tres roles rebotan. Se pregunta por el PRIVILEGIO, jamás por texto
  --     en `proacl` — un `LIKE` sobre el ACL ya abortó una migración de
  --     seguridad de esta casa con el agujero abierto.
  IF has_function_privilege('anon', v_firma, 'EXECUTE')
     OR has_function_privilege('authenticated', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: la puerta quedo alcanzable por anon o authenticated';
  END IF;
  IF NOT has_function_privilege('service_role', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: service_role NO puede ejecutar — la edge no podria registrar nada';
  END IF;

  -- (b) 🔴 SE EJERCE DE VERDAD, con dos llamadas y su DISCRIMINADOR. *Que la
  --     función exista y que el `ON CONFLICT` esté escrito no prueba que la
  --     idempotencia funcione: eso lo prueba llamar dos veces y contar UNA
  --     fila.*
  v_res := public.registrar_hecho_de_sala(
    'cinturon-sala-no-uuid', 'participant_joined', now(),
    '{"fixture":true}'::jsonb, 'no-soy-un-uuid', 'cinturon-evt-1');

  IF (v_res->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: la primera llamada no devolvio ok';
  END IF;
  IF (v_res->>'ya_estaba')::boolean THEN
    RAISE EXCEPTION 'cinturon: la primera llamada dijo que ya estaba';
  END IF;
  -- La sala no es un uuid ⇒ el hecho entra igual, SIN cita. Es el caso que la
  -- decisión de diseño existe para cubrir, así que se prueba.
  IF (v_res->>'cita_resuelta')::boolean THEN
    RAISE EXCEPTION 'cinturon: resolvio una cita donde no habia ninguna';
  END IF;

  v_res := public.registrar_hecho_de_sala(
    'cinturon-sala-no-uuid', 'participant_joined', now(),
    '{"fixture":true}'::jsonb, 'no-soy-un-uuid', 'cinturon-evt-1');
  IF NOT (v_res->>'ya_estaba')::boolean THEN
    RAISE EXCEPTION 'cinturon: el reintento NO fue idempotente';
  END IF;

  SELECT count(*) INTO v_n FROM public.videollamada_hechos
   WHERE livekit_event_id = 'cinturon-evt-1';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: dos llamadas dejaron % filas, no 1', v_n;
  END IF;

  -- (c) Residuo CERO. El fixture escribió de verdad, así que se limpia de
  --     verdad — y se verifica que la limpieza pasó.
  DELETE FROM public.videollamada_hechos WHERE livekit_event_id = 'cinturon-evt-1';
  SELECT count(*) INTO v_n FROM public.videollamada_hechos;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon: quedo residuo del fixture (% filas)', v_n;
  END IF;

  EXECUTE format('SET LOCAL ROLE %I', v_rol_origen);
  RAISE NOTICE 'cinturon hechos_de_sala: OK (permisos + idempotencia ejercida + residuo 0)';
END;
$cinturon$;

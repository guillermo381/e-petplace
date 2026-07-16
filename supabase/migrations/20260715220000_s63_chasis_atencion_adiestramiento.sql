-- ═════════════════════════════════════════════════════════════════════
-- S63-A — CHASIS DE ATENCIÓN DEL ADIESTRAMIENTO (Antes/Durante/Después
-- del oficio, MODELO_ADIESTRAMIENTO v1.1 §5/§6/§8/§12.6) — espejo del
-- chasis de grooming RELEVADO contra DB viva (L-144):
--   · tres capas: hito en eventos_mascota → capa genérica evento_atencion
--     (familia/estados/mensaje_familia/cita_id) → detalle de oficio.
--   · el registro del Durante ancla al HEAD del oficio (patrón
--     evento_grooming_servicios_aplicados.grooming_id — la cita se
--     alcanza por evento_atencion.cita_id), no directo a la cita.
--   · el cierre devenga variante (b) — clon LITERAL de
--     cerrar_grooming_con_calidad (cura S54-T4 sin no-op silencioso).
--
-- Diferencias FIRMADAS con el espejo (letra del oficio, no desvíos):
--   · piso de calidad = ≥1 objetivo TRABAJADO + ≥1 nota o clip (§5) —
--     sin estados recibir/entregar (rasgo del grooming) y SIN captura
--     exigida en ningún punto (§12.6 cerrado: terminar NO exige la
--     foto de entrega — D-270 es letra del grooming, no de este oficio).
--   · trabajado ≠ ALCANZADO (§6): el registro porta la distinción; la
--     progresión narrativa lee alcanzado, jamás trabajado.
--   · clips de video: bucket propio + tope DURO de 3 por sesión
--     (CHECK orden 1..3 + UNIQUE — el techo 15-30s lo valida el
--     cliente de la B; el motor guarda duracion_segundos con cordura).
--   · INSTRUCCIONES PARA LA FAMILIA (§5, founder S62): texto v1 en el
--     head del oficio, escrito al cierre.
--   · el guard duro de orden (trigger 20260715180000) NO se
--     reimplementa: la promoción a 'completada' del cierre lo dispara
--     sola — cerrar la sesión k con la k−1 abierta rebota EN LA FUENTE.
--   · el parte (§6): forma NARRATIVA — solo objetivos trabajados de la
--     sesión + voz de familia de los dominados + conteos; JAMÁS el
--     currículum completo con booleans (LOYALTY §2/§3). Memorial apaga
--     la progresión (estado_vida='fallecida', LOYALTY §7.1 estructural).
-- ═════════════════════════════════════════════════════════════════════

-- ── 0. La capa genérica aprende el tercer oficio ──────────────────────
ALTER TABLE public.evento_atencion DROP CONSTRAINT evento_atencion_familia_check;
ALTER TABLE public.evento_atencion ADD CONSTRAINT evento_atencion_familia_check
  CHECK (familia = ANY (ARRAY['grooming'::text, 'paseo'::text, 'adiestramiento'::text]));

-- El tipo de evento del hito: clon fiel de la fila del grooming (todas
-- las columnas heredadas, solo identidad y voz propias).
INSERT INTO public.cat_tipos_evento
SELECT (jsonb_populate_record(c, jsonb_build_object(
  'codigo', 'atencion_adiestramiento_registrada',
  'nombre', 'Atencion de adiestramiento registrada',
  'descripcion', 'Documentacion de una sesion de adiestramiento completada por un prestador. Sub-evento de la cita de servicio que la origino. Protagonista del timeline de la mascota; propaga al perfil vigente.'
))).*
FROM public.cat_tipos_evento c
WHERE c.codigo = 'atencion_grooming_registrada'
ON CONFLICT (codigo) DO NOTHING;

-- ── 1. El HEAD del oficio (espejo de eventos_mascota_grooming) ────────
CREATE TABLE public.eventos_mascota_adiestramiento (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_atencion_id    uuid NOT NULL REFERENCES public.evento_atencion(id) ON DELETE CASCADE,
  mascota_id            uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  prestador_id          uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  empleado_id           uuid REFERENCES public.prestador_empleados(id) ON DELETE SET NULL,
  country_code          text NOT NULL,
  -- §5 founder S62: el refuerzo entre sesiones — texto del adiestrador
  -- v1 (la tarea ESTRUCTURADA con seguimiento es v2, §9). Se escribe
  -- al cierre.
  instrucciones_familia text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.eventos_mascota_adiestramiento IS
  'Detalle de oficio de la atención de adiestramiento (espejo de eventos_mascota_grooming): puente a evento_atencion + campos propios del oficio. La cita vive en evento_atencion.cita_id.';

CREATE TRIGGER trg_eventos_mascota_adiestramiento_updated_at
  BEFORE UPDATE ON public.eventos_mascota_adiestramiento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ema_atencion ON public.eventos_mascota_adiestramiento (evento_atencion_id);
CREATE INDEX idx_ema_mascota ON public.eventos_mascota_adiestramiento (mascota_id);

ALTER TABLE public.eventos_mascota_adiestramiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY adiestramiento_head_select ON public.eventos_mascota_adiestramiento
  FOR SELECT TO authenticated USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_head_update ON public.eventos_mascota_adiestramiento
  FOR UPDATE TO authenticated
  USING (user_puede_acceder_prestador(prestador_id))
  WITH CHECK (user_puede_acceder_prestador(prestador_id));
CREATE POLICY adiestramiento_head_delete ON public.eventos_mascota_adiestramiento
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT, UPDATE ON public.eventos_mascota_adiestramiento TO authenticated;
GRANT ALL ON public.eventos_mascota_adiestramiento TO service_role;

-- ── 2. El registro del DURANTE: objetivos trabajados / ALCANZADOS ─────
-- Espejo de evento_grooming_servicios_aplicados contra el vocabulario
-- del oficio. Comprable ≠ registrable: puro registro, CERO precio.
CREATE TABLE public.evento_adiestramiento_objetivos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adiestramiento_id uuid NOT NULL REFERENCES public.eventos_mascota_adiestramiento(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  prestador_id      uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  country_code      text NOT NULL,
  objetivo_codigo   text NOT NULL REFERENCES public.cat_objetivos_adiestramiento(codigo) ON DELETE RESTRICT,
  -- §6: trabajado ≠ logrado. La fila ES el "trabajado"; alcanzado es la
  -- distinción real que lee la progresión narrativa.
  alcanzado         boolean NOT NULL DEFAULT false,
  nota              text,
  orden             integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_adiestramiento_objetivo UNIQUE (adiestramiento_id, objetivo_codigo)
);

COMMENT ON COLUMN public.evento_adiestramiento_objetivos.alcanzado IS
  '§6: "trabajado" (la fila existe) ≠ "alcanzado" (logrado). La progresión narrativa y los guijarros leen SOLO alcanzado.';

CREATE INDEX idx_eao_adiestramiento ON public.evento_adiestramiento_objetivos (adiestramiento_id);

ALTER TABLE public.evento_adiestramiento_objetivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY adiestramiento_obj_select ON public.evento_adiestramiento_objetivos
  FOR SELECT TO authenticated USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_obj_insert ON public.evento_adiestramiento_objetivos
  FOR INSERT TO authenticated
  WITH CHECK (user_puede_acceder_prestador(prestador_id) AND user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_obj_update ON public.evento_adiestramiento_objetivos
  FOR UPDATE TO authenticated USING (user_puede_acceder_prestador(prestador_id));
CREATE POLICY adiestramiento_obj_delete ON public.evento_adiestramiento_objetivos
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT, INSERT, UPDATE ON public.evento_adiestramiento_objetivos TO authenticated;
GRANT ALL ON public.evento_adiestramiento_objetivos TO service_role;

-- ── 3. La nota conductual (espejo de evento_grooming_notas) ───────────
CREATE TABLE public.evento_adiestramiento_notas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adiestramiento_id uuid NOT NULL REFERENCES public.eventos_mascota_adiestramiento(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  prestador_id      uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  country_code      text NOT NULL,
  texto             text NOT NULL,
  via               text NOT NULL DEFAULT 'durante',
  categoria         text,
  orden             integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_adiestramiento_nota_via CHECK (via IN ('durante','cierre'))
);

CREATE INDEX idx_ean_adiestramiento ON public.evento_adiestramiento_notas (adiestramiento_id);

ALTER TABLE public.evento_adiestramiento_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY adiestramiento_notas_select ON public.evento_adiestramiento_notas
  FOR SELECT TO authenticated USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_notas_insert ON public.evento_adiestramiento_notas
  FOR INSERT TO authenticated
  WITH CHECK (user_puede_acceder_prestador(prestador_id) AND user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_notas_delete ON public.evento_adiestramiento_notas
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT, INSERT ON public.evento_adiestramiento_notas TO authenticated;
GRANT ALL ON public.evento_adiestramiento_notas TO service_role;

-- ── 4. LOS CLIPS: bucket propio + registro con tope DURO de 3 ─────────
-- §5 founder S62 (techo v1 firmado §12.3): clips de 15-30s, máximo 3
-- por sesión. El techo de DURACIÓN lo valida la captura del cliente
-- (Bloque 1 de la B, compresión en captura); el motor pone el tope de
-- CONTEO por construcción (orden 1..3 + UNIQUE) y cordura de duración.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('adiestramiento-clips', 'adiestramiento-clips', false, 52428800,
        ARRAY['video/mp4','video/quicktime','video/webm'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.evento_adiestramiento_clips (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adiestramiento_id uuid NOT NULL REFERENCES public.eventos_mascota_adiestramiento(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  prestador_id      uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE RESTRICT,
  country_code      text NOT NULL,
  storage_path      text NOT NULL,
  duracion_segundos integer,
  descripcion       text,
  orden             integer NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- tope DURO §12.3: máximo 3 por sesión, por construcción
  CONSTRAINT chk_clip_orden CHECK (orden BETWEEN 1 AND 3),
  CONSTRAINT uq_adiestramiento_clip_orden UNIQUE (adiestramiento_id, orden),
  -- cordura (el techo fino 15-30s es del cliente; el motor no miente)
  CONSTRAINT chk_clip_duracion CHECK (duracion_segundos IS NULL OR duracion_segundos BETWEEN 1 AND 60)
);

CREATE INDEX idx_eac_adiestramiento ON public.evento_adiestramiento_clips (adiestramiento_id);

ALTER TABLE public.evento_adiestramiento_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY adiestramiento_clips_select ON public.evento_adiestramiento_clips
  FOR SELECT TO authenticated USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_clips_insert ON public.evento_adiestramiento_clips
  FOR INSERT TO authenticated
  WITH CHECK (user_puede_acceder_prestador(prestador_id) AND user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY adiestramiento_clips_delete ON public.evento_adiestramiento_clips
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT, INSERT ON public.evento_adiestramiento_clips TO authenticated;
GRANT ALL ON public.evento_adiestramiento_clips TO service_role;

-- Policies de storage: clon de grooming-archivos (path = prestador_id/…;
-- el dueño VE por el registro + acceso a mascota).
CREATE POLICY adiestramiento_clips_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adiestramiento-clips'
    AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));
CREATE POLICY adiestramiento_clips_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'adiestramiento-clips'
    AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));
CREATE POLICY adiestramiento_clips_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'adiestramiento-clips'
    AND user_puede_acceder_prestador((split_part(name, '/', 1))::uuid));
CREATE POLICY adiestramiento_clips_storage_select_acceso_mascota ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'adiestramiento-clips'
    AND EXISTS (
      SELECT 1 FROM public.evento_adiestramiento_clips c
      WHERE c.storage_path = objects.name AND user_tiene_acceso_a_mascota(c.mascota_id)
    ));

-- ── 5. Helper: atención del oficio TERMINADA (clon literal) ───────────
CREATE OR REPLACE FUNCTION public._adiestramiento_atencion_terminada(
  p_adiestramiento_id uuid,
  OUT o_mascota_id uuid, OUT o_prestador_id uuid, OUT o_country_code text
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_estado text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_adiestramiento_id IS NULL THEN
    RAISE EXCEPTION 'adiestramiento_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT a.estado, a.mascota_id, a.prestador_id, a.country_code
  INTO v_estado, o_mascota_id, o_prestador_id, o_country_code
  FROM eventos_mascota_adiestramiento g
  JOIN evento_atencion a ON a.id = g.evento_atencion_id
  WHERE g.id = p_adiestramiento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_estado IS DISTINCT FROM 'terminada' THEN
    RAISE EXCEPTION 'atencion_no_terminada: %', v_estado USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(o_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
END;
$function$;

-- ── 6. iniciar_atencion_adiestramiento (clon del par de grooming) ─────
CREATE OR REPLACE FUNCTION public.iniciar_atencion_adiestramiento(
  p_cita_id uuid,
  p_empleado_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid        uuid := auth.uid();
  v_now             timestamptz := now();
  v_cita_existe     boolean;
  v_cita_estado     text;
  v_cita_fecha      date;
  v_cita_evento_id  uuid;
  v_mascota_id      uuid;
  v_prestador_id    uuid;
  v_country_code    text;
  v_categoria       text;
  v_eje_jtbd        text;
  v_evento_hijo_id  uuid;
  v_atencion_id     uuid;
  v_adiestramiento  uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT true, ecs.estado, ecs.fecha, ecs.evento_id, ecs.mascota_id, ecs.prestador_id,
         ecs.country_code, ts.categoria
  INTO v_cita_existe, v_cita_estado, v_cita_fecha, v_cita_evento_id, v_mascota_id, v_prestador_id,
       v_country_code, v_categoria
  FROM evento_cita_servicio ecs
  JOIN tipos_servicio ts ON ts.codigo = ecs.tipo_servicio
  WHERE ecs.id = p_cita_id;

  IF v_cita_existe IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_categoria IS DISTINCT FROM 'adiestramiento' THEN
    RAISE EXCEPTION 'cita_no_es_adiestramiento' USING ERRCODE = '22023';
  END IF;
  IF v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_mascota_o_prestador' USING ERRCODE = '22023';
  END IF;
  IF v_cita_evento_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_evento_padre' USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF v_cita_estado NOT IN ('confirmada', 'en_curso') THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_iniciar: %', v_cita_estado USING ERRCODE = '22023';
  END IF;
  -- Gate temporal (espejo EXACTO paseo/grooming, precedente S57 + D-320):
  -- la palanca de devengo anticipado sigue cerrada en el MOTOR.
  IF v_cita_fecha > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'cita_aun_no_ocurre' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM evento_atencion
    WHERE cita_id = p_cita_id AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'atencion_adiestramiento_ya_existe_para_cita' USING ERRCODE = '23505';
  END IF;

  SELECT eje_jtbd INTO v_eje_jtbd
  FROM cat_tipos_evento WHERE codigo = 'atencion_adiestramiento_registrada';
  IF v_eje_jtbd IS NULL THEN
    RAISE EXCEPTION 'cat_tipos_evento_sin_adiestramiento' USING ERRCODE = '22023';
  END IF;

  -- 1. Hito en eventos_mascota
  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, evento_padre_id,
    prestador_id, empleado_id, creado_por_user_id, country_code, datos
  ) VALUES (
    v_mascota_id, 'atencion_adiestramiento_registrada', v_eje_jtbd, v_now, v_cita_evento_id,
    v_prestador_id, p_empleado_id, v_auth_uid, v_country_code,
    jsonb_build_object('cita_id', p_cita_id)
  )
  RETURNING id INTO v_evento_hijo_id;

  -- 2. Capa de atención (la cita vive ACÁ)
  INSERT INTO evento_atencion (
    evento_id, cita_id, familia, mascota_id, prestador_id, empleado_id,
    country_code, estado, iniciada_en
  ) VALUES (
    v_evento_hijo_id, p_cita_id, 'adiestramiento', v_mascota_id, v_prestador_id, p_empleado_id,
    v_country_code, 'en_curso', v_now
  )
  RETURNING id INTO v_atencion_id;

  -- 3. Detalle de oficio: solo el puente
  INSERT INTO eventos_mascota_adiestramiento (
    evento_atencion_id, mascota_id, prestador_id, empleado_id, country_code
  ) VALUES (
    v_atencion_id, v_mascota_id, v_prestador_id, p_empleado_id, v_country_code
  )
  RETURNING id INTO v_adiestramiento;

  -- 4. La cita pasa a en_curso
  UPDATE evento_cita_servicio
  SET estado = 'en_curso'
  WHERE id = p_cita_id AND estado = 'confirmada';

  RETURN jsonb_build_object(
    'ok', true,
    'adiestramiento_id', v_adiestramiento,
    'evento_atencion_id', v_atencion_id,
    'evento_id', v_evento_hijo_id,
    'cita_id', p_cita_id,
    'estado', 'en_curso'
  );
END;
$function$;

-- ── 7. El DURANTE: registrar/quitar objetivo · nota · clip ────────────
CREATE OR REPLACE FUNCTION public.registrar_objetivo_adiestramiento(
  p_adiestramiento_id uuid,
  p_objetivo_codigo text,
  p_alcanzado boolean DEFAULT false,
  p_nota text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_atencion_id uuid; v_id uuid;
BEGIN
  SELECT evento_atencion_id INTO v_atencion_id
  FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;
  IF v_atencion_id IS NULL THEN RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023'; END IF;
  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(v_atencion_id);
  IF p_objetivo_codigo IS NULL OR NOT EXISTS (
    SELECT 1 FROM cat_objetivos_adiestramiento o
    WHERE o.codigo = p_objetivo_codigo AND o.activo
  ) THEN
    RAISE EXCEPTION 'objetivo_invalido: %', COALESCE(p_objetivo_codigo, 'NULL') USING ERRCODE = '22023';
  END IF;

  -- upsert: el mismo objetivo puede pasar de trabajado a ALCANZADO
  -- dentro de la sesión sin fila nueva (trabajado ≠ logrado, §6)
  INSERT INTO evento_adiestramiento_objetivos (
    adiestramiento_id, mascota_id, prestador_id, country_code,
    objetivo_codigo, alcanzado, nota
  ) VALUES (
    p_adiestramiento_id, v_mascota_id, v_prestador_id, v_country_code,
    p_objetivo_codigo, COALESCE(p_alcanzado, false), p_nota
  )
  ON CONFLICT (adiestramiento_id, objetivo_codigo)
  DO UPDATE SET alcanzado = COALESCE(p_alcanzado, false),
                nota = COALESCE(p_nota, evento_adiestramiento_objetivos.nota)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'alcanzado', COALESCE(p_alcanzado, false));
END;
$function$;

CREATE OR REPLACE FUNCTION public.quitar_objetivo_adiestramiento(
  p_adiestramiento_id uuid,
  p_objetivo_codigo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_atencion_id uuid; v_n int;
BEGIN
  SELECT evento_atencion_id INTO v_atencion_id
  FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;
  IF v_atencion_id IS NULL THEN RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023'; END IF;
  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(v_atencion_id);

  DELETE FROM evento_adiestramiento_objetivos
  WHERE adiestramiento_id = p_adiestramiento_id AND objetivo_codigo = p_objetivo_codigo;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'objetivo_no_registrado: %', COALESCE(p_objetivo_codigo, 'NULL') USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_nota_adiestramiento(
  p_adiestramiento_id uuid,
  p_texto text,
  p_categoria text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_atencion_id uuid; v_id uuid;
BEGIN
  SELECT evento_atencion_id INTO v_atencion_id
  FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;
  IF v_atencion_id IS NULL THEN RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023'; END IF;
  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(v_atencion_id);
  IF p_texto IS NULL OR length(trim(p_texto)) = 0 THEN
    RAISE EXCEPTION 'texto_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO evento_adiestramiento_notas (
    adiestramiento_id, mascota_id, prestador_id, country_code, texto, categoria
  ) VALUES (
    p_adiestramiento_id, v_mascota_id, v_prestador_id, v_country_code, p_texto, p_categoria
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_clip_adiestramiento(
  p_adiestramiento_id uuid,
  p_storage_path text,
  p_orden integer,
  p_duracion_segundos integer DEFAULT NULL,
  p_descripcion text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_atencion_id uuid; v_id uuid;
BEGIN
  SELECT evento_atencion_id INTO v_atencion_id
  FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;
  IF v_atencion_id IS NULL THEN RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023'; END IF;
  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(v_atencion_id);
  IF p_storage_path IS NULL OR length(trim(p_storage_path)) = 0 THEN
    RAISE EXCEPTION 'storage_path_required' USING ERRCODE = '22023';
  END IF;
  -- el path pertenece al prestador de la atención (patrón del bucket)
  IF split_part(p_storage_path, '/', 1) IS DISTINCT FROM v_prestador_id::text THEN
    RAISE EXCEPTION 'clip_path_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_orden IS NULL OR p_orden NOT BETWEEN 1 AND 3 THEN
    -- defensa en profundidad del techo §12.3 (el CHECK+UNIQUE ya lo
    -- hacen imposible; acá el error sale TIPADO)
    RAISE EXCEPTION 'clip_tope_superado' USING ERRCODE = '22023';
  END IF;

  INSERT INTO evento_adiestramiento_clips (
    adiestramiento_id, mascota_id, prestador_id, country_code,
    storage_path, duracion_segundos, descripcion, orden
  ) VALUES (
    p_adiestramiento_id, v_mascota_id, v_prestador_id, v_country_code,
    p_storage_path, p_duracion_segundos, p_descripcion, p_orden
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id, 'orden', p_orden);
END;
$function$;

-- ── 8. terminar_atencion_adiestramiento ───────────────────────────────
-- Clon de terminar_atencion_grooming SIN el guard D-270 (§12.6 cerrado:
-- NINGUNA captura exigida en v1 — la foto de entrega es letra del
-- grooming, no de este oficio) y sin pausas (la sesión es continua v1).
CREATE OR REPLACE FUNCTION public.terminar_atencion_adiestramiento(p_adiestramiento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_now timestamptz := now();
  v_atencion_id uuid;
BEGIN
  SELECT evento_atencion_id INTO v_atencion_id
  FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;
  IF v_atencion_id IS NULL THEN
    RAISE EXCEPTION 'atencion_adiestramiento_no_existe' USING ERRCODE = '22023';
  END IF;

  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _atencion_operable(v_atencion_id);

  UPDATE evento_atencion
  SET estado = 'terminada', terminada_en = v_now
  WHERE id = v_atencion_id;

  RETURN jsonb_build_object(
    'ok', true,
    'adiestramiento_id', p_adiestramiento_id,
    'estado', 'terminada',
    'terminada_en', v_now
  );
END;
$function$;

-- ── 9. cerrar_atencion_adiestramiento — piso de calidad + DEVENGO ─────
-- Piso §5 adaptado: ≥1 objetivo TRABAJADO + ≥1 nota o clip (jamás video
-- obligatorio, §12.6). Devengo variante (b): clon LITERAL de
-- cerrar_grooming_con_calidad (cura S54-T4). El guard duro de orden
-- (trigger 20260715180000) se dispara SOLO en la promoción a
-- 'completada' — esta función no lo reimplementa NI lo sortea.
CREATE OR REPLACE FUNCTION public.cerrar_atencion_adiestramiento(
  p_adiestramiento_id uuid,
  p_mensaje_familia text DEFAULT NULL,
  p_instrucciones_familia text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_now timestamptz := now();
  v_atencion_id uuid;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
  v_tiene_objetivo boolean; v_tiene_nota_clip boolean;
BEGIN
  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _adiestramiento_atencion_terminada(p_adiestramiento_id);
  SELECT evento_atencion_id INTO v_atencion_id FROM eventos_mascota_adiestramiento WHERE id = p_adiestramiento_id;

  -- piso de calidad del oficio (§5): ≥1 objetivo trabajado…
  SELECT EXISTS (SELECT 1 FROM evento_adiestramiento_objetivos WHERE adiestramiento_id = p_adiestramiento_id) INTO v_tiene_objetivo;
  IF NOT v_tiene_objetivo THEN
    RAISE EXCEPTION 'calidad_falta_objetivo: cerrar con calidad requiere al menos un objetivo trabajado' USING ERRCODE = '22023';
  END IF;
  -- …+ ≥1 nota o clip (la captura JAMÁS es obligatoria — §12.6)
  SELECT EXISTS (SELECT 1 FROM evento_adiestramiento_notas WHERE adiestramiento_id = p_adiestramiento_id)
    OR EXISTS (SELECT 1 FROM evento_adiestramiento_clips WHERE adiestramiento_id = p_adiestramiento_id) INTO v_tiene_nota_clip;
  IF NOT v_tiene_nota_clip THEN
    RAISE EXCEPTION 'calidad_falta_nota_o_clip: cerrar con calidad requiere al menos una nota conductual o un clip' USING ERRCODE = '22023';
  END IF;

  -- las INSTRUCCIONES PARA LA FAMILIA (§5) viven en el head del oficio
  IF p_instrucciones_familia IS NOT NULL THEN
    UPDATE eventos_mascota_adiestramiento
    SET instrucciones_familia = p_instrucciones_familia, updated_at = v_now
    WHERE id = p_adiestramiento_id;
  END IF;

  -- cerrar la atención
  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = v_atencion_id;

  -- completar el turno + DEVENGO — espejo LITERAL de cerrar_grooming_
  -- con_calidad (incluye la cura S54-T4: sin no-op silencioso). La
  -- promoción dispara el guard duro de orden del programa EN LA FUENTE.
  SELECT cita_id INTO v_cita_id FROM evento_atencion WHERE id = v_atencion_id;
  IF v_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_id FOR UPDATE;
    IF v_cita.estado = 'en_curso' THEN
      UPDATE evento_cita_servicio SET estado = 'completada', updated_at = now()
      WHERE id = v_cita_id;
    ELSIF v_cita.estado = 'completada' THEN
      NULL;  -- idempotente: el turno ya estaba completado
    ELSE
      RAISE EXCEPTION 'cita_no_promovible: %', COALESCE(v_cita.estado, 'cita_inexistente')
        USING ERRCODE = '22023';
    END IF;

    -- DEVENGO AL CIERRE [variante (b)]: solo citas CUBIERTAS
    -- (invariante 'pagada', CUATRO escritores). Legacy (NULL) pasa.
    IF v_cita.estado_reserva = 'pagada'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'cita'
           AND ee.origen_id = v_cita_id
           AND ee.tipo_evento = 'cita_pagada'
       )
    THEN
      IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
        RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
      END IF;

      SELECT cc.id, cc.moneda INTO v_cuenta
      FROM prestadores pr
      JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_prestador_id;
      IF v_cuenta.id IS NULL THEN
        RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
      END IF;

      v_evento_econ := crear_evento_economico(
        p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
        p_revenue_stream      => 'transaccional'::revenue_stream_enum,
        p_cuenta_comercial_id => v_cuenta.id,
        p_country_code        => v_cita.country_code,
        p_moneda              => v_cuenta.moneda,
        p_monto_bruto         => v_cita.precio,
        p_monto_kushki_fee    => 0,   -- simulación honesta
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_atencion_adiestramiento')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'adiestramiento_id', p_adiestramiento_id,
    'estado', 'cerrada_con_calidad', 'cerrada_en', v_now,
    'evento_economico_id', v_evento_econ
  );
END;
$function$;

-- ── 10. EL PARTE (§6 — el DESPUÉS que enseña) ─────────────────────────
-- Forma NARRATIVA por diseño (LOYALTY §2/§3): SOLO los objetivos
-- trabajados de ESTA sesión (con su voz de familia y la distinción
-- alcanzado), la voz de los DOMINADOS del programa y CONTEOS — jamás
-- el currículum completo con booleans que invite a pintar checklist.
-- Memorial apaga la progresión ESTRUCTURALMENTE (LOYALTY §7.1).
CREATE OR REPLACE FUNCTION public.obtener_parte_adiestramiento(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth       uuid := auth.uid();
  v_atencion   record;
  v_head       record;
  v_cita       record;
  v_programa   record;
  v_nivel      text;
  v_estado_vida text;
  v_objetivos  jsonb;
  v_notas      jsonb;
  v_clips      jsonb;
  v_dominados  jsonb;
  v_dominados_n int;
  v_curriculum_n int;
  v_progresion jsonb;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT a.* INTO v_atencion
  FROM evento_atencion a
  WHERE a.cita_id = p_cita_id AND a.familia = 'adiestramiento';
  IF v_atencion.id IS NULL THEN
    RAISE EXCEPTION 'parte_no_existe' USING ERRCODE = '22023';
  END IF;
  IF NOT (user_tiene_acceso_a_mascota(v_atencion.mascota_id)
          OR user_puede_acceder_prestador(v_atencion.prestador_id)) THEN
    RAISE EXCEPTION 'no_access' USING ERRCODE = '42501';
  END IF;
  -- el parte es del DESPUÉS: existe cuando el cierre selló la calidad
  IF v_atencion.estado <> 'cerrada_con_calidad' THEN
    RAISE EXCEPTION 'parte_no_disponible: %', v_atencion.estado USING ERRCODE = '22023';
  END IF;

  SELECT g.* INTO v_head
  FROM eventos_mascota_adiestramiento g WHERE g.evento_atencion_id = v_atencion.id;

  SELECT c.* INTO v_cita FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  SELECT m.estado_vida INTO v_estado_vida FROM mascotas m WHERE m.id = v_atencion.mascota_id;

  -- lo trabajado en ESTA sesión, con voz de familia (es/en)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'codigo', o.objetivo_codigo,
      'nombre', c.nombre,
      'nombre_familia', c.nombre_familia,
      'nombre_familia_en', c.nombre_familia_en,
      'alcanzado', o.alcanzado,
      'nota', o.nota
    ) ORDER BY c.orden_display), '[]'::jsonb)
  INTO v_objetivos
  FROM evento_adiestramiento_objetivos o
  JOIN cat_objetivos_adiestramiento c ON c.codigo = o.objetivo_codigo
  WHERE o.adiestramiento_id = v_head.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('texto', n.texto, 'categoria', n.categoria)
    ORDER BY n.orden, n.created_at), '[]'::jsonb)
  INTO v_notas
  FROM evento_adiestramiento_notas n WHERE n.adiestramiento_id = v_head.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'storage_path', cl.storage_path, 'orden', cl.orden,
      'duracion_segundos', cl.duracion_segundos, 'descripcion', cl.descripcion
    ) ORDER BY cl.orden), '[]'::jsonb)
  INTO v_clips
  FROM evento_adiestramiento_clips cl WHERE cl.adiestramiento_id = v_head.id;

  -- la PROGRESIÓN del programa (§6) — narrativa, jamás checklist.
  -- Memorial/M6 la apagan (LOYALTY §7.1: estructural, no filtro de UI).
  v_progresion := NULL;
  IF v_cita.programa_contratado_id IS NOT NULL AND v_estado_vida <> 'fallecida' THEN
    SELECT pc.*, pp.nivel INTO v_programa
    FROM programas_contratados pc
    JOIN prestador_programas pp ON pp.id = pc.programa_id
    WHERE pc.id = v_cita.programa_contratado_id;

    -- los DOMINADOS: objetivos DISTINTOS alcanzados en TODAS las
    -- sesiones del programa (voz de familia — el dato de los guijarros)
    SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'codigo', c.codigo,
        'nombre_familia', c.nombre_familia,
        'nombre_familia_en', c.nombre_familia_en
      )), '[]'::jsonb), count(DISTINCT c.codigo)::int
    INTO v_dominados, v_dominados_n
    FROM evento_adiestramiento_objetivos o
    JOIN cat_objetivos_adiestramiento c ON c.codigo = o.objetivo_codigo
    JOIN eventos_mascota_adiestramiento g ON g.id = o.adiestramiento_id
    JOIN evento_atencion a ON a.id = g.evento_atencion_id
    JOIN evento_cita_servicio ecs ON ecs.id = a.cita_id
    WHERE ecs.programa_contratado_id = v_cita.programa_contratado_id
      AND o.alcanzado;

    -- el universo del nivel (currículum de plataforma); las
    -- ESPECIALIDADES no tienen currículum — el denominador va NULL y
    -- la narrativa habla sin el "de N" (jamás 0 falso)
    SELECT count(*)::int INTO v_curriculum_n
    FROM cat_curriculum_adiestramiento cc
    WHERE cc.nivel = v_programa.nivel AND cc.activo;

    v_progresion := jsonb_build_object(
      'nivel', v_programa.nivel,
      'sesion_numero', v_cita.sesion_numero,
      'n_sesiones', v_programa.n_sesiones,
      'dominados', v_dominados,
      'dominados_n', v_dominados_n,
      'del_programa_n', CASE WHEN v_curriculum_n > 0 THEN v_curriculum_n ELSE NULL END
    );
  END IF;

  RETURN jsonb_build_object(
    'cita_id', p_cita_id,
    'sesion', CASE WHEN v_cita.programa_contratado_id IS NOT NULL
      THEN jsonb_build_object('numero', v_cita.sesion_numero,
                              'de', (SELECT pc.n_sesiones FROM programas_contratados pc WHERE pc.id = v_cita.programa_contratado_id))
      ELSE NULL END,
    'objetivos', v_objetivos,
    'notas', v_notas,
    'clips', v_clips,
    'mensaje_familia', v_atencion.mensaje_familia,
    'instrucciones_familia', v_head.instrucciones_familia,
    'progresion', v_progresion,
    'cerrada_en', v_atencion.cerrada_en
  );
END;
$function$;

-- ── 11. L-140: ley en dos partes por CADA función nueva ───────────────
REVOKE ALL ON FUNCTION public._adiestramiento_atencion_terminada(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._adiestramiento_atencion_terminada(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.iniciar_atencion_adiestramiento(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_atencion_adiestramiento(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.registrar_objetivo_adiestramiento(uuid, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_objetivo_adiestramiento(uuid, text, boolean, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.quitar_objetivo_adiestramiento(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quitar_objetivo_adiestramiento(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.registrar_nota_adiestramiento(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_nota_adiestramiento(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.registrar_clip_adiestramiento(uuid, text, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_clip_adiestramiento(uuid, text, integer, integer, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.terminar_atencion_adiestramiento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.terminar_atencion_adiestramiento(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cerrar_atencion_adiestramiento(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cerrar_atencion_adiestramiento(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.obtener_parte_adiestramiento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_parte_adiestramiento(uuid) TO authenticated, service_role;

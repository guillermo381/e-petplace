-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2a + 2c — LA MODALIDAD SE DERIVA · EL CONSENTIMIENTO ES ATÓMICO
-- ═══════════════════════════════════════════════════════════════════════
--
-- LETRA: LETRA_TELEMEDICINA v1.1 §7 (la marca) + el requisito del abogado
-- de consentimiento POR CITA registrado. Firma founder CP1 S106.
-- Acta: docs/actas/2026-08-25-s106-CP1-ACTA.md (firmas ③ y ⑤).
--
-- ─── 2a · EL DEFECTO MEDIDO, y NO es el que el pedido describía ─────────
--
-- El pedido decía: «hoy solo acepta {local, domicilio} con default 'local'».
-- **Medido contra el objeto: es más sutil y peor.** El guard de modalidad
-- vive DENTRO del bloque `IF categoria = 'grooming'`, así que para una
-- teleconsulta **no se ejecuta nunca**: `v_modalidad` queda NULL y el INSERT
-- final la escribe con `COALESCE(v_modalidad, 'presencial')`.
--
--   ⇒ Una teleconsulta **no rebota: NACE DICIENDO `modalidad='presencial'`.**
--
-- *No hay error, no hay log, hay un dato equivocado con cara de normal* —
-- y ese dato es justo el que §7 usa como marca visible del expediente.
--
-- LA CURA: la modalidad de telemedicina se **DERIVA DEL TIPO DE SERVICIO,
-- SERVER-SIDE**, jamás del parámetro del cliente. Y en las dos direcciones:
--   · si el servicio es telemedicina y el caller pide otra cosa → rebote;
--   · si el caller pide 'telemedicina' sobre un servicio que no lo es →
--     rebote. *Un cliente no puede declarar teleconsulta lo que no lo es:
--     eso pondría la marca del expediente en manos de quien reserva.*
--
-- ─── 2c · EL CONSENTIMIENTO ────────────────────────────────────────────
--
-- `ActoConsentible` YA EXISTÍA como concepto en la casa (`arbitraje`,
-- `dictado_voz` — `packages/api/src/wrappers/auth.ts`): «no son documentos,
-- son ACTOS que el contrato exige consentir por separado». **La teleconsulta
-- es uno más**, y por eso no nace vocabulario nuevo: se suma al que hay.
--
-- 🔴 EL VOCABULARIO DEL CHECK SE MIDIÓ DEL **CÓDIGO**, NO DE LOS DATOS.
-- Las filas vivas solo tienen `registro`, `privacidad`, `terminos_parent`.
-- Pero `documentosVigentes()` puede escribir **`terminos_professional`**
-- (camino `acceso_prestador` / `registro_profesional`, S104) y el union
-- declara además `arbitraje` y `dictado_voz`. **Un CHECK armado con los
-- datos vivos habría roto el alta profesional el día que alguien la usara.**
-- *Los datos dicen lo que ya pasó; el vocabulario dice lo que puede pasar.*
--
-- LA VERSIÓN LA DICE EL SERVIDOR, NO LA PANTALLA — misma ley que
-- `documentosVigentes` («la casa tiene UNA respuesta a qué texto vio, y no
-- la decide la pantalla»). El cliente solo declara que aceptó.
--
-- ─── VEDA 76(g): **NO RIGE.** ───────────────────────────────────────────
-- Sin backfill. La columna `cita_id` nace NULL para las 66 filas vivas y
-- ninguna de ellas es de teleconsulta (hay CERO citas de telemedicina, y no
-- puede haberlas: `reservable=false`). Los CHECK se validan contra datos
-- existentes que ya cumplen. Sin ventana de veda.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-25-s106a-REVERSA-modalidad-y-consentimiento.sql
-- **Con el cuerpo de 7 args EMBEBIDO** — es su única fuente: la función
-- vivía en la base y en ningún archivo del repo. Declara que revertir
-- DESTRUYE el vínculo consentimiento↔cita aunque conserve las filas.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1 · La versión del texto, del lado del servidor ───────────────────
CREATE OR REPLACE FUNCTION public._version_aviso_teleconsulta()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  -- Apunta a la versión de la LETRA que contiene el texto del aviso §3.
  -- Cambia SOLO cuando el texto del aviso cambie — y ese día las filas
  -- viejas siguen diciendo qué texto vio cada quien, que es el punto.
  SELECT 'letra-telemedicina-v1.1'::text;
$fn$;

REVOKE EXECUTE ON FUNCTION public._version_aviso_teleconsulta() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public._version_aviso_teleconsulta() TO authenticated;

-- ─── 2 · El consentimiento gana su objeto ──────────────────────────────
ALTER TABLE public.consentimientos
  ADD COLUMN IF NOT EXISTS cita_id uuid REFERENCES public.evento_cita_servicio(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.consentimientos.cita_id IS
  'S106 · El OBJETO del consentimiento cuando es por acto y no por documento. '
  'NULL para los consentimientos de alta/registro (que son de la persona, no '
  'de una operación). NOT NULL obligatorio para tipo=teleconsulta.';

-- El vocabulario, cerrado. Medido del CÓDIGO (auth.ts: DocumentoLegal +
-- ActoConsentible) más el legado 'registro' que vive en 59 filas de 2026-04.
ALTER TABLE public.consentimientos
  ADD CONSTRAINT chk_consentimiento_tipo CHECK (
    tipo IN (
      'registro',               -- legado (59 filas, abr-may 2026)
      'terminos_parent',
      'terminos_professional',  -- S104: existe en el código, aún no en datos
      'privacidad',
      'arbitraje',              -- ActoConsentible (T&C §38.10)
      'dictado_voz',            -- ActoConsentible (T&C §31.6)
      'teleconsulta'            -- ActoConsentible NUEVO — S106
    )
  );

-- La coherencia se vuelve INEXPRESABLE, no se pide por prosa:
--   · un consentimiento de teleconsulta SIN cita no puede existir;
--   · una cita colgada de un consentimiento que no es de teleconsulta,
--     tampoco (hoy la teleconsulta es el único acto por-cita; el día que
--     haya otro, esta línea se enmienda con su letra).
ALTER TABLE public.consentimientos
  ADD CONSTRAINT chk_consentimiento_teleconsulta_con_cita CHECK (
    (tipo = 'teleconsulta' AND cita_id IS NOT NULL)
    OR (tipo <> 'teleconsulta' AND cita_id IS NULL)
  );

-- Un consentimiento por persona y por cita. Parcial: no toca el legado.
CREATE UNIQUE INDEX IF NOT EXISTS uq_consentimiento_teleconsulta_por_cita
  ON public.consentimientos (user_id, cita_id)
  WHERE cita_id IS NOT NULL;

-- ─── 3 · El hold: modalidad derivada + consentimiento atómico ──────────
-- L-119: la firma cambia (gana `p_acepta_teleconsulta`) ⇒ DROP EXPLÍCITO
-- de la de 7 args. `CREATE OR REPLACE` con otra aridad NO reemplaza:
-- dejaría las dos vivas y PostgREST elegiría por los nombres que le manden
-- — una teleconsulta podría entrar por la puerta vieja, sin consentimiento.
DROP FUNCTION IF EXISTS public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid);

CREATE FUNCTION public.crear_bloqueo_agenda(
  p_prestador_id uuid,
  p_servicio_id uuid,
  p_mascota_id uuid,
  p_fecha date,
  p_hora time without time zone,
  p_modalidad text DEFAULT NULL::text,
  p_empleado_id uuid DEFAULT NULL::uuid,
  p_acepta_teleconsulta boolean DEFAULT NULL::boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_expira      timestamptz;
  v_direccion   jsonb;   -- D-339
  v_modalidad   text;    -- S61 D-392
  -- S59-A5: resolución grooming por talla (MODELO_GROOMING §2/§6)
  v_talla          text;
  v_pelaje         text;
  v_precio_talla   numeric;
  v_duracion_talla int;
  -- V0-actor: la persona del hold + la semántica de concurrencia
  v_empleado    uuid;
  v_cupo_techo  int;
  -- S68: reservable en dos niveles + same-day declarativo
  v_ts_reservable boolean;
  v_ts_solo_hoy   boolean;
  -- S106: la categoría decide la modalidad y el consentimiento
  v_categoria     text;
  v_es_tele       boolean;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- S55-B2: la duración de la oferta entra al snapshot junto al precio.
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos, ps.atiende_local, ps.atiende_domicilio, ps.reservable
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- S68: la puerta del hold es del MOTOR — reservable en DOS niveles y
  -- el same-day de urgencia (declarativo, tipos_servicio.reserva_solo_hoy).
  SELECT ts.reservable, ts.reserva_solo_hoy, ts.categoria
  INTO v_ts_reservable, v_ts_solo_hoy, v_categoria
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;
  IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(v_ts_solo_hoy, false)
     AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN  -- D-320, espejo S57/S60
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
  END IF;

  v_es_tele := (v_categoria = 'telemedicina');

  -- ═══ S106 · LA MODALIDAD SE DERIVA DEL TIPO, JAMÁS DEL CLIENTE ═══════
  -- La marca del expediente (§7) no puede depender de lo que declare quien
  -- reserva. Se deriva acá, y se rebota en las DOS direcciones.
  IF v_es_tele THEN
    IF p_modalidad IS NOT NULL AND p_modalidad <> 'telemedicina' THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    v_modalidad := 'telemedicina';
  ELSIF p_modalidad = 'telemedicina' THEN
    -- Un caller no puede vestir de teleconsulta un servicio presencial.
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;

  -- ═══ S106 · SIN CONSENTIMIENTO NO HAY HOLD ══════════════════════════
  -- Se exige ANTES de gastar trabajo (lock, geometría, reparto): rebotar
  -- temprano es más barato y no deja rastro a medias.
  IF v_es_tele AND COALESCE(p_acepta_teleconsulta, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'consentimiento_requerido' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma.
  IF EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
     )
     AND NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  -- S59-A5 (MODELO_GROOMING §2/§6): el GROOMING cotiza por TALLA del
  -- PERFIL + extra pelaje + recargo domicilio — server-side, ANTES de
  -- validar ventana/cupo, y se CONGELA como snapshot (INTACTO en V0).
  IF v_categoria = 'grooming' THEN
    SELECT m.talla, m.pelaje INTO v_talla, v_pelaje
    FROM mascotas m WHERE m.id = p_mascota_id;
    IF v_talla IS NULL THEN
      RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
    END IF;
    SELECT pst.precio, pst.duracion_minutos
    INTO v_precio_talla, v_duracion_talla
    FROM prestador_servicio_tallas pst
    WHERE pst.prestador_servicio_id = v_servicio.id AND pst.talla = v_talla;
    IF v_precio_talla IS NULL OR v_duracion_talla IS NULL THEN
      RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_pelaje = 'largo' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_modalidad := COALESCE(p_modalidad, 'local');
    IF v_modalidad NOT IN ('local', 'domicilio') THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' AND NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'local' AND NOT v_servicio.atiende_local THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_servicio.precio := v_precio_talla;
    v_servicio.duracion_minutos := v_duracion_talla;
  END IF;

  -- S68: la urgencia A DOMICILIO es domicilio por tipo — hereda VERBATIM
  -- el mecanismo D-339/D-392 (dirección al snapshot + guard del pago).
  IF v_servicio.tipo_servicio = 'urgencia_domicilio' THEN
    IF NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    v_modalidad := 'domicilio';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente no recibe holds nuevos.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  IF NOT EXISTS (
    SELECT 1 FROM prestador_horarios h
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  ) THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;

  SELECT pe.id INTO v_empleado
  FROM prestador_horarios h
  JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
    AND public._empleado_matricula_ok(pe.id, v_servicio.tipo_servicio)
    AND _agenda_ocupacion(pe.id, p_fecha, p_hora, v_servicio.duracion_minutos, NULL, v_servicio.tipo_servicio)
        < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
    AND (p_empleado_id IS NULL OR pe.id = p_empleado_id)
  -- S78-A5 — LA CONTINUIDAD CLINICA VENCE AL BALANCEO. (Intacta: ver la
  -- reversa para el comentario largo original, que no se reproduce acá
  -- para no duplicar su literal.)
  ORDER BY (CASE WHEN EXISTS (
              SELECT 1 FROM caso_clinico kc
              JOIN tipos_servicio kts ON kts.codigo = v_servicio.tipo_servicio
              WHERE kc.mascota_id = p_mascota_id
                AND kc.estado = 'activo'
                AND kc.empleado_tratante_id = pe.user_id
                AND kts.es_medico
            ) THEN 0 ELSE 1 END),
           (SELECT count(*) FROM evento_cita_servicio cc
            WHERE cc.empleado_id = pe.id AND cc.fecha = p_fecha
              AND (cc.estado IN ('confirmada', 'en_curso')
                   OR (cc.estado = 'pendiente' AND cc.estado_reserva = 'pendiente_pago'
                       AND cc.expira_en > now()))),
           pe.created_at, pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
    IF p_empleado_id IS NOT NULL THEN
      RAISE EXCEPTION 'persona_no_disponible' USING ERRCODE = '22023';
    END IF;
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  v_ocupados := 0;  -- (la pregunta de cupo ya se respondió por persona)

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;

  SELECT cte.eje_jtbd, cte.visibilidad_default
  INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: dirección del hogar al snapshot del hold (NULL honesto).
  -- S106: la teleconsulta NO lleva dirección — no ocurre en ningún lugar.
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  )
  OR v_modalidad = 'domicilio' THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot, modalidad
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_empleado, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion,
    COALESCE(v_modalidad, 'presencial')
  ) RETURNING id INTO v_cita_id;

  -- ═══ S106 · EL CONSENTIMIENTO, EN LA MISMA TRANSACCIÓN ══════════════
  -- Acá está la garantía: una teleconsulta con hold y SIN consentimiento
  -- es inexpresable, porque las dos filas nacen o no nace ninguna.
  -- La VERSIÓN la pone el servidor — la pantalla no decide qué texto vio.
  IF v_es_tele THEN
    INSERT INTO consentimientos (user_id, tipo, aceptado, version, cita_id, metadata)
    VALUES (
      v_auth, 'teleconsulta', true, public._version_aviso_teleconsulta(), v_cita_id,
      jsonb_build_object(
        'contexto', 'reserva_teleconsulta',
        'origen', 'crear_bloqueo_agenda',
        -- El abandono del hold deja este registro huérfano de cita pagada,
        -- y es INOFENSIVO: dice que esta persona vio y aceptó el aviso ese
        -- día. La evidencia de haber informado no caduca porque la reserva
        -- no se haya completado.
        'registrado_en', now()
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'duracion_minutos', v_servicio.duracion_minutos,
    'fecha', p_fecha,
    'hora', p_hora,
    'modalidad', COALESCE(v_modalidad, 'presencial'),
    'empleado_id', v_empleado
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid, boolean) TO authenticated, service_role;

-- ─── 4 · CINTURÓN ──────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_sobrecargas int;
  v_ok boolean;
BEGIN
  -- L-119 probado, no supuesto: UNA sola firma viva.
  SELECT count(*) INTO v_sobrecargas
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'crear_bloqueo_agenda';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'CINTURON L-119: quedaron % firmas de crear_bloqueo_agenda (debe ser 1)', v_sobrecargas;
  END IF;

  -- La derivación existe en el cuerpo vivo, no en el comentario.
  SELECT pg_get_functiondef(p.oid) ILIKE '%v_es_tele := (v_categoria = ''telemedicina'')%'
    INTO v_ok
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'crear_bloqueo_agenda';
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON: la derivación de modalidad no está en el cuerpo vivo';
  END IF;

  -- El estado malo es INEXPRESABLE — se prueba intentándolo, no leyéndolo.
  BEGIN
    INSERT INTO consentimientos (user_id, tipo, aceptado, version, cita_id)
    SELECT id, 'teleconsulta', true, 'x', NULL FROM auth.users LIMIT 1;
    RAISE EXCEPTION 'CINTURON: se pudo insertar un consentimiento de teleconsulta SIN cita';
  EXCEPTION WHEN check_violation THEN
    NULL;  -- correcto: el CHECK lo rebotó
  END;

  BEGIN
    INSERT INTO consentimientos (user_id, tipo, aceptado, version)
    SELECT id, 'tipo_inventado_que_no_existe', true, 'x' FROM auth.users LIMIT 1;
    RAISE EXCEPTION 'CINTURON: el vocabulario de tipo NO está cerrado';
  EXCEPTION WHEN check_violation THEN
    NULL;  -- correcto
  END;

  -- El vocabulario admite lo que el CÓDIGO puede escribir (no solo lo que
  -- los datos ya tienen): terminos_professional es el caso que importa.
  BEGIN
    INSERT INTO consentimientos (user_id, tipo, aceptado, version)
    SELECT id, 'terminos_professional', true, 'x' FROM auth.users LIMIT 1;
    -- si llegó acá, el vocabulario lo acepta: se deshace la prueba
    DELETE FROM consentimientos WHERE tipo = 'terminos_professional' AND version = 'x';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'CINTURON: el CHECK rompe el alta PROFESIONAL (terminos_professional rebotado)';
  END;

  -- L-140
  IF has_function_privilege('anon', 'public._version_aviso_teleconsulta()', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON L-140: _version_aviso_teleconsulta ejecutable por anon';
  END IF;
  IF has_function_privilege('anon', 'public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid, boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON L-140: crear_bloqueo_agenda ejecutable por anon';
  END IF;

  RAISE NOTICE 'CINTURON OK — 1 firma, derivación viva, estado malo inexpresable, vocabulario del CODIGO, anon cerrado';
END
$cinturon$;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════
-- S79-A · CONTRATO del paquete DDL de LETRA_PERFIL_S79 v1.0 — §9.
--
-- ⚠️ NO APLICAR SIN LA FIRMA DEL FOUNDER SOBRE LA LETRA.
-- Vive FUERA de supabase/migrations/ A PROPÓSITO (precedente S78:
-- ahí adentro un `db push` lo aplicaría solo). Al aplicarse, se copia
-- a una migración versionada con timestamp del día de la firma.
--
-- ANTES DE APLICAR (obligatorio):
--   1. Re-leer con pg_get_functiondef los bodies VIVOS de
--      crear_prestador_inicial y obtener_paseadores_disponibles y
--      confirmar que no cambiaron desde 2026-07-27 (otra sesión pudo
--      tocarlos — L-166: el dato vivo se lee al usarlo).
--   2. Reversa al lado: 2026-07-27-s79a-REVERSA-letra-perfil.sql.
--   3. Después de aplicar: gen:types + fixture in-txn ROLLBACK (§9.5).
--
-- 76(g), DECLARADA: NO RIGE — DDL aditivo (columnas nullable sin
-- DEFAULT: instantáneas, sin reescritura de tabla), cero backfill,
-- cero anclas computadas sobre datos vivos.
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ── 1) Las columnas de la letra (§3 · §4) + la caída del default (§2.1) ──
ALTER TABLE public.prestadores
  ADD COLUMN proposito         text,
  ADD COLUMN direccion_envio   text,
  ADD COLUMN primer_ingreso_en timestamptz;

ALTER TABLE public.prestadores
  ALTER COLUMN radio_cobertura_km DROP DEFAULT;

COMMENT ON COLUMN public.prestadores.proposito IS
  'LETRA_PERFIL_S79 §3: la respuesta VERBATIM a "¿por qué te metiste en esto?" (PORTAL §2.1). Lector: la bienvenida §2.3.';
COMMENT ON COLUMN public.prestadores.direccion_envio IS
  'LETRA_PERFIL_S79 §3: dirección física del kit fundador (PORTAL §2.2). NO fiscal, NO visible al cliente, NO es la sede.';
COMMENT ON COLUMN public.prestadores.primer_ingreso_en IS
  'LETRA_PERFIL_S79 §4: marca ceremonial del primer ingreso del TITULAR. Se escribe UNA vez vía registrar_primer_ingreso(); sin deshacer (familia D-544).';
COMMENT ON COLUMN public.prestadores.radio_cobertura_km IS
  'LETRA_PERFIL_S79 §2: NULL = el prestador NO declaró radio ⇒ NO se oferta por geografía (firma founder). El 15 sugerido vive en el formulario, jamás acá.';

-- ── 2) crear_prestador_inicial: muere el COALESCE(…, 5) ──────────────
-- Misma firma ⇒ CREATE OR REPLACE legal (L-119 no aplica). Body vivo
-- 2026-07-27 con UN cambio: COALESCE(p_radio_cobertura_km, 5) →
-- p_radio_cobertura_km (línea marcada -- §2.1).
CREATE OR REPLACE FUNCTION public.crear_prestador_inicial(
  p_cuenta_comercial_id uuid, p_tipo text, p_nombre_comercial text,
  p_ciudad text, p_descripcion text DEFAULT NULL, p_telefono text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL, p_email_contacto text DEFAULT NULL,
  p_sitio_web text DEFAULT NULL, p_direccion text DEFAULT NULL,
  p_sector text DEFAULT NULL, p_lat double precision DEFAULT NULL,
  p_lon double precision DEFAULT NULL, p_acepta_emergencias boolean DEFAULT NULL,
  p_acepta_telemedicina boolean DEFAULT NULL, p_radio_cobertura_km integer DEFAULT NULL,
  p_matricula_profesional text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, prestador_id uuid, mensaje text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid              uuid := auth.uid();
  v_nombre_trim           text := trim(p_nombre_comercial);
  v_ciudad_trim           text := trim(p_ciudad);
  v_tipos_validos         text[] := ARRAY[
    'clinica_veterinaria','veterinario_independiente','grooming','paseador',
    'hotel_mascotas','adiestramiento','laboratorio','otro'
  ];
  v_country_code          text;
  v_validacion            record;
  v_existe_prestador      boolean;
  v_user_ya_dueno         boolean;
  v_nuevo_id              uuid;
  v_metadata_safe         jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_metadata_final        jsonb;
  v_descripcion_otro      text;
BEGIN
  IF v_nombre_trim IS NULL OR length(v_nombre_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El nombre comercial es obligatorio.';
    RETURN;
  END IF;

  IF v_ciudad_trim IS NULL OR length(v_ciudad_trim) = 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'La ciudad es obligatoria.';
    RETURN;
  END IF;

  IF p_tipo IS NULL OR NOT (p_tipo = ANY (v_tipos_validos)) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'El tipo de prestador no es válido.';
    RETURN;
  END IF;

  IF p_tipo = 'otro' THEN
    v_descripcion_otro := NULLIF(trim(v_metadata_safe ->> 'tipo_otro_descripcion'), '');

    IF v_descripcion_otro IS NULL THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'Cuando seleccionas el tipo "Otro", debes describir brevemente tu tipo de servicio.';
      RETURN;
    END IF;

    IF length(v_descripcion_otro) < 5 OR length(v_descripcion_otro) > 200 THEN
      RETURN QUERY SELECT false, NULL::uuid,
        'La descripción del tipo de servicio debe tener entre 5 y 200 caracteres.';
      RETURN;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.prestadores
    WHERE user_id = v_auth_uid
  )
  INTO v_user_ya_dueno;

  IF v_user_ya_dueno THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Ya eres dueño de un prestador. No puedes crear otro desde este flujo.';
    RETURN;
  END IF;

  SELECT * INTO v_validacion
  FROM public._validar_ownership_cuenta_comercial(p_cuenta_comercial_id);

  IF NOT v_validacion.valido THEN
    RETURN QUERY SELECT false, NULL::uuid, v_validacion.mensaje;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
  )
  INTO v_existe_prestador;

  IF v_existe_prestador THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Esta cuenta comercial ya tiene un prestador registrado. Para agregar sedes adicionales, hazlo desde el panel de gestión.';
    RETURN;
  END IF;

  SELECT cc.country_code INTO v_country_code
  FROM public.cuentas_comerciales cc
  WHERE cc.id = p_cuenta_comercial_id;

  v_metadata_final := jsonb_build_object('created_via', 'wizard') || v_metadata_safe;

  INSERT INTO public.prestadores (
    user_id, cuenta_comercial_id, country_code, tipo, nombre_comercial,
    ciudad, descripcion, telefono, whatsapp, email_contacto, sitio_web,
    direccion, sector, lat, lon, acepta_emergencias, acepta_telemedicina,
    radio_cobertura_km, matricula_profesional, estado, metadata
  ) VALUES (
    v_auth_uid, p_cuenta_comercial_id, v_country_code, p_tipo, v_nombre_trim,
    v_ciudad_trim, NULLIF(trim(p_descripcion), ''), NULLIF(trim(p_telefono), ''),
    NULLIF(trim(p_whatsapp), ''), NULLIF(trim(p_email_contacto), ''),
    NULLIF(trim(p_sitio_web), ''), NULLIF(trim(p_direccion), ''),
    NULLIF(trim(p_sector), ''), p_lat, p_lon,
    COALESCE(p_acepta_emergencias, false),
    COALESCE(p_acepta_telemedicina, false),
    p_radio_cobertura_km,   -- §2.1 LETRA_PERFIL_S79: murió el COALESCE(…, 5) — NULL = no declaró
    NULLIF(trim(p_matricula_profesional), ''),
    'pendiente',
    v_metadata_final
  )
  RETURNING id INTO v_nuevo_id;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  VALUES (p_cuenta_comercial_id, 'prestador_servicios', 'activo')
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;

  RETURN QUERY SELECT true, v_nuevo_id, NULL::text;
END;
$function$;

-- ── 3) obtener_paseadores_disponibles gana p_lat/p_lon (§2.2) ────────
-- CAMBIO DE FIRMA ⇒ DROP explícito de la vieja (L-119) + ACL
-- re-establecida a mano (L-140: la nueva nace con anon por default).
DROP FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer);

CREATE FUNCTION public.obtener_paseadores_disponibles(
  p_fecha date, p_hora time without time zone, p_duracion_minutos integer,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, servicio_nombre text, precio numeric, precio_plan numeric, duracion_minutos integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ahora_local timestamp := (now() AT TIME ZONE 'America/Guayaquil');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_duracion_minutos IS NULL OR p_duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF (p_fecha + p_hora) <= v_ahora_local THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    ps.id,
    pr.nombre_comercial,
    COALESCE(ps.nombre_custom, ts.nombre),
    ps.precio,
    ps.precio_plan,
    ps.duracion_minutos
  FROM prestador_servicios ps
  JOIN prestadores pr          ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc  ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts       ON ts.codigo = ps.tipo_servicio AND ts.categoria = 'paseo' AND ts.activo AND ts.reservable
  WHERE ps.activo
    AND ps.reservable
    AND ps.duracion_minutos = p_duracion_minutos
    AND NOT _prestador_bloqueado(pr.id, p_fecha)
    -- LETRA_PERFIL_S79 §2.2 (FIRMA founder): sin coordenadas o sin radio
    -- declarado NO se oferta por geografía. SIN COALESCE (L-139).
    -- §2.3 (transición): cliente sin coordenadas ⇒ sin filtro (lo de hoy).
    AND (
      p_lat IS NULL OR p_lon IS NULL
      OR (
        pr.lat IS NOT NULL
        AND pr.lon IS NOT NULL
        AND pr.radio_cobertura_km IS NOT NULL
        AND 2 * 6371 * asin(sqrt(
              power(sin(radians((pr.lat - p_lat) / 2)), 2)
              + cos(radians(p_lat)) * cos(radians(pr.lat))
                * power(sin(radians((pr.lon - p_lon) / 2)), 2)
            )) <= pr.radio_cobertura_km
      )
    )
    AND EXISTS (
      SELECT 1
      FROM prestador_horarios h
      JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
      WHERE h.prestador_id = pr.id
        AND h.activo
        AND h.duracion_slot_minutos > 0
        AND (h.servicio_id IS NULL OR h.servicio_id = ps.id)
        AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
        AND p_hora >= h.hora_inicio
        AND EXTRACT(EPOCH FROM p_hora)::int + p_duracion_minutos * 60
            <= EXTRACT(EPOCH FROM h.hora_fin)::int
        AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
        AND (pe.rol = 'dueño' OR EXISTS (
              SELECT 1 FROM prestador_empleado_servicios pes
              WHERE pes.empleado_id = pe.id AND pes.servicio_id = ps.id))
        AND _agenda_ocupacion(pe.id, p_fecha, p_hora, p_duracion_minutos, NULL, ps.tipo_servicio)
            < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(ts.cupo_techo, 1))
    )
  ORDER BY 5, 3;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_paseadores_disponibles(date, time without time zone, integer, double precision, double precision) TO authenticated;

-- ── 4) registrar_primer_ingreso (§4 v1.1 — el pedido de B) ───────────
-- ENMIENDA v1.1 (T3.4-1): el que NO tiene fila propia en prestadores
-- NO es excepción — es TODO EMPLEADO (viven en prestador_empleados;
-- Aurora tiene dos activos logueándose acá desde S76). Respuesta
-- normal {ok, es_primer_ingreso:false, primer_ingreso_en:null}; la
-- ÚNICA excepción es auth_required. La RPC no exige que el caller sepa
-- si es titular: B la llama para cualquier sesión.
-- Y la respuesta del TITULAR trae su proposito (§3bis: esta RPC es el
-- lector canónico del propósito — por PostgREST la columna no viaja).
CREATE FUNCTION public.registrar_primer_ingreso()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_estampado timestamptz;
  v_proposito text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- Solo el TITULAR estampa (LETRA §4): la bienvenida §2.3 le habla al
  -- que aplicó; el empleado que entra no toca la marca del negocio.
  -- Y SOLO con estado='activo' (precisión de la FIRMA, T4 / LETRA_ALTA
  -- §2 fase 4): el primer ingreso es AL PORTAL — la sala de espera
  -- (pendiente/en_revision) no quema la ceremonia aunque B llamara
  -- esta RPC antes de tiempo.
  UPDATE public.prestadores
     SET primer_ingreso_en = now()
   WHERE user_id = v_auth
     AND estado = 'activo'
     AND primer_ingreso_en IS NULL
  RETURNING primer_ingreso_en, proposito INTO v_estampado, v_proposito;

  IF v_estampado IS NOT NULL THEN
    -- El PRIMER caller de la vida del negocio — la carrera de dos
    -- dispositivos se resuelve acá, en la fila.
    RETURN jsonb_build_object('ok', true, 'es_primer_ingreso', true,
                              'primer_ingreso_en', v_estampado,
                              'proposito', v_proposito);
  END IF;

  SELECT p.primer_ingreso_en, p.proposito INTO v_estampado, v_proposito
  FROM public.prestadores p WHERE p.user_id = v_auth;

  IF NOT FOUND THEN
    -- v1.1: empleado (o cualquier sesión sin negocio propio) = estado
    -- normal, jamás RAISE. NULL honesto en todo.
    RETURN jsonb_build_object('ok', true, 'es_primer_ingreso', false,
                              'primer_ingreso_en', NULL,
                              'proposito', NULL);
  END IF;

  RETURN jsonb_build_object('ok', true, 'es_primer_ingreso', false,
                            'primer_ingreso_en', v_estampado,
                            'proposito', v_proposito);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_primer_ingreso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_primer_ingreso() TO authenticated;

-- ── 5) El régimen de COLUMNA (§3bis, v1.1 — medición T3.3) ──────────
-- prestadores_public concede SELECT de FILA ENTERA a authenticated
-- sobre los activos; el Pick de R1 es TypeScript, no frontera (L-140).
-- Primer uso de privilegios por columna de la casa (attacl medido
-- vacío en todo public). Compatibilidad MEDIDA: cero select('*') sobre
-- prestadores en los wrappers vivos (T3.3).
-- Mecánica PostgreSQL: no existe "REVOKE de una columna" — se revoca el
-- SELECT de tabla y se re-concede por LISTA (todas menos proposito y
-- direccion_envio). UPDATE/INSERT de tabla NO se tocan (la RLS own-row
-- sigue gateando filas; el titular escribe su proposito por whitelist).
REVOKE SELECT ON public.prestadores FROM authenticated;
GRANT SELECT (
  id, user_id, country_code, tipo, nombre_comercial, descripcion,
  foto_url, fotos_galeria, telefono, whatsapp, email_contacto,
  sitio_web, direccion, ciudad, sector, lat, lon, estado, aprobado_por,
  aprobado_en, motivo_rechazo, calificacion_promedio, total_citas,
  total_resenas, acepta_emergencias, acepta_telemedicina,
  radio_cobertura_km, created_at, updated_at, matricula_profesional,
  cuenta_comercial_id, metadata, grooming_extra_pelaje_largo,
  grooming_recargo_domicilio, modo_horarios, expone_personas,
  primer_ingreso_en
) ON public.prestadores TO authenticated;

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE
  v_default text;
  v_sobrecargas int;
  v_anon int;
BEGIN
  SELECT column_default INTO v_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='prestadores' AND column_name='radio_cobertura_km';
  IF v_default IS NOT NULL THEN
    RAISE EXCEPTION 'verificacion: radio_cobertura_km conserva default %', v_default;
  END IF;

  SELECT count(*) INTO v_sobrecargas
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='obtener_paseadores_disponibles';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'verificacion L-119: % sobrecargas de obtener_paseadores_disponibles', v_sobrecargas;
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace,
       LATERAL aclexplode(p.proacl) a JOIN pg_roles r ON r.oid=a.grantee
  WHERE n.nspname='public'
    AND p.proname IN ('obtener_paseadores_disponibles','registrar_primer_ingreso')
    AND r.rolname='anon';
  IF v_anon > 0 THEN
    RAISE EXCEPTION 'verificacion L-140: anon con % grants en las funciones nuevas', v_anon;
  END IF;

  -- §3bis: la frontera de columna quedó — proposito/direccion_envio NO
  -- legibles por authenticated; el resto SÍ.
  IF has_column_privilege('authenticated', 'public.prestadores', 'proposito', 'SELECT')
     OR has_column_privilege('authenticated', 'public.prestadores', 'direccion_envio', 'SELECT') THEN
    RAISE EXCEPTION 'verificacion §3bis: authenticated puede leer proposito/direccion_envio';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.prestadores', 'nombre_comercial', 'SELECT') THEN
    RAISE EXCEPTION 'verificacion §3bis: authenticated perdio el SELECT de columnas normales';
  END IF;
END $$;

commit;

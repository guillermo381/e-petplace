-- ============================================================================
-- S60-A3 — LOS DOS PEDIDOS DE LA B (literales del reporte S60-B1,
-- aprobados por el arquitecto). La tercera pieza del pedido (relajar el
-- guard de foto de terminar_atencion_grooming) queda CONDICIONAL al
-- pulgar del founder y NO viaja acá.
--
-- PIEZA 1 — la PRÓXIMA SESIÓN SUGERIDA (§8 MODELO_GROOMING: "una
-- sugerencia de fecha, sin tocar la agenda"): columna en la fila del
-- oficio + parámetro opcional del cierre + eco en el resumen.
--
-- PIEZA 2 — la VÍA DE REPARACIÓN de servicios aplicados en cierre
-- (variante ESPEJO, decisión del arquitecto): sin ella, un groomer que
-- terminó sin registrar servicios quedaba BLOQUEADO del cierre con
-- calidad (calidad_falta_servicio) sin vía server — el guard de UI de
-- la B pasa a ser cinturón, no solución. Patrón EXACTO de
-- registrar_estado_pelaje_en_cierre (_grooming_atencion_terminada +
-- errores tipados).
--
-- L-140 desde el nacimiento: REVOKE PUBLIC/anon + GRANT mínimo en toda
-- función creada o recreada + sonda proacl en la verificación.
-- L-119: cerrar_grooming_con_calidad cambia de firma → DROP explícito
-- de la vieja (uuid, text); el wrapper de la B queda compatible por el
-- DEFAULT del parámetro nuevo. Callers en DB relevados: cero.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- PIEZA 1a · la columna
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.eventos_mascota_grooming
  ADD COLUMN IF NOT EXISTS proxima_sesion_sugerida date;

COMMENT ON COLUMN public.eventos_mascota_grooming.proxima_sesion_sugerida IS
  '§8 MODELO_GROOMING v1.0: la próxima sesión SUGERIDA por el groomer al cierre — una fecha, JAMÁS una cita: no toca la agenda ni el motor de ventana. La escribe cerrar_grooming_con_calidad (p_proxima_sesion) y la eca obtener_resumen_cierre_grooming. NULL = sin sugerencia (honesto).';

-- ────────────────────────────────────────────────────────────────────────────
-- PIEZA 1b · cerrar_grooming_con_calidad gana p_proxima_sesion
--            (cuerpo VERBATIM del vigente + el UPDATE del oficio antes
--            de cerrar; guards de calidad y devengo variante (b) INTACTOS)
-- ────────────────────────────────────────────────────────────────────────────
DROP FUNCTION public.cerrar_grooming_con_calidad(uuid, text);

CREATE FUNCTION public.cerrar_grooming_con_calidad(
  p_grooming_id     uuid,
  p_mensaje_familia text DEFAULT NULL,
  p_proxima_sesion  date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text; v_now timestamptz := now(); v_atencion_id uuid;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
  v_tiene_servicio boolean; v_recibir boolean; v_entregar boolean; v_tiene_nota_foto boolean;
BEGIN
  -- guard estricto: solo 'terminada' (antes _editable_en_cierre aceptaba cerrada_con_pendiente, DM-S35.8 eliminado)
  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _grooming_atencion_terminada(p_grooming_id);
  SELECT evento_atencion_id INTO v_atencion_id FROM eventos_mascota_grooming WHERE id = p_grooming_id;

  -- guards de calidad (piso obligatorio §8, intactos)
  SELECT EXISTS (SELECT 1 FROM evento_grooming_servicios_aplicados WHERE grooming_id = p_grooming_id) INTO v_tiene_servicio;
  IF NOT v_tiene_servicio THEN RAISE EXCEPTION 'calidad_falta_servicio: cerrar con calidad requiere al menos un servicio aplicado' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_recibir')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'recibir') INTO v_recibir;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_entregar')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'entregar') INTO v_entregar;
  IF NOT v_recibir THEN RAISE EXCEPTION 'calidad_falta_estado_recibir: cerrar con calidad requiere estado al recibir (foto u observacion)' USING ERRCODE = '22023'; END IF;
  IF NOT v_entregar THEN RAISE EXCEPTION 'calidad_falta_estado_entregar: cerrar con calidad requiere estado al entregar (foto u observacion)' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_notas WHERE grooming_id = p_grooming_id)
    OR EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id) INTO v_tiene_nota_foto;
  IF NOT v_tiene_nota_foto THEN RAISE EXCEPTION 'calidad_falta_nota_o_foto: cerrar con calidad requiere al menos una nota o foto' USING ERRCODE = '22023'; END IF;

  -- PIEZA 1 (S60-A3, pedido literal de la B): la próxima sesión SUGERIDA
  -- se escribe en la fila del OFICIO antes de cerrar — una fecha, jamás
  -- una cita (§8). NULL = el cierre no toca la sugerencia previa.
  IF p_proxima_sesion IS NOT NULL THEN
    UPDATE eventos_mascota_grooming
    SET proxima_sesion_sugerida = p_proxima_sesion
    WHERE id = p_grooming_id;
  END IF;

  -- cerrar la atención
  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = v_atencion_id;

  -- completar el turno + DEVENGO — espejo LITERAL de cerrar_paseo_con_
  -- calidad (S59 §10.2; incluye la cura S54-T4: sin no-op silencioso)
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

    -- DEVENGO AL CIERRE [variante (b)]: solo citas pagadas por
    -- confirmar_cita_pagada (invariante §1). Legacy (NULL) pasa de largo.
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
        p_monto_kushki_fee    => 0,   -- simulación honesta: no inventamos fee
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_grooming_con_calidad')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'grooming_id', p_grooming_id, 'estado', 'cerrada_con_calidad', 'cerrada_en', v_now, 'evento_economico_id', v_evento_econ,
    'proxima_sesion_sugerida', p_proxima_sesion);
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- PIEZA 1c · el eco en el resumen del cierre (misma firma, RETURNS jsonb)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_resumen_cierre_grooming(p_grooming_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_grooming                record;
  v_atencion_id             uuid;
  v_suma_pausas_seg         integer;
  v_tiempo_sesion           integer;
  v_tiempo_trabajo          integer;
  v_conteos                 jsonb;
  v_fotos_por_tipo          jsonb;
  v_servicios_aplicados     jsonb;
  v_zonas_aplicadas         jsonb;
  v_notas_capturadas        jsonb;
  v_incidencias_capturadas  jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_grooming_id IS NULL THEN
    RAISE EXCEPTION 'grooming_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT g.id, g.evento_atencion_id, g.proxima_sesion_sugerida,
         a.estado, a.iniciada_en, a.terminada_en,
         a.cerrada_en, a.mensaje_familia, a.prestador_id, a.mascota_id
  INTO v_grooming
  FROM eventos_mascota_grooming g
  JOIN evento_atencion a ON a.id = g.evento_atencion_id
  WHERE g.id = p_grooming_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'atencion_grooming_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_grooming.estado NOT IN ('terminada', 'cerrada_con_calidad') THEN
    RAISE EXCEPTION 'atencion_no_terminada: %', v_grooming.estado USING ERRCODE = '22023';
  END IF;
  IF NOT user_puede_acceder_prestador(v_grooming.prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  v_atencion_id := v_grooming.evento_atencion_id;

  -- Pausas: por capa
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (reanudada_en - pausada_en)))::int, 0)
  INTO v_suma_pausas_seg
  FROM evento_grooming_pausas
  WHERE evento_atencion_id = v_atencion_id;

  v_tiempo_sesion  := EXTRACT(EPOCH FROM (v_grooming.terminada_en - v_grooming.iniciada_en))::int;
  v_tiempo_trabajo := GREATEST(v_tiempo_sesion - v_suma_pausas_seg, 0);

  SELECT jsonb_build_object(
    'servicios',    (SELECT count(*) FROM evento_grooming_servicios_aplicados WHERE grooming_id = p_grooming_id),
    'zonas',        (SELECT count(*) FROM evento_grooming_zonas_trabajadas    WHERE grooming_id = p_grooming_id),
    'notas',        (SELECT count(*) FROM evento_grooming_notas               WHERE evento_atencion_id = v_atencion_id),
    'incidencias',  (SELECT count(*) FROM evento_grooming_incidencias         WHERE evento_atencion_id = v_atencion_id),
    'fotos_total',  (SELECT count(*) FROM evento_grooming_archivos            WHERE grooming_id = p_grooming_id)
  ) INTO v_conteos;

  SELECT COALESCE(jsonb_object_agg(tipo, fotos_array), '{}'::jsonb)
  INTO v_fotos_por_tipo
  FROM (
    SELECT tipo, jsonb_agg(
      jsonb_build_object('id', id, 'storage_path', storage_path, 'descripcion', descripcion)
      ORDER BY created_at ASC) AS fotos_array
    FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id GROUP BY tipo
  ) sub;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('codigo', sa.servicio_codigo, 'nombre', COALESCE(cs.nombre, sa.servicio_codigo))
    ORDER BY sa.orden ASC), '[]'::jsonb)
  INTO v_servicios_aplicados
  FROM evento_grooming_servicios_aplicados sa
  LEFT JOIN cat_servicios_grooming cs ON cs.codigo = sa.servicio_codigo
  WHERE sa.grooming_id = p_grooming_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('codigo', zt.zona_codigo, 'nombre', COALESCE(cz.nombre, zt.zona_codigo))
    ORDER BY zt.orden ASC), '[]'::jsonb)
  INTO v_zonas_aplicadas
  FROM evento_grooming_zonas_trabajadas zt
  LEFT JOIN cat_zonas_trabajo_grooming cz ON cz.codigo = zt.zona_codigo
  WHERE zt.grooming_id = p_grooming_id;

  -- Notas: por capa
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id', n.id, 'texto', n.texto, 'via', n.via)
    ORDER BY n.orden ASC), '[]'::jsonb)
  INTO v_notas_capturadas
  FROM evento_grooming_notas n WHERE n.evento_atencion_id = v_atencion_id;

  -- Incidencias: por capa
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id', i.id, 'codigo', i.incidencia_codigo,
      'nombre', COALESCE(ci.nombre, i.incidencia_codigo),
      'descripcion', i.descripcion, 'severidad', i.severidad)
    ORDER BY i.orden ASC), '[]'::jsonb)
  INTO v_incidencias_capturadas
  FROM evento_grooming_incidencias i
  LEFT JOIN cat_incidencias_grooming ci ON ci.codigo = i.incidencia_codigo
  WHERE i.evento_atencion_id = v_atencion_id;

  RETURN jsonb_build_object(
    'ok', true,
    'grooming_id', v_grooming.id,
    'estado', v_grooming.estado,
    'iniciada_en', v_grooming.iniciada_en,
    'terminada_en', v_grooming.terminada_en,
    'cerrada_en', v_grooming.cerrada_en,
    'mensaje_familia', v_grooming.mensaje_familia,
    -- PIEZA 1 (S60-A3): el eco de la sugerencia — NULL honesto
    'proxima_sesion_sugerida', v_grooming.proxima_sesion_sugerida,
    'tiempo_sesion_segundos', v_tiempo_sesion,
    'tiempo_trabajo_segundos', v_tiempo_trabajo,
    'conteos', v_conteos,
    'fotos_por_tipo', v_fotos_por_tipo,
    'servicios_aplicados', v_servicios_aplicados,
    'zonas_aplicadas', v_zonas_aplicadas,
    'notas_capturadas', v_notas_capturadas,
    'incidencias_capturadas', v_incidencias_capturadas
  );
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- PIEZA 2 · la vía de reparación: agregar servicio aplicado EN CIERRE
--           (espejo EXACTO de registrar_estado_pelaje_en_cierre: gate
--           _grooming_atencion_terminada + validaciones del agregar normal)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.agregar_servicio_grooming_en_cierre(
  p_grooming_id     uuid,
  p_servicio_codigo text,
  p_nota            text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text;
  v_id uuid;
BEGIN
  -- el gate del cierre: SOLO atención 'terminada' (auth + acceso adentro);
  -- en_curso sigue usando la vía normal (agregar_servicio_grooming).
  SELECT o_mascota_id, o_prestador_id, o_country_code
  INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _grooming_atencion_terminada(p_grooming_id);
  IF p_servicio_codigo IS NULL OR length(trim(p_servicio_codigo)) = 0 THEN
    RAISE EXCEPTION 'servicio_codigo_required' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM evento_grooming_servicios_aplicados
    WHERE grooming_id = p_grooming_id AND servicio_codigo = p_servicio_codigo) THEN
    RAISE EXCEPTION 'servicio_ya_aplicado' USING ERRCODE = '23505';
  END IF;
  INSERT INTO evento_grooming_servicios_aplicados (
    grooming_id, mascota_id, prestador_id, country_code, servicio_codigo, nota
  ) VALUES (
    p_grooming_id, v_mascota_id, v_prestador_id, v_country_code, p_servicio_codigo, p_nota
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- L-140 — ley de las dos partes, en TODA función creada o recreada acá
-- ────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.cerrar_grooming_con_calidad(uuid, text, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cerrar_grooming_con_calidad(uuid, text, date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_resumen_cierre_grooming(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_resumen_cierre_grooming(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.agregar_servicio_grooming_en_cierre(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.agregar_servicio_grooming_en_cierre(uuid, text, text) TO authenticated;

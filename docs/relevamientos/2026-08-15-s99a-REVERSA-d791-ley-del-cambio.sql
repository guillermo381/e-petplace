-- ============================================================================
-- REVERSA de 20260817100000_s99a_d791_ley_del_cambio_en_respuesta.sql
-- Escrita ANTES de aplicar (regla de la casa). S99-A, 15-ago-2026.
--
-- QUÉ DESHACE: restaura los cuerpos PREVIOS (leídos del objeto con
-- pg_get_functiondef el 15-ago-2026) de las tres puertas del reparto.
-- Las respuestas vuelven a NO declarar accion/comprometidos/nota.
--
-- QUÉ NO DESHACE: nada de datos — la migración no toca datos (76(g) NO RIGE).
-- NOTA DE BUNDLES (D-662): ningún bundle vivo consume las claves nuevas de la
-- respuesta (son ADITIVAS); revertir no rompe ningún consumidor — los
-- consumidores de `ok`/`turno_id`/`recurso_id`/`regla_id` siguen enteros.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.definir_recurso_reparto(p_cuenta_comercial_id uuid, p_nombre text, p_capacidad_por_dia integer, p_dias_operacion integer[] DEFAULT NULL::integer[], p_activo boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_capacidad_por_dia IS NULL OR p_capacidad_por_dia <= 0 THEN
    RAISE EXCEPTION 'capacidad_invalida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO recursos_reparto (cuenta_comercial_id, nombre, capacidad_por_dia,
                                dias_operacion, activo)
    VALUES (p_cuenta_comercial_id, btrim(p_nombre), p_capacidad_por_dia,
            COALESCE(p_dias_operacion, '{1,2,3,4,5,6}'), p_activo)
  ON CONFLICT (cuenta_comercial_id, nombre)
    DO UPDATE SET capacidad_por_dia = EXCLUDED.capacidad_por_dia,
                  dias_operacion = EXCLUDED.dias_operacion,
                  activo = EXCLUDED.activo, updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'recurso_id', v_id);
END $function$;

CREATE OR REPLACE FUNCTION public.definir_regla_envio_vendedor(p_cuenta_comercial_id uuid, p_tipo text, p_parametros jsonb, p_pagado_por text DEFAULT 'vendedor'::text, p_ciudades_cubiertas text[] DEFAULT NULL::text[], p_prioridad integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_tipo record; v_id uuid; v_params jsonb;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_tipo FROM cat_tipos_regla_envio WHERE codigo = p_tipo;
  IF v_tipo.codigo IS NULL THEN
    RAISE EXCEPTION 'tipo_regla_no_existe: %', p_tipo USING ERRCODE = '22023';
  END IF;
  IF NOT v_tipo.activo THEN
    RAISE EXCEPTION 'tipo_regla_envio_inactivo: «%» está modelado y apagado. Motivo: %',
      p_tipo, COALESCE(v_tipo.motivo_inactivo,'(sin declarar)') USING ERRCODE = '22023';
  END IF;

  IF p_pagado_por NOT IN ('vendedor','cliente','plataforma') THEN
    RAISE EXCEPTION 'pagado_por_invalido: %', p_pagado_por USING ERRCODE = '22023';
  END IF;

  -- 🔴 «GRATIS» NO ES «NADIE PAGA». `pagado_por` viaja DENTRO de los
  --    parámetros, y de ahí lo copia `cotizar_envio_despensa` a
  --    `parametros_aplicados`, que `crear_pedido_despensa` congela en
  --    `pedidos.envio_cotizacion`. ⇒ **quién pagó el envío queda escrito en la
  --    fila del pedido**, no en una tabla de configuración que puede cambiar.
  v_params := COALESCE(p_parametros, '{}'::jsonb)
              || jsonb_build_object('pagado_por', p_pagado_por);
  IF p_ciudades_cubiertas IS NOT NULL THEN
    v_params := v_params || jsonb_build_object('ciudades_cubiertas',
                              to_jsonb(p_ciudades_cubiertas));
  END IF;

  -- Idempotente por vendedor+país+tipo: redefinir NO apila reglas.
  UPDATE reglas_envio SET activo = false, vigencia_hasta = now(), updated_at = now()
   WHERE cuenta_comercial_id = p_cuenta_comercial_id
     AND country_code = 'EC' AND activo;

  INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros,
                            moneda, prioridad, vigencia_desde, activo, notas)
  VALUES (p_cuenta_comercial_id, 'EC', p_tipo, v_params, 'USD',
          p_prioridad, now(), true,
          'S95-G2 · definida por función, no por INSERT directo (D-762).')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'regla_id', v_id, 'tipo', p_tipo,
                            'parametros', v_params);
END $function$;

CREATE OR REPLACE FUNCTION public.definir_turno_entrega(p_cuenta_comercial_id uuid, p_codigo text, p_corte time without time zone, p_entrega_desde time without time zone, p_entrega_hasta time without time zone, p_dia_offset integer DEFAULT 0, p_orden integer DEFAULT 1, p_zona_horaria text DEFAULT 'America/Guayaquil'::text, p_dias_semana smallint[] DEFAULT NULL::smallint[], p_incluye_festivos boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  INSERT INTO entrega_turnos (cuenta_comercial_id, codigo, corte, entrega_desde,
                              entrega_hasta, dia_offset, orden, zona_horaria,
                              dias_semana, incluye_festivos)
    VALUES (p_cuenta_comercial_id, p_codigo, p_corte, p_entrega_desde,
            p_entrega_hasta, p_dia_offset, p_orden, p_zona_horaria,
            -- al CREAR, `NULL` cae al default de la columna (L–D): un corte
            -- nuevo sin días declarados rige todos los días, que es el
            -- estado que la tabla tenía antes de existir esta columna.
            COALESCE(p_dias_semana, ARRAY[0,1,2,3,4,5,6]::smallint[]),
            COALESCE(p_incluye_festivos, false))
  ON CONFLICT (cuenta_comercial_id, codigo)
    DO UPDATE SET corte = EXCLUDED.corte, entrega_desde = EXCLUDED.entrega_desde,
                  entrega_hasta = EXCLUDED.entrega_hasta, dia_offset = EXCLUDED.dia_offset,
                  orden = EXCLUDED.orden, zona_horaria = EXCLUDED.zona_horaria,
                  -- 🔴 al EDITAR, `NULL` NO PISA: conserva lo que la fila
                  --    tiene. `entrega_turnos` es la tabla, no EXCLUDED.
                  dias_semana      = COALESCE(p_dias_semana,      entrega_turnos.dias_semana),
                  incluye_festivos = COALESCE(p_incluye_festivos, entrega_turnos.incluye_festivos),
                  activo = true
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'turno_id', v_id);
END $function$;

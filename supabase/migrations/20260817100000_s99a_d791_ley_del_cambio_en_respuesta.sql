-- ============================================================================
-- S99-A · D-791 — LA LEY DEL CAMBIO ENTRA A LA RESPUESTA DE LAS TRES PUERTAS
--
-- Medido antes de escribir (15-ago-2026, pg_get_functiondef del objeto):
--   · `definir_turno_entrega`   YA upserta por (cuenta_comercial_id, codigo),
--     con NULL-no-pisa en dias_semana/incluye_festivos.
--   · `definir_recurso_reparto` YA upserta por (cuenta_comercial_id, nombre).
--   · `definir_regla_envio_vendedor` YA versiona (apaga las activas y crea).
--   · `actualizar_repartidor` existe (editor explícito, sin compromisos que
--     declarar — NO se toca).
-- ⇒ El camino de edición EXISTE. Lo que faltaba de motor es la mitad que la
-- ficha exige literal: «el cambio rige para lo nuevo, lo comprometido conserva
-- su ventana, y la respuesta DICE ambas cosas». Hoy las tres respuestas dicen
-- solo {ok, id}: quien edita no sabe si creó o corrigió, ni qué compromiso
-- vivo queda intacto.
--
-- QUÉ HACE (aditivo puro sobre las respuestas; firmas idénticas):
--   ① las tres respuestas ganan `accion` ('creado'|'actualizado' /
--     'creada'|'reemplazada'), el conteo de lo COMPROMETIDO, y `nota` con la
--     ley del cambio. Las claves previas ({ok, *_id, tipo, parametros}) no
--     cambian — cero consumidor roto (D-662: bundle vivo intacto).
--   ② el compromiso se cuenta con la MISMA verdad del motor:
--     - turnos: pedidos en estado NO terminal (cat_estados_pedido.es_terminal,
--       jamás lista hardcodeada — regla 21) cuya promesa congelada
--       (`envio_cotizacion->'promesa'->>'turno'`) nombra este turno.
--     - recursos: `cupo_reparto_del_dia(...)` — LA fuente única del cupo — se
--       reusa para barrer hoy..+13 y declarar los días que quedarían
--       sobre-comprometidos con la capacidad nueva. NO se copia el predicado.
--     - regla de envío: pedidos vivos con cotización congelada (conservan su
--       cotización por construcción — `pedidos.envio_cotizacion`).
--
-- 76(g): NO RIGE — DDL de funciones, cero backfill, cero escritura de datos.
-- REVERSA: escrita ANTES en
--   docs/relevamientos/2026-08-15-s99a-REVERSA-d791-ley-del-cambio.sql
--   (cuerpos previos verbatim del objeto).
-- BUNDLES VIVOS (D-662): las claves nuevas son ADITIVAS; los wrappers y el
--   bundle `01a00373` leen `ok` y los ids — ninguno rompe.
-- GRANTS: CREATE OR REPLACE conserva el ACL vivo (sin anon); se verifica al
--   cierre con has_function_privilege.
-- ============================================================================

-- ① EL TURNO — la respuesta dice si creó o corrigió, y cuántas ventanas
--    pactadas quedan intactas.
CREATE OR REPLACE FUNCTION public.definir_turno_entrega(p_cuenta_comercial_id uuid, p_codigo text, p_corte time without time zone, p_entrega_desde time without time zone, p_entrega_hasta time without time zone, p_dia_offset integer DEFAULT 0, p_orden integer DEFAULT 1, p_zona_horaria text DEFAULT 'America/Guayaquil'::text, p_dias_semana smallint[] DEFAULT NULL::smallint[], p_incluye_festivos boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
  v_existia boolean;
  v_comprometidos int;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  -- D-791: la acción se detecta ANTES del upsert — 'actualizado' es la mitad
  -- de la ley del cambio que la respuesta tiene que poder decir.
  SELECT EXISTS (SELECT 1 FROM entrega_turnos
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND codigo = p_codigo)
    INTO v_existia;

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

  -- Lo COMPROMETIDO: pedidos vivos cuya promesa congelada nombra este turno.
  -- La ventana vive en la fila del pedido (envio_cotizacion), no acá — por eso
  -- el cambio no puede tocarla: se cuenta y se DICE. Terminal = catálogo.
  SELECT count(*) INTO v_comprometidos
  FROM pedidos p
  JOIN cat_estados_pedido e ON e.codigo = p.estado
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
    AND NOT e.es_terminal
    AND p.envio_cotizacion->'promesa'->>'turno' = p_codigo;

  RETURN jsonb_build_object(
    'ok', true, 'turno_id', v_id,
    'accion', CASE WHEN v_existia THEN 'actualizado' ELSE 'creado' END,
    'comprometidos', v_comprometidos,
    'nota', 'El cambio rige para pedidos nuevos; lo ya comprometido conserva su ventana.');
END $function$;

-- ② EL RECURSO — la respuesta dice si creó o corrigió, y qué días quedarían
--    sobre-comprometidos con la capacidad nueva (medidos con la fuente única
--    del cupo, jamás con un predicado copiado).
CREATE OR REPLACE FUNCTION public.definir_recurso_reparto(p_cuenta_comercial_id uuid, p_nombre text, p_capacidad_por_dia integer, p_dias_operacion integer[] DEFAULT NULL::integer[], p_activo boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
  v_existia boolean;
  v_cupo jsonb;
  v_sobre jsonb := '[]'::jsonb;
  i int;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_capacidad_por_dia IS NULL OR p_capacidad_por_dia <= 0 THEN
    RAISE EXCEPTION 'capacidad_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (SELECT 1 FROM recursos_reparto
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND nombre = btrim(p_nombre))
    INTO v_existia;

  INSERT INTO recursos_reparto (cuenta_comercial_id, nombre, capacidad_por_dia,
                                dias_operacion, activo)
    VALUES (p_cuenta_comercial_id, btrim(p_nombre), p_capacidad_por_dia,
            COALESCE(p_dias_operacion, '{1,2,3,4,5,6}'), p_activo)
  ON CONFLICT (cuenta_comercial_id, nombre)
    DO UPDATE SET capacidad_por_dia = EXCLUDED.capacidad_por_dia,
                  dias_operacion = EXCLUDED.dias_operacion,
                  activo = EXCLUDED.activo, updated_at = now()
  RETURNING id INTO v_id;

  -- Lo COMPROMETIDO: los pedidos ya prometidos contra los días que vienen no
  -- se cancelan por bajar la capacidad — se cumplen. Si con la capacidad NUEVA
  -- algún día queda con más prometido que cupo, la respuesta LO DICE.
  -- `cupo_reparto_del_dia` es la única verdad del cupo (capacidad post-cambio
  -- + consumido real); barrer hoy..+13 con ella evita un segundo predicado.
  FOR i IN 0..13 LOOP
    v_cupo := cupo_reparto_del_dia(p_cuenta_comercial_id, current_date + i);
    IF (v_cupo->>'consumido')::int > (v_cupo->>'capacidad')::int THEN
      v_sobre := v_sobre || jsonb_build_object(
        'fecha', v_cupo->>'fecha',
        'capacidad', (v_cupo->>'capacidad')::int,
        'comprometido', (v_cupo->>'consumido')::int);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'recurso_id', v_id,
    'accion', CASE WHEN v_existia THEN 'actualizado' ELSE 'creado' END,
    'dias_sobrecomprometidos', v_sobre,
    'nota', 'El cambio rige para pedidos nuevos; lo ya comprometido se cumple aunque exceda la capacidad nueva.');
END $function$;

-- ③ LA REGLA DE ENVÍO — la respuesta dice si estrenó o reemplazó, cuántas
--    reglas archivó, y cuántos pedidos vivos conservan su cotización congelada.
CREATE OR REPLACE FUNCTION public.definir_regla_envio_vendedor(p_cuenta_comercial_id uuid, p_tipo text, p_parametros jsonb, p_pagado_por text DEFAULT 'vendedor'::text, p_ciudades_cubiertas text[] DEFAULT NULL::text[], p_prioridad integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tipo record; v_id uuid; v_params jsonb;
  v_archivadas int;
  v_comprometidos int;
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
  GET DIAGNOSTICS v_archivadas = ROW_COUNT;

  INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros,
                            moneda, prioridad, vigencia_desde, activo, notas)
  VALUES (p_cuenta_comercial_id, 'EC', p_tipo, v_params, 'USD',
          p_prioridad, now(), true,
          'S95-G2 · definida por función, no por INSERT directo (D-762).')
  RETURNING id INTO v_id;

  -- Lo COMPROMETIDO: todo pedido vivo lleva su cotización CONGELADA en la
  -- fila (envio_cotizacion) — la regla nueva no lo alcanza. Se cuenta y se
  -- DICE. Terminal = catálogo, jamás lista hardcodeada.
  SELECT count(*) INTO v_comprometidos
  FROM pedidos p
  JOIN cat_estados_pedido e ON e.codigo = p.estado
  WHERE p.cuenta_comercial_id = p_cuenta_comercial_id
    AND NOT e.es_terminal
    AND p.envio_cotizacion IS NOT NULL;

  RETURN jsonb_build_object(
    'ok', true, 'regla_id', v_id, 'tipo', p_tipo, 'parametros', v_params,
    'accion', CASE WHEN v_archivadas > 0 THEN 'reemplazada' ELSE 'creada' END,
    'reglas_archivadas', v_archivadas,
    'comprometidos', v_comprometidos,
    'nota', 'La regla rige para cotizaciones nuevas; los pedidos vivos conservan su cotización congelada.');
END $function$;

-- ============================================================================
-- CINTURÓN (aborta la migración si el objeto no quedó como la letra dice)
-- ============================================================================
DO $cinturon$
DECLARE
  v_src text;
  f text;
BEGIN
  -- ① Las tres declaran la ley del cambio en su cuerpo vivo.
  FOREACH f IN ARRAY ARRAY['definir_turno_entrega','definir_recurso_reparto','definir_regla_envio_vendedor'] LOOP
    SELECT prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = f;
    IF v_src IS NULL OR position('accion' IN v_src) = 0 OR position('nota' IN v_src) = 0 THEN
      RAISE EXCEPTION 'cinturon: % no declara accion/nota — la ley del cambio no entró', f;
    END IF;
  END LOOP;

  -- ② Sin sobrecarga zombi (L-119): exactamente UNA firma por nombre.
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname IN ('definir_turno_entrega','definir_recurso_reparto','definir_regla_envio_vendedor')) <> 3 THEN
    RAISE EXCEPTION 'cinturon: sobrecarga zombi — hay más de una firma por puerta';
  END IF;

  -- ③ L-140: anon no ejecuta ninguna de las tres (el REPLACE conserva ACL;
  --    esto lo VERIFICA en vez de suponerlo).
  IF has_function_privilege('anon', 'public.definir_turno_entrega(uuid,text,time,time,time,integer,integer,text,smallint[],boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.definir_recurso_reparto(uuid,text,integer,integer[],boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.definir_regla_envio_vendedor(uuid,text,jsonb,text,text[],integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: anon puede ejecutar una puerta del reparto (L-140)';
  END IF;
END $cinturon$;

-- ─────────────────────────────────────────────────────────────────────
-- REVERSA de `20260804200000_s86_tiempo_las_cinco.sql`
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ AVISO PROPIO — REVERTIR REPONE UN DATO CLÍNICO FALSO:
-- estas cinco vuelven a decidir el DÍA con `current_date`, y la base
-- corre en UTC sin override para ningún rol. Entre las 19:00 locales y
-- medianoche, `current_date` YA ES MAÑANA.
--
-- Dos de las cinco escriben la fecha de una VACUNA. **Una vacuna con
-- fecha equivocada no es un número feo: es un dato clínico falso en el
-- expediente**, y el expediente es el producto. Revertir esto no
-- "vuelve atrás una mejora": reabre esa puerta.
--
-- LO QUE REVERTIR NO DESHACE: nada de datos. La firma del founder fue
-- SOLO HACIA ADELANTE — no hubo backfill, así que no hay backfill que
-- deshacer. Lo ya escrito torcido sigue torcido y está declarado.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- ── registrar_vacuna_mostrador (cuerpo previo a S86-A, verbatim) ──
CREATE OR REPLACE FUNCTION public.registrar_vacuna_mostrador(p_cita_id uuid, p_vacuna_codigo text DEFAULT NULL::text, p_nombre_libre text DEFAULT NULL::text, p_fecha_aplicacion date DEFAULT NULL::date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_mascota uuid; v_prestador uuid; v_cuenta uuid; v_country text; v_origen text;
  v_codigo text := NULLIF(trim(p_vacuna_codigo), '');
  v_libre text := NULLIF(trim(p_nombre_libre), '');
  v_nombre text;
  v_evento uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT ecs.mascota_id, ecs.prestador_id, ecs.country_code, ecs.metadata ->> 'origen'
  INTO v_mascota, v_prestador, v_country, v_origen
  FROM evento_cita_servicio ecs WHERE ecs.id = p_cita_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023'; END IF;

  SELECT p.cuenta_comercial_id INTO v_cuenta FROM prestadores p WHERE p.id = v_prestador;
  IF v_cuenta IS NULL OR NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_capacidad_clinica(v_prestador), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- cita de mostrador O al menos acceso vigente a la mascota
  IF v_origen IS DISTINCT FROM 'mostrador' AND NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = v_mascota AND map.cuenta_comercial_id = v_cuenta
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;

  -- catálogo XOR libre
  IF (v_codigo IS NOT NULL) = (v_libre IS NOT NULL) THEN
    RAISE EXCEPTION 'vacuna_xor' USING ERRCODE = '22023',
      DETAIL = 'Pasá un código de cat_vacunas O un nombre libre — exactamente uno.';
  END IF;

  IF v_codigo IS NOT NULL THEN
    SELECT nombre INTO v_nombre FROM cat_vacunas WHERE codigo = v_codigo AND activo = true;
    IF v_nombre IS NULL THEN RAISE EXCEPTION 'vacuna_codigo_invalido' USING ERRCODE = '22023'; END IF;
  ELSE
    v_nombre := v_libre;
  END IF;

  -- La tipada + su trigger (A1bis) crean el evento padre con procedencia
  -- declarado_por_prestador (hay prestador_id).
  INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, fecha_aplicada, prestador_id, country_code, cita_id)
  VALUES (v_mascota, v_nombre, COALESCE(p_fecha_aplicacion, current_date), v_prestador, COALESCE(v_country, 'EC'), p_cita_id)
  RETURNING evento_id INTO v_evento;

  RETURN v_evento;
END;
$function$;

-- ── registrar_vacunas_de_carnet (cuerpo previo a S86-A, verbatim) ──
CREATE OR REPLACE FUNCTION public.registrar_vacunas_de_carnet(p_mascota_id uuid, p_vacunas jsonb, p_archivo_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_item           jsonb;
  v_idx            int := 0;
  v_nombre         text;
  v_fecha_aplicada date;
  v_fecha_proxima  date;
  v_via            text;
  v_id             uuid;
  v_ids            uuid[] := '{}';
  v_archivo        text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  -- INVOKER: esta lectura pasa por la RLS de mascotas; la condición es
  -- la MISMA puerta que la rama del dueño en vacuna_insert (relevada
  -- literal en S46-B1.0) — el error tipado llega antes que un 42501.
  if not exists (
    select 1 from mascotas m
     where m.id = p_mascota_id and m.user_id = auth.uid()
  ) then
    raise exception 'sin_acceso_mascota';
  end if;

  -- El carnet que respalda el lote: path del bucket mascotas, carpeta
  -- del dueño. Ni URL ni carpeta ajena (S47-B1.2).
  v_archivo := nullif(btrim(p_archivo_url), '');
  if v_archivo is not null then
    if v_archivo like 'http%' then
      raise exception 'archivo_invalido: es una URL, se espera un path del bucket';
    end if;
    if split_part(v_archivo, '/', 1) <> auth.uid()::text then
      raise exception 'archivo_invalido: el path no está en la carpeta del dueño';
    end if;
  end if;

  if p_vacunas is null
     or jsonb_typeof(p_vacunas) <> 'array'
     or jsonb_array_length(p_vacunas) = 0 then
    raise exception 'vacunas_vacias';
  end if;

  for v_item in select * from jsonb_array_elements(p_vacunas) loop
    v_idx := v_idx + 1;

    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'item_invalido: %: no es un objeto', v_idx;
    end if;

    v_nombre := nullif(btrim(v_item->>'nombre'), '');
    if v_nombre is null then
      raise exception 'item_invalido: %: nombre obligatorio', v_idx;
    end if;

    if v_item->>'fecha_aplicada' is not null then
      if not pg_input_is_valid(v_item->>'fecha_aplicada', 'date') then
        raise exception 'item_invalido: %: fecha_aplicada no es una fecha válida', v_idx;
      end if;
      v_fecha_aplicada := (v_item->>'fecha_aplicada')::date;
      if v_fecha_aplicada > current_date then
        raise exception 'item_invalido: %: fecha_aplicada futura', v_idx;
      end if;
    else
      v_fecha_aplicada := null;
    end if;

    if v_item->>'fecha_proxima' is not null then
      if not pg_input_is_valid(v_item->>'fecha_proxima', 'date') then
        raise exception 'item_invalido: %: fecha_proxima no es una fecha válida', v_idx;
      end if;
      v_fecha_proxima := (v_item->>'fecha_proxima')::date;
    else
      v_fecha_proxima := null;
    end if;

    -- espejo literal del CHECK evento_vacuna_aplicada_via_administracion_check
    v_via := nullif(btrim(v_item->>'via_administracion'), '');
    if v_via is not null
       and v_via not in ('subcutanea','intramuscular','intranasal','oral') then
      raise exception 'item_invalido: %: via_administracion fuera del catálogo', v_idx;
    end if;

    -- evento_id NO se pasa: _trg_vacuna_crear_evento crea el padre.
    insert into evento_vacuna_aplicada
      (mascota_id, nombre_vacuna, fecha_aplicada, fecha_proxima,
       veterinario_nombre_externo, tipo_vacuna, lote, via_administracion,
       archivo_url)
    values
      (p_mascota_id, v_nombre, v_fecha_aplicada, v_fecha_proxima,
       nullif(btrim(v_item->>'veterinario_nombre_externo'), ''),
       nullif(btrim(v_item->>'tipo_vacuna'), ''),
       nullif(btrim(v_item->>'lote'), ''),
       v_via,
       v_archivo)
    returning id into v_id;

    v_ids := v_ids || v_id;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'insertadas', coalesce(array_length(v_ids, 1), 0),
    'ids', to_jsonb(v_ids),
    'archivo_url', v_archivo
  );
end;
$function$;

-- ── registrar_desparasitacion (cuerpo previo a S86-A, verbatim) ──
CREATE OR REPLACE FUNCTION public.registrar_desparasitacion(p_mascota_id uuid, p_producto text, p_tipo text DEFAULT NULL::text, p_fecha_aplicada date DEFAULT NULL::date, p_fecha_proxima date DEFAULT NULL::date, p_notas text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id uuid;
  v_country text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_producto IS NULL OR length(trim(p_producto)) = 0 THEN
    RAISE EXCEPTION 'producto_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_tipo IS NOT NULL AND p_tipo NOT IN ('interna', 'externa', 'mixta') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;
  -- lo declarado por familia es un hecho PASADO: la aplicación no es futura
  IF p_fecha_aplicada IS NOT NULL AND p_fecha_aplicada > CURRENT_DATE THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE = '22023';
  END IF;
  IF p_fecha_proxima IS NOT NULL AND p_fecha_aplicada IS NOT NULL AND p_fecha_proxima < p_fecha_aplicada THEN
    RAISE EXCEPTION 'orden_fechas_invalido' USING ERRCODE = '22023';
  END IF;

  -- eventos_mascota.country_code es NOT NULL (hallazgo del rojo crudo):
  -- el país del evento es el de la MASCOTA, derivado — jamás pedido.
  SELECT country_code INTO v_country FROM mascotas WHERE id = p_mascota_id;

  INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima, notas)
  VALUES (p_mascota_id, v_country, trim(p_producto), p_tipo, p_fecha_aplicada, p_fecha_proxima, p_notas)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'mascota_id', p_mascota_id);
END;
$function$;

-- ── obtener_plan_vacunal (cuerpo previo a S86-A, verbatim) ──
CREATE OR REPLACE FUNCTION public.obtener_plan_vacunal(p_mascota_id uuid)
 RETURNS TABLE(vacuna_codigo text, nombre text, obligatoria boolean, periodicidad_meses integer, ultima_aplicada date, proxima date, proxima_es_derivada boolean, estado text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_especie text;
  v_edad_meses integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- la puerta del expediente: el MISMO helper que gobierna la lectura
  -- clínica de la mascota (jamás una regla nueva acá)
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  SELECT m.especie,
         CASE WHEN m.fecha_nacimiento IS NULL THEN NULL
              ELSE (EXTRACT(YEAR FROM age(CURRENT_DATE, m.fecha_nacimiento)) * 12
                  + EXTRACT(MONTH FROM age(CURRENT_DATE, m.fecha_nacimiento)))::integer END
    INTO v_especie, v_edad_meses
    FROM mascotas m WHERE m.id = p_mascota_id;

  RETURN QUERY
  WITH aplicadas AS (
    -- la ÚLTIMA aplicación por vacuna del catálogo (el puente ②)
    SELECT DISTINCT ON (e.vacuna_codigo)
           e.vacuna_codigo, e.fecha_aplicada, e.fecha_proxima
      FROM evento_vacuna_aplicada e
     WHERE e.mascota_id = p_mascota_id AND e.vacuna_codigo IS NOT NULL
     ORDER BY e.vacuna_codigo, e.fecha_aplicada DESC NULLS LAST
  )
  SELECT p.vacuna_codigo,
         c.nombre,
         p.obligatoria,
         p.periodicidad_meses,
         a.fecha_aplicada,
         -- LA CAPTURADA GANA A LA DERIVADA (siempre)
         COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)),
         (a.fecha_proxima IS NULL
          AND _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses) IS NOT NULL),
         CASE
           WHEN a.vacuna_codigo IS NULL AND v_edad_meses IS NOT NULL
                AND p.edad_inicio_meses IS NOT NULL AND v_edad_meses < p.edad_inicio_meses
             THEN 'aun_no_corresponde'
           WHEN a.vacuna_codigo IS NULL THEN 'nunca_aplicada'
           WHEN COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) IS NULL
             THEN 'sin_fecha'
           WHEN COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) >= CURRENT_DATE
             THEN 'al_dia'
           ELSE 'vencida'
         END
    FROM cat_plan_vacunal p
    JOIN cat_vacunas c ON c.codigo = p.vacuna_codigo
    LEFT JOIN aplicadas a ON a.vacuna_codigo = p.vacuna_codigo
   WHERE p.especie_codigo = v_especie AND p.activo AND c.activo
   ORDER BY p.orden, c.nombre;
END;
$function$;

-- ── otorgar_puntos (cuerpo previo a S86-A, verbatim) ──
CREATE OR REPLACE FUNCTION public.otorgar_puntos(p_user_id uuid, p_puntos integer, p_tipo text, p_descripcion text, p_logro_id uuid DEFAULT NULL::uuid, p_referencia text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_nuevo_total   INT;
  v_nuevo_nivel   UUID;
BEGIN
  -- Insertar transacción
  INSERT INTO transacciones_puntos (
    user_id, puntos, tipo, descripcion, logro_id, referencia_id
  ) VALUES (
    p_user_id, p_puntos, p_tipo, p_descripcion, p_logro_id, p_referencia
  );

  -- Actualizar puntos del usuario
  INSERT INTO puntos_usuario (user_id, puntos_totales, puntos_mes, ultima_actividad)
  VALUES (p_user_id, p_puntos, p_puntos, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET
    puntos_totales   = puntos_usuario.puntos_totales + p_puntos,
    puntos_mes       = puntos_usuario.puntos_mes + p_puntos,
    ultima_actividad = CURRENT_DATE,
    updated_at       = NOW()
  RETURNING puntos_totales INTO v_nuevo_total;

  -- Actualizar nivel si corresponde
  SELECT id INTO v_nuevo_nivel
  FROM niveles
  WHERE puntos_minimos <= v_nuevo_total
    AND (puntos_maximos IS NULL OR puntos_maximos >= v_nuevo_total)
  ORDER BY puntos_minimos DESC
  LIMIT 1;

  IF v_nuevo_nivel IS NOT NULL THEN
    UPDATE puntos_usuario
    SET nivel_id = v_nuevo_nivel
    WHERE user_id = p_user_id;
  END IF;
END;
$function$;


-- El helper se va ÚLTIMO: antes hay que haber repuesto a sus consumidores.
DROP FUNCTION IF EXISTS public.hoy_local();

COMMIT;

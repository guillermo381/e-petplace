-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · SIN DIAGNÓSTICO NO SE PRESCRIBE — respaldo legal, pedido de C
-- ═══════════════════════════════════════════════════════════════════════
--
-- LITERAL DEL ABOGADO (docs/legal/2026-08-25-receta-videoconsulta.md,
-- Límite 1): *«El sistema debe exigir el campo de diagnóstico como
-- obligatorio antes de emitir — no por formalismo, sino porque una REV sin
-- diagnóstico es una receta defectuosa.»* **SISTEMA, no pantalla.**
--
-- ─── LO MEDIDO, Y CORRIGE EN DOS PUNTOS AL PEDIDO ──────────────────────
--
-- ① **El productor VIVO YA CUMPLE.** `sedimentar_nota_clinica` exige
--    diagnóstico en su línea 38 (`nota_sin_diagnostico`, `22023`), ANTES de
--    cualquier medicación. ⇒ **no hay hueco de usuario, y no lo había.**
--    *Es una de-escalada, no una minimización: cambia la urgencia, no el
--    hecho.*
--
-- ② **`completar_historia_clinica` SÍ menciona diagnóstico** — el pedido
--    decía que no. Lo menciona **para ESCRIBIRLO** (`input_data->>
--    'diagnostico_principal'`), nunca para exigirlo. *Mencionar no es
--    exigir, y la diferencia es justo la que el abogado nombró.*
--    ⇒ **el hallazgo de C es real; su literal era impreciso.**
--
-- ─── LA DECISIÓN: EXIGIR, NO RETIRAR — con doble check ─────────────────
--
-- Las dos salidas eran legítimas (mismo par que `D-898`). Se eligió el
-- guard, y las razones en orden de peso:
--
--   1. **La letra pide EXIGIR.** *«El sistema debe exigir el campo»* — un
--      guard es la respuesta literal. Retirar la función responde otra
--      pregunta: hace que el camino no exista, no que el sistema exija.
--   2. **El riesgo es asimétrico.** La función tiene `authenticated:
--      EXECUTE` vivo. El grep dio **cero consumidores** en el monorepo y en
--      los cinco repos vecinos —solo docs—, pero la lección S95-F avisa que
--      *lo que bloquea vive afuera*, y «afuera» acá incluye artefactos
--      desplegados. **Un DROP que rompa un portal legado en producción es
--      caro; un guard que rebota es barato, y su fallo es ruidoso y
--      correcto.**
--   3. **Si mañana se retira, el guard no estorbó.** El orden inverso no es
--      cierto.
--
-- ⚠️ **Se exige SIEMPRE, no solo cuando hay medicación** — igual que el
-- productor vivo. *Que los dos gemelos se comporten distinto es la clase de
-- diferencia que nadie recuerda el día que importa.*
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- Solo se reemplaza el cuerpo de una función. Sin DDL de datos, sin
-- backfill, sin anclas. Firma IDÉNTICA ⇒ tampoco aplica L-119.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-26-s106a-REVERSA-diagnostico-obligatorio.sql
-- Declara qué significa revertirla: vuelve a ser posible prescribir sin
-- diagnóstico.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.completar_historia_clinica(input_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  -- IDs de entrada
  v_cita_id        uuid;
  v_mascota_id     uuid;
  v_prestador_id   uuid;
  v_empleado_id    uuid;
  v_country_code   text;

  -- Estado de la cita
  v_cita_existe          boolean;
  v_cita_evento_id_actual uuid;
  v_cita_modalidad        text;
  v_cita_tipo_servicio    text;

  -- Eventos creados
  v_evento_padre_id    uuid;
  v_evento_hc_id       uuid;
  v_evento_peso_id     uuid;  -- NUEVO
  v_evento_receta_id   uuid;
  v_evento_examen_id   uuid;
  v_evento_archivo_id  uuid;

  -- HC creada
  v_historia_id  uuid;

  -- Loop variables
  v_receta   jsonb;
  v_examen   jsonb;
  v_archivo  jsonb;
  v_orden    int;

  -- Peso (NUEVO)
  v_peso_kg           numeric;
  v_metodo_peso       text;

  -- Eje JTBD calculado
  v_eje_jtbd text;
BEGIN
  -- ============================================================
  -- 1. Extraer y validar IDs obligatorios
  -- ============================================================

  v_cita_id      := (input_data->>'cita_id')::uuid;
  v_mascota_id   := (input_data->>'mascota_id')::uuid;
  v_prestador_id := (input_data->>'prestador_id')::uuid;
  v_empleado_id  := NULLIF(input_data->>'empleado_id', '')::uuid;
  v_country_code := COALESCE(input_data->>'country_code', 'EC');

  IF v_cita_id IS NULL OR v_mascota_id IS NULL OR v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_id, mascota_id y prestador_id son obligatorios';
  END IF;

  -- ============================================================
  -- 2. Validar acceso del usuario al prestador
  -- ============================================================

  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'acceso denegado: no tiene permisos sobre este prestador';
  END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_capacidad_clinica(v_prestador_id), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- ═══ S106 · SIN DIAGNÓSTICO NO SE PRESCRIBE ════════════════════════════
  -- Literal del abogado (docs/legal/2026-08-25-receta-videoconsulta.md,
  -- Límite 1): «El sistema debe exigir el campo de diagnóstico como
  -- obligatorio antes de emitir — no por formalismo, sino porque una REV sin
  -- diagnóstico es una receta defectuosa». **SISTEMA, no pantalla.**
  --
  -- Esta función ESCRIBE `diagnostico_principal` (más abajo) pero no lo
  -- exigía: se podía sedimentar medicación prescrita con diagnóstico NULL.
  --
  -- ⚠️ El productor VIVO (`sedimentar_nota_clinica`) YA lo exige desde su
  -- línea 38, con este mismo código de error. **Acá se iguala el gemelo
  -- muerto**, para que los dos caminos hablen el mismo idioma y para que el
  -- día que alguien reconecte éste no herede el hueco.
  IF NULLIF(trim(COALESCE(input_data->>'diagnostico_principal','')), '') IS NULL THEN
    RAISE EXCEPTION 'nota_sin_diagnostico' USING ERRCODE = '22023';
  END IF;

  -- ============================================================
  -- 3. Validar integridad de la cita
  -- ============================================================

  SELECT
    EXISTS(SELECT 1 FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT evento_id FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT modalidad FROM evento_cita_servicio WHERE id = v_cita_id),
    (SELECT tipo_servicio FROM evento_cita_servicio WHERE id = v_cita_id)
  INTO v_cita_existe, v_cita_evento_id_actual, v_cita_modalidad, v_cita_tipo_servicio;

  IF NOT v_cita_existe THEN
    RAISE EXCEPTION 'cita % no existe', v_cita_id;
  END IF;

  IF v_cita_evento_id_actual IS NOT NULL THEN
    RAISE EXCEPTION 'cita % ya tiene evento padre asociado (evento_id=%). La función no es idempotente. Si necesita reintentar, limpie el evento manualmente primero',
      v_cita_id, v_cita_evento_id_actual;
  END IF;

  -- Validar que la cita pertenece al prestador y mascota declarados
  IF NOT EXISTS (
    SELECT 1 FROM evento_cita_servicio
    WHERE id = v_cita_id
      AND prestador_id = v_prestador_id
      AND mascota_id = v_mascota_id
  ) THEN
    RAISE EXCEPTION 'cita % no pertenece al prestador % y/o mascota % declarados',
      v_cita_id, v_prestador_id, v_mascota_id;
  END IF;

  -- Validar que la HC no existe ya
  IF EXISTS (SELECT 1 FROM evento_historia_clinica_registrada WHERE cita_id = v_cita_id) THEN
    RAISE EXCEPTION 'ya existe una historia clínica para la cita %', v_cita_id;
  END IF;

  -- ============================================================
  -- 4. Calcular eje JTBD (siempre 'salud' para cita con HC)
  -- ============================================================

  v_eje_jtbd := COALESCE(eje_de_tipo_servicio(v_cita_tipo_servicio), 'salud');

  -- ============================================================
  -- 5. Crear evento padre (cita_servicio)
  -- ============================================================

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    cuenta_comercial_id, prestador_id, empleado_id,
    creado_por_user_id, country_code,
    datos
  ) VALUES (
    v_mascota_id, 'cita_servicio', v_eje_jtbd, now(),
    NULL, v_prestador_id, v_empleado_id,
    auth.uid(), v_country_code,
    jsonb_build_object(
      'cita_id', v_cita_id,
      'tipo_servicio', v_cita_tipo_servicio,
      'modalidad', v_cita_modalidad
    )
  )
  RETURNING id INTO v_evento_padre_id;

  -- Popular evento_cita_servicio.evento_id (cierra el loop)
  UPDATE evento_cita_servicio
  SET
    evento_id = v_evento_padre_id,
    estado = 'completada'
  WHERE id = v_cita_id;

  -- ============================================================
  -- 6. Crear evento hijo HC y registrar historia_clinica
  -- ============================================================

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
    creado_por_user_id, country_code,
    datos
  ) VALUES (
    v_mascota_id, 'historia_clinica_registrada', 'salud', now(),
    v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
    auth.uid(), v_country_code,
    jsonb_build_object('cita_id', v_cita_id)
  )
  RETURNING id INTO v_evento_hc_id;

  INSERT INTO evento_historia_clinica_registrada (
    cita_id, mascota_id, prestador_id, veterinario_user_id, empleado_id, evento_id, country_code,
    motivo_consulta, anamnesis,
    peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal,
    examen_fisico, diagnostico_principal, cie_codigo, diagnosticos_secundarios,
    tratamiento, indicaciones,
    requiere_hospitalizacion, requiere_cirugia,
    completado_en
  ) VALUES (
    v_cita_id, v_mascota_id, v_prestador_id, auth.uid(), v_empleado_id, v_evento_hc_id, v_country_code,
    input_data->>'motivo_consulta',
    input_data->>'anamnesis',
    (input_data->>'peso_kg')::numeric,
    (input_data->>'temperatura_c')::numeric,
    (input_data->>'frecuencia_cardiaca')::int,
    (input_data->>'frecuencia_respiratoria')::int,
    (input_data->>'condicion_corporal')::int,
    input_data->>'examen_fisico',
    input_data->>'diagnostico_principal',
    input_data->>'cie_codigo',
    COALESCE(input_data->'dx_secundarios', '[]'::jsonb),
    input_data->>'tratamiento',
    input_data->>'indicaciones',
    (input_data->>'requiere_hospitalizacion')::boolean,
    (input_data->>'requiere_cirugia')::boolean,
    now()
  )
  RETURNING id INTO v_historia_id;

  -- ============================================================
  -- 6.5. Si la HC trae peso_kg > 0, crear sub-evento peso_medicion
  -- (NUEVO — fix D-107: dispara trigger _trg_peso_propagar_perfil que
  --  actualiza mascota_perfil_vigente.peso_clinico_kg)
  -- ============================================================

  v_peso_kg := (input_data->>'peso_kg')::numeric;

  IF v_peso_kg IS NOT NULL AND v_peso_kg > 0 THEN
    -- Default 'bascula_clinica' para flujo de cita vet; permite override por input.
    v_metodo_peso := COALESCE(input_data->>'metodo_peso', 'bascula_clinica');

    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'peso_medicion', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'peso_kg', v_peso_kg,
        'metodo', v_metodo_peso
      )
    )
    RETURNING id INTO v_evento_peso_id;

    INSERT INTO evento_peso_medicion (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      peso_kg, metodo_medicion, fecha_medicion
    ) VALUES (
      v_evento_peso_id, v_mascota_id, v_prestador_id, v_empleado_id, v_country_code,
      v_peso_kg, v_metodo_peso, now()
    );
  END IF;

  -- ============================================================
  -- 7. Insertar recetas: sub-evento + tipada + frecuencia
  -- ============================================================

  v_orden := 1;
  FOR v_receta IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'recetas', '[]'::jsonb))
  LOOP
    -- Evento hijo para esta receta
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'medicacion_prescrita', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'medicamento', v_receta->>'nombre_medicamento'
      )
    )
    RETURNING id INTO v_evento_receta_id;

    -- Tipada
    INSERT INTO evento_medicacion_prescrita (
      cita_id, mascota_id, prestador_id, empleado_id, evento_id, country_code,
      nombre_medicamento, dosis, frecuencia,
      concentracion, principio_activo, forma_farmaceutica,
      via_administracion, duracion_dias, indicaciones_especiales,
      orden
    ) VALUES (
      v_cita_id, v_mascota_id, v_prestador_id, v_empleado_id, v_evento_receta_id, v_country_code,
      v_receta->>'nombre_medicamento',
      v_receta->>'dosis',
      v_receta->>'frecuencia',
      v_receta->>'concentracion',
      v_receta->>'principio_activo',
      v_receta->>'forma_farmaceutica',
      v_receta->>'via_administracion',
      (v_receta->>'duracion_dias')::int,
      v_receta->>'indicaciones_especiales',
      v_orden
    );

    -- Upsert en recetas frecuentes (funcionalidad útil preservada)
    INSERT INTO prestador_recetas_frecuentes (
      prestador_id, country_code,
      nombre_medicamento, dosis, frecuencia,
      concentracion, principio_activo, forma_farmaceutica,
      via_administracion, duracion_dias, indicaciones_especiales,
      contador_uso, ultima_vez_usada, activa, creada_manualmente
    ) VALUES (
      v_prestador_id, v_country_code,
      v_receta->>'nombre_medicamento',
      v_receta->>'dosis',
      v_receta->>'frecuencia',
      v_receta->>'concentracion',
      v_receta->>'principio_activo',
      v_receta->>'forma_farmaceutica',
      v_receta->>'via_administracion',
      (v_receta->>'duracion_dias')::int,
      v_receta->>'indicaciones_especiales',
      1, now(), true, false
    )
    ON CONFLICT ON CONSTRAINT prestador_receta_frecuente_unique
    DO UPDATE SET
      contador_uso     = prestador_recetas_frecuentes.contador_uso + 1,
      ultima_vez_usada = now();

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 8. Insertar exámenes: sub-evento + tipada
  -- ============================================================

  v_orden := 1;
  FOR v_examen IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'examenes', '[]'::jsonb))
  LOOP
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'examen_diagnostico', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'tipo_examen', v_examen->>'tipo_examen'
      )
    )
    RETURNING id INTO v_evento_examen_id;

    INSERT INTO evento_examen_diagnostico (
      cita_id, mascota_id, prestador_id, empleado_id, evento_id, country_code,
      tipo_examen, descripcion, urgencia,
      indicaciones_preparacion, estado, orden
    ) VALUES (
      v_cita_id, v_mascota_id, v_prestador_id, v_empleado_id, v_evento_examen_id, v_country_code,
      v_examen->>'tipo_examen',
      v_examen->>'descripcion',
      COALESCE(v_examen->>'urgencia', 'rutina'),
      v_examen->>'indicaciones_preparacion',
      'solicitado',
      v_orden
    );

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 9. Insertar archivos: sub-evento + tipada
  -- ============================================================

  v_orden := 1;
  FOR v_archivo IN
    SELECT value FROM jsonb_array_elements(COALESCE(input_data->'archivos', '[]'::jsonb))
  LOOP
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento,
      evento_padre_id, cuenta_comercial_id, prestador_id, empleado_id,
      creado_por_user_id, country_code,
      datos
    ) VALUES (
      v_mascota_id, 'archivo_adjunto', 'salud', now(),
      v_evento_padre_id, NULL, v_prestador_id, v_empleado_id,
      auth.uid(), v_country_code,
      jsonb_build_object(
        'cita_id', v_cita_id,
        'categoria', COALESCE(v_archivo->>'categoria', 'otro'),
        'nombre_archivo', v_archivo->>'nombre_archivo'
      )
    )
    RETURNING id INTO v_evento_archivo_id;

    INSERT INTO evento_archivo_adjunto (
      mascota_id, prestador_id, empleado_id, country_code,
      bucket, storage_path, nombre_archivo,
      categoria, mime_type, tamano_bytes, descripcion,
      subido_por_user_id,
      evento_padre_id, evento_id,
      orden
    ) VALUES (
      v_mascota_id, v_prestador_id, v_empleado_id, v_country_code,
      COALESCE(v_archivo->>'bucket', 'cita-archivos'),
      v_archivo->>'storage_path',
      v_archivo->>'nombre_archivo',
      COALESCE(v_archivo->>'categoria', 'otro'),
      v_archivo->>'mime_type',
      (v_archivo->>'tamano_bytes')::bigint,
      v_archivo->>'descripcion',
      auth.uid(),
      v_evento_hc_id,
      v_evento_archivo_id,
      v_orden
    );

    v_orden := v_orden + 1;
  END LOOP;

  -- ============================================================
  -- 10. Retornar ID de la historia clínica creada
  -- ============================================================

  RETURN v_historia_id;
END;
$function$
;

-- ─── CINTURÓN — con DISCRIMINADOR y control positivo ───────────────────
DO $cinturon$
DECLARE v_ok boolean;
BEGIN
  -- El guard está en el cuerpo VIVO, no en un comentario. Se mira el cuerpo
  -- SIN comentarios (L-170: un censo sobre prosrc los lee como código).
  SELECT regexp_replace(p.prosrc, '--[^\n]*', '', 'g') ILIKE '%nota_sin_diagnostico%'
    INTO v_ok
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='completar_historia_clinica';
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON: el guard no quedó en el cuerpo vivo de completar_historia_clinica';
  END IF;

  -- CONTROL POSITIVO: el productor VIVO sigue exigiéndolo. Si esta
  -- migración lo hubiera roto de rebote, el rojo sale acá.
  SELECT regexp_replace(p.prosrc, '--[^\n]*', '', 'g') ILIKE '%nota_sin_diagnostico%'
    INTO v_ok
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='sedimentar_nota_clinica';
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON: el productor VIVO perdió su guard de diagnóstico';
  END IF;

  -- Y la firma no se movió (no hay sobrecarga nueva).
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='completar_historia_clinica') <> 1 THEN
    RAISE EXCEPTION 'CINTURON L-119: quedó más de una firma de completar_historia_clinica';
  END IF;

  RAISE NOTICE 'CINTURON OK — los DOS productores exigen diagnóstico, una sola firma';
END
$cinturon$;

COMMIT;

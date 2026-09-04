/* ═══════════════════════════════════════════════════════════════════════════
   S113-A · lote 0 «Nexo despierta» — MODO_CAPTURA EN LAS DOS IA QUE YA EXISTEN
   Migración 20260908960000 · reversa: docs/loop/S113-A-REVERSA-20260908960000.sql
   (escrita ANTES de aplicar)

   ── EL ROJO DE PARTIDA, medido en la base viva (no en archivos) ────────────
     SELECT modo_captura, count(*) FROM eventos_mascota GROUP BY 1;
       NULL          564
       automatico      2
     ⇒ CERO 'extraido_por_ia', CERO 'dictado', CERO 'tecleado'.
     La columna existe y ninguna pieza de IA la escribe.

   ── LO QUE SE MIDIÓ ANTES DE DECIDIR (pg_proc / pg_policies / pg_trigger) ──
   ① CHECK vivo: modo_captura IS NULL OR ∈ (tecleado, dictado, extraido_por_ia,
      automatico).  [eventos_mascota_modo_captura_check]
   ② `registrar_vacunas_de_carnet(uuid, jsonb, text)` — **INVOKER**. NO inserta
      en `eventos_mascota`: inserta en `evento_vacuna_aplicada` y el trigger
      BEFORE INSERT `trg_vacuna_crear_evento` crea el padre.
   ③ `sedimentar_nota_clinica(...7 args)` — **DEFINER**. Tampoco toca
      `eventos_mascota`: crea sus 1..N padres con `_crear_padre_constelacion`.
   ④ Los dos caminos desembocan en `_crear_evento_padre_auto`, que tiene
      **19 consumidores** (17 triggers + `abrir_caso_clinico` +
      `sedimentar_nota_clinica`).
   ⑤ `eventos_mascota`: RLS = true, con policies de SELECT e INSERT
      y **NINGUNA de UPDATE**.

   ── POR QUÉ EL DISEÑO ES ÉSTE, Y NO EL OBVIO ───────────────────────────────
   El camino obvio era ensanchar `_crear_evento_padre_auto` con
   `p_modo_captura text DEFAULT NULL` y escribir el modo AL NACER. **No se
   hizo, y la razón se midió**: en Postgres un parámetro con DEFAULT NO
   reemplaza la función — la SOBRECARGA. Las llamadas de 11 argumentos de los
   19 consumidores quedarían AMBIGUAS. La casa ya pagó esa lección (L-119) y
   la salida sería DROPear la puerta de 19 consumidores dentro de una
   migración cuyo objetivo es otro. **Una migración que hace cirugía de firma
   sobre la puerta central para escribir una columna de metadato está
   cambiando su propio alcance.**

   ⇒ Un solo mecanismo para los dos caminos: `_marcar_modo_captura_evento`,
   DEFINER, angosta (una columna, NULL→valor, jamás pisa), que re-chequea el
   acceso con `user_tiene_acceso_a_mascota` — **el MISMO predicado que la
   policy de INSERT de `eventos_mascota`** (medido literal). Ese predicado
   cubre las tres patas: dueño, familia y prestador con acceso vigente, así
   que sirve para el camino de la familia (carnet) Y para el del vet (nota).

   🔴 LA SUPERFICIE QUE ABRE, DECLARADA: `_marcar_modo_captura_evento` queda
   ejecutable por `authenticated`. Eso permite que alguien marque **eventos
   propios** con cualquiera de los cuatro valores del vocabulario. Es una
   afirmación sobre CÓMO capturó SU dato, sobre eventos que ya son suyos, y
   sólo donde hoy hay NULL. No alcanza eventos ajenos (rebota por el
   predicado) ni pisa una marca existente. Se declara acá para que nadie la
   descubra después.

   ── 76(g) VEDA DE ESCRITURA: **NO RIGE** ────────────────────────────────────
   Cero backfill. Los 564 nulos se quedan como están: un evento viejo no sabe
   cómo se capturó, y **inventarlo sería exactamente el dato que esta columna
   existe para no tener**. No hay ancla que congelar.

   ── FUERA DE ALCANCE, dicho para que no se lea como olvido ─────────────────
   · `registrar_vacuna_mostrador` (DEFINER, el otro productor de vacunas)
     sigue sin declarar modo. Es una persona tecleando en un mostrador; la
     letra del lote no lo pide y ensanchar de paso es cómo se rompen cosas.
   · Los otros 16 triggers de evento siguen naciendo con modo_captura NULL.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══ ① EL MARCADOR — la única mutación autorizada de esa columna ═══════════ */
CREATE OR REPLACE FUNCTION public._marcar_modo_captura_evento(
  p_evento_ids uuid[],
  p_modo       text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_n int;
BEGIN
  IF p_modo IS NULL THEN RETURN 0; END IF;

  -- Vocabulario CERRADO, espejo literal del CHECK de la tabla. Se valida acá
  -- para que el rebote tenga NOMBRE y no llegue como un 23514 crudo.
  IF p_modo NOT IN ('tecleado','dictado','extraido_por_ia','automatico') THEN
    RAISE EXCEPTION 'modo_captura_invalido' USING ERRCODE = '22023';
  END IF;

  IF p_evento_ids IS NULL OR array_length(p_evento_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  /* DEFINER, así que el gate va ACÁ ADENTRO y es el mismo que la policy de
     INSERT de eventos_mascota (L-167: una DEFINER salta la RLS, así que su
     puerta la escribe ella o no la tiene).
     `modo_captura IS NULL` no es prolijidad: **una marca no se pisa** — cómo
     se capturó un hecho es un hecho, no una preferencia. */
  UPDATE eventos_mascota e
     SET modo_captura = p_modo
   WHERE e.id = ANY(p_evento_ids)
     AND e.modo_captura IS NULL
     AND public.user_tiene_acceso_a_mascota(e.mascota_id);

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$fn$;

REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) FROM anon;
GRANT EXECUTE ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) TO authenticated;

/* ═══ ② EL CARNET — siempre extracción por IA ═══════════════════════════════ */
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
  v_evento         uuid;
  v_ids            uuid[] := '{}';
  v_archivo        text;
  v_evs            uuid[] := '{}';   -- S113-A
  v_marcados       int;
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
      if v_fecha_aplicada > public.hoy_local() then
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
    returning id, evento_id into v_id, v_evento;

    v_ids := v_ids || v_id;
    v_evs := v_evs || v_evento;
  end loop;

  /* ═══ S113-A · LA MARCA DE ESTE CAMINO ═══════════════════════════════════
     Sin parámetro: por acá SIEMPRE se entra desde la extracción del carnet
     por IA. No hay otro llamador — medido: los productores SQL de
     `evento_vacuna_aplicada` son DOS (`registrar_vacuna_mostrador`, DEFINER,
     y esta), y el mostrador no pasa por acá.

     🔴 POR QUÉ NO ES UN `UPDATE` ACÁ ADENTRO: esta función es INVOKER y
     `eventos_mascota` tiene RLS con policies de SELECT e INSERT y **ninguna
     de UPDATE** (medido en `pg_policies`). Un UPDATE desde acá afectaría
     CERO filas y devolvería ok igual: verde falso perfecto. Por eso la marca
     pasa por `_marcar_modo_captura_evento`, que es DEFINER, re-chequea el
     acceso con el MISMO predicado que la policy de INSERT, y devuelve
     cuántas marcó — y acá se ASSERTEA contra las que se insertaron. */
  v_marcados := public._marcar_modo_captura_evento(v_evs, 'extraido_por_ia');
  if v_marcados <> coalesce(array_length(v_ids, 1), 0) then
    raise exception 'marca_incompleta: marcó % de %', v_marcados, coalesce(array_length(v_ids,1),0);
  end if;

  return jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'insertadas', coalesce(array_length(v_ids, 1), 0),
    'ids', to_jsonb(v_ids),
    'archivo_url', v_archivo
  );
end;
$function$
;

/* ═══ ③ LA NOTA CLÍNICA — el modo lo dice quien la capturó ══════════════════
   La de 7 argumentos MUERE. No se puede convivir: un parámetro con DEFAULT
   sobrecarga y las llamadas de 7 quedarían ambiguas (L-119, otra vez).
   Sin `p_modo_captura` el comportamiento es EXACTAMENTE el de hoy: NULL. */
DROP FUNCTION IF EXISTS public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text);
CREATE OR REPLACE FUNCTION public.sedimentar_nota_clinica(p_cita_id uuid, p_cuenta_comercial_id uuid, p_empleado_id uuid, p_mascota_id uuid, p_nota jsonb, p_caso jsonb DEFAULT NULL::jsonb, p_country_code text DEFAULT 'EC'::text, p_modo_captura text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_prestador uuid;
  v_desenlace text;
  v_cita_evento uuid;
  v_caso_id uuid;
  v_caso_modo text;
  v_ev_hc uuid;
  v_ev uuid;
  v_motivo text; v_diag text;
  v_vitales jsonb;
  v_peso numeric;
  v_item jsonb; v_ex text;
  v_n_med int := 0; v_n_ex int := 0; v_n_cond int := 0; v_n_alg int := 0;
  v_peso_medido boolean := false;
  v_prox date;
  v_idx int;
  v_evs uuid[] := '{}';          -- S113-A: los eventos de ESTA constelación
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_cita_id IS NULL THEN RAISE EXCEPTION 'cita_requerida' USING ERRCODE = '22023'; END IF;
  /* S113-A · modo_captura. Vocabulario CERRADO, espejo literal del CHECK
     `eventos_mascota_modo_captura_check` (medido en la base viva antes de
     escribir esto). NULL es legítimo y es el comportamiento de SIEMPRE: la
     pantalla que todavía no lo manda se comporta exactamente igual que ayer. */
  IF p_modo_captura IS NOT NULL
     AND p_modo_captura NOT IN ('tecleado','dictado','extraido_por_ia','automatico') THEN
    RAISE EXCEPTION 'modo_captura_invalido' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM evento_historia_clinica_registrada WHERE cita_id = p_cita_id) THEN
    RAISE EXCEPTION 'hc_ya_existe' USING ERRCODE = '22023';   -- UNIQUE(cita_id): una HC por cita
  END IF;

  v_motivo := NULLIF(trim(COALESCE(p_nota->>'motivo','')), '');
  v_diag   := NULLIF(trim(COALESCE(p_nota->>'diagnostico','')), '');
  IF v_motivo IS NULL THEN RAISE EXCEPTION 'nota_sin_motivo' USING ERRCODE = '22023'; END IF;
  /* ═══ EL DESENLACE ═══════════════════════════════════════════════════════
     Vocabulario CERRADO y mínimo: `resuelto` · `derivacion`. **No se inventa
     más de lo que la mesa firmó** — un vocabulario cerrado no se amplía de
     paso. `NULL` es legítimo: las consultas anteriores no lo declararon, y
     para ellas rige el guard estricto de siempre. */
  v_desenlace := NULLIF(trim(COALESCE(p_nota->>'desenlace','')), '');
  IF v_desenlace IS NOT NULL AND v_desenlace NOT IN ('resuelto','derivacion') THEN
    RAISE EXCEPTION 'desenlace_invalido' USING ERRCODE = '22023';
  END IF;

  /* 🔴 EL GUARD DEL DIAGNÓSTICO ERA MÁS ANCHO QUE SU LETRA.
     Citaba al abogado, pero **el abogado dijo «antes de EMITIR»** —una receta—
     y el guard estaba en CERRAR LA CONSULTA. ⇒ el vet que concluye *«necesita
     visita presencial»* quedaba atrapado: *le exigían el diagnóstico que
     precisamente no puede dar.*
     Se acota, **sin ablandar el límite legal**: la excepción es UNA y sólo
     cuando la conclusión es DERIVACIÓN. */
  IF v_diag IS NULL AND v_desenlace IS DISTINCT FROM 'derivacion' THEN
    RAISE EXCEPTION 'nota_sin_diagnostico' USING ERRCODE = '22023';
  END IF;

  /* 🔴 Y EL LÍMITE SE CUMPLE DONDE FUE ESCRITO: una consulta DERIVADA SIN
     diagnóstico **no puede emitir receta.** *Ablandar el cierre sin cerrar la
     emisión habría movido el agujero de lugar en vez de taparlo* — que es
     exactamente lo que la enmienda vino a evitar. */
  IF v_diag IS NULL
     AND jsonb_array_length(COALESCE(p_nota->'formula','[]'::jsonb)) > 0 THEN
    RAISE EXCEPTION 'derivacion_no_emite_receta' USING ERRCODE = '22023';
  END IF;

  -- prestador (por empleado, si no primero de la cuenta) — tipadas exigen NOT NULL
  SELECT pe.prestador_id INTO v_prestador FROM prestador_empleados pe WHERE pe.id = p_empleado_id;
  IF v_prestador IS NULL THEN
    SELECT id INTO v_prestador FROM prestadores WHERE cuenta_comercial_id = p_cuenta_comercial_id ORDER BY created_at LIMIT 1;
  END IF;
  IF v_prestador IS NULL THEN RAISE EXCEPTION 'cuenta_sin_prestador' USING ERRCODE = '22023'; END IF;
  -- S75-A31 D-490 fase 2: gate de ROL por la puerta unica (empleado_tiene_rol).
  -- El escritor DEFINER salta la RLS; sin esto, recepcion firma clinico.
  -- COALESCE (A42, pre-aprobado): un NULL en el guard pasaria en silencio
  -- (IF NOT NULL no dispara) — se fuerza a false por si acaso.
  IF NOT COALESCE(public.empleado_tiene_capacidad_clinica(v_prestador), false) THEN
    RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
  END IF;

  -- E3: el evento 'cita_servicio' de la cita (puede ser NULL en citas de presupuesto)
  SELECT evento_id INTO v_cita_evento FROM evento_cita_servicio WHERE id = p_cita_id;

  v_prox := NULLIF(p_nota->>'proximo_control','')::date;

  -- CASO: 'nuevo' | {caso_id} | null
  v_caso_modo := p_caso->>'modo';
  IF v_caso_modo = 'nuevo' THEN
    v_caso_id := public.abrir_caso_clinico(
      p_mascota_id, p_caso->>'condicion', p_cuenta_comercial_id, p_empleado_id,
      COALESCE(NULLIF(p_caso->>'horizonte','')::timestamptz, (v_prox + time '00:00')::timestamptz),
      NULL, p_country_code);
  ELSIF v_caso_modo = 'existente' THEN
    v_caso_id := (p_caso->>'caso_id')::uuid;
    IF NOT public._user_clinica_tratante_del_caso(v_caso_id, v_uid) THEN
      RAISE EXCEPTION 'no_es_tratante' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_caso_id := NULL;
  END IF;

  v_vitales := COALESCE(p_nota->'vitales', '{}'::jsonb);
  v_peso := NULLIF(v_vitales->>'peso_kg','')::numeric;

  -- ── HC (narrativa + vitales medidos) ──
  v_ev_hc := public._crear_padre_constelacion(
    p_mascota_id, 'historia_clinica_registrada', v_prestador, p_empleado_id, v_uid,
    p_country_code, jsonb_build_object('cita_id', p_cita_id, 'diagnostico_principal', v_diag,
      'proximo_control', v_prox), v_cita_evento);
  v_evs := v_evs || v_ev_hc;

  INSERT INTO evento_historia_clinica_registrada (
    evento_id, cita_id, mascota_id, prestador_id, veterinario_user_id, empleado_id, country_code,
    motivo_consulta, anamnesis, examen_fisico, diagnostico_principal, cie_codigo,
    tratamiento, indicaciones, diagnosticos_secundarios,
    peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal,
    requiere_hospitalizacion, requiere_cirugia, caso_clinico_id, desenlace
  ) VALUES (
    v_ev_hc, p_cita_id, p_mascota_id, v_prestador, v_uid, p_empleado_id, p_country_code,
    v_motivo,
    NULLIF(trim(COALESCE(p_nota->>'anamnesis','')),''),
    NULLIF(trim(COALESCE(p_nota->>'examen','')),''),
    v_diag,
    NULLIF(trim(COALESCE(p_nota->>'cie_codigo','')),''),
    NULLIF(trim(COALESCE(p_nota->>'plan_terapeutico','')),''),
    NULLIF(trim(COALESCE(p_nota->>'indicaciones','')),''),
    COALESCE(p_nota->'diagnosticos_secundarios', '[]'::jsonb),
    v_peso,
    NULLIF(v_vitales->>'temperatura_c','')::numeric,
    NULLIF(v_vitales->>'frecuencia_cardiaca','')::int,
    NULLIF(v_vitales->>'frecuencia_respiratoria','')::int,
    NULLIF(v_vitales->>'condicion_corporal','')::int,
    COALESCE((p_nota->>'requiere_hospitalizacion')::boolean, false),
    COALESCE((p_nota->>'requiere_cirugia')::boolean, false),
    v_caso_id, v_desenlace
  );

  -- ── PESO medido → evento propio (propaga peso_clinico al perfil) ──
  IF v_peso IS NOT NULL THEN
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'peso_medicion', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('peso_kg', v_peso), v_cita_evento);
  v_evs := v_evs || v_ev;
    INSERT INTO evento_peso_medicion (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      peso_kg, metodo_medicion, fecha_medicion
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_peso, COALESCE(NULLIF(v_vitales->>'peso_metodo',''), 'bascula_clinica'), now()
    );
    v_peso_medido := true;
  END IF;

  -- ── N × MEDICACIÓN PRESCRITA (dosis/frecuencia CONFIRMADAS, guard tipado) ──
  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'formula','[]'::jsonb)) LOOP
    v_idx := v_idx + 1;
    IF NULLIF(trim(COALESCE(v_item->>'nombre','')),'') IS NULL THEN
      RAISE EXCEPTION 'medicamento_sin_nombre: %', v_idx USING ERRCODE = '22023';
    END IF;
    IF NULLIF(trim(COALESCE(v_item->>'dosis','')),'') IS NULL
       OR NULLIF(trim(COALESCE(v_item->>'frecuencia','')),'') IS NULL THEN
      RAISE EXCEPTION 'posologia_incompleta: %', v_idx USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'medicacion_prescrita', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('medicamento', v_item->>'nombre', 'cita_id', p_cita_id),
      v_cita_evento);
  v_evs := v_evs || v_ev;
    INSERT INTO evento_medicacion_prescrita (
      evento_id, cita_id, mascota_id, prestador_id, empleado_id, country_code,
      nombre_medicamento, principio_activo, concentracion, forma_farmaceutica,
      dosis, frecuencia, duracion_dias, via_administracion, indicaciones_especiales,
      cantidad, orden, caso_clinico_id
    ) VALUES (
      v_ev, p_cita_id, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'nombre',
      NULLIF(trim(COALESCE(v_item->>'principio_activo','')),''),
      NULLIF(trim(COALESCE(v_item->>'concentracion','')),''),
      NULLIF(trim(COALESCE(v_item->>'presentacion','')),''),
      v_item->>'dosis', v_item->>'frecuencia',
      NULLIF(v_item->>'duracion_dias','')::int,
      NULLIF(trim(COALESCE(v_item->>'via','')),''),
      NULLIF(trim(COALESCE(v_item->>'indicaciones','')),''),
      NULLIF(v_item->>'cantidad','')::numeric,
      v_idx, v_caso_id
    );
    v_n_med := v_n_med + 1;
  END LOOP;

  -- ── N × EXAMEN DIAGNÓSTICO estado 'solicitado' (el plan diagnóstico) ──
  v_idx := 0;
  FOR v_ex IN SELECT jsonb_array_elements_text(COALESCE(p_nota->'plan_diagnostico','[]'::jsonb)) LOOP
    v_idx := v_idx + 1;
    IF NULLIF(trim(v_ex),'') IS NULL THEN CONTINUE; END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'examen_diagnostico', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('tipo_examen', v_ex, 'cita_id', p_cita_id), v_cita_evento);
  v_evs := v_evs || v_ev;
    INSERT INTO evento_examen_diagnostico (
      evento_id, cita_id, mascota_id, prestador_id, empleado_id, country_code,
      tipo_examen, estado, urgencia, orden, caso_clinico_id
    ) VALUES (
      v_ev, p_cita_id, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_ex, 'solicitado', 'rutina', v_idx, v_caso_id
    );
    v_n_ex := v_n_ex + 1;
  END LOOP;

  -- ── CONDICIÓN CRÓNICA — SOLO si el vet la marcó explícita ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'condiciones_cronicas','[]'::jsonb)) LOOP
    IF NULLIF(trim(COALESCE(v_item->>'condicion','')),'') IS NULL THEN
      RAISE EXCEPTION 'condicion_sin_nombre' USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'condicion_cronica_diagnosticada', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('condicion', v_item->>'condicion'), v_cita_evento);
  v_evs := v_evs || v_ev;
    INSERT INTO evento_condicion_cronica_diagnosticada (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      condicion, cie_codigo, fecha_diagnostico, diagnostico_descripcion,
      manejo_actual, seguimiento_recomendado, estado, caso_clinico_id
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'condicion',
      NULLIF(trim(COALESCE(v_item->>'cie_codigo','')),''),
      COALESCE(NULLIF(v_item->>'fecha_diagnostico','')::date, (now() AT TIME ZONE 'America/Guayaquil')::date),
      NULLIF(trim(COALESCE(v_item->>'diagnostico_descripcion','')),''),
      NULLIF(trim(COALESCE(v_item->>'manejo_actual','')),''),
      NULLIF(trim(COALESCE(v_item->>'seguimiento_recomendado','')),''),
      COALESCE(NULLIF(v_item->>'estado',''), 'activa'), v_caso_id
    );
    v_n_cond := v_n_cond + 1;
  END LOOP;

  -- ── ALERGIA — SOLO si el vet la marcó explícita ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_nota->'alergias','[]'::jsonb)) LOOP
    IF NULLIF(trim(COALESCE(v_item->>'alergeno','')),'') IS NULL THEN
      RAISE EXCEPTION 'alergia_sin_alergeno' USING ERRCODE = '22023';
    END IF;
    IF NULLIF(trim(COALESCE(v_item->>'severidad','')),'') IS NULL THEN
      RAISE EXCEPTION 'alergia_sin_severidad' USING ERRCODE = '22023';
    END IF;
    v_ev := public._crear_padre_constelacion(
      p_mascota_id, 'alergia_diagnosticada', v_prestador, p_empleado_id, v_uid,
      p_country_code, jsonb_build_object('alergeno', v_item->>'alergeno'), v_cita_evento);
  v_evs := v_evs || v_ev;
    INSERT INTO evento_alergia_diagnosticada (
      evento_id, mascota_id, prestador_id, empleado_id, country_code,
      alergeno, categoria_alergeno, severidad, reaccion_descripcion,
      fecha_diagnostico, metodo_diagnostico, manejo_recomendado, estado, caso_clinico_id
    ) VALUES (
      v_ev, p_mascota_id, v_prestador, p_empleado_id, p_country_code,
      v_item->>'alergeno',
      NULLIF(trim(COALESCE(v_item->>'categoria_alergeno','')),''),
      v_item->>'severidad',
      NULLIF(trim(COALESCE(v_item->>'reaccion_descripcion','')),''),
      COALESCE(NULLIF(v_item->>'fecha_diagnostico','')::date, (now() AT TIME ZONE 'America/Guayaquil')::date),
      NULLIF(trim(COALESCE(v_item->>'metodo_diagnostico','')),''),
      NULLIF(trim(COALESCE(v_item->>'manejo_recomendado','')),''),
      COALESCE(NULLIF(v_item->>'estado',''), 'confirmada'), v_caso_id
    );
    v_n_alg := v_n_alg + 1;
  END LOOP;

  /* S113-A · LA MARCA. Un solo acto al final, sobre TODA la constelación:
     el peso, la fórmula y los exámenes salieron del MISMO dictado que la
     narrativa — marcar sólo la HC diría que el resto se capturó de otro
     modo, y eso sería falso. Se declara: la letra pidió "el evento"; acá
     son los N de la constelación, por esa razón.
     `_marcar_modo_captura_evento` devuelve cuántos marcó; no se assertea el
     número porque un evento ya marcado (imposible hoy: nacen NULL) no es un
     error. Lo que sí importa es que no falle en silencio: si el modo fuera
     inválido, ya rebotó arriba. */
  IF p_modo_captura IS NOT NULL THEN
    PERFORM public._marcar_modo_captura_evento(v_evs, p_modo_captura);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'evento_hc_id', v_ev_hc,
    'caso_id', v_caso_id,
    'medicaciones', v_n_med,
    'examenes', v_n_ex,
    'peso_medido', v_peso_medido,
    'condiciones', v_n_cond,
    'alergias', v_n_alg,
    'colgado_de_cita_evento', (v_cita_evento IS NOT NULL)
  );
END;
$function$
;

REVOKE ALL ON FUNCTION public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.sedimentar_nota_clinica(uuid, uuid, uuid, uuid, jsonb, jsonb, text, text) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   EL CINTURÓN — ROJO ANTES QUE VERDE, POR LOS DOS CAMINOS
   Todo corre en una SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406):
   `sedimentar_nota_clinica` escribe historia clínica REAL sobre una cita
   REAL, y un arnés que para probar el circuito lo ejecuta de verdad es un
   arnés que hace lo que vino a vigilar.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  -- datos VIVOS, medidos antes de escribir esta migración (sin PII: ids)
  k_masc_fam   uuid := '73c381cc-9f7c-4b82-91f6-a415c8b1676f';  -- mascota con titular
  k_titular    uuid := '632727a3-9682-4fa7-b569-19a6399736ff';  -- su user_id
  k_cita_a     uuid := '3bc4c5fd-0571-4811-ac2b-75f1c34dc236';  -- cita vet sin HC
  k_cita_b     uuid := '9be02bfd-77b0-4f2f-b0d6-96a5354968af';  -- otra, sin HC
  k_masc_a     uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  k_masc_b     uuid := '0cb414c8-1edf-40de-821a-2efec7435f80';
  k_cc         uuid := 'de680000-0000-4000-8000-0000000000cc';
  k_vet        uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_n          int;
  v_ev_directo uuid;
  v_modo       text;
  v_res        jsonb;
  v_rebote     text;
BEGIN
  BEGIN   -- ← subtransacción; al final se aborta a propósito

  /* ── ⓪ CONTROL POSITIVO: los datos del arnés existen ───────────────────── */
  IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id=k_masc_fam AND user_id=k_titular) THEN
    RAISE EXCEPTION 'ARNES: la mascota/titular del fixture ya no existe — re-medir';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM evento_cita_servicio WHERE id=k_cita_a) THEN
    RAISE EXCEPTION 'ARNES: la cita A del fixture ya no existe — re-medir';
  END IF;

  /* ── ① SOBRECARGAS: sedimentar_nota_clinica tiene que ser UNA ───────────── */
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='sedimentar_nota_clinica';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ARNES sobrecargas: sedimentar_nota_clinica tiene % firmas, esperaba 1', v_n;
  END IF;

  /* ── ② L-140: la puerta nueva NO nace alcanzable por anon ni PUBLIC ─────── */
  IF has_function_privilege('anon', 'public._marcar_modo_captura_evento(uuid[], text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon puede ejecutar _marcar_modo_captura_evento';
  END IF;
  IF has_function_privilege('anon', 'public.sedimentar_nota_clinica(uuid,uuid,uuid,uuid,jsonb,jsonb,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon puede ejecutar sedimentar_nota_clinica';
  END IF;
  -- CONTROL POSITIVO del propio instrumento: authenticated SÍ puede.
  IF NOT has_function_privilege('authenticated', 'public._marcar_modo_captura_evento(uuid[], text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ARNES: authenticated no puede ejecutar el marcador — el gate mide mal';
  END IF;

  /* ═══ CAMINO 1 · EL CARNET ═══════════════════════════════════════════════ */
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_titular::text, 'role','authenticated')::text, true);

  /* 🔴 EL ROJO, y es el discriminador: la MISMA tabla, la MISMA mascota, el
     MISMO usuario — pero por fuera de la RPC. El trigger crea el evento y
     modo_captura queda NULL. Sin este brazo, el verde de abajo probaría
     igual con la marca desconectada. */
  INSERT INTO evento_vacuna_aplicada (mascota_id, nombre_vacuna, fecha_aplicada)
  VALUES (k_masc_fam, 'ARNES-S113-rojo', current_date)
  RETURNING evento_id INTO v_ev_directo;

  SELECT modo_captura INTO v_modo FROM eventos_mascota WHERE id = v_ev_directo;
  IF v_modo IS NOT NULL THEN
    RAISE EXCEPTION 'ARNES rojo carnet: inserción directa dejó modo_captura=%, esperaba NULL', v_modo;
  END IF;

  /* ✅ EL VERDE: por la RPC del carnet. */
  v_res := public.registrar_vacunas_de_carnet(
    k_masc_fam,
    '[{"nombre":"ARNES-S113-verde-1"},{"nombre":"ARNES-S113-verde-2"}]'::jsonb,
    NULL);

  IF (v_res->>'insertadas')::int <> 2 THEN
    RAISE EXCEPTION 'ARNES carnet: insertó %, esperaba 2', v_res->>'insertadas';
  END IF;

  SELECT count(*) INTO v_n
    FROM evento_vacuna_aplicada v JOIN eventos_mascota e ON e.id = v.evento_id
   WHERE v.nombre_vacuna LIKE 'ARNES-S113-verde-%'
     AND e.modo_captura = 'extraido_por_ia';
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'ARNES verde carnet: % de 2 eventos con extraido_por_ia', v_n;
  END IF;

  /* ═══ CAMINO 2 · LA NOTA CLÍNICA ═════════════════════════════════════════ */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_vet::text, 'role','authenticated')::text, true);

  /* 🔴 ROJO ①: un valor fuera del vocabulario REBOTA CON NOMBRE. */
  BEGIN
    PERFORM public.sedimentar_nota_clinica(
      k_cita_a, k_cc, NULL, k_masc_a,
      '{"motivo":"arnes","diagnostico":"arnes"}'::jsonb, NULL, 'EC', 'telepatia');
    RAISE EXCEPTION 'ARNES: modo inválido NO rebotó — el guard es decorativo';
  EXCEPTION WHEN sqlstate '22023' THEN
    GET STACKED DIAGNOSTICS v_rebote = MESSAGE_TEXT;
    IF v_rebote <> 'modo_captura_invalido' THEN
      RAISE EXCEPTION 'ARNES: rebotó por otra cosa: %', v_rebote;
    END IF;
  END;

  /* ✅ VERDE: 'dictado' llega a TODA la constelación (narrativa + peso). */
  v_res := public.sedimentar_nota_clinica(
    k_cita_a, k_cc, NULL, k_masc_a,
    '{"motivo":"arnes S113","diagnostico":"arnes S113","vitales":{"peso_kg":"9.4"}}'::jsonb,
    NULL, 'EC', 'dictado');

  SELECT modo_captura INTO v_modo FROM eventos_mascota WHERE id = (v_res->>'evento_hc_id')::uuid;
  IF v_modo IS DISTINCT FROM 'dictado' THEN
    RAISE EXCEPTION 'ARNES verde nota: la HC quedó en %, esperaba dictado', v_modo;
  END IF;
  IF (v_res->>'peso_medido')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ARNES: el fixture no produjo evento de peso — no mide la constelación';
  END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota
   WHERE mascota_id = k_masc_a AND tipo = 'peso_medicion' AND modo_captura = 'dictado';
  IF v_n < 1 THEN
    RAISE EXCEPTION 'ARNES: el peso de la constelación NO quedó marcado — la marca sólo tocó la HC';
  END IF;

  /* 🔴 ROJO ②: SIN el parámetro, el comportamiento es el de ayer — NULL. */
  v_res := public.sedimentar_nota_clinica(
    k_cita_b, k_cc, NULL, k_masc_b,
    '{"motivo":"arnes sin modo","diagnostico":"arnes sin modo"}'::jsonb, NULL, 'EC');

  SELECT modo_captura INTO v_modo FROM eventos_mascota WHERE id = (v_res->>'evento_hc_id')::uuid;
  IF v_modo IS NOT NULL THEN
    RAISE EXCEPTION 'ARNES: sin parámetro quedó %, esperaba NULL (cambio de comportamiento)', v_modo;
  END IF;

  SET LOCAL ROLE postgres;
  RAISE EXCEPTION 'ROLLBACK_ARNES_OK';

  EXCEPTION WHEN OTHERS THEN
    SET LOCAL ROLE postgres;
    IF SQLERRM = 'ROLLBACK_ARNES_OK' THEN
      RAISE NOTICE '✅ CINTURÓN S113-A VERDE — arnés deshecho, residuo 0';
    ELSE
      RAISE;
    END IF;
  END;
END;
$cinturon$;


/* ═══ NOTA DE APLICACIÓN — S113-A, dicha para que no se lea como magia ══════
   La PRIMERA corrida de este archivo llevaba `BEGIN;`/`COMMIT;` explícitos y
   cerraba el arnés con `RESET ROLE`. El cinturón dio VERDE y el DDL commiteó
   entero — y acto seguido el CLI falló al escribir su propia fila de ledger
   con `permission denied for schema supabase_migrations`.

   La causa, medida: el CLI fija su rol con un `SET ROLE` de SESIÓN al
   conectarse ("Initialising login role..."). `RESET ROLE` no vuelve a ESE rol:
   vuelve al rol de login subyacente, que no puede escribir el ledger. Y el
   `COMMIT;` propio cerraba la transacción del CLI antes de tiempo.

   ⇒ Curado a la convención de la casa, medida en las migraciones de S112:
   ninguna usa `BEGIN;`/`COMMIT;` (el CLI envuelve) y el arnés se cierra con
   `SET LOCAL ROLE postgres`, no con `RESET ROLE`.

   ⚠️ EL ARCHIVO DIFIERE DE LO QUE CORRIÓ, y se declara: el DDL es
   BYTE-IDÉNTICO —las tres piezas se verificaron en `pg_proc` después—; lo
   único que cambió es cómo el arnés devuelve el rol, y el arnés no persiste
   nada. La fila del ledger se registró con `migration repair --status applied`.
   ═══════════════════════════════════════════════════════════════════════════ */

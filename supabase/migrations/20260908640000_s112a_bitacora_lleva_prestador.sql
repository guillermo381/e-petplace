-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LA BITÁCORA DEL CUIDADOR LLEVA SU PRESTADOR EN LA COLUMNA
--
-- 🔴 **76(g) RIGE**: esta migración TIENE backfill. Anclas EXACTAS, medidas
-- antes de escribir — son las dos únicas filas con `origen='bitacora_guarderia'`
-- y `prestador_id IS NULL`, las que el founder cargó hoy 01:45 y 01:51:
--   8e10d1be-48d1-4c39-b9a3-0f2edb1070c7  → de680000…e5 (Clínica Aurora)
--   5405a614-e080-4903-b567-fc748a8ea3e9  → de680000…e5
-- El valor NO se inventa: sale de `datos->>'prestador_id'` de cada fila.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.registrar_bitacora_guarderia(p_estadia_id uuid, p_chips jsonb DEFAULT '[]'::jsonb, p_texto text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_prest     uuid;
  v_estado    text;
  v_masc      uuid;
  v_especie   text;
  v_sujeto    text;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento    uuid;
  v_bitacora  uuid;
  v_ya        boolean := false;
  v_chip      jsonb;
  v_codigo    text;
  v_tipo      text;
  v_n         int := 0;
  v_nuevos    int := 0;
BEGIN
  -- GATE: el prestador que gestiona esta estadía. Lanza solo si no.
  v_prest := public._guarderia_estadia_gestionable(p_estadia_id);

  SELECT g.estado, c.mascota_id INTO v_estado, v_masc
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.id = p_estadia_id;

  -- GUARD DE ESTADO TERMINAL. Rebota HABLADO y con el estado adentro: un guard
  -- que sólo sabe negarse manda a probar de nuevo algo que nunca va a andar.
  IF v_estado = ANY (ARRAY['cancelada','no_recogida','entregada']) THEN
    RAISE EXCEPTION 'estadia_terminal: %', v_estado USING ERRCODE = '22023',
      HINT = 'La estadia ya cerro. Sobre cancelada o no_recogida el animal nunca estuvo.';
  END IF;

  -- ≥1 chip o texto: registrar la nada no es una observación (espejo del de familia)
  IF (p_texto IS NULL OR length(btrim(p_texto)) = 0)
     AND (p_chips IS NULL OR jsonb_array_length(p_chips) = 0) THEN
    RAISE EXCEPTION 'bitacora_vacia' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code, m.especie, m.sujeto INTO v_country, v_especie, v_sujeto
    FROM mascotas m WHERE m.id = v_masc;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
    FROM cat_tipos_evento cte WHERE cte.codigo = 'bitacora_familia';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_bitacora_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- ── LA FILA: una por estadía. Si ya existe, se REUSA. ──────────────────
  SELECT b.id, b.evento_id INTO v_bitacora, v_evento
    FROM evento_bitacora_familia b WHERE b.estadia_id = p_estadia_id;

  IF v_bitacora IS NULL THEN
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id,
      /* 🔴 LA COLUMNA, NO SÓLO `datos`. Hasta S112-A el id del prestador
         viajaba **únicamente dentro de `datos`**, y la columna quedaba NULL.

         La procedencia SÍ estaba bien (`declarado_por_prestador`), así que el
         expediente no mentía sobre QUIÉN observó — *pero el dato vivía en el
         lugar donde casi nadie lo busca*: **60 funciones de la casa leen
         `eventos_mascota.prestador_id`** y ninguna mira `datos`.

         ⚠️ **La asimetría lo prueba mejor que cualquier argumento:** el otro
         acto de la MISMA pantalla, `publicar_media_guarderia`, llena la
         columna — **9 de 9 filas**. La bitácora: **0 de 2**. *Dos actos
         hermanos, el mismo cuidador, el mismo día, y forma opuesta.*

         Su modo de falla es el peor: **no hay error**. Una consulta por
         prestador simplemente no encuentra estas observaciones. */
      prestador_id,
      datos, visibilidad, country_code, procedencia
    ) VALUES (
      v_masc, 'bitacora_familia', v_eje, now(), auth.uid(),
      v_prest,
      jsonb_build_object('origen','bitacora_guarderia','estadia_id',p_estadia_id,
                         'prestador_id',v_prest,'aportado_por_menor',false),
      v_visib, COALESCE(v_country,'EC'),
      -- 🔴 EL TERCER NIVEL, y es el que hace honesto al expediente: quien
      -- observó fue el prestador. `verificado_por_prestador` sigue SIN
      -- productor y no se usa acá — esto es lo que él DECLARA haber visto.
      'declarado_por_prestador'
    ) RETURNING id INTO v_evento;

    INSERT INTO evento_bitacora_familia (
      evento_id, mascota_id, user_id, texto, aportado_por_menor, country_code, estadia_id
    ) VALUES (
      v_evento, v_masc, auth.uid(),
      NULLIF(btrim(COALESCE(p_texto,'')),''), false, COALESCE(v_country,'EC'), p_estadia_id
    ) RETURNING id INTO v_bitacora;
  ELSE
    v_ya := true;
    -- El texto se AGREGA, no se pisa: dos observaciones del día son dos, y
    -- pisar la primera perdería lo que el cuidador ya había escrito.
    IF p_texto IS NOT NULL AND length(btrim(p_texto)) > 0 THEN
      UPDATE evento_bitacora_familia
         SET texto = btrim(COALESCE(texto || E'\n', '') || btrim(p_texto))
       WHERE id = v_bitacora;
    END IF;
  END IF;

  -- ── LOS CHIPS, validados contra SU catálogo ────────────────────────────
  FOR v_chip IN SELECT * FROM jsonb_array_elements(COALESCE(p_chips,'[]'::jsonb))
  LOOP
    v_tipo   := COALESCE(v_chip ->> 'tipo', 'conducta');
    v_codigo := v_chip ->> 'codigo';
    IF v_tipo <> 'conducta' THEN
      RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_tipo,'NULL') USING ERRCODE='22023',
        HINT = 'La bitacora del prestador registra CONDUCTAS. Los objetivos son del adiestramiento.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM cat_conductas_bitacora c WHERE c.codigo=v_codigo AND c.activo) THEN
      RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_codigo,'NULL') USING ERRCODE='22023';
    END IF;
    -- LA PUERTA ÚNICA ES LA VERDAD, NO LA PANTALLA (espejo exacto del escritor
    -- de la familia): la superficie filtra para no OFRECER lo que no aplica; el
    -- motor lo RECHAZA para que no ENTRE.
    IF NOT EXISTS (
      SELECT 1 FROM cat_conductas_bitacora c
       WHERE c.codigo = v_codigo
         AND (c.especies_aplicables IS NULL OR v_especie = ANY(c.especies_aplicables))
         AND (c.sujetos_aplicables  IS NULL OR v_sujeto  = ANY(c.sujetos_aplicables))
    ) THEN
      RAISE EXCEPTION 'chip_no_aplica_a_la_mascota: %', COALESCE(v_codigo,'NULL')
        USING ERRCODE='22023';
    END IF;

    INSERT INTO evento_bitacora_chips (bitacora_id, chip_tipo, codigo)
    VALUES (v_bitacora, 'conducta', v_codigo)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN v_nuevos := v_nuevos + 1; END IF;
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'bitacoraId', v_bitacora, 'eventoId', v_evento,
    'estadiaId', p_estadia_id, 'yaExistia', v_ya,
    'chipsRecibidos', v_n, 'chipsNuevos', v_nuevos);
END $function$

;

-- ═══ EL BACKFILL — sólo las dos anclas, y el valor sale del DATO ═══
UPDATE eventos_mascota e
   SET prestador_id = (e.datos->>'prestador_id')::uuid
 WHERE e.tipo = 'bitacora_familia'
   AND e.datos->>'origen' = 'bitacora_guarderia'
   AND e.prestador_id IS NULL
   AND e.datos->>'prestador_id' IS NOT NULL;

-- ═══ CINTURÓN ═══
DO $c$
DECLARE v_faltan int; v_mal int; v_flia int;
BEGIN
  /* ① Ninguna bitácora de cuidador queda sin su prestador en la columna. */
  SELECT count(*) INTO v_faltan FROM eventos_mascota
   WHERE tipo='bitacora_familia' AND datos->>'origen'='bitacora_guarderia'
     AND prestador_id IS NULL;
  IF v_faltan > 0 THEN
    RAISE EXCEPTION 'CINTURON: quedan % bitacora(s) de cuidador sin prestador_id', v_faltan;
  END IF;

  /* ② La columna coincide con el dato — no se escribió otra cosa. */
  SELECT count(*) INTO v_mal FROM eventos_mascota
   WHERE tipo='bitacora_familia' AND datos->>'origen'='bitacora_guarderia'
     AND prestador_id::text <> datos->>'prestador_id';
  IF v_mal > 0 THEN
    RAISE EXCEPTION 'CINTURON: % fila(s) con columna distinta al dato', v_mal;
  END IF;

  /* ③ 🔴 EL CONTROL NEGATIVO, y es el que hace válido al positivo: la
     bitácora que escribe LA FAMILIA **sigue sin prestador**. Un backfill que
     hubiera llenado por tipo —y no por origen— les habría puesto un prestador
     a observaciones que la familia hizo sola. */
  SELECT count(*) INTO v_flia FROM eventos_mascota
   WHERE tipo='bitacora_familia'
     AND (datos->>'origen' IS DISTINCT FROM 'bitacora_guarderia')
     AND prestador_id IS NOT NULL;
  IF v_flia > 0 THEN
    RAISE EXCEPTION 'CINTURON: el backfill le puso prestador a % bitacora(s) DE LA FAMILIA', v_flia;
  END IF;

  /* ④ Y que la cura quedó en el CUERPO, no sólo en los datos (L-119). */
  IF (SELECT regexp_replace(prosrc,'/\*.*?\*/','','gs') FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='registrar_bitacora_guarderia')
     NOT LIKE '%prestador_id,%'
  THEN RAISE EXCEPTION 'CINTURON: la funcion sigue sin escribir la columna'; END IF;

  RAISE NOTICE 'CINTURON VERDE: cuidador CON prestador, familia SIN prestador';
END $c$;

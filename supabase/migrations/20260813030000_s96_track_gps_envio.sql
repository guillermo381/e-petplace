-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · M23 — EL GPS DEL REPARTIDOR: EL TRACK DEL ENVÍO (firma founder 13-ago)
--
-- La firma que mata D-770 de verdad: §9.5 estaba firmado en v1 y era lo único
-- sin construir. La elevación previa (2026-08-13-s96-a-elevacion-gps-repartidor.md)
-- midió que la captura de fondo se hereda ENTERA del paseo (track-gps-fondo.ts
-- + plugin horneado en el binario 1.0.5 ⇒ cero build); lo que faltaba es este
-- cableo del motor: dónde persiste el track y quién puede escribirlo.
--
-- LA FORMA DEL PUNTO ES LA DEL PASEO — {lat, lng, t} — y no la de la elevación
-- ({lat, lon, t}): el filtro de packages/domain, el dibujo y registrar_track_paseo
-- ya hablan `lng` (regla 22: el nombre se mide, y el objeto gana al documento).
-- Heredar la forma es lo que hace que "un repartidor moviéndose hacia una casa
-- = un paseador moviéndose con un perro" sea verdad de punta a punta.
--
-- LA VENTANA ES ESTRICTA: el track solo se escribe con el envío en
-- `hacia_destino`. Fuera de ventana rebota HABLADO (track_fuera_de_ventana) —
-- ni antes de salir ni después de entregar se fabrica recorrido. Contrato con
-- la pantalla (pista C): el flush final corre ANTES de llamar entregar_pedido.
--
-- El mapa en vivo de la familia sigue en v2 POR LETRA: esta tanda captura y
-- persiste; ninguna superficie de la familia lo dibuja en v1.
--
-- 76(g): NO RIGE — DDL + función nueva, sin backfill, sin anclas. El fixture
-- del cinturón vive dentro de la migración y termina con residuo 0.
-- Reversa escrita ANTES: scripts/s96/2026-08-13-s96-m23-REVERSA.sql (su nota:
-- revertir BORRA los tracks capturados y no los devuelve).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1 · La columna ──────────────────────────────────────────────────────────
ALTER TABLE public.envios ADD COLUMN track_gps jsonb;

COMMENT ON COLUMN public.envios.track_gps IS
  'S96 · Track GPS del reparto: array de puntos {lat, lng, t} — la MISMA forma '
  'que eventos_mascota_paseo.track_gps (el filtro de dominio y el dibujo se '
  'heredan). Lo escribe SOLO el repartidor asignado vía registrar_track_envio, '
  'solo con el envío en hacia_destino. La familia NO lo lee en v1 (mapa v2 por '
  'letra); el vendedor lo ve por su RLS de envíos — es la operación de su moto.';

-- ── 2 · La puerta ───────────────────────────────────────────────────────────
CREATE FUNCTION public.registrar_track_envio(p_envio_id uuid, p_puntos jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_env record;
  v_elem jsonb;
  v_lat numeric; v_lng numeric;
  v_total int;
BEGIN
  SELECT * INTO v_env FROM envios WHERE id = p_envio_id FOR UPDATE;
  IF v_env.id IS NULL THEN
    RAISE EXCEPTION 'envio_no_existe' USING ERRCODE = '22023';
  END IF;

  -- El asignado y nadie más (mismo patrón que sus hermanos del reparto).
  IF auth.uid() IS NOT NULL AND NOT _es_repartidor_del_pedido(v_env.pedido_id)
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_repartidor_asignado' USING ERRCODE = '42501';
  END IF;

  -- La ventana estricta: solo mientras va hacia la casa.
  IF v_env.estado IS DISTINCT FROM 'hacia_destino' THEN
    RAISE EXCEPTION 'track_fuera_de_ventana: el envio esta en %', v_env.estado
      USING ERRCODE = '22023';
  END IF;

  IF p_puntos IS NULL OR jsonb_typeof(p_puntos) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_puntos) = 0 THEN
    RAISE EXCEPTION 'puntos_invalidos: se espera array no vacio' USING ERRCODE = '22023';
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_puntos) LOOP
    IF jsonb_typeof(v_elem->'lat') IS DISTINCT FROM 'number'
       OR jsonb_typeof(v_elem->'lng') IS DISTINCT FROM 'number'
       OR v_elem->>'t' IS NULL THEN
      RAISE EXCEPTION 'puntos_invalidos: cada punto requiere lat/lng numericos y t'
        USING ERRCODE = '22023';
    END IF;
    -- Guard de rango: grados imposibles rebotan en la fuente. HONESTIDAD DE
    -- ALCANCE (hallazgo del propio cinturón, T4 v1): la INVERSIÓN lat/lng de
    -- Quito NO es detectable por rango — lat invertida (-78.48) cae dentro de
    -- [-90,90]. Este guard ataja basura (grados fuera de la Tierra), no la
    -- inversión; esa la vería el filtro de dominio aguas abajo, si aparece.
    v_lat := (v_elem->>'lat')::numeric;
    v_lng := (v_elem->>'lng')::numeric;
    IF v_lat < -90 OR v_lat > 90 OR v_lng < -180 OR v_lng > 180 THEN
      RAISE EXCEPTION 'puntos_invalidos: lat/lng fuera de rango (lat %, lng %)', v_lat, v_lng
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- APPEND siempre: el track de un envío no se reescribe.
  UPDATE envios
  SET track_gps = coalesce(track_gps, '[]'::jsonb) || p_puntos,
      updated_at = now()
  WHERE id = p_envio_id
  RETURNING jsonb_array_length(track_gps) INTO v_total;

  IF v_total > 10000 THEN
    RAISE EXCEPTION 'track_excede_limite: % puntos (max 10000)', v_total
      USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'envio_id', p_envio_id, 'puntos_total', v_total);
END;
$$;

-- L-140: la puerta nace sin anon/PUBLIC y con su audiencia escrita.
REVOKE EXECUTE ON FUNCTION public.registrar_track_envio(uuid, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_track_envio(uuid, jsonb) TO authenticated;

-- ── 3 · CINTURÓN — estructura + camino real con discriminador, residuo 0 ───
DO $$
DECLARE
  v_def text;
  v_cuenta uuid;
  v_pedido uuid;
  v_user_rep uuid;
  v_user_otro uuid;
  v_rep uuid;
  v_envio uuid;
  v_r jsonb;
  v_fallo boolean;
BEGIN
  -- (a) Estructura: la función existe y su cuerpo contiene los tres gates.
  v_def := pg_get_functiondef(to_regprocedure('public.registrar_track_envio(uuid, jsonb)'));
  IF v_def IS NULL THEN RAISE EXCEPTION 'cinturon: la funcion no existe'; END IF;
  IF position('_es_repartidor_del_pedido' IN v_def) = 0
     OR position('hacia_destino' IN v_def) = 0
     OR position('track_fuera_de_ventana' IN v_def) = 0 THEN
    RAISE EXCEPTION 'cinturon: el cuerpo perdio un gate (asignado/ventana)';
  END IF;

  -- (b) L-140 medido por privilegio, jamás por proacl textual.
  IF has_function_privilege('anon', 'public.registrar_track_envio(uuid, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: anon puede ejecutar registrar_track_envio';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.registrar_track_envio(uuid, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: authenticated perdio EXECUTE';
  END IF;

  -- (c) Fixture: repartidor + envío sintéticos sobre un pedido real.
  -- El pedido se elige SIN envíos previos: _es_repartidor_del_pedido mide por
  -- PEDIDO, y un envío ajeno preexistente haría de T5 un verde falso.
  SELECT id INTO v_cuenta FROM cuentas_comerciales LIMIT 1;
  SELECT p.id INTO v_pedido FROM pedidos p
   WHERE NOT EXISTS (SELECT 1 FROM envios e WHERE e.pedido_id = p.id) LIMIT 1;
  SELECT id INTO v_user_rep FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user_otro FROM auth.users WHERE id <> v_user_rep ORDER BY created_at LIMIT 1;
  IF v_cuenta IS NULL OR v_pedido IS NULL OR v_user_rep IS NULL OR v_user_otro IS NULL THEN
    RAISE EXCEPTION 'cinturon: falta materia prima para el fixture (cuenta/pedido/users)';
  END IF;

  INSERT INTO repartidores (cuenta_comercial_id, nombre, documento, user_id, activo)
  VALUES (v_cuenta, 'CINTURON M23 — borrar', 'CINTURON-M23', v_user_rep, true)
  RETURNING id INTO v_rep;

  -- 'propio' medido de cat_transportistas (regla 22 — 'flota_propia' rebotó la FK).
  INSERT INTO envios (pedido_id, transportista, destino_direccion, repartidor_id, estado)
  VALUES (v_pedido, 'propio', 'CINTURON M23 — borrar', v_rep, 'pendiente')
  RETURNING id INTO v_envio;

  -- (T1) Fuera de ventana (pendiente) → rebota HABLADO.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_rep, 'role', 'authenticated')::text, true);
  v_fallo := false;
  BEGIN
    PERFORM registrar_track_envio(v_envio, '[{"lat":-0.17,"lng":-78.48,"t":1}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    v_fallo := true;
    IF position('track_fuera_de_ventana' IN SQLERRM) = 0 THEN
      RAISE EXCEPTION 'cinturon T1: rebota pero no hablado (%)', SQLERRM;
    END IF;
  END;
  IF NOT v_fallo THEN RAISE EXCEPTION 'cinturon T1: fuera de ventana NO rebota'; END IF;

  -- Abrir la ventana (acto del motor, no de la puerta — el fixture instrumenta el paso).
  PERFORM set_config('request.jwt.claims', NULL, true);
  UPDATE envios SET estado = 'hacia_destino', hacia_destino_en = now() WHERE id = v_envio;

  -- (T2) El asignado registra y el total cuenta.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_rep, 'role', 'authenticated')::text, true);
  v_r := registrar_track_envio(v_envio,
    '[{"lat":-0.176,"lng":-78.480,"t":1},{"lat":-0.177,"lng":-78.481,"t":2}]'::jsonb);
  IF (v_r->>'puntos_total')::int <> 2 THEN
    RAISE EXCEPTION 'cinturon T2: esperaba 2 puntos, hay %', v_r->>'puntos_total';
  END IF;

  -- (T3) APPEND: el segundo flush suma, no pisa.
  v_r := registrar_track_envio(v_envio, '[{"lat":-0.178,"lng":-78.482,"t":3}]'::jsonb);
  IF (v_r->>'puntos_total')::int <> 3 THEN
    RAISE EXCEPTION 'cinturon T3: el append no sumo (total %)', v_r->>'puntos_total';
  END IF;

  -- (T4) El fuera-de-rango REAL rebota (lat 91 no existe en la Tierra).
  -- La v1 de este test afirmaba que la inversión de Quito rebotaba — y el rojo
  -- probó que era imposible por rango: el instrumento sobre-prometía, se
  -- corrigió el instrumento y la letra del guard, jamás se ablandó el motor.
  v_fallo := false;
  BEGIN
    PERFORM registrar_track_envio(v_envio, '[{"lat":91,"lng":-78.48,"t":4}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    v_fallo := true;
    IF position('fuera de rango' IN SQLERRM) = 0 THEN
      RAISE EXCEPTION 'cinturon T4: rebota pero no por rango (%)', SQLERRM;
    END IF;
  END;
  IF NOT v_fallo THEN RAISE EXCEPTION 'cinturon T4: lat 91 NO rebota'; END IF;

  -- (T5) OTRO usuario autenticado → 42501.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_otro, 'role', 'authenticated')::text, true);
  v_fallo := false;
  BEGIN
    PERFORM registrar_track_envio(v_envio, '[{"lat":-0.18,"lng":-78.49,"t":5}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    v_fallo := true;
    IF position('no_sos_el_repartidor_asignado' IN SQLERRM) = 0 THEN
      RAISE EXCEPTION 'cinturon T5: rebota pero no por asignacion (%)', SQLERRM;
    END IF;
  END;
  IF NOT v_fallo THEN RAISE EXCEPTION 'cinturon T5: otro usuario puede escribir el track ajeno'; END IF;

  -- (T6) El tope existe: 10001 puntos rebotan.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_rep, 'role', 'authenticated')::text, true);
  v_fallo := false;
  BEGIN
    PERFORM registrar_track_envio(v_envio,
      (SELECT jsonb_agg(jsonb_build_object('lat', 0, 'lng', 0, 't', g))
       FROM generate_series(1, 10001) g));
  EXCEPTION WHEN OTHERS THEN
    v_fallo := true;
    IF position('track_excede_limite' IN SQLERRM) = 0 THEN
      RAISE EXCEPTION 'cinturon T6: rebota pero no por tope (%)', SQLERRM;
    END IF;
  END;
  IF NOT v_fallo THEN RAISE EXCEPTION 'cinturon T6: el tope de 10000 no rige'; END IF;

  -- Residuo 0: el fixture se va entero.
  PERFORM set_config('request.jwt.claims', NULL, true);
  DELETE FROM envios WHERE id = v_envio;
  DELETE FROM repartidores WHERE id = v_rep;
  IF EXISTS (SELECT 1 FROM envios WHERE destino_direccion = 'CINTURON M23 — borrar')
     OR EXISTS (SELECT 1 FROM repartidores WHERE documento = 'CINTURON-M23') THEN
    RAISE EXCEPTION 'cinturon: quedo residuo del fixture';
  END IF;

  RAISE NOTICE 'CINTURON M23: 6/6 verdes, residuo 0';
END $$;

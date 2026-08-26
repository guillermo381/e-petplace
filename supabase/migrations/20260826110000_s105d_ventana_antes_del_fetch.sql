-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · LA VENTANA SE PREGUNTA **ANTES** DE PEDIR EL REFUND
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 76(g) — VEDA: **NO RIGE.** DDL de dos funciones de SOLO LECTURA. No escriben
-- una fila. El cinturón no necesita subtransacción porque no muta nada.
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-D-REVERSA-20260826110000-ventana-antes-del-fetch.sql
--   🔴 Dice que revertir REABRE el defecto, y fija el orden.
--
-- ── EL DEFECTO, MEDIDO EN EL CÓDIGO PROPIO ─────────────────────────────────
--
--   pagos-reverso/index.ts:137        fetch(.../transaction/refund/)
--   pagos-reverso/index.ts:184        rpc('registrar_reverso_nuvei')   ← la ventana
--   pagos-reverso-deuna/index.ts:114  fetch(.../payment/refund)
--   pagos-reverso-deuna/index.ts:183  rpc('registrar_reverso_deuna')   ← la ventana
--
-- **Las dos edges le piden el refund al proveedor y verifican la ventana
-- después.** Si el proveedor acepta un refund fuera de nuestra ventana, la
-- plata vuelve y el registro rebota ⇒ **plata devuelta sin rastro nuestro.**
--
-- > ### Que hoy sea inalcanzable —porque el proveedor probablemente rechace
-- > igual— no lo vuelve seguro: **lo vuelve seguro POR EL PROVEEDOR**, que es
-- > depender de un tercero para nuestra propia integridad.
--
-- *Lo destapó un caso real que cayó fuera de ventana (`DF-2103629`, cobrado
-- 19:43 Guayaquil, después del corte de las 17:00), no un gate. Es el mismo
-- patrón que mordió dos veces hoy: una validación que corre después del acto
-- que debía validar.*
--
-- ── POR QUÉ CONSULTA Y NO UNA COPIA DE LA REGLA EN LA EDGE ─────────────────
--
-- 🔴 La tentación era calcular la ventana en la edge, que ya lee `cerrado_en`.
-- **Se descartó: dos lugares que calculan la misma ventana se desincronizan el
-- día que una se corrija** — y acá las ventanas ya son distintas por riel
-- (Nuvei mismo día < 17:00 · DeUna 24 h), que es justo donde una copia se
-- equivoca sin que nadie lo note.
--
-- ⇒ **Estas funciones son el MISMO predicado que usa el registro**, expuesto
-- para preguntar antes. No una segunda opinión: la misma, más temprano.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── NUVEI: mismo día de Guayaquil Y antes de las 17:00 ────────────────────
CREATE OR REPLACE FUNCTION public.puede_reversar_nuvei(p_intento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE                                   -- ← no muta nada, y se declara
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i     pagos_intentos;
  v_local timestamp := now() AT TIME ZONE 'America/Guayaquil';
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;
  IF v_i.proveedor <> 'nuvei' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_nuvei',
                              'proveedor', v_i.proveedor);
  END IF;
  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ya_reversado');
  END IF;
  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;
  IF v_i.cerrado_en IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;
  IF (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date <> v_local::date THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_otro_dia',
      'cobrado', (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date,
      'hoy', v_local::date);
  END IF;
  IF v_local::time >= TIME '17:00' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_corte',
      'hora_local', to_char(v_local, 'HH24:MI'),
      'nota', 'pasado el corte no es un endpoint: es un tramite con el banco');
  END IF;
  RETURN jsonb_build_object('ok', true, 'tx', v_i.proveedor_transaction_id);
END $function$;

-- ── DEUNA: 24 HORAS desde el cobro. NO «mismo día», que es Nuvei ──────────
CREATE OR REPLACE FUNCTION public.puede_reversar_deuna(p_intento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i     pagos_intentos;
  v_horas numeric;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;
  IF v_i.proveedor <> 'deuna' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_deuna',
                              'proveedor', v_i.proveedor);
  END IF;
  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ya_reversado');
  END IF;
  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;
  IF v_i.cerrado_en IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;
  v_horas := extract(epoch FROM (now() - v_i.cerrado_en)) / 3600.0;
  IF v_horas > 24 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_24h',
      'horas_desde_el_cobro', round(v_horas, 2));
  END IF;
  RETURN jsonb_build_object('ok', true, 'tx', v_i.proveedor_transaction_id,
                            'horas_desde_el_cobro', round(v_horas, 2));
END $function$;

COMMENT ON FUNCTION public.puede_reversar_nuvei(uuid) IS
  'S105-D: consulta previa al refund. MISMO predicado que registrar_reverso_nuvei, '
  'expuesto para preguntar ANTES del fetch. Solo lectura.';
COMMENT ON FUNCTION public.puede_reversar_deuna(uuid) IS
  'S105-D: consulta previa al refund. Ventana 24 h (no mismo dia: eso es Nuvei). '
  'Solo lectura.';

REVOKE ALL ON FUNCTION public.puede_reversar_nuvei(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.puede_reversar_deuna(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.puede_reversar_nuvei(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.puede_reversar_deuna(uuid) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — sobre el CASO REAL que destapó el defecto. Solo lectura: no hay
-- fixtures que limpiar porque estas funciones no escriben.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_id uuid;
  v_r  jsonb;
BEGIN
  SELECT id INTO v_id FROM pagos_intentos
   WHERE proveedor_transaction_id = 'DF-2103629';

  IF v_id IS NULL THEN
    RAISE NOTICE 'CINTURON: DF-2103629 no esta; se omite el caso real.';
  ELSE
    /* 🔴 EL CASO QUE LO ORIGINÓ: cobrado 19:43 Guayaquil, después del corte.
       **Nunca estuvo dentro de ventana** — no es que se nos pasó el tiempo. */
    v_r := puede_reversar_nuvei(v_id);
    IF (v_r->>'ok')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON ①: DF-2103629 deberia estar FUERA de ventana '
        '(cobro 19:43, corte 17:00) y la consulta dice %', v_r;
    END IF;
    RAISE NOTICE 'CINTURON ①: DF-2103629 rebota ANTES del fetch → %', v_r->>'codigo';
  END IF;

  -- ② Fail-closed por riel: la de Nuvei no acepta un intento de DeUna.
  SELECT id INTO v_id FROM pagos_intentos WHERE proveedor = 'deuna' LIMIT 1;
  IF v_id IS NOT NULL THEN
    v_r := puede_reversar_nuvei(v_id);
    IF v_r->>'codigo' <> 'proveedor_no_es_nuvei' THEN
      RAISE EXCEPTION 'CINTURON ②: la consulta de Nuvei acepto un intento de DeUna: %', v_r;
    END IF;
  END IF;

  -- ③ Un intento inexistente no explota: contesta.
  v_r := puede_reversar_deuna('00000000-0000-0000-0000-000000000000'::uuid);
  IF v_r->>'codigo' <> 'intento_no_existe' THEN
    RAISE EXCEPTION 'CINTURON ③: un intento inexistente no se nombro: %', v_r;
  END IF;

  RAISE NOTICE 'CINTURON VENTANA-ANTES-DEL-FETCH: verde.';
END $cinturon$;

COMMIT;

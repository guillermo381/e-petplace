-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L5a — EL LOTE DETERMINISTA: proponer_skus_vendedor_lote
--
-- EL REENCUADRE DE MESA (17-ago, en PLAN_S99): L5a no es «la carga por
-- archivo» — es LO QUE HACE QUE LA VITRINA EXISTA MÁS ALLÁ DE SEIS. El
-- arco: 1 a 1 (proponer_sku_vendedor, vivo desde S95-F) · **Excel/CSV
-- DETERMINISTA (esta puerta — §14 de MODELO_DESPENSA NO le aplica porque
-- no es IA)** · PDF con IA (POST-15-SEP, espera su fecha).
--
-- M21 INTACTA POR CONSTRUCCIÓN: cada fila entra por la MISMA puerta 1 a 1
-- (`proponer_sku_vendedor`) — nace `propuesto`, e-PetPlace publica. Este
-- lote no salta ni re-implementa un solo gate: los LLAMA en bucle, con el
-- mismo criterio del contexto de arranque (componer, jamás copiar).
--
-- POR-FILA, JAMÁS TODO-O-NADA, y es decisión de producto: en una carga de
-- 50, una fila mala no puede matar 49 buenas — el vendedor corrige UNA y
-- re-sube, no re-empieza. Cada fila responde ok/error CON SU ÍNDICE
-- (savepoint por iteración: el error de una no ensucia la transacción de
-- las demás). Lo que no entra SE DICE — el criterio de la mitad
-- determinista aplicado a la puerta.
--
-- 76(g): NO RIGE — una función nueva; cero DDL de tablas; las escrituras
-- son las de proponer_sku_vendedor (idempotente, S95-F). Reversa ANTES:
-- docs/relevamientos/2026-08-17-s99a-REVERSA-viajes-y-lote.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.proponer_skus_vendedor_lote(
  p_cuenta_comercial_id uuid,
  p_filas jsonb,
  p_origen_carga text DEFAULT 'vendedor'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_fila       jsonb;
  v_i          int := 0;
  v_r          jsonb;
  v_resultados jsonb := '[]'::jsonb;
  v_ok         int := 0;
  v_mal        int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  -- El gate del vendedor se verifica UNA vez acá y otra en cada llamada
  -- interna (la puerta 1 a 1 no se confía en nadie — costo: nada; valor:
  -- este lote jamás puede volverse un bypass si el gate interno cambia).
  IF NOT public.es_vendedor_de(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  IF p_filas IS NULL OR jsonb_typeof(p_filas) <> 'array' THEN
    RAISE EXCEPTION 'lote_invalido';
  END IF;
  -- Techo explícito: una carga determinista es un archivo de decenas, no
  -- un firehose. 500 = el «cargar 500 productos» del plan, con margen cero
  -- de silencio: más que eso rebota HABLANDO, jamás trunca.
  IF jsonb_array_length(p_filas) > 500 THEN
    RAISE EXCEPTION 'lote_demasiado_grande';
  END IF;

  FOR v_fila IN SELECT * FROM jsonb_array_elements(p_filas) LOOP
    BEGIN
      v_r := public.proponer_sku_vendedor(
        p_cuenta_comercial_id,
        v_fila -> 'producto',
        v_fila -> 'variante',
        v_fila -> 'sku',
        p_origen_carga
      );
      v_resultados := v_resultados || jsonb_build_object(
        'indice', v_i, 'ok', true, 'resultado', v_r);
      v_ok := v_ok + 1;
    EXCEPTION WHEN OTHERS THEN
      -- El savepoint implícito del bloque deshace SOLO esta fila; el error
      -- viaja con su índice para que la superficie diga CUÁL línea del
      -- archivo no entró y por qué.
      v_resultados := v_resultados || jsonb_build_object(
        'indice', v_i, 'ok', false, 'error', SQLERRM);
      v_mal := v_mal + 1;
    END;
    v_i := v_i + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'propuestos', v_ok,
    'rechazados', v_mal,
    'resultados', v_resultados
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.proponer_skus_vendedor_lote(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proponer_skus_vendedor_lote(uuid, jsonb, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — contra el contrato REAL de la puerta 1 a 1 (leído con
-- pg_get_functiondef ANTES de escribir esto): el canónico se RESUELVE
-- (jamás se crea desde acá), el SKU es lo único del vendedor, y con
-- stock_disponible=0 NO nace movimiento de ledger (L-231: un ledger
-- append-only no se limpia — por eso la siembra es sin stock).
-- Brazos: ① lote mixto (fila buena MAPEA la variante canónica INT-S-0019,
-- libre para esta cuenta — medido; fila mala sin familia_codigo) → 1/1,
-- la mala responde con índice y `campo_requerido`, la buena nace
-- `propuesto` (el por-fila discrimina contra todo-o-nada) · ② ajeno
-- rebota · ③ techo rebota hablando · ④ L-140. Limpieza quirúrgica: SOLO
-- el vendedor_skus nuevo (el canónico no es nuestro y no se toca).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_r       jsonb;
  v_sku_id  uuid;
  v_estado  text;
  v_err     text;
  v_lote    jsonb := jsonb_build_array(
    jsonb_build_object(
      'producto', jsonb_build_object(
        'familia_codigo', 'suplemento',
        'nombre', 'Aceite de Salmon Brilliant Piel y Pelaje',
        'marca', 'Brilliant'
      ),
      'variante', jsonb_build_object('codigo', 'INT-S-0019'),
      'sku', jsonb_build_object(
        'sku_vendedor', 'CINT-LOTE-S99-1',
        'precio_propuesto', 12.50,
        'stock_disponible', 0
      )
    ),
    jsonb_build_object(
      'producto', jsonb_build_object('nombre', 'FILA MALA SIN FAMILIA'),
      'variante', jsonb_build_object('codigo', 'CINT-LOTE-S99-2'),
      'sku', jsonb_build_object('sku_vendedor', 'CINT-LOTE-S99-2')
    )
  );
BEGIN
  -- Brazo ① — lote mixto como duenodes.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.proponer_skus_vendedor_lote(
    'eec12ef3-2c0c-41e7-a45e-81559fdf62a8', v_lote, 'vendedor');
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_r ->> 'propuestos')::int <> 1 OR (v_r ->> 'rechazados')::int <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN ①: esperaba 1/1, vino %/% — %',
      v_r ->> 'propuestos', v_r ->> 'rechazados', v_r -> 'resultados';
  END IF;
  IF (v_r -> 'resultados' -> 1 ->> 'ok') <> 'false'
     OR (v_r -> 'resultados' -> 1 ->> 'indice') <> '1'
     OR (v_r -> 'resultados' -> 1 ->> 'error') NOT LIKE 'campo_requerido%' THEN
    RAISE EXCEPTION 'CINTURÓN ①b: la fila mala no responde con índice+causa — %', v_r -> 'resultados';
  END IF;
  SELECT vs.id, vs.estado INTO v_sku_id, v_estado FROM public.vendedor_skus vs
  WHERE vs.sku_vendedor = 'CINT-LOTE-S99-1'
    AND vs.cuenta_comercial_id = 'eec12ef3-2c0c-41e7-a45e-81559fdf62a8';
  IF v_sku_id IS NULL OR v_estado <> 'propuesto' THEN
    RAISE EXCEPTION 'CINTURÓN ①c: la fila buena no nació propuesto (%, %)', v_sku_id, v_estado;
  END IF;
  -- M21 por resultado: la puerta NO creó canónico (creado.producto=false).
  IF (v_r -> 'resultados' -> 0 -> 'resultado' -> 'creado' ->> 'producto') <> 'false' THEN
    RAISE EXCEPTION 'CINTURÓN ①d: el lote creó un producto canónico — M21 rota';
  END IF;

  -- Brazo ② — el ajeno rebota (Diego no es vendedor de duenodes).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"4bfafac3-e456-4de7-9484-99e76b7301b0","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.proponer_skus_vendedor_lote(
      'eec12ef3-2c0c-41e7-a45e-81559fdf62a8', '[]'::jsonb, 'vendedor');
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ②: el ajeno NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'no_sos_el_vendedor%' THEN
      RAISE EXCEPTION 'CINTURÓN ②: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ③ — el techo rebota HABLANDO (501 filas vacías).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.proponer_skus_vendedor_lote(
      'eec12ef3-2c0c-41e7-a45e-81559fdf62a8',
      (SELECT jsonb_agg('{}'::jsonb) FROM generate_series(1, 501)), 'vendedor');
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ③: el techo NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'lote_demasiado_grande%' THEN
      RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ④ — L-140.
  IF has_function_privilege('anon', 'public.proponer_skus_vendedor_lote(uuid, jsonb, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ④ (L-140): anon tiene EXECUTE';
  END IF;

  -- LIMPIEZA QUIRÚRGICA: SOLO el SKU sembrado (con stock 0 no hay
  -- movimiento de ledger que limpiar — verificado abajo; el canónico que
  -- mapeó no es nuestro y NO se toca).
  IF EXISTS (SELECT 1 FROM public.inventario_movimientos WHERE sku_id = v_sku_id) THEN
    RAISE EXCEPTION 'CINTURÓN residuo: nació un movimiento de ledger con stock 0';
  END IF;
  DELETE FROM public.vendedor_skus WHERE id = v_sku_id;
  IF EXISTS (SELECT 1 FROM public.vendedor_skus WHERE sku_vendedor LIKE 'CINT-LOTE-S99%') THEN
    RAISE EXCEPTION 'CINTURÓN residuo: quedó siembra viva';
  END IF;

  RAISE NOTICE 'CINTURÓN lote: ①①b①c①d②③④ verdes, residuo 0';
END $$;

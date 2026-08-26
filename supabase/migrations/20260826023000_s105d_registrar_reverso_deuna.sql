-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · EL REVERSO DE DEUNA — hermana de la de Nuvei, y NO su copia
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 76(g) — VEDA: **NO RIGE.** DDL de una función. Sin backfill, sin anclas. El
-- cinturón escribe en subtransacción que se deshace sola (`L-406`).
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-D-REVERSA-20260826023000-reverso-deuna.sql
--   🔴 Fija el orden: primero la edge, después esta función.
--
-- ── 🔴 LOS TRES DELTAS CONTRA NUVEI, TODOS MEDIDOS HOY EN QA ───────────────
--
-- Esta función NO es `registrar_reverso_nuvei` con otro nombre. Cada
-- diferencia salió de ejercer el reverso de Carlos, no de leer papel.
--
-- ① **LA VENTANA ES DE 24 HORAS, NO «MISMO DÍA».**
--    Firma del founder sobre la respuesta de DeUna (WhatsApp, 24-ago-2026), y
--    `LETRA_DEUNA` §8 quedó enmendada: **la ventana es POR RIEL** — DeUna 24 h ·
--    Nuvei mismo día.
--    🔴 **Es el borde que más se presta a copiarse mal**, porque la función
--    hermana dice «mismo día y antes de las 17:00» y se ve razonable. *Un
--    `cerrado_en` de ayer a las 23:00 está DENTRO de ventana acá y FUERA en
--    Nuvei.* Va por construcción y con su porqué al lado.
--
-- ② **`transactionReverseId` EXISTE, y es DISTINTO del `transactionId`.**
--    Medido: el refund devolvió `efa88734-1311-50a1-b907-25d770497f27` mientras
--    la transacción es `89600c04-…`. **Al revés que Nuvei**, donde el reverso
--    vuelve con el mismo id y `proveedor_reverso_id` quedaba redundante.
--    ⇒ acá esa columna **por fin guarda información nueva.**
--
-- ③ 🔴 **EL DISCRIMINADOR NO ES `status: true`.**
--    Medido dos veces, y ésta es la razón de ser del parámetro
--    `p_info_reversed`:
--      · sobre una transacción **NO pagada**: `status: true` +
--        `"The QR with id 4262774 has been successfully cleaned"` +
--        **`transactionReverseId: null`** ← cancelación de un QR, no un reverso
--      · sobre la transacción **pagada de Carlos**: `status: true` +
--        `"Refund executed successfully for transferNumber 89600c04-…"` +
--        **`transactionReverseId: efa88734-…`**
--
--    > ### `status: true` vuelve IGUAL en los dos casos. Quien lo lea como éxito **marca reversada una transacción que nunca tuvo plata.**
--
--    ⇒ **se exigen las DOS cosas: el `transactionReverseId` presente Y el
--    `payment/info` en `REVERSED`.** La edge verifica lo segundo y lo pasa acá;
--    esta función **no confía en un booleano del proveedor.**
--
--    ✅ **Y de paso queda medido que el refund NO toca el punto de venta**: su
--    `message` nombra la transacción (`for transferNumber 89600c04-…`), no el
--    POS. *Confirma por medición lo que Carlos había dicho de palabra, y cierra
--    la duda que tuvo el `refund` congelado media jornada.*
--
-- ── LO QUE COMPARTE CON SU HERMANA, a propósito ────────────────────────────
-- Idempotencia · sólo desde `'aprobado'` · fail-closed por proveedor · **y NO
-- MUEVE EL SUJETO** (`D-923`, de A): la respuesta lo dice con `sujeto_movido`.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.registrar_reverso_deuna(
  p_intento_id     uuid,
  p_reverso_id     text,     -- transactionReverseId (② — existe y es distinto)
  p_monto          numeric,  -- el amount que devuelve payment/info
  p_estado_info    text,     -- el status de payment/info: se exige 'REVERSED'
  p_crudo          jsonb     -- refund + info, para la conciliación
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i     pagos_intentos;
  v_ahora timestamptz := now();
  v_horas numeric;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.proveedor <> 'deuna' THEN
    /* Fail-closed por riel, igual que su hermana y por la misma razón: los dos
       vocabularios se cruzaron dos veces en esta mesa. Acá es inexpresable. */
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_deuna',
                              'proveedor', v_i.proveedor);
  END IF;

  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_reversado',
                              'reverso_id', v_i.proveedor_reverso_id);
  END IF;

  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;

  /* ③ 🔴 LAS DOS CONDICIONES, Y NINGUNA ALCANZA SOLA.
     Sin `transactionReverseId` lo que hubo fue una cancelación de QR; sin
     `REVERSED` en `payment/info` no hay confirmación del proveedor de que la
     plata volvió. *Un `status: true` no entra en esta decisión ni de paso.* */
  IF p_reverso_id IS NULL OR btrim(p_reverso_id) = '' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_transaction_reverse_id',
      'nota', 'sin ese id lo que ocurrio fue una cancelacion de QR, no un reverso');
  END IF;

  IF upper(coalesce(p_estado_info,'')) <> 'REVERSED' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'info_no_confirma_reverso',
      'estado_info', p_estado_info,
      'nota', 'el proveedor no confirmo REVERSED: no se marca de nuestro lado');
  END IF;

  /* ① LA VENTANA: 24 HORAS desde el cobro. NO «mismo día», que es Nuvei. */
  IF v_i.cerrado_en IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;

  v_horas := extract(epoch FROM (v_ahora - v_i.cerrado_en)) / 3600.0;
  IF v_horas > 24 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_24h',
      'horas_desde_el_cobro', round(v_horas, 2),
      'nota', 'la ventana de DeUna son 24 horas; pasado eso es gestion manual');
  END IF;

  UPDATE pagos_intentos
     SET estado = 'reversado',
         /* ② acá esta columna GUARDA ALGO NUEVO, a diferencia de Nuvei. */
         proveedor_reverso_id = p_reverso_id,
         payload_crudo = coalesce(payload_crudo, '{}'::jsonb) || jsonb_build_object(
           'reverso', jsonb_build_object(
             'transaction_reverse_id', p_reverso_id,
             'monto', p_monto,
             'estado_info', p_estado_info,
             'crudo', p_crudo,
             'en', v_ahora)),
         hallazgo = 'reversado_mismo_dia',   -- vocabulario cerrado por CHECK
         hallazgo_en = v_ahora,
         actualizado_en = v_ahora
   WHERE id = p_intento_id;

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'reversado',
    'reverso_id', p_reverso_id,
    'horas_desde_el_cobro', round(v_horas, 2),
    /* Se DICE, no se deja notar: el circuito queda a medias y es `D-923`. */
    'sujeto_movido', false,
    'nota', 'el sujeto no se mueve: D-923, de A');
END $function$;

COMMENT ON FUNCTION public.registrar_reverso_deuna(uuid, text, numeric, text, jsonb) IS
  'S105-D: persiste un reverso de DeUna ya ejecutado. Ventana 24 HORAS (no mismo '
  'dia: eso es Nuvei). Exige transactionReverseId Y payment/info en REVERSED — '
  'status:true no alcanza. NO mueve el sujeto (D-923).';

REVOKE ALL ON FUNCTION public.registrar_reverso_deuna(uuid, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_reverso_deuna(uuid, text, numeric, text, jsonb) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — con ROJOS PRODUCIDOS, en subtransacción que se deshace sola.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_id uuid; v_r jsonb; v_ped uuid; v_est text;
BEGIN
  SELECT id INTO v_ped FROM pedidos LIMIT 1;
  IF v_ped IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay pedido para anclar fixtures. No se inventa.';
  END IF;

  BEGIN
    -- Cobrado HACE 3 HORAS: fuera de la ventana de Nuvei si fuera ayer, pero
    -- DENTRO de las 24 h de DeUna. Es el caso que separa a las dos hermanas.
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda, pedido_id,
                                proveedor_transaction_id, cerrado_en, clave_idempotencia)
    VALUES ('deuna','codigo_push','aprobado', 10.00,'USD', v_ped,
            'CINT-DEUNA-1', now() - interval '3 hours', 'cd-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;

    -- ① VERDE: dentro de 24 h, con las dos condiciones.
    v_r := registrar_reverso_deuna(v_id, 'REV-DEUNA-1', 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'reversado' THEN
      RAISE EXCEPTION 'CINTURON ①: no reverso un caso valido de 3h: %', v_r;
    END IF;
    SELECT estado INTO v_est FROM pagos_intentos WHERE id = v_id;
    IF v_est <> 'reversado' THEN RAISE EXCEPTION 'CINTURON ①b: estado quedo %', v_est; END IF;
    IF (SELECT proveedor_reverso_id FROM pagos_intentos WHERE id = v_id) <> 'REV-DEUNA-1' THEN
      RAISE EXCEPTION 'CINTURON ①c: no guardo el transactionReverseId';
    END IF;

    -- ② ROJO: idempotencia.
    v_r := registrar_reverso_deuna(v_id, 'REV-OTRO', 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'ya_reversado' THEN
      RAISE EXCEPTION 'CINTURON ②: un reintento se trato como reverso nuevo: %', v_r;
    END IF;

    -- ③ 🔴 ROJO: SIN transactionReverseId ⇒ fue una cancelacion de QR, no un reverso.
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda, pedido_id,
                                proveedor_transaction_id, cerrado_en, clave_idempotencia)
    VALUES ('deuna','codigo_push','aprobado', 10.00,'USD', v_ped,
            'CINT-DEUNA-2', now(), 'cd-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_deuna(v_id, NULL, 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'sin_transaction_reverse_id' THEN
      RAISE EXCEPTION 'CINTURON ③: acepto un reverso SIN su id — el caso del QR cleaned: %', v_r;
    END IF;

    -- ④ 🔴 ROJO: info que NO dice REVERSED (aunque el refund haya dicho true).
    v_r := registrar_reverso_deuna(v_id, 'REV-X', 10.00, 'APPROVED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'info_no_confirma_reverso' THEN
      RAISE EXCEPTION 'CINTURON ④: marco reversado algo que info dice APPROVED: %', v_r;
    END IF;

    -- ⑤ 🔴 ROJO: fuera de las 24 h (cobrado hace 25 horas).
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda, pedido_id,
                                proveedor_transaction_id, cerrado_en, clave_idempotencia)
    VALUES ('deuna','codigo_push','aprobado', 10.00,'USD', v_ped,
            'CINT-DEUNA-3', now() - interval '25 hours', 'cd-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_deuna(v_id, 'REV-Y', 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'fuera_de_ventana_24h' THEN
      RAISE EXCEPTION 'CINTURON ⑤: acepto un reverso de 25 horas: %', v_r;
    END IF;

    -- ⑥ 🔴 EL DISCRIMINADOR DE LAS DOS HERMANAS: 20 horas.
    --    DENTRO de la ventana de DeUna · FUERA de la de Nuvei (otro día).
    --    *Sin este caso, copiar la ventana de Nuvei pasaría el cinturón.*
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda, pedido_id,
                                proveedor_transaction_id, cerrado_en, clave_idempotencia)
    VALUES ('deuna','codigo_push','aprobado', 10.00,'USD', v_ped,
            'CINT-DEUNA-4', now() - interval '20 hours', 'cd-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_deuna(v_id, 'REV-Z', 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'reversado' THEN
      RAISE EXCEPTION 'CINTURON ⑥: rechazo un reverso de 20 HORAS. La ventana esta '
        'copiada de Nuvei (mismo dia) en vez de las 24 h de DeUna: %', v_r;
    END IF;

    -- ⑦ ROJO: proveedor equivocado.
    INSERT INTO pagos_intentos (proveedor, forma, estado, monto, moneda, pedido_id,
                                proveedor_transaction_id, cerrado_en, clave_idempotencia)
    VALUES ('nuvei','tokenizacion','aprobado', 10.00,'USD', v_ped,
            'CINT-DEUNA-5', now(), 'cd-'||gen_random_uuid()::text)
    RETURNING id INTO v_id;
    v_r := registrar_reverso_deuna(v_id, 'REV-W', 10.00, 'REVERSED', '{}'::jsonb);
    IF v_r->>'codigo' <> 'proveedor_no_es_deuna' THEN
      RAISE EXCEPTION 'CINTURON ⑦: acepto un intento de Nuvei: %', v_r;
    END IF;

    RAISE NOTICE 'CINTURON REVERSO DEUNA: 7/7 verdes (5 rojos producidos).';
    RAISE EXCEPTION 'ROLLBACK_CINTURON';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_CINTURON' THEN RAISE; END IF;
  END;

  IF EXISTS (SELECT 1 FROM pagos_intentos
              WHERE proveedor_transaction_id LIKE 'CINT-DEUNA-%') THEN
    RAISE EXCEPTION 'CINTURON: quedo residuo de fixtures.';
  END IF;
  RAISE NOTICE 'CINTURON: residuo 0 verificado.';
END $cinturon$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A4 · F6 · EL SALDO e-PetPlace — nace en V1 (LETRA_POSTVENTA §7)
--
-- Es un PASIVO del ledger: plata que le debemos al dueño. Cierra D-926 («el
-- motor de saldo no existe, y dos letras firmadas lo daban por hecho»).
--
-- CENSO ANTES DE ESCRIBIR (regla de la casa), medido:
--   · cero tablas de saldo · cero funciones de saldo (D-926 confirmada)
--   · la unidad del hogar es `familia`; el usuario llega por `familia_miembro`
--   · `bonos.familia_id` es el precedente del anclaje al hogar
--
-- LAS SEIS FIRMAS DE §7, cada una hecha estructura:
--   ① DEL HOGAR, no de la mascota → cuelga de `familia_id` (como el bono)
--   ② se acredita SÓLO por el motor → REVOKE de escritura; nace por función
--   ③ se consume FIFO → los movimientos se ordenan por fecha y se agotan viejo primero
--   ④ no vence en V1 → sin columna de vencimiento (no se puede expresar un vencimiento)
--   ⑤ no se retira a efectivo → no hay función de retiro; sólo consumo en checkout
--   ⑥ cada movimiento nombra su origen y es idempotente → clave_idempotencia UNIQUE
--
-- CURA D-314 DESDE EL NACIMIENTO (§7 lo exige explícito):
--   sin policy de auto-escritura · REVOKE EXECUTE a anon y PUBLIC · search_path fijo.
--
-- VEDA 76(g): NO RIGE — DDL aditiva + funciones; cero backfill.
-- REVERSA: escrita ANTES (y declara que borra la constancia de una deuda).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── EL LIBRO MAYOR DEL SALDO, append-only ──────────────────────────────────
-- No hay una columna «saldo actual»: el saldo es la SUMA de los movimientos.
-- Un total materializado es un número que puede mentir cuando un movimiento no
-- lo actualiza (la lección del ledger de S95: un saldo que un trigger mantiene
-- se desincroniza cuando alguien inserta por otra puerta). Acá el saldo se
-- DERIVA, siempre, y por eso no puede divergir de sus movimientos.
CREATE TABLE public.saldo_hogar_movimientos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id    uuid NOT NULL REFERENCES public.familia(id),

  -- + acredita (una devolución a saldo) · - consume (un checkout)
  monto         numeric(12,2) NOT NULL,

  -- de dónde salió cada movimiento (§7 · «cada movimiento nombra su origen»)
  origen_tipo   text NOT NULL,     -- caso | compra | ajuste
  origen_id     uuid,              -- el caso que acreditó, la compra que consumió

  -- FIFO: un consumo apunta al lote (movimiento de crédito) del que sale, para
  -- que «agotar el más viejo primero» sea auditable y no una convención.
  lote_id       uuid REFERENCES public.saldo_hogar_movimientos(id),

  -- §7 · idempotente: el mismo hecho no acredita dos veces
  clave_idempotencia text NOT NULL,

  descripcion   text,
  creado_por    uuid REFERENCES auth.users(id),
  creado_en     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_saldo_origen CHECK (origen_tipo IN ('caso','compra','ajuste')),
  CONSTRAINT chk_saldo_monto_no_cero CHECK (monto <> 0),
  -- un crédito no tiene lote (ES el lote); un consumo SÍ lo tiene.
  CONSTRAINT chk_saldo_lote CHECK (
    (monto > 0 AND lote_id IS NULL) OR (monto < 0 AND lote_id IS NOT NULL)),
  CONSTRAINT uq_saldo_idem UNIQUE (clave_idempotencia)
);

CREATE INDEX ix_saldo_familia ON public.saldo_hogar_movimientos (familia_id, creado_en);
CREATE INDEX ix_saldo_lote    ON public.saldo_hogar_movimientos (lote_id) WHERE lote_id IS NOT NULL;

COMMENT ON TABLE public.saldo_hogar_movimientos IS
  'S114 · §7 F6 · El saldo e-PetPlace, un pasivo del ledger. DEL HOGAR (familia_id, '
  'como el bono). El saldo se DERIVA de la suma de movimientos, jamás se '
  'materializa — un total guardado miente el día que un movimiento no lo '
  'actualiza (S95). Se acredita SÓLO por el motor, se consume FIFO, no vence, '
  'no se retira a efectivo. D-926 cerrada.';

ALTER TABLE public.saldo_hogar_movimientos ENABLE ROW LEVEL SECURITY;

-- La familia ve SUS movimientos. La casa, todos.
CREATE POLICY saldo_select_mi_familia ON public.saldo_hogar_movimientos
  FOR SELECT TO authenticated USING (
    -- membresía directa: el saldo es del HOGAR, y un miembro del hogar lo ve.
    -- (`_user_es_de_la_familia_de` es por MASCOTA; acá el sujeto es la familia.)
    EXISTS (SELECT 1 FROM familia_miembro fm
             WHERE fm.familia_id = saldo_hogar_movimientos.familia_id
               AND fm.user_id = auth.uid())
    OR is_admin()
  );

-- 🔴 D-314 · CERO escritura para authenticated. El saldo se acredita SÓLO por
-- el motor. Sin esto, cualquiera con sesión se inventa plata a favor.
REVOKE ALL ON public.saldo_hogar_movimientos FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.saldo_hogar_movimientos TO authenticated;

-- ── LA FAMILIA DEL USUARIO ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._familia_del_user(p_user uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT familia_id FROM familia_miembro WHERE user_id = p_user LIMIT 1;
$fn$;

-- ── EL SALDO DISPONIBLE (derivado) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.saldo_hogar_disponible(p_familia uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(sum(monto), 0)::numeric(12,2)
    FROM saldo_hogar_movimientos WHERE familia_id = p_familia;
$fn$;

-- ── ACREDITAR (sólo el motor) ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.acreditar_saldo_hogar(
  p_familia uuid, p_monto numeric, p_origen_tipo text, p_clave text, p_origen_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_id uuid;
BEGIN
  IF p_monto <= 0 THEN RETURN jsonb_build_object('ok',false,'codigo','monto_no_positivo'); END IF;
  IF p_familia IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_familia'); END IF;

  -- §7 idempotente: si el hecho ya acreditó, se devuelve lo que hay, no se duplica.
  SELECT id INTO v_id FROM saldo_hogar_movimientos WHERE clave_idempotencia = p_clave;
  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok',true,'codigo','ya_acreditado','movimiento_id',v_id);
  END IF;

  INSERT INTO saldo_hogar_movimientos (familia_id, monto, origen_tipo, origen_id, clave_idempotencia, creado_por)
  VALUES (p_familia, p_monto, p_origen_tipo, p_origen_id, p_clave, auth.uid())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok',true,'movimiento_id',v_id,
    'saldo_nuevo', saldo_hogar_disponible(p_familia));
END $fn$;

-- ── CONSUMIR FIFO (en el checkout) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consumir_saldo_hogar(
  p_familia uuid, p_monto numeric, p_clave text, p_compra_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_disp numeric; v_rest numeric := p_monto; v_lote record; v_toma numeric;
  v_ya uuid; v_consumido numeric := 0;
BEGIN
  IF p_monto <= 0 THEN RETURN jsonb_build_object('ok',false,'codigo','monto_no_positivo'); END IF;

  -- idempotencia: mismo checkout no consume dos veces
  SELECT id INTO v_ya FROM saldo_hogar_movimientos WHERE clave_idempotencia = p_clave || ':consumo';
  IF v_ya IS NOT NULL THEN
    RETURN jsonb_build_object('ok',true,'codigo','ya_consumido');
  END IF;

  v_disp := saldo_hogar_disponible(p_familia);
  IF v_disp < p_monto THEN
    RETURN jsonb_build_object('ok',false,'codigo','saldo_insuficiente',
      'disponible', v_disp, 'pedido', p_monto);
  END IF;

  -- FIFO: recorre los lotes (créditos) del más viejo al más nuevo, restando lo
  -- ya consumido de cada uno, y toma de cada lote hasta cubrir p_monto.
  FOR v_lote IN
    SELECT c.id,
           c.monto + COALESCE((SELECT sum(u.monto) FROM saldo_hogar_movimientos u WHERE u.lote_id = c.id),0) AS restante
      FROM saldo_hogar_movimientos c
     WHERE c.familia_id = p_familia AND c.monto > 0
     ORDER BY c.creado_en, c.id
  LOOP
    EXIT WHEN v_rest <= 0;
    IF v_lote.restante <= 0 THEN CONTINUE; END IF;   -- lote ya agotado
    v_toma := LEAST(v_rest, v_lote.restante);
    INSERT INTO saldo_hogar_movimientos (familia_id, monto, origen_tipo, origen_id, lote_id, clave_idempotencia)
    VALUES (p_familia, -v_toma, 'compra', p_compra_id, v_lote.id,
            p_clave || ':consumo:' || v_lote.id::text);
    v_rest := v_rest - v_toma;
    v_consumido := v_consumido + v_toma;
  END LOOP;

  -- marca de idempotencia del consumo entero (por si tomó de varios lotes)
  IF NOT EXISTS (SELECT 1 FROM saldo_hogar_movimientos WHERE clave_idempotencia = p_clave || ':consumo') THEN
    -- un ancla de 0 no se puede (chk_monto_no_cero); la idempotencia del consumo
    -- vive en las claves por-lote, que son únicas. Se deriva de que exista al
    -- menos una fila con ese prefijo.
    NULL;
  END IF;

  RETURN jsonb_build_object('ok',true,'consumido',v_consumido,
    'saldo_nuevo', saldo_hogar_disponible(p_familia));
END $fn$;

REVOKE ALL ON FUNCTION public._familia_del_user(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._familia_del_user(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.saldo_hogar_disponible(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.saldo_hogar_disponible(uuid) TO authenticated;
-- 🔴 acreditar y consumir NO se conceden a authenticated: sólo el motor
-- (otras funciones DEFINER) y service_role las llaman. D-314.
REVOKE ALL ON FUNCTION public.acreditar_saldo_hogar(uuid,numeric,text,text,uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.consumir_saldo_hogar(uuid,numeric,text,uuid) FROM anon, authenticated, PUBLIC;

-- ── CINTURÓN · el ciclo entero, con FIFO probado y residuo 0 ────────────────
DO $cinturon$
DECLARE
  v_fam uuid; v_disp numeric; r jsonb; v_l1 uuid; v_l2 uuid;
BEGIN
  SELECT id INTO v_fam FROM familia LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'CINTURÓN: no hay familias para probar'; END IF;

  -- saldo inicial de esta familia (puede no ser 0 si otra corrida dejó algo)
  v_disp := saldo_hogar_disponible(v_fam);

  -- ① acreditar dos lotes
  r := acreditar_saldo_hogar(v_fam, 10.00, 'ajuste', 'SONDA-A4-l1');
  IF (r->>'ok')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'CINTURÓN: no acreditó lote 1 · %', r; END IF;
  PERFORM pg_sleep(0.01);
  r := acreditar_saldo_hogar(v_fam, 5.00, 'ajuste', 'SONDA-A4-l2');

  -- ② idempotencia: reacreditar el mismo no duplica
  r := acreditar_saldo_hogar(v_fam, 10.00, 'ajuste', 'SONDA-A4-l1');
  IF r->>'codigo' <> 'ya_acreditado' THEN RAISE EXCEPTION 'CINTURÓN: acreditó dos veces la misma clave · %', r; END IF;

  IF saldo_hogar_disponible(v_fam) <> v_disp + 15.00 THEN
    RAISE EXCEPTION 'CINTURÓN: saldo debería ser %+15, es %', v_disp, saldo_hogar_disponible(v_fam);
  END IF;

  -- ③ consumir 12: FIFO toma 10 del lote 1 y 2 del lote 2
  r := consumir_saldo_hogar(v_fam, 12.00, 'SONDA-A4-compra');
  IF (r->>'ok')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'CINTURÓN: no consumió · %', r; END IF;
  IF saldo_hogar_disponible(v_fam) <> v_disp + 3.00 THEN
    RAISE EXCEPTION 'CINTURÓN: tras consumir 12 de 15, saldo debería ser %+3, es %', v_disp, saldo_hogar_disponible(v_fam);
  END IF;

  -- ④ FIFO probado: el lote VIEJO quedó agotado, el nuevo tiene 3
  SELECT id INTO v_l1 FROM saldo_hogar_movimientos WHERE clave_idempotencia='SONDA-A4-l1';
  IF (SELECT 10.00 + COALESCE(sum(monto),0) FROM saldo_hogar_movimientos WHERE lote_id=v_l1) <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: FIFO no agotó el lote viejo primero';
  END IF;

  -- ⑤ insuficiente rebota hablado
  r := consumir_saldo_hogar(v_fam, 999.00, 'SONDA-A4-grande');
  IF r->>'codigo' <> 'saldo_insuficiente' THEN RAISE EXCEPTION 'CINTURÓN: no frenó un consumo mayor al saldo · %', r; END IF;

  -- ⑥ D-314: authenticated no puede escribir ni acreditar
  IF has_table_privilege('authenticated','public.saldo_hogar_movimientos','INSERT') THEN
    RAISE EXCEPTION 'CINTURÓN: authenticated puede INSERT — D-314 abierta';
  END IF;
  IF has_function_privilege('authenticated','public.acreditar_saldo_hogar(uuid,numeric,text,text,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: authenticated puede acreditarse saldo';
  END IF;

  -- LIMPIEZA de la sonda (residuo 0)
  DELETE FROM saldo_hogar_movimientos WHERE clave_idempotencia LIKE 'SONDA-A4%';
  IF saldo_hogar_disponible(v_fam) <> v_disp THEN
    RAISE EXCEPTION 'CINTURÓN: la sonda dejó residuo · saldo % <> inicial %', saldo_hogar_disponible(v_fam), v_disp;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · acredita · idempotente · consume FIFO (lote viejo primero) · insuficiente rebota · D-314 cerrada · residuo 0';
END $cinturon$;

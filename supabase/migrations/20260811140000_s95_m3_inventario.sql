-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 3 — EL INVENTARIO
--
-- `MODELO_DESPENSA` §3.3: «Stock: movimientos, no un número que se pisa.
-- Append-only. La reserva se bloquea al confirmar.» §9.1: «la disponibilidad
-- se verifica contra stock al confirmar, y la reserva se bloquea ahí, no
-- antes.»
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m3-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. DDL puramente aditivo: tres tablas nuevas, un trigger
-- y una vista. Cero backfill, cero borrado, cero anclas sobre datos vivos.
--
-- ── LAS TRES DECISIONES ───────────────────────────────────────────────────
-- ① **El ledger es la fuente de verdad; el número es lectura rápida.**
--    `vendedor_skus.stock_disponible` NO se escribe a mano: lo materializa un
--    trigger desde `inventario_movimientos`. Es el mismo patrón que
--    `mascota_perfil_vigente` sobre `eventos_mascota` — nadie recorre el
--    timeline para saber qué alergias tiene Thor hoy.
-- ② **Append-only como lo hace esta casa:** no un trigger que prohíbe, sino la
--    AUSENCIA de policy de escritura y de grant de UPDATE. Molde de
--    `eventos_economicos`.
-- ③ **La reserva expira sola por lectura perezosa; el cron es higiene.**
--    Precedente literal del hold de agenda (S54): la expiración perezosa es
--    CORRECTITUD, el barrido es limpieza. Una reserva vencida no bloquea stock
--    aunque nadie la haya barrido todavía.
--
-- ── LO QUE NO SE PARTE EN v1, DECLARADO ───────────────────────────────────
-- El saldo es por SKU, NO por bodega. `bodega_id` viaja en el movimiento para
-- que el día del segundo depósito no haya que migrar, pero con una sola bodega
-- partir el saldo es complejidad sin uso.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · EL ORIGEN DE DESPACHO — una en v1, modelada como N
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vendedor_bodegas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  nombre              text NOT NULL,
  ciudad              text,
  sector              text,
  direccion           text,
  referencia          text,
  lat                 double precision,
  lon                 double precision,
  country_code        text NOT NULL DEFAULT 'EC' REFERENCES public.country_config(country_code),
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bodegas_cuenta ON public.vendedor_bodegas (cuenta_comercial_id, activo);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · EL LEDGER DE STOCK — append-only
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.inventario_movimientos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id          uuid NOT NULL REFERENCES public.vendedor_skus(id) ON DELETE RESTRICT,
  bodega_id       uuid REFERENCES public.vendedor_bodegas(id) ON DELETE RESTRICT,
  tipo            text NOT NULL CHECK (tipo IN (
                    'ingreso',            -- entra mercadería
                    'ajuste',             -- corrección de inventario (con signo)
                    'merma',              -- se rompió, venció, se perdió
                    'reserva',            -- se bloquea al CONFIRMAR el pedido
                    'liberacion_reserva', -- el pago no completó, o se canceló
                    'consumo'             -- salió del depósito: se despachó
                  )),
  cantidad        integer NOT NULL CHECK (cantidad <> 0),
  motivo          text,
  referencia_tipo text CHECK (referencia_tipo IN ('pedido','manual','expiracion','carga_inicial')),
  referencia_id   uuid,
  creado_por      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- El signo lo define el TIPO, no quien escribe: un movimiento de reserva con
  -- cantidad negativa es un estado que no debe poder existir.
  CONSTRAINT chk_signo_por_tipo CHECK (
    (tipo IN ('ingreso','reserva','liberacion_reserva','consumo','merma') AND cantidad > 0)
    OR tipo = 'ajuste'
  )
);
CREATE INDEX idx_movimientos_sku ON public.inventario_movimientos (sku_id, created_at DESC);
CREATE INDEX idx_movimientos_ref ON public.inventario_movimientos (referencia_tipo, referencia_id);

COMMENT ON TABLE public.inventario_movimientos IS
  'APPEND-ONLY. La inmutabilidad NO la da un trigger: la da la ausencia de '
  'policy de UPDATE/DELETE y de grant de mutación. Molde de eventos_economicos.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LA RESERVA — se bloquea al confirmar y expira sola
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.inventario_reservas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id      uuid NOT NULL REFERENCES public.vendedor_skus(id) ON DELETE RESTRICT,
  pedido_id   uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  cantidad    integer NOT NULL CHECK (cantidad > 0),
  estado      text NOT NULL DEFAULT 'vigente'
              CHECK (estado IN ('vigente','consumida','liberada','expirada')),
  expira_en   timestamptz NOT NULL,
  creada_en   timestamptz NOT NULL DEFAULT now(),
  cerrada_en  timestamptz,
  UNIQUE (pedido_id, sku_id),
  CHECK (estado = 'vigente' OR cerrada_en IS NOT NULL)
);
CREATE INDEX idx_reservas_vigentes ON public.inventario_reservas (estado, expira_en)
  WHERE estado = 'vigente';

-- 🔴 LA LECTURA PEREZOSA ES LA CORRECTITUD. Toda pregunta por «¿está
--    reservado?» pasa por acá, jamás por `estado='vigente'` a secas: una
--    reserva vencida deja de bloquear en el instante en que vence, no cuando
--    el barrido pasa.
CREATE VIEW public.v_inventario_reservas_vigentes AS
  SELECT * FROM public.inventario_reservas
  WHERE estado = 'vigente' AND expira_en > now();

COMMENT ON VIEW public.v_inventario_reservas_vigentes IS
  'Precedente literal del hold de agenda (S54): la expiración PEREZOSA es '
  'correctitud; el cron es higiene. Una reserva vencida no bloquea stock '
  'aunque nadie la haya barrido.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · LA MATERIALIZACIÓN — el número lo escribe el ledger
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_inventario_aplicar_movimiento()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_delta_disp integer := 0;
  v_delta_res  integer := 0;
BEGIN
  CASE NEW.tipo
    WHEN 'ingreso'            THEN v_delta_disp :=  NEW.cantidad;
    WHEN 'ajuste'             THEN v_delta_disp :=  NEW.cantidad;   -- con signo
    WHEN 'merma'              THEN v_delta_disp := -NEW.cantidad;
    WHEN 'reserva'            THEN v_delta_disp := -NEW.cantidad; v_delta_res :=  NEW.cantidad;
    WHEN 'liberacion_reserva' THEN v_delta_disp :=  NEW.cantidad; v_delta_res := -NEW.cantidad;
    WHEN 'consumo'            THEN v_delta_res  := -NEW.cantidad;  -- sale de lo reservado
    ELSE RAISE EXCEPTION 'tipo de movimiento no soportado: %', NEW.tipo;
  END CASE;

  UPDATE vendedor_skus
     SET stock_disponible = stock_disponible + v_delta_disp,
         stock_reservado  = stock_reservado  + v_delta_res,
         updated_at       = now()
   WHERE id = NEW.sku_id;

  -- Los CHECK `>= 0` de vendedor_skus son los que rebotan sobrerreserva y
  -- consumo de lo que no está reservado. No hace falta duplicarlos acá: el
  -- estado imposible ya es inexpresable en la tabla del saldo.
  RETURN NEW;
END $$;

CREATE TRIGGER trg_inventario_aplicar_movimiento
  AFTER INSERT ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public._trg_inventario_aplicar_movimiento();

-- Barrido de higiene. NO es la correctitud (eso lo da la vista de arriba):
-- solo cierra las filas para que la tabla no acumule «vigentes» mentirosas.
CREATE OR REPLACE FUNCTION public.expirar_reservas_vencidas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_r record; v_n int := 0;
BEGIN
  FOR v_r IN
    SELECT * FROM inventario_reservas
     WHERE estado = 'vigente' AND expira_en <= now()
     FOR UPDATE
  LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              'reserva vencida sin pago', 'expiracion', v_r.id);
    UPDATE inventario_reservas
       SET estado = 'expirada', cerrada_en = now()
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'expiradas', v_n, 'corrida_en', now());
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · RLS Y GRANTS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vendedor_bodegas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_reservas    ENABLE ROW LEVEL SECURITY;

CREATE POLICY bodegas_select ON public.vendedor_bodegas FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_insert ON public.vendedor_bodegas FOR INSERT TO authenticated
  WITH CHECK (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_update ON public.vendedor_bodegas FOR UPDATE TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin())
  WITH CHECK (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY bodegas_delete ON public.vendedor_bodegas FOR DELETE TO authenticated
  USING (is_admin());

-- 🔴 EL LEDGER: SELECT e INSERT y NADA MÁS. Sin policy de UPDATE ni de DELETE
--    — ni para el admin. Un ledger que el admin puede editar no es un ledger.
CREATE POLICY movimientos_select ON public.inventario_movimientos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vendedor_skus s
                  WHERE s.id = inventario_movimientos.sku_id
                    AND (es_vendedor_de(s.cuenta_comercial_id) OR is_admin())));
CREATE POLICY movimientos_insert ON public.inventario_movimientos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM vendedor_skus s
                       WHERE s.id = inventario_movimientos.sku_id
                         AND (es_vendedor_de(s.cuenta_comercial_id) OR is_admin())));

-- La reserva la ve su dueño y el vendedor; la escribe SOLO el motor
-- (funciones SECURITY DEFINER) o el admin.
CREATE POLICY reservas_select ON public.inventario_reservas FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM pedidos p WHERE p.id = inventario_reservas.pedido_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM vendedor_skus s WHERE s.id = inventario_reservas.sku_id
                 AND es_vendedor_de(s.cuenta_comercial_id))
    OR is_admin());
CREATE POLICY reservas_insert ON public.inventario_reservas FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY reservas_update ON public.inventario_reservas FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 🔴 EL REVOKE INCLUYE A `authenticated`, Y NO ES PROLIJIDAD.
--    Los DEFAULT PRIVILEGES de Supabase conceden TODO (incluidos UPDATE,
--    DELETE y TRUNCATE) a `anon` y `authenticated` sobre cada tabla nueva de
--    `public`. **Un GRANT de menos NO quita lo de más.**
--
--    Este defecto estaba en la primera versión de esta migración —el REVOKE
--    solo nombraba a `anon` y `PUBLIC`— y **lo cazó el cinturón ② al abortar
--    con `authenticated puede UPDATE sobre inventario_movimientos`**. Sin ese
--    cinturón, el ledger habría nacido mutable y las policies habrían dado la
--    apariencia de append-only. Es L-140 en su forma de tabla: lo que hay que
--    cerrar es el DEFAULT, no agregar el permiso correcto al lado.
REVOKE ALL ON public.vendedor_bodegas, public.inventario_movimientos,
              public.inventario_reservas, public.v_inventario_reservas_vigentes
  FROM anon, authenticated, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendedor_bodegas TO authenticated;
-- 🔴 APPEND-ONLY EN EL GRANT, no solo en la policy: sin UPDATE ni DELETE.
GRANT SELECT, INSERT ON public.inventario_movimientos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inventario_reservas TO authenticated;
GRANT SELECT ON public.v_inventario_reservas_vigentes TO authenticated;

REVOKE ALL ON FUNCTION public.expirar_reservas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expirar_reservas_vencidas() TO service_role;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES — con datos reales, creados y deshechos acá adentro
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① EL LEDGER MUEVE EL NÚMERO, Y LA SOBRERRESERVA REBOTA.
--    No se verifica que el trigger exista: se le da de comer y se mira el saldo.
DO $$
DECLARE
  v_prod uuid; v_var uuid; v_cc uuid; v_sku uuid;
  v_disp int; v_res int; v_ok boolean := false;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;
  INSERT INTO productos (nombre, familia_codigo, estado)
    VALUES ('__cinturon_s95_m3', 'alimento', 'activo') RETURNING id INTO v_prod;
  INSERT INTO producto_variantes (producto_id, codigo, presentacion, impuesto_codigo)
    VALUES (v_prod, '15kg', '15 kg', 'EC_IVA_15') RETURNING id INTO v_var;
  INSERT INTO vendedor_skus (cuenta_comercial_id, variante_id, sku_vendedor, estado)
    VALUES (v_cc, v_var, '__cint_m3', 'aceptado') RETURNING id INTO v_sku;

  -- El saldo nace en cero y NADIE lo escribió a mano.
  SELECT stock_disponible INTO v_disp FROM vendedor_skus WHERE id = v_sku;
  IF v_disp <> 0 THEN RAISE EXCEPTION 'ABORTA: el SKU no nació con saldo 0 (es %).', v_disp; END IF;

  -- Ingreso de 10 → disponible 10.
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
    VALUES (v_sku, 'ingreso', 10, 'carga_inicial');
  SELECT stock_disponible, stock_reservado INTO v_disp, v_res FROM vendedor_skus WHERE id = v_sku;
  IF (v_disp, v_res) IS DISTINCT FROM (10, 0) THEN
    RAISE EXCEPTION 'ABORTA: tras ingresar 10 el saldo es %/% y debía ser 10/0.', v_disp, v_res;
  END IF;

  -- Reserva de 3 → 7 disponibles, 3 reservados.
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
    VALUES (v_sku, 'reserva', 3, 'pedido');
  SELECT stock_disponible, stock_reservado INTO v_disp, v_res FROM vendedor_skus WHERE id = v_sku;
  IF (v_disp, v_res) IS DISTINCT FROM (7, 3) THEN
    RAISE EXCEPTION 'ABORTA: tras reservar 3 el saldo es %/% y debía ser 7/3.', v_disp, v_res;
  END IF;

  -- Consumo de 3 → 7 disponibles, 0 reservados (salió del depósito).
  INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
    VALUES (v_sku, 'consumo', 3, 'pedido');
  SELECT stock_disponible, stock_reservado INTO v_disp, v_res FROM vendedor_skus WHERE id = v_sku;
  IF (v_disp, v_res) IS DISTINCT FROM (7, 0) THEN
    RAISE EXCEPTION 'ABORTA: tras consumir 3 el saldo es %/% y debía ser 7/0.', v_disp, v_res;
  END IF;

  -- 🔴 EL DISCRIMINADOR: reservar 99 sobre 7 disponibles tiene que REBOTAR.
  BEGIN
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo)
      VALUES (v_sku, 'reserva', 99, 'pedido');
  EXCEPTION WHEN check_violation THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se reservaron 99 unidades sobre 7 disponibles. El stock puede quedar negativo.';
  END IF;

  -- Y un movimiento con cantidad negativa en un tipo que no la admite.
  v_ok := false;
  BEGIN
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad) VALUES (v_sku, 'ingreso', -5);
  EXCEPTION WHEN check_violation THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: un ingreso aceptó cantidad negativa.';
  END IF;

  DELETE FROM inventario_movimientos WHERE sku_id = v_sku;
  DELETE FROM vendedor_skus WHERE id = v_sku;
  DELETE FROM producto_variantes WHERE id = v_var;
  DELETE FROM productos WHERE id = v_prod;
END $$;

-- 🔴 ② APPEND-ONLY MEDIDO POR EL PRIVILEGIO EFECTIVO, no por la policy.
--    `has_table_privilege` resuelve la herencia de PUBLIC (L-216).
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(r || ' puede ' || p || ' sobre ' || t, ', ') INTO v_mal
  FROM unnest(ARRAY['inventario_movimientos']) t,
       unnest(ARRAY['anon','authenticated']) r,
       unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.'||t, p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: el ledger de stock NO es append-only (%).', v_mal;
  END IF;
  -- Contra-caso: el camino legítimo sigue abierto.
  IF NOT has_table_privilege('authenticated', 'public.inventario_movimientos', 'INSERT') THEN
    RAISE EXCEPTION 'ABORTA: se cerró también el INSERT del ledger.';
  END IF;
END $$;

-- ③ Cero policies ALL y anon sin nada sobre lo nuevo.
DO $$
DECLARE v_all text; v_anon text;
BEGIN
  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('vendedor_bodegas','inventario_movimientos','inventario_reservas');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY[
    'vendedor_bodegas','inventario_movimientos','inventario_reservas']) x
  WHERE has_table_privilege('anon', 'public.'||x, 'SELECT')
     OR has_table_privilege('anon', 'public.'||x, 'INSERT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;
END $$;

-- ④ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM productos WHERE nombre LIKE '\_\_cinturon\_s95%';
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % fixtures.', v_n; END IF;
  SELECT count(*) INTO v_n FROM inventario_movimientos;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % movimientos de fixture.', v_n; END IF;
END $$;

COMMIT;

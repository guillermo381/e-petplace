-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · UN SOLO INVENTARIO, DOS BOCAS — el reloj, su gate, la voz y el juez
--
-- FIRMA DEL FOUNDER (16-ago): «tanto si vendo desde el local como si vendo a
-- través de e-PetPlace me tiene que afectar el inventario… tiene un ÚNICO
-- inventario» · «un pedido que esté en el carrito por X tiempo se le elimina
-- la reserva… si el cliente quiere retomar, tiene que volver a validar contra
-- stock, y si no lo tienen, le dice PRODUCTO YA NO DISPONIBLE».
--
-- 🔴 LO QUE ESTA MIGRACIÓN NO HACE, Y ES SU HALLAZGO: **no enciende el reloj
-- tal como estaba escrito, porque encenderlo así libera mercadería VENDIDA.**
-- Medido el 16-ago contra la base: `expirar_reservas_vencidas` filtra SOLO por
-- `expira_en <= now()` y **no mira el estado del pedido**. Y las reservas
-- vigentes de hoy son **13, las 13 de pedidos PAGADOS** (liberado_preparacion
-- 8 · documentado 3 · en_reparto 2), **12 con su `expira_en` ya pasado** ⇒ un
-- solo tick habría devuelto **15 unidades vendidas** al disponible, y el
-- mostrador podría venderlas de nuevo. *La sobreventa que el founder temía la
-- habría causado la cura, no la falta de cura.*
--
-- ⇒ EL ORDEN CORRECTO ES: **primero el gate, después el reloj.** Con el gate,
-- el reloj es seguro POR CONSTRUCCIÓN y no por cuidado (patrón L-222: el
-- estado malo se vuelve inexpresable).
--
-- ⚠️ Y LA MITAD QUE YA ESTABA BIEN, para que nadie la re-audite: el carrito
-- abandonado **ya está cubierto** — `expirar_pedidos_sin_pago` tiene cron
-- horario, **91 corridas `succeeded`** (última 17:07 de hoy) y libera las
-- reservas por el ledger; hay **cero** pedidos `creado`/`esperando_pago`
-- viejos. Lo que faltaba no era el barrendero del carrito: era el reloj de la
-- reserva de quien empezó a pagar y no terminó.
--
-- 📌 EL PLAZO NO SE DECIDE ACÁ PORQUE YA ESTABA DECIDIDO: la reserva nace con
-- `reservar_stock_pedido(p_minutos_vigencia integer DEFAULT 30)` — **30
-- minutos, en el esquema desde S95**, y coincide con el voto de mesa. La ley
-- del founder necesitaba el reloj, no un número nuevo.
--
-- 76(g): NO RIGE — no hay backfill de anclas. La ÚNICA escritura de datos es
-- la reconciliación de DOS filas de prueba (`PRUEBA-*`, cuenta «borrable»),
-- con su valor previo guardado fila por fila para poder volver.
-- Reversa: `docs/relevamientos/2026-08-16-s99a-REVERSA-dos-bocas.sql`,
-- escrita ANTES, con su advertencia de que revertir REARMA el arma.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ① LA VOZ DEL SALDO (D-827 en la puerta que más lo necesita)
--
-- Hoy el rechazo por falta de stock llega como VIOLACIÓN DE CONSTRAINT: la
-- pantalla no puede decir «ya no queda», solo «algo salió mal» — y es el
-- último paso de una compra, el peor momento posible para una voz genérica.
-- El CHECK se queda (es el invariante); lo que gana el trigger es DECIRLO
-- ANTES, con código tipado. Un solo lugar: es la puerta única del saldo.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_inventario_aplicar_movimiento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_delta_disp integer := 0;
  v_delta_res  integer := 0;
  v_disp       integer;
  v_res        integer;
BEGIN
  CASE NEW.tipo
    WHEN 'ingreso'            THEN v_delta_disp :=  NEW.cantidad;
    WHEN 'ajuste'             THEN v_delta_disp :=  NEW.cantidad;   -- con signo
    WHEN 'merma'              THEN v_delta_disp := -NEW.cantidad;
    WHEN 'reserva'            THEN v_delta_disp := -NEW.cantidad; v_delta_res :=  NEW.cantidad;
    WHEN 'liberacion_reserva' THEN v_delta_disp :=  NEW.cantidad; v_delta_res := -NEW.cantidad;
    WHEN 'consumo'            THEN v_delta_res  := -NEW.cantidad;  -- sale de lo reservado
    -- S96: la venta de mostrador sale del DISPONIBLE — nunca hubo reserva.
    WHEN 'venta_directa'      THEN v_delta_disp := -NEW.cantidad;
    ELSE RAISE EXCEPTION 'tipo de movimiento no soportado: %', NEW.tipo;
  END CASE;

  -- 🔴 LA VOZ, ANTES DEL CHOQUE. Bloquea la fila del saldo para que dos bocas
  -- simultáneas se ordenen acá y no en el CHECK (el lock del UPDATE ya las
  -- ordenaba; lo que faltaba era que el rechazo se pudiera DECIR).
  SELECT stock_disponible, stock_reservado INTO v_disp, v_res
    FROM vendedor_skus WHERE id = NEW.sku_id FOR UPDATE;
  IF v_disp IS NULL THEN
    RAISE EXCEPTION 'sku_inexistente: % no tiene saldo de inventario', NEW.sku_id
      USING ERRCODE = '22023';
  END IF;
  IF v_disp + v_delta_disp < 0 THEN
    RAISE EXCEPTION 'stock_insuficiente: quedan % y el movimiento pide %',
      v_disp, -v_delta_disp USING ERRCODE = '22023';
  END IF;
  IF v_res + v_delta_res < 0 THEN
    RAISE EXCEPTION 'reserva_insuficiente: hay % reservadas y el movimiento libera %',
      v_res, -v_delta_res USING ERRCODE = '22023';
  END IF;

  UPDATE vendedor_skus
     SET stock_disponible = stock_disponible + v_delta_disp,
         stock_reservado  = stock_reservado  + v_delta_res,
         updated_at       = now()
   WHERE id = NEW.sku_id;

  -- Los CHECK `>= 0` de vendedor_skus SIGUEN SIENDO el invariante: la voz de
  -- arriba es para la persona, el CHECK es para la verdad. Si algún día un
  -- camino nuevo escribe sin pasar por acá, el CHECK lo rebota igual.
  RETURN NEW;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ② EL GATE QUE VUELVE SEGURO AL RELOJ
--
-- La reserva de un pedido PAGADO no tiene reloj: su compromiso ya no es del
-- carrito, es de la venta, y se cierra al ENTREGAR (`entregar_pedido` escribe
-- el `consumo`). `expira_en` solo significa algo mientras el pedido no está
-- pagado — y esta función ahora lo dice con su WHERE.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expirar_reservas_vencidas()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_r record; v_n int := 0; v_u int := 0;
BEGIN
  FOR v_r IN
    SELECT r.* FROM inventario_reservas r
     JOIN pedidos p ON p.id = r.pedido_id
     WHERE r.estado = 'vigente'
       AND r.expira_en <= now()
       -- 🔴 EL GATE: solo lo que todavía no se pagó. Sin esta línea, un tick
       -- libera mercadería VENDIDA y el mostrador la vuelve a vender.
       AND p.estado IN ('creado', 'esperando_pago')
     FOR UPDATE OF r
  LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              'reserva vencida sin pago (el carrito sigue vivo; se revalida al retomar)',
              'expiracion', v_r.id);
    UPDATE inventario_reservas SET estado = 'expirada', cerrada_en = now() WHERE id = v_r.id;
    v_n := v_n + 1;
    v_u := v_u + v_r.cantidad;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'expiradas', v_n, 'unidades_liberadas', v_u,
                            'corrida_en', now());
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ③ EL RELOJ — y su porqué escrito, que es la firma del founder.
-- Cada 5 minutos: una unidad queda apartada 30 min (su vigencia) más 5 de
-- resolución del reloj, jamás media tarde. `cron.schedule` con el mismo
-- nombre REEMPLAZA, así que re-aplicar la migración no duplica el job.
-- ───────────────────────────────────────────────────────────────────────────
SELECT cron.schedule('expirar-reservas-vencidas', '*/5 * * * *',
                     'SELECT public.expirar_reservas_vencidas();');

-- ───────────────────────────────────────────────────────────────────────────
-- ④ EL JUEZ DEL SALDO — que el saldo no pueda irse del ledger sin testigo.
--
-- El saldo de `vendedor_skus` es DERIVADO: su verdad está en el ledger. Nada
-- comparaba las dos cosas, y por eso una divergencia de S95-K vivió cuatro
-- días sin que fallara nada. Este juez es el testigo permanente.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verificar_coherencia_inventario()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  WITH led AS (
    SELECT sku_id,
      SUM(CASE tipo WHEN 'ingreso' THEN cantidad WHEN 'ajuste' THEN cantidad
                    WHEN 'merma' THEN -cantidad WHEN 'reserva' THEN -cantidad
                    WHEN 'liberacion_reserva' THEN cantidad
                    WHEN 'venta_directa' THEN -cantidad ELSE 0 END) AS disp_ledger,
      SUM(CASE tipo WHEN 'reserva' THEN cantidad WHEN 'liberacion_reserva' THEN -cantidad
                    WHEN 'consumo' THEN -cantidad ELSE 0 END) AS res_ledger
    FROM inventario_movimientos GROUP BY sku_id)
  SELECT jsonb_build_object(
    'ok', true,
    'skus_con_movimientos', (SELECT count(*) FROM led),
    'divergentes', (SELECT count(*) FROM led JOIN vendedor_skus vs ON vs.id = led.sku_id
                     WHERE vs.stock_disponible <> led.disp_ledger
                        OR vs.stock_reservado  <> led.res_ledger),
    'detalle', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'sku_id', vs.id, 'sku_vendedor', vs.sku_vendedor,
                    'disponible_saldo', vs.stock_disponible, 'disponible_ledger', led.disp_ledger,
                    'reservado_saldo', vs.stock_reservado,  'reservado_ledger', led.res_ledger))
                  FROM led JOIN vendedor_skus vs ON vs.id = led.sku_id
                  WHERE vs.stock_disponible <> led.disp_ledger
                     OR vs.stock_reservado  <> led.res_ledger), '[]'::jsonb),
    'medido_en', now());
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑤ LA RECONCILIACIÓN — con rastro, porque un saldo corregido sin testigo es
-- exactamente lo que produjo este lío.
--
-- 🔴 POR QUÉ ESTO NO VIOLA «jamás por UPDATE»: la regla protege contra
-- escrituras ARBITRARIAS del saldo. Recomputar un derivado DESDE SU FUENTE es
-- lo contrario de arbitrario — es restaurar el invariante. Y deja fila.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventario_reconciliaciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id            uuid NOT NULL REFERENCES public.vendedor_skus(id) ON DELETE CASCADE,
  antes_disponible  integer NOT NULL,
  antes_reservado   integer NOT NULL,
  despues_disponible integer NOT NULL,
  despues_reservado  integer NOT NULL,
  motivo            text NOT NULL,
  reconciliada_por  uuid,
  creada_en         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventario_reconciliaciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventario_reconciliaciones FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reconciliar_inventario_sku(p_sku_id uuid, p_motivo text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_antes record; v_disp int; v_res int;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'motivo_requerido: una corrección de saldo sin motivo es la que produjo este lío'
      USING ERRCODE = '22023';
  END IF;

  SELECT stock_disponible, stock_reservado INTO v_antes
    FROM vendedor_skus WHERE id = p_sku_id FOR UPDATE;
  IF v_antes IS NULL THEN
    RAISE EXCEPTION 'sku_inexistente' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(SUM(CASE tipo WHEN 'ingreso' THEN cantidad WHEN 'ajuste' THEN cantidad
                                WHEN 'merma' THEN -cantidad WHEN 'reserva' THEN -cantidad
                                WHEN 'liberacion_reserva' THEN cantidad
                                WHEN 'venta_directa' THEN -cantidad ELSE 0 END), 0),
         COALESCE(SUM(CASE tipo WHEN 'reserva' THEN cantidad WHEN 'liberacion_reserva' THEN -cantidad
                                WHEN 'consumo' THEN -cantidad ELSE 0 END), 0)
    INTO v_disp, v_res
    FROM inventario_movimientos WHERE sku_id = p_sku_id;

  UPDATE vendedor_skus
     SET stock_disponible = v_disp, stock_reservado = v_res, updated_at = now()
   WHERE id = p_sku_id;

  INSERT INTO inventario_reconciliaciones
    (sku_id, antes_disponible, antes_reservado, despues_disponible, despues_reservado,
     motivo, reconciliada_por)
  VALUES (p_sku_id, v_antes.stock_disponible, v_antes.stock_reservado, v_disp, v_res,
          p_motivo, auth.uid());

  RETURN jsonb_build_object('ok', true, 'sku_id', p_sku_id,
    'antes', jsonb_build_object('disponible', v_antes.stock_disponible,
                                'reservado', v_antes.stock_reservado),
    'despues', jsonb_build_object('disponible', v_disp, 'reservado', v_res));
END $$;

-- L-140 en las tres funciones nuevas/tocadas que son alcanzables por PostgREST.
REVOKE EXECUTE ON FUNCTION public.expirar_reservas_vencidas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verificar_coherencia_inventario() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.verificar_coherencia_inventario() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reconciliar_inventario_sku(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reconciliar_inventario_sku(uuid, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — cinco brazos, cada uno con su discriminador.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig  text := current_user;
  v_viejo    int;
  v_nuevo    int;
  v_r        jsonb;
  v_cod      text;
  v_sku      uuid;
  v_divs     int;
  v_antes_d  int;
  v_antes_r  int;
  v_disp     int;
  v_res      int;
BEGIN
  -- ① EL DISCRIMINADOR DEL GATE: el criterio VIEJO (solo `expira_en`) contra
  --    el NUEVO (además, pedido sin pagar). Si el viejo no toma nada, este
  --    cinturón no probaría nada y hay que decirlo, no dar verde.
  SELECT count(*) INTO v_viejo FROM inventario_reservas r
   WHERE r.estado='vigente' AND r.expira_en <= now();
  SELECT count(*) INTO v_nuevo FROM inventario_reservas r JOIN pedidos p ON p.id=r.pedido_id
   WHERE r.estado='vigente' AND r.expira_en <= now() AND p.estado IN ('creado','esperando_pago');
  IF v_viejo = 0 THEN
    RAISE EXCEPTION 'CINTURÓN ①: el criterio viejo no toma NADA — el discriminador no discrimina, revisar antes de dar verde';
  END IF;
  IF v_nuevo >= v_viejo THEN
    RAISE EXCEPTION 'CINTURÓN ①: el gate no achica (viejo=% nuevo=%) — no estaría protegiendo nada', v_viejo, v_nuevo;
  END IF;
  RAISE NOTICE 'CINTURÓN ①: el gate salva % reserva(s) de pedidos PAGADOS (viejo=% · nuevo=%)',
    v_viejo - v_nuevo, v_viejo, v_nuevo;

  -- ② LA VOZ: un movimiento imposible tiene que rebotar HABLANDO, jamás como
  --    violación de constraint. Se prueba adentro de un savepoint.
  SELECT id INTO v_sku FROM vendedor_skus WHERE stock_disponible = 0 LIMIT 1;
  IF v_sku IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN ②: no hay SKU en cero para probar la voz';
  END IF;
  BEGIN
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo)
      VALUES (v_sku, 'venta_directa', 1, 'CINTURÓN S99-A: prueba de voz', 'manual');
    RAISE EXCEPTION 'CINTURÓN ②: la venta bajo cero NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    v_cod := split_part(SQLERRM, ':', 1);
    IF v_cod <> 'stock_insuficiente' THEN
      RAISE EXCEPTION 'CINTURÓN ②: rebotó sin voz decible — «%»', SQLERRM;
    END IF;
  END;
  RAISE NOTICE 'CINTURÓN ②: la falta de stock se DICE (stock_insuficiente), no se choca';

  -- ③ EL RELOJ, CORRIENDO DE VERDAD — y el brazo que importa no es que expire,
  --    es QUE NO TOQUE LO PAGADO. Con cero pedidos sin pagar hoy, un tick que
  --    devuelva 0 no probaría nada por sí solo; lo que prueba es que las
  --    reservas de pedidos PAGADOS siguen intactas DESPUÉS de correrlo.
  --    (La idempotencia se verifica además del cuerpo: el WHERE toma solo
  --    `vigente` y el loop las marca `expirada` — un segundo tick no las ve.)
  SELECT count(*) INTO v_viejo FROM inventario_reservas r JOIN pedidos p ON p.id=r.pedido_id
   WHERE r.estado='vigente' AND p.estado NOT IN ('creado','esperando_pago');
  v_r := public.expirar_reservas_vencidas();
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURÓN ③: el reloj no corrió — %', v_r;
  END IF;
  SELECT count(*) INTO v_nuevo FROM inventario_reservas r JOIN pedidos p ON p.id=r.pedido_id
   WHERE r.estado='vigente' AND p.estado NOT IN ('creado','esperando_pago');
  IF v_nuevo <> v_viejo THEN
    RAISE EXCEPTION 'CINTURÓN ③: el tick se llevó % reserva(s) de pedidos PAGADOS — el gate no rige',
      v_viejo - v_nuevo;
  END IF;
  IF (v_r ->> 'expiradas')::int <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ③: expiró % con cero pedidos sin pagar — revisar el WHERE', v_r ->> 'expiradas';
  END IF;
  RAISE NOTICE 'CINTURÓN ③: tick corrido — % reserva(s) de pedidos pagados INTACTAS', v_nuevo;

  -- ④ LAS DOS FILAS DE PRUEBA, RECONCILIADAS CON SU RASTRO REAL.
  --    Corre con el rol dueño de la migración (no hay sesión de admin en un
  --    `db push`), y por eso NO llama a la puerta: repite su cuerpo con los
  --    valores previos MEDIDOS, que es lo que la reversa necesita para volver.
  FOR v_sku IN SELECT (e ->> 'sku_id')::uuid
               FROM jsonb_array_elements(public.verificar_coherencia_inventario() -> 'detalle') e
  LOOP
    SELECT stock_disponible, stock_reservado INTO v_antes_d, v_antes_r
      FROM vendedor_skus WHERE id = v_sku FOR UPDATE;
    SELECT COALESCE(SUM(CASE tipo WHEN 'ingreso' THEN cantidad WHEN 'ajuste' THEN cantidad
                                  WHEN 'merma' THEN -cantidad WHEN 'reserva' THEN -cantidad
                                  WHEN 'liberacion_reserva' THEN cantidad
                                  WHEN 'venta_directa' THEN -cantidad ELSE 0 END),0),
           COALESCE(SUM(CASE tipo WHEN 'reserva' THEN cantidad WHEN 'liberacion_reserva' THEN -cantidad
                                  WHEN 'consumo' THEN -cantidad ELSE 0 END),0)
      INTO v_disp, v_res FROM inventario_movimientos WHERE sku_id = v_sku;
    UPDATE vendedor_skus SET stock_disponible = v_disp, stock_reservado = v_res,
                             updated_at = now() WHERE id = v_sku;
    INSERT INTO inventario_reconciliaciones
      (sku_id, antes_disponible, antes_reservado, despues_disponible, despues_reservado, motivo)
    VALUES (v_sku, v_antes_d, v_antes_r, v_disp, v_res,
      'S99-A: residuo de S95-K, que corrigió un ledger append-only BORRANDO filas — '
      || 'su propio motivo lo dice: «la reserva se borró sin su movimiento de liberación». '
      || 'El trigger SIEMPRE descontó bien: 172 de 173 SKU reconcilian exacto.');
    RAISE NOTICE 'CINTURÓN ④: % reconciliado — disp %→% · res %→%',
      v_sku, v_antes_d, v_disp, v_antes_r, v_res;
  END LOOP;

  -- ⑤ EL JUEZ, DESPUÉS: cero divergencias.
  v_divs := (public.verificar_coherencia_inventario() ->> 'divergentes')::int;
  IF v_divs <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN ⑤: quedan % SKU divergiendo del ledger', v_divs;
  END IF;
  RAISE NOTICE 'CINTURÓN ⑤: saldo == ledger en las % filas con movimientos',
    public.verificar_coherencia_inventario() ->> 'skus_con_movimientos';
END $$;

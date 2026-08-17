-- S100-A · NACE «LA COMPRA» — la entidad que se cobra.
--
-- ── POR QUÉ EXISTE, Y POR QUÉ AHORA ─────────────────────────────────────────
-- F5 (firma del founder): *«un carrito, N pedidos independientes en v1; la
-- división se declara antes de pagar y se explica después»*. Y la pasarela
-- (S101) cobra **UNA transacción** con un `dev_reference` que identifica la
-- orden. Si los N pedidos quedan sueltos, **no hay dónde colgar el pago** y
-- S101 tiene que rehacer el checkout entero para inventar el padre.
--
-- **LA COMPRA ES DEL MOTOR, NO DE LA PANTALLA.** La familia sigue viendo N
-- pedidos con sus N entregas (F5). La compra existe para que **la plata tenga
-- un solo dueño y un solo número**.
--
-- ── 🔴 EL DESGLOSE CONGELADO, QUE ES LA MITAD QUE MÁS IMPORTA ───────────────
-- `compra_desglose` guarda, **al momento de cobrar**, cuánto del total le
-- corresponde a cada pedido y cuánto de eso es IVA.
--
-- No es redundante con `pedidos`: **es un SNAPSHOT**. La razón es concreta y
-- llega de la mesa: **los reembolsos parciales probablemente no existen en
-- Ecuador**, y nuestra división en N pedidos **los crea por construcción**
-- (cancelar uno de dos pedidos de un solo cobro *es* un reembolso parcial).
-- Eso no se resuelve en S100 — **se PREVIENE guardando el desglose**: *sin él,
-- en S101 no se puede ni calcular cuánto devolver.*
--
-- ── 🔴 UN DEFECTO CONOCIDO QUE ESTA MIGRACIÓN NO REPITE ─────────────────────
-- `crear_pedido_despensa` busca su clave de idempotencia **sin filtrar por
-- dueño** (`WHERE clave_idempotencia = p_clave`), así que con una clave
-- repetida entre personas quien la mandara recibiría el id de OTRO. El wrapper
-- lo tapa prefijando con el uid, pero la puerta sigue abierta.
-- **Acá la búsqueda filtra por `user_id` en el cuerpo**, y el UNIQUE es
-- `(user_id, clave_idempotencia)`. *El mismo defecto, dos veces, ya no es un
-- descuido: es una decisión.*
--
-- ── EL IVA NO SE PINTA ──────────────────────────────────────────────────────
-- Los montos salen **sumados de los pedidos**, que a su vez los sacan de
-- `cat_tasas_impuesto` vía el código declarado en la variante. Censado esta
-- sesión: 538 variantes, **0 sin código y 0 con código fantasma**, y los ítems
-- vivos cuadran al centavo en los dos códigos. **Ningún total se pasa por
-- parámetro**: el motor calcula, la pantalla transporta.
--
-- ── VEDA 76(g): **NO RIGE.** ────────────────────────────────────────────────
-- Tablas y columna nuevas, sin backfill: los pedidos existentes quedan con
-- `compra_id NULL`, que es la verdad — **no tuvieron compra**. No se les
-- inventa una.
--
-- ── REVERSA ─────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-17-s100a-REVERSA-la-compra.sql`, escrita ANTES,
-- **declarando que BORRA DATO** y que aborta sola si encuentra compras vivas.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LA ENTIDAD
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.compras (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- Los tres montos son SUMA de los pedidos, calculada por el motor.
  subtotal            numeric(12,2) NOT NULL DEFAULT 0,
  impuesto_total      numeric(12,2) NOT NULL DEFAULT 0,
  envio_total         numeric(12,2) NOT NULL DEFAULT 0,
  total               numeric(12,2) NOT NULL DEFAULT 0,
  moneda              text NOT NULL DEFAULT 'USD',
  -- 'creada' → 'esperando_pago' → 'pagada' | 'fallida' | 'cancelada'.
  -- Vocabulario CERRADO: un estado que no está acá no se puede escribir.
  estado              text NOT NULL DEFAULT 'creada'
                        CHECK (estado IN ('creada','esperando_pago','pagada','fallida','cancelada')),
  clave_idempotencia  text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- Ver la nota de idempotencia en la cabecera: la clave es única POR PERSONA,
  -- jamás global.
  CONSTRAINT uq_compra_idempotencia UNIQUE (user_id, clave_idempotencia)
);

-- El vínculo. NULLABLE a propósito: los pedidos que ya existen no tuvieron
-- compra, y eso es la verdad — no se les inventa una (76(g): sin backfill).
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS compra_id uuid REFERENCES public.compras(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_pedidos_compra ON public.pedidos(compra_id)
  WHERE compra_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL DESGLOSE CONGELADO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.compra_desglose (
  compra_id       uuid NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  pedido_id       uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  -- Los montos TAL COMO SE COBRARON. Si el pedido cambia después, esto no.
  subtotal        numeric(12,2) NOT NULL,
  impuesto        numeric(12,2) NOT NULL,
  envio           numeric(12,2) NOT NULL,
  total           numeric(12,2) NOT NULL,
  congelado_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (compra_id, pedido_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ RLS — la compra es de quien la hizo, y de nadie más
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.compras         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra_desglose ENABLE ROW LEVEL SECURITY;

-- SOLO LECTURA para la familia. La escritura pasa por las RPC DEFINER: si la
-- familia pudiera escribir `compras` directo, podría declararse una compra
-- pagada — el mismo agujero que S95 encontró en `confirmar_pago_pedido`.
CREATE POLICY compras_select ON public.compras
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE POLICY compra_desglose_select ON public.compra_desglose
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.compras c
             WHERE c.id = compra_desglose.compra_id
               AND (c.user_id = auth.uid() OR is_admin()))
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ LA PUERTA — agrupar N pedidos en una compra
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.crear_compra_desde_pedidos(
  p_pedido_ids uuid[],
  p_clave text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_compra uuid;
  v_n int;
  v_sub numeric(12,2); v_imp numeric(12,2); v_env numeric(12,2); v_tot numeric(12,2);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;
  IF p_clave IS NULL OR btrim(p_clave) = '' THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE='22023';
  END IF;
  IF p_pedido_ids IS NULL OR array_length(p_pedido_ids,1) IS NULL THEN
    RAISE EXCEPTION 'compra_sin_pedidos' USING ERRCODE='22023';
  END IF;

  -- IDEMPOTENCIA, ACOTADA POR DUEÑO (ver cabecera). Un reintento devuelve la
  -- misma compra en vez de crear otra — y jamás la de otra persona.
  SELECT id INTO v_compra FROM compras
   WHERE user_id = v_uid AND clave_idempotencia = p_clave;
  IF v_compra IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'compra_id', v_compra, 'ya_existia', true);
  END IF;

  -- 🔴 TODOS LOS PEDIDOS TIENEN QUE SER MÍOS, ESTAR EN `creado` Y SIN COMPRA.
  -- Se cuenta cuántos CUMPLEN y se compara con cuántos vinieron: si no
  -- coinciden, se rebota **sin decir cuál falló** — decir "el pedido X no es
  -- tuyo" le confirma a un curioso que X existe.
  SELECT count(*) INTO v_n FROM pedidos
   WHERE id = ANY(p_pedido_ids)
     AND user_id = v_uid
     AND estado = 'creado'
     AND compra_id IS NULL;

  IF v_n <> array_length(p_pedido_ids,1) THEN
    RAISE EXCEPTION 'pedidos_no_agrupables: alguno no es tuyo, ya tiene compra, o no está en creado'
      USING ERRCODE='22023';
  END IF;

  -- LOS MONTOS SALEN DE LOS PEDIDOS. Ninguno se pasa por parámetro.
  SELECT COALESCE(sum(subtotal),0), COALESCE(sum(impuesto_total),0),
         COALESCE(sum(costo_envio),0), COALESCE(sum(total),0)
    INTO v_sub, v_imp, v_env, v_tot
    FROM pedidos WHERE id = ANY(p_pedido_ids);

  INSERT INTO compras (user_id, subtotal, impuesto_total, envio_total, total, clave_idempotencia)
  VALUES (v_uid, v_sub, v_imp, v_env, v_tot, p_clave)
  RETURNING id INTO v_compra;

  UPDATE pedidos SET compra_id = v_compra WHERE id = ANY(p_pedido_ids);

  RETURN jsonb_build_object('ok', true, 'compra_id', v_compra, 'ya_existia', false,
                            'pedidos', v_n, 'subtotal', v_sub, 'impuesto_total', v_imp,
                            'envio_total', v_env, 'total', v_tot);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ EL INTENTO DE PAGO — el contrato que S101 enchufa sin rehacer nada
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.crear_intento_pago(
  p_compra_id uuid,
  p_metodo text DEFAULT 'simulado'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_c record;
  v_p record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN RAISE EXCEPTION 'compra_no_existe' USING ERRCODE='22023'; END IF;
  IF v_c.user_id <> v_uid AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_es_tu_compra' USING ERRCODE='42501';
  END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RAISE EXCEPTION 'compra_no_cobrable: está en %', v_c.estado USING ERRCODE='22023';
  END IF;

  -- 🔴 PRIMERO SE APARTA LA MERCADERÍA DE TODOS LOS PEDIDOS, DESPUÉS SE PIDE
  --    LA TARJETA. `iniciar_pago_pedido` ya reserva y mueve el estado, y si no
  --    hay stock rebota `sin_stock` CON EL NOMBRE DEL PRODUCTO. Se llama por
  --    pedido y **cualquier rebote aborta la compra entera**: una compra que
  --    cobra un total no puede quedar medio reservada.
  FOR v_p IN SELECT id FROM pedidos WHERE compra_id = p_compra_id ORDER BY created_at
  LOOP
    PERFORM iniciar_pago_pedido(v_p.id, 30);
  END LOOP;

  -- 🔴 EL DESGLOSE SE CONGELA ACÁ, y no antes: **cobrar es el momento en que
  --    estos montos pasan a ser LO QUE SE COBRÓ.** Idempotente por PK.
  INSERT INTO compra_desglose (compra_id, pedido_id, subtotal, impuesto, envio, total)
  SELECT p_compra_id, p.id, p.subtotal, p.impuesto_total, p.costo_envio, p.total
    FROM pedidos p WHERE p.compra_id = p_compra_id
  ON CONFLICT (compra_id, pedido_id) DO NOTHING;

  UPDATE compras SET estado = 'esperando_pago', updated_at = now() WHERE id = p_compra_id;

  -- `referencia` es lo que la pasarela va a llevar como `dev_reference`: el id
  -- de LA COMPRA, jamás el de un pedido. `proveedor` sale por parámetro para
  -- que el día que entre Nuvei no haya que tocar la firma.
  RETURN jsonb_build_object('ok', true, 'compra_id', p_compra_id,
                            'referencia', p_compra_id::text,
                            'monto', v_c.total, 'moneda', v_c.moneda,
                            'metodo', p_metodo, 'estado', 'esperando_pago');
END $$;

REVOKE ALL ON FUNCTION public.crear_compra_desde_pedidos(uuid[], text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.crear_intento_pago(uuid, text)          FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_compra_desde_pedidos(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_intento_pago(uuid, text)          TO authenticated;

-- ── CINTURÓN: L-140 — ninguna función nueva queda alcanzable por anon ───────
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO v_mal
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('crear_compra_desde_pedidos','crear_intento_pago')
    AND (has_function_privilege('anon', p.oid, 'EXECUTE')
      OR has_function_privilege('public', p.oid, 'EXECUTE'));
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN L-140: % siguen alcanzables por anon/PUBLIC', v_mal;
  END IF;
  RAISE NOTICE 'CINTURÓN L-140 verde — ninguna de las dos alcanzable por anon';
END $$;

COMMIT;

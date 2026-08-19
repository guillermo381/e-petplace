-- ═══════════════════════════════════════════════════════════════════════════
-- S101-A · MIGRACIÓN 2 — EL MOTOR DE PAGOS SE ENMIENDA, NO SE CREA
--
-- Firma de mesa (19-ago): «enmendar `pagos_intentos`, no crear `pagos`».
-- Base: censo B0 — docs/relevamientos/2026-08-19-s101-censo-pagos.md
--
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-19-s101-REVERSA-motor-pagos.sql
--
-- Veda 76(g): **NO RIGE.** DDL aditivo + una función nueva. **CERO backfill**,
--   y no por pereza: se midió que los 14 intentos vivos cuelgan de pedidos con
--   `compra_id IS NULL` los 14 — son del mundo pre-compra. No hay de dónde
--   backfillear `compra_id`, así que nace NULL y se declara.
--
-- ───────────────────────────────────────────────────────────────────────────
-- 🔴 DESVÍO DECLARADO SOBRE EL ÍTEM ② DE LA FIRMA — con su rojo producido
--
-- La firma pide «el UNIQUE sobre (proveedor, proveedor_referencia) primero».
-- **Ese UNIQUE es inconstruible junto con el ítem ⑤, y se probó, no se
-- argumentó.**
--
-- La razón medida: `proveedor_referencia` guarda el `dev_reference`, que por
-- firma de S100 **es la COMPRA**. `pagos_intentos` es POR PEDIDO. Una compra
-- con N pedidos produce N intentos con la MISMA (proveedor, referencia).
--
-- El rojo, corrido sobre la compra real `fc8e2a85` que YA tiene 2 pedidos
-- (BEGIN/ROLLBACK, residuo 0):
--     1 · UNIQUE(proveedor, proveedor_referencia) → creado sin conflicto
--     2 · intento del pedido 1                    → OK
--     3 · intento del pedido 2                    → 🔴 duplicate key value
--                                                    violates unique constraint
--
-- ⇒ El candado va sobre el identificador de la PASARELA y **al grano correcto**:
--   `UNIQUE (proveedor, proveedor_transaction_id, pedido_id)`, que es lo que
--   la letra §3 quería decir («el DF de Nuvei… es la llave de la idempotencia»)
--   sin romper la forma 1:N que la casa ya tiene viva.
--   `proveedor_referencia` conserva su índice NO único: es un puntero a la
--   compra, no una llave.
--
-- **Y la idempotencia de evento ya existía y no se toca:**
-- `pagos_eventos.clave_idempotencia` es UNIQUE y `confirmar_pago_pedido` la
-- consulta antes de aplicar nada. Este candado no la reemplaza: cubre el otro
-- agujero — que un mismo DF genere dos intentos para el mismo pedido.
-- ───────────────────────────────────────────────────────────────────────────


-- ───────────────────────────────────────────────────────────────────────────
-- ⓪ SOBRE LOS PEDIDOS CLAVADOS — POR QUÉ EL CINTURÓN NO LOS MIDE
--
-- Firma de mesa (19-ago, cierre), camino (a): **los clavados se dejan decaer,
-- el cron NO se toca, y el gate de la escalera usa un pedido creado fresco.**
--
-- Hay un cron VIVO (job 12, `7 * * * *`) corriendo `expirar_pedidos_sin_pago()`
-- y los pedidos en narrativa `pagando` **se vencen solos** — durante la sesión
-- que escribió esto pasaron de 6 a 5 (`09a2f00b` → `cancelado_sistema`).
--
-- Esta migración **no puede mover un pedido: es DDL más una definición de
-- función, cero DML sobre `pedidos`.** Un cinturón que igual los contara
-- tendría que elegir entre dos cosas malas:
--   · afirmar un número fijo → aborta cuando el cron hace su trabajo
--     (ya pasó: la primera versión de este cinturón abortó el ensayo en seco);
--   · afirmar el delta → aborta si el cron dispara DURANTE la migración,
--     que por firma ② es comportamiento esperado y correcto.
-- ⇒ **No se mide.** *Un cinturón que puede abortar por algo que la migración
--   no controla no protege: interrumpe.*
-- ───────────────────────────────────────────────────────────────────────────


-- ═══ ① LA FRONTERA CONTRA `webhook_events`, DECLARADA EN EL OBJETO ═══
--
-- Veredicto del censo: **hermanos legítimos, NO duplicación.** Lo que lo
-- decide no es el parecido de columnas, es que **ninguna se deriva de la otra**:
--   · de `pagos_eventos` no se reconstruye `webhook_events` — lo ilegible, lo
--     rechazado y lo duplicado nunca llegan a ser un pago;
--   · de `webhook_events` no se reconstruye `pagos_eventos` — no tiene
--     `intento_id`, y el candado de idempotencia vive acá.
-- Y la prueba más limpia es la CARDINALIDAD: **un golpe HTTP de una compra con
-- 3 pedidos deja UNA fila en `webhook_events` y TRES en `pagos_eventos`.**
-- Dos tablas con cardinalidad distinta por diseño no son la misma tabla.
COMMENT ON TABLE public.pagos_eventos IS
  'S101. Capa de DOMINIO: solo lo que RESULTÓ ser un pago. Su '
  'clave_idempotencia (UNIQUE) es PORTANTE — confirmar_pago_pedido la consulta '
  'para decidir si un pago ya se aplicó; no meter ruido de transporte acá. '
  'La capa de TRANSPORTE es webhook_events (todo lo que golpea la puerta, '
  'incluido lo ilegible y lo rechazado). Cardinalidad distinta a propósito: '
  '1 evento HTTP de una compra de N pedidos → 1 fila allá, N filas acá.';


-- ═══ ③ + ④ LAS COLUMNAS, Y EL PUENTE HACIA `dev_reference` ═══
ALTER TABLE public.pagos_intentos
  -- ④ EL PUENTE. La pasarela habla de COMPRAS (`dev_reference`); esta tabla
  --    habla de PEDIDOS. Sin esta columna, ir del webhook al intento obliga a
  --    pasar por `pedidos.compra_id` en cada consulta. Nullable y SIN backfill:
  --    los 14 intentos vivos son del mundo pre-compra (medido: 0 de 14).
  ADD COLUMN IF NOT EXISTS compra_id uuid
    REFERENCES public.compras(id) ON DELETE RESTRICT,

  -- 🔴 SIN ESTO LOS CUATRO CASOS DE LA LETRA §6 NO SON AUDITABLES: no se
  --    puede saber si un pedido avanzó porque llegó el webhook o porque lo
  --    encontró el barrido por consulta activa.
  ADD COLUMN IF NOT EXISTS confirmado_por text
    CHECK (confirmado_por IS NULL OR confirmado_por IN ('webhook','consulta_activa')),

  -- El DF de la pasarela. Es lo único que permite reconciliar un cobro nuestro
  -- contra el panel del proveedor.
  ADD COLUMN IF NOT EXISTS proveedor_transaction_id text,

  -- Requisito del correo de certificación, no cortesía.
  ADD COLUMN IF NOT EXISTS authorization_code text,

  -- Para el correo de confirmación y para soporte. `ultimos4` es TEXTO a
  -- propósito: '0042' no es 42, y guardarlo como número le come los ceros.
  ADD COLUMN IF NOT EXISTS marca text,
  ADD COLUMN IF NOT EXISTS bin text,
  ADD COLUMN IF NOT EXISTS ultimos4 text
    CHECK (ultimos4 IS NULL OR ultimos4 ~ '^[0-9]{4}$');

COMMENT ON COLUMN public.pagos_intentos.compra_id IS
  'Puente hacia el dev_reference de la pasarela, que por firma S100 ES la '
  'compra. Nullable: los intentos anteriores a S100 no tienen compra.';
COMMENT ON COLUMN public.pagos_intentos.confirmado_por IS
  'webhook | consulta_activa. Distingue los cuatro casos de la letra §6. '
  'NULL = confirmado por un camino que no lo declaró.';
COMMENT ON COLUMN public.pagos_intentos.proveedor_referencia IS
  'dev_reference: el id de LA COMPRA. NO es único — una compra de N pedidos '
  'produce N intentos con esta misma referencia. La llave es '
  'proveedor_transaction_id.';

CREATE INDEX IF NOT EXISTS idx_pagos_intentos_compra
  ON public.pagos_intentos (compra_id) WHERE compra_id IS NOT NULL;


-- ═══ ② EL CANDADO, AL GRANO CORRECTO ═══
-- Parcial: un intento que todavía no llegó a la pasarela no tiene DF, y varios
-- NULL no deben chocar entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_intentos_tx_por_pedido
  ON public.pagos_intentos (proveedor, proveedor_transaction_id, pedido_id)
  WHERE proveedor_transaction_id IS NOT NULL;


-- ═══ ⑤ LA ORQUESTACIÓN — UNA COMPRA JAMÁS SE CONFIRMA A MEDIAS ═══
--
-- 🔴 EL DEFECTO QUE ESTA FUNCIÓN EXISTE PARA EVITAR, y que falla EN SILENCIO:
--    `confirmar_pago_pedido` arranca con
--        IF EXISTS (SELECT 1 FROM pagos_eventos WHERE clave_idempotencia = …)
--          THEN RETURN jsonb_build_object('ok', true, 'duplicado', true);
--    Llamarla N veces con la MISMA clave del webhook confirmaría **solo el
--    primer pedido**; del segundo en adelante devolvería `duplicado: true`,
--    con `ok: true`, sin mover nada y sin lanzar. Una compra confirmada a
--    medias que además REPORTA ÉXITO.
--    ⇒ Acá cada pedido recibe su clave DERIVADA: '<clave>:<pedido_id>'.
--
-- Atomicidad: plpgsql corre en UNA transacción. Si un pedido rebota
-- (`pago_sin_reserva`, transición ilegal, lo que sea), **la excepción tumba la
-- compra entera** — ningún pedido queda avanzado. Es la garantía de la firma.
CREATE OR REPLACE FUNCTION public.confirmar_pago_compra(
  p_compra_id            uuid,
  p_proveedor            text,
  p_referencia           text,                      -- dev_reference, tal cual vino
  p_clave_idempotencia   text,                      -- clave del EVENTO de la pasarela
  p_payload              jsonb   DEFAULT '{}'::jsonb,
  p_confirmado_por       text    DEFAULT 'webhook',
  p_transaction_id       text    DEFAULT NULL,
  p_monto                numeric DEFAULT NULL,      -- ver nota ⚠️ abajo
  p_authorization_code   text    DEFAULT NULL,
  p_marca                text    DEFAULT NULL,
  p_bin                  text    DEFAULT NULL,
  p_ultimos4             text    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c        record;
  v_p        record;
  v_res      jsonb;
  v_intento  uuid;
  v_n        int := 0;
  v_intentos uuid[] := '{}';
BEGIN
  -- Mismo gate que `confirmar_pago_pedido`: este camino es del webhook, no de
  -- una sesión de persona. Si viviera abierto, cualquiera con la anon key
  -- declararía pagada una compra.
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

  IF p_confirmado_por NOT IN ('webhook','consulta_activa') THEN
    RAISE EXCEPTION 'confirmado_por_invalido: % — debe ser webhook o consulta_activa', p_confirmado_por
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_c FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_c.id IS NULL THEN
    RAISE EXCEPTION 'compra_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Idempotencia al grano de la COMPRA. El webhook tardío y el duplicado
  -- (letra §6 ③ y su hermano) mueren acá, sin tocar nada.
  IF v_c.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
                              'compra_id', p_compra_id, 'motivo', 'compra_ya_pagada');
  END IF;
  IF v_c.estado NOT IN ('creada','esperando_pago') THEN
    RAISE EXCEPTION 'compra_no_confirmable: está en %', v_c.estado USING ERRCODE = '22023';
  END IF;

  -- ⚠️ VALIDACIÓN DE MONTO — no está entre los seis ítems de la firma; se
  --    incluye porque la letra §5.4 la exige y porque cobrar un monto que no
  --    es el nuestro es el defecto más caro posible. Es OPCIONAL por
  --    construcción: con `p_monto => NULL` no valida nada y el
  --    comportamiento es idéntico a no tenerla. Sacarla es borrar este bloque.
  IF p_monto IS NOT NULL AND p_monto <> v_c.total THEN
    RAISE EXCEPTION 'monto_no_coincide: la pasarela dice % y la compra vale %', p_monto, v_c.total
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pedidos WHERE compra_id = p_compra_id) THEN
    RAISE EXCEPTION 'compra_sin_pedidos: % no tiene pedidos que confirmar', p_compra_id
      USING ERRCODE = '22023';
  END IF;

  FOR v_p IN SELECT id FROM pedidos WHERE compra_id = p_compra_id ORDER BY created_at, id
  LOOP
    -- Clave DERIVADA por pedido: sin esto, del segundo en adelante rebotan
    -- como 'duplicado' y la compra queda a medias diciendo que salió bien.
    v_res := confirmar_pago_pedido(
               v_p.id, p_proveedor, p_referencia,
               p_clave_idempotencia || ':' || v_p.id::text,
               p_payload);

    IF COALESCE((v_res->>'duplicado')::boolean, false) THEN
      RAISE EXCEPTION 'pedido_ya_confirmado_con_esta_clave: % — la compra no se confirma a medias', v_p.id
        USING ERRCODE = '22023';
    END IF;

    v_intento := (v_res->>'intento_id')::uuid;

    -- Los datos de la pasarela los estampa ACÁ el orquestador:
    -- `confirmar_pago_pedido` no los conoce y no se la modificó.
    UPDATE pagos_intentos
       SET compra_id                = p_compra_id,
           confirmado_por           = p_confirmado_por,
           proveedor_transaction_id = p_transaction_id,
           authorization_code       = p_authorization_code,
           marca                    = p_marca,
           bin                      = p_bin,
           ultimos4                 = p_ultimos4,
           actualizado_en           = now()
     WHERE id = v_intento;

    v_n := v_n + 1;
    v_intentos := v_intentos || v_intento;
  END LOOP;

  UPDATE compras SET estado = 'pagada', updated_at = now() WHERE id = p_compra_id;

  RETURN jsonb_build_object('ok', true, 'compra_id', p_compra_id,
                            'pedidos_confirmados', v_n, 'intentos', to_jsonb(v_intentos));
END $function$;

COMMENT ON FUNCTION public.confirmar_pago_compra(
  uuid, text, text, text, jsonb, text, text, numeric, text, text, text, text) IS
  'S101. Confirma UNA compra entera: N pedidos en una sola transacción. '
  'Cualquier rebote tumba todo — una compra jamás se confirma a medias. '
  'Deriva la clave de idempotencia por pedido; con la clave cruda, '
  'confirmar_pago_pedido devolvería duplicado:true del segundo en adelante.';

-- 🔴 L-140: la puerta del webhook NO es de nadie con sesión.
REVOKE ALL ON FUNCTION public.confirmar_pago_compra(
  uuid, text, text, text, jsonb, text, text, numeric, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_pago_compra(
  uuid, text, text, text, jsonb, text, text, numeric, text, text, text, text) TO service_role;


-- ═══ ⑥ `crear_intento_pago` — LÁPIDA, NO RENOMBRE ═══
--
-- Se midió el costo del renombre y NO es barato: tiene llamador VIVO en el
-- bundle publicado del cliente
--   apps/cliente/src/app/(tabs)/despensa/checkout.tsx:457 → crearIntentoPago()
--   packages/api/src/wrappers/despensa-pedido.ts:751      → rpc('crear_intento_pago')
-- Renombrar la RPC rompe el checkout de la app que está corriendo HOY hasta
-- que aterrice un OTA. (Llamadores dentro de la base: CERO — medido.)
-- ⇒ El nombre se queda y la lápida dice la verdad, que es lo que evita que el
--   próximo que lo lea crea que crea un intento.
COMMENT ON FUNCTION public.crear_intento_pago(uuid, text) IS
  '⚠️ EL NOMBRE MIENTE Y SE CONSERVA A PROPÓSITO (S101 ⑥): esta función NO '
  'crea ninguna fila en pagos_intentos. Aparta el stock de todos los pedidos '
  'de la compra, congela compra_desglose y deja la compra en esperando_pago; '
  'devuelve el sobre para el formulario del proveedor (referencia = compra_id '
  '= dev_reference). Quien escribe pagos_intentos es confirmar_pago_pedido, '
  'o sea el webhook. No se renombró porque tiene llamador vivo en el bundle '
  'publicado del cliente (checkout.tsx) y el rename lo rompería hasta el OTA.';


-- ═══ CINTURÓN — aborta si el estado no quedó como se declaró ═══
DO $$
DECLARE v_faltan text; v_uq int; v_anon boolean; v_auth boolean; v_srv boolean;
BEGIN
  SELECT string_agg(c, ', ') INTO v_faltan FROM unnest(ARRAY[
    'compra_id','confirmado_por','proveedor_transaction_id',
    'authorization_code','marca','bin','ultimos4']) c
   WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='pagos_intentos'
                        AND column_name = c);
  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon: faltan columnas en pagos_intentos → %', v_faltan;
  END IF;

  SELECT count(*) INTO v_uq FROM pg_indexes
   WHERE schemaname='public' AND indexname='uq_pagos_intentos_tx_por_pedido';
  IF v_uq <> 1 THEN RAISE EXCEPTION 'cinturon: no quedó el candado de idempotencia'; END IF;

  IF to_regprocedure('public.confirmar_pago_compra(uuid,text,text,text,jsonb,text,text,numeric,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'cinturon: confirmar_pago_compra no existe';
  END IF;

  -- La puerta cerrada se VERIFICA, no se supone (L-216: un REVOKE que deja
  -- PUBLIC intacto no cierra nada).
  SELECT has_function_privilege('anon',
    'public.confirmar_pago_compra(uuid,text,text,text,jsonb,text,text,numeric,text,text,text,text)','EXECUTE') INTO v_anon;
  SELECT has_function_privilege('authenticated',
    'public.confirmar_pago_compra(uuid,text,text,text,jsonb,text,text,numeric,text,text,text,text)','EXECUTE') INTO v_auth;
  SELECT has_function_privilege('service_role',
    'public.confirmar_pago_compra(uuid,text,text,text,jsonb,text,text,numeric,text,text,text,text)','EXECUTE') INTO v_srv;
  IF v_anon OR v_auth OR NOT v_srv THEN
    RAISE EXCEPTION 'cinturon: puerta mal — anon=% authenticated=% service_role=%', v_anon, v_auth, v_srv;
  END IF;

  -- Los pedidos clavados NO se miden acá, a propósito: ver la nota ⓪ arriba.
END $$;

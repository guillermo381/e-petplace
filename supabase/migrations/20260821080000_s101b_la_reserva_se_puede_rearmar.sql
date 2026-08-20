-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · D-851 · LA RESERVA VENCIDA SE PUEDE REARMAR                    ║
-- ║ ENTREGADA SIN APLICAR — pide firma del founder.                         ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821080000.sql ║
-- ║ (escrita ANTES, y **declara que puede no poder revertirse**)            ║
-- ║ Regla 76(g): NO RIGE — DDL + cuerpo de función, sin backfill de datos.  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ EL DEFECTO, EN PRODUCTO ════════════════════════════════════════════════
--
-- Una familia deja el checkout abierto, la reserva vence a los 30 minutos,
-- vuelve a pagar — y **no puede completar ese pedido nunca más**. La app le dice
-- «no queda suficiente» habiendo stock, y reintentar da lo mismo. *No hay salida
-- por el camino del usuario.*
--
-- Mecanismo medido: `UNIQUE (pedido_id, sku_id)` **ciego al estado**.
--
-- ═══ 🔴 LA MEDICIÓN QUE LA FICHA ESPERABA — Y QUE RE-ENCUADRA LA PREGUNTA ════
--
-- `D-851` dejó dos candidatas y una medición pendiente. La medición se corrió, y
-- **contestó las dos preguntas y además movió la pregunta**:
--
-- **(a) «liberar/borrar la reserva vencida antes de re-reservar»** — su miedo era
--   que `stock_disponible` se corrompiera. **FALSADO**: el stock **no lo mantiene
--   `inventario_reservas`** (esa tabla no tiene un solo trigger), lo mantiene
--   `_trg_inventario_aplicar_movimiento` **sobre `inventario_movimientos`**.
--   Y el ledger cierra: para el SKU del ensayo, `reserva 4` contra
--   `liberacion_reserva 4`, saldo 0. *El stock nunca estuvo en riesgo.*
--   **Pero (a) igual PIERDE**, por otra razón que la medición hizo visible: las
--   filas vencidas **no están todas en `vigente`** — hay 21 `expirada`, 1
--   `liberada`, 2 `consumida`. Borrarlas para desbloquear sería **destruir la
--   traza de reservas que ya cumplieron su ciclo**. *Curar un bloqueo borrando
--   historia es pagar con la evidencia.*
--
-- **(b) UNIQUE parcial sobre `estado='vigente'`** — su miedo era «qué más se
--   apoya en el constraint». **MEDIDO: nada.** Cero FKs entrantes, cero triggers
--   sobre la tabla, **cero `ON CONFLICT` que la nombre** (censadas las 10
--   migraciones que tocan `inventario_reservas`).
--
-- ⇒ **GANA (b)** — y no por prolijidad: porque **es el invariante que el UNIQUE
--   quería decir y decía mal.** Lo que el negocio necesita es *«un pedido no
--   puede tener DOS reservas VIGENTES del mismo SKU»*. El UNIQUE total decía
--   *«…ni una sola reserva histórica»*, que no es una regla de negocio: es un
--   efecto colateral. *No estábamos eligiendo entre dos curas: una de las dos
--   era la corrección de un constraint mal escrito.*
--
-- ═══ 🔴 CORRECCIÓN DE UN DIAGNÓSTICO MÍO, ANTES DE APLICAR ═════════════════
--
-- Una versión anterior de esta migración decía dos cosas y **las dos eran
-- falsas**. Quedan escritas porque el error explica la cura:
--
-- ❌ *«`expirar_reservas_vencidas()` existe desde S95 y nadie la llama»* —
--    **FALSO.** Corre cada 5 minutos: **1.146 corridas `succeeded`**, la última
--    de hace minutos. Lo afirmé sobre un censo de `cron.job` **truncado por un
--    `head`**: eran 12 jobs y vi 10. *Medí mal y afirmé fuerte — la misma clase
--    de error que estuve cazando todo el día.*
--
-- ❌ *«18 unidades secuestradas por reservas muertas»* — **FALSO.** Medido por
--    estado del pedido: `liberado_preparacion` 12 · `documentado` 4 ·
--    `en_reparto` 1 · `hacia_destino` 1. **Es mercadería VENDIDA Y EN CAMINO.**
--    El barredor no las toca **a propósito**: su gate dice, textual,
--    *«sin esta línea, un tick libera mercadería VENDIDA y el mostrador la
--    vuelve a vender»*. **Es la regla madre de S99, y estaba funcionando.**
--
-- ⇒ **El `cron.schedule` sale de esta migración**: habría duplicado un job vivo.
--
-- ═══ 🔴🔴 Y LO QUE LA CORRECCIÓN DESTAPÓ EN MI PROPIA CURA ═══════════════════
--
-- El rearme, como estaba escrito, liberaba **cualquier** reserva vigente vencida
-- del par (pedido, sku) — **incluida la de un pedido ya despachado**. Aplicada
-- tal cual, **habría abierto exactamente el agujero que S99 cerró**: devolver al
-- disponible mercadería que ya viaja hacia una casa.
--
-- *Lo encontró la medición que hice para corregir mi error anterior.* Si el
-- primer diagnóstico hubiera sido correcto, nadie habría mirado los estados de
-- los pedidos y la cura firmada habría entrado con el agujero adentro.
--
-- ⇒ **El rearme hereda el gate del barredor**: solo se rearma la reserva de un
--   pedido que **todavía no se despachó**. Y no se copia la lista: se pregunta
--   por lo que importa —¿esta mercadería ya salió?— con los mismos estados que
--   el barredor considera seguros, **más `pagando`**, que es donde vive un
--   pedido que está reintentando pagar y es justo el caso de `D-851`.
--
-- 🔴 **Lo que queda ABIERTO y no se cura acá** (es de la despensa, no del pago):
--   una reserva de un pedido despachado sigue en `vigente` con `expira_en`
--   pasado. **No es plata en riesgo** —el stock está bien contado— pero **es un
--   estado que miente sobre lo que es**, y fue exactamente lo que me hizo leer
--   «secuestrada» donde decía «vendida». Debería pasar a `consumida`. *Un
--   estado que no describe la realidad no es un detalle de prolijidad: es una
--   trampa para el próximo que lo lea.*

-- ── ① EL CONSTRAINT DICE LO QUE QUERÍA DECIR ────────────────────────────────
ALTER TABLE public.inventario_reservas
  DROP CONSTRAINT IF EXISTS inventario_reservas_pedido_id_sku_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reserva_vigente_por_pedido_sku
  ON public.inventario_reservas (pedido_id, sku_id)
  WHERE estado = 'vigente';

COMMENT ON INDEX public.uq_reserva_vigente_por_pedido_sku IS
  'S101-B/D-851: un pedido no puede tener DOS reservas VIGENTES del mismo SKU. '
  'El UNIQUE total anterior además prohibía cualquier reserva histórica, y eso '
  'dejaba a la familia que abandona el checkout sin poder pagar nunca.';

-- ── ② EL RESERVADOR CUMPLE LA IDEMPOTENCIA QUE SU WRAPPER YA PROMETÍA ───────
--
-- 🔴 El wrapper de `packages/api` documenta hace sesiones: *«El motor es
--    idempotente: si ya hay reserva vigente devuelve `ya_reservado` en vez de
--    duplicar»*. **El motor no lo implementaba: insertaba a ciegas.** *Una
--    promesa escrita en la capa de arriba no es un comportamiento; es una
--    expectativa que alguien va a creerle.*
CREATE OR REPLACE FUNCTION public.reservar_stock_pedido(
  p_pedido_id        uuid,
  p_minutos_vigencia integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_it        record;
  v_prev      record;
  v_n         int := 0;
  v_ya        int := 0;
  v_rearmadas int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
              WHERE pi.pedido_id = p_pedido_id AND o.sku_id IS NULL) THEN
    RAISE EXCEPTION 'item_sin_sku' USING ERRCODE = '22023';
  END IF;

  -- 🔴 POR SKU, NO POR ÍTEM: la reserva es del stock, y el stock es del SKU.
  FOR v_it IN
    SELECT o.sku_id, SUM(pi.cantidad)::int AS cantidad
      FROM pedido_items pi JOIN ofertas o ON o.id = pi.oferta_id
     WHERE pi.pedido_id = p_pedido_id
     GROUP BY o.sku_id
  LOOP
    -- La fila vigente de este par, si existe. `FOR UPDATE` porque entre mirar y
    -- decidir puede entrar otra boca (la regla madre de S99: un inventario, dos
    -- bocas).
    SELECT * INTO v_prev
      FROM inventario_reservas
     WHERE pedido_id = p_pedido_id AND sku_id = v_it.sku_id AND estado = 'vigente'
     FOR UPDATE;

    IF v_prev.id IS NOT NULL AND v_prev.expira_en > now() THEN
      -- YA ESTÁ APARTADA Y SIGUE VIVA: no se duplica ni se extiende sola.
      -- *Extenderla acá sería regalar tiempo cada vez que alguien toca pagar.*
      v_ya := v_ya + 1;
      CONTINUE;
    END IF;

    IF v_prev.id IS NOT NULL THEN
      -- 🔴 EL GATE DE S99, HEREDADO: **no se devuelve mercadería que ya salió.**
      --    Si el pedido pasó de la preparación, su reserva no se rearma ni se
      --    libera — se deja como está y el rearme aborta hablado. *Liberar acá
      --    haría que el mostrador vuelva a vender algo que ya va en camino.*
      IF NOT EXISTS (SELECT 1 FROM pedidos p
                      WHERE p.id = p_pedido_id
                        AND p.estado IN ('creado','esperando_pago','pagando')) THEN
        RAISE EXCEPTION 'reserva_no_rearmable: el pedido ya salió de preparación'
          USING ERRCODE = '22023';
      END IF;

      -- 🔴 VIGENTE PERO VENCIDA: se cierra **y se devuelve la mercadería**.
      --    El movimiento compensatorio es obligatorio: sin él la re-reserva
      --    descontaría el stock por segunda vez. *El estado de la fila es una
      --    etiqueta; lo que mueve el stock es el ledger.*
      INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
        VALUES (v_prev.sku_id, 'liberacion_reserva', v_prev.cantidad, 'pedido', p_pedido_id);
      UPDATE inventario_reservas
         SET estado = 'expirada', cerrada_en = now()
       WHERE id = v_prev.id;
      v_rearmadas := v_rearmadas + 1;
    END IF;

    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, referencia_tipo, referencia_id)
      VALUES (v_it.sku_id, 'reserva', v_it.cantidad, 'pedido', p_pedido_id);
    INSERT INTO inventario_reservas (sku_id, pedido_id, cantidad, expira_en)
      VALUES (v_it.sku_id, p_pedido_id, v_it.cantidad,
              now() + (p_minutos_vigencia || ' minutes')::interval);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'reservas', v_n,
    -- El wrapper ya lee esta clave: ahora dice la verdad.
    'ya_reservado', (v_ya > 0 AND v_n = 0),
    'vigentes_respetadas', v_ya,
    'rearmadas', v_rearmadas,
    'expira_en', now() + (p_minutos_vigencia || ' minutes')::interval);
END $$;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_idx int; v_con int; v_job int; v_def text;
BEGIN
  SELECT count(*) INTO v_idx FROM pg_indexes
   WHERE tablename='inventario_reservas' AND indexname='uq_reserva_vigente_por_pedido_sku';
  IF v_idx <> 1 THEN RAISE EXCEPTION 'CINTURÓN: falta el índice parcial'; END IF;

  SELECT count(*) INTO v_con FROM pg_constraint
   WHERE conrelid='inventario_reservas'::regclass AND conname='inventario_reservas_pedido_id_sku_id_key';
  IF v_con <> 0 THEN RAISE EXCEPTION 'CINTURÓN: el UNIQUE ciego al estado sigue vivo'; END IF;

  -- El reloj YA existía y corre; esta migración no lo toca. Se verifica que
  -- siga habiendo **exactamente uno** — un duplicado sería daño nuestro.
  SELECT count(*) INTO v_job FROM cron.job WHERE jobname ILIKE '%reserva%' AND active;
  IF v_job <> 1 THEN RAISE EXCEPTION 'CINTURÓN: relojes de reserva activos = % (debe ser 1)', v_job; END IF;

  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='reservar_stock_pedido';
  -- El discriminador que importa: sin el movimiento compensatorio, la cura
  -- descontaría stock dos veces. Que el estado cambie NO alcanza.
  IF v_def NOT ILIKE '%liberacion_reserva%' THEN
    RAISE EXCEPTION 'CINTURÓN: el rearme no devuelve la mercadería';
  END IF;
  -- 🔴 EL DISCRIMINADOR QUE IMPORTA MÁS: sin el gate, la cura reabre S99.
  IF v_def NOT ILIKE '%reserva_no_rearmable%' THEN
    RAISE EXCEPTION 'CINTURÓN: el rearme puede liberar mercadería ya despachada';
  END IF;

  RAISE NOTICE 'cinturón verde · la reserva se rearma, el stock vuelve, y lo despachado no se toca';
END $$;

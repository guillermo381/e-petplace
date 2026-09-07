-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · ③ · `pedido_nuevo_vendedor` recupera su productor
--
-- QUÉ PASÓ, medido y no heredado:
--   · el tipo está `activo=true`, audiencia `prestador`, y NO está en sombra
--   · emitió **4 veces**, entre el 16-ago 16:55 y el 18-ago 03:13
--   · hoy la única función que lo nombra es `_voz_notificacion`, que es la VOZ
--     y no el emisor ⇒ **cero productores**
--   · su productor vivía dentro de `confirmar_pago_pedido` y se perdió el
--     21-ago al redefinirla (medición de E, re-medida acá contra el objeto)
--
-- 🔴 EL DAÑO, con su número: **14 pedidos pasaron por `vendedor_notificado`**
--    y sólo **4** avisaron ⇒ **diez veces le entró un pedido a un vendedor y
--    nadie se lo dijo.** Y no hubo síntoma: el pedido avanza igual, la familia
--    ve su estado, y lo único que falta es que del otro lado alguien se entere.
--
-- POR QUÉ NO SE REPONE DONDE ESTABA:
--   Estaba adentro de `confirmar_pago_pedido`, que es larga, se redefine
--   entera con `CREATE OR REPLACE` y ya se comió este aviso una vez.
--   *Volver a ponerlo ahí sería reponer la pieza y dejar intacto el mecanismo
--   que se la llevó.* Va a un TRIGGER sobre `pedido_estados`, que es el molde
--   que la casa ya usa para avisarle a la familia (`_trg_pedido_avisa_familia`)
--   y que una redefinición de otra función no puede borrar.
--
-- EL ANCLA: el estado **`vendedor_notificado`**, que existe en
-- `cat_estados_pedido` y se llama así exactamente para esto. *El aviso deja de
-- colgar de un paso del cobro y pasa a colgar del hecho que nombra.*
--
-- VEDA 76(g): NO RIGE — función + trigger, cero backfill. Las 4 intenciones
-- viejas se dejan como están: son hechos, no estado a corregir.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911020000-aviso-vendedor.sql`
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._trg_pedido_avisa_vendedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_ped record; v_dueno uuid; v_items int;
BEGIN
  IF NEW.estado_codigo <> 'vendedor_notificado' THEN RETURN NEW; END IF;

  SELECT p.id, p.numero_orden, p.total, p.moneda, p.cuenta_comercial_id
    INTO v_ped FROM pedidos p WHERE p.id = NEW.pedido_id;
  IF v_ped.id IS NULL THEN RETURN NEW; END IF;

  -- El destinatario es el DUEÑO de la cuenta comercial del pedido.
  SELECT cc.owner_profile_id INTO v_dueno
    FROM cuentas_comerciales cc WHERE cc.id = v_ped.cuenta_comercial_id;

  -- 🔴 SIN DESTINATARIO NO SE INVENTA UNO. Un pedido cuya cuenta no tiene
  -- dueño es un dato roto, y mandarle el aviso a cualquier otro sería peor
  -- que no mandarlo. Se avisa al log y se sigue: el aviso no puede tumbar
  -- la transición de estado del pedido.
  IF v_dueno IS NULL THEN
    RAISE WARNING 'pedido_nuevo_vendedor sin destinatario: pedido % / cuenta %',
      NEW.pedido_id, v_ped.cuenta_comercial_id;
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_items FROM pedido_items WHERE pedido_id = NEW.pedido_id;

  BEGIN
    -- La forma de `datos` es la MISMA de las 4 intenciones de agosto, leída de
    -- ellas y no inventada: {items, total, titulo}. *Cambiarla acá habría roto
    -- la lectura de lo ya emitido sin que nada fallara.*
    PERFORM registrar_intencion_notificacion(
      'pedido_nuevo_vendedor', v_dueno, NULL, NULL,
      jsonb_build_object(
        'pedido_id',    NEW.pedido_id,
        'numero_orden', v_ped.numero_orden,
        'items',        v_items,
        'total',        v_ped.total::text,
        'titulo',       'Pedido nuevo · $' || v_ped.total::text),
      -- Dedup por la FILA de la historia, igual que el aviso a la familia:
      -- un pedido no vuelve a `vendedor_notificado` dos veces por la misma fila.
      'pedido_vendedor:' || NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aviso pedido_nuevo_vendedor no registrado: %', SQLERRM;
  END;
  RETURN NEW;
END $fn$;

REVOKE ALL ON FUNCTION public._trg_pedido_avisa_vendedor() FROM anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_pedido_avisa_vendedor ON public.pedido_estados;
CREATE TRIGGER trg_pedido_avisa_vendedor
  AFTER INSERT ON public.pedido_estados
  FOR EACH ROW EXECUTE FUNCTION public._trg_pedido_avisa_vendedor();

-- ── CINTURÓN · EMITE DE VERDAD, medido con una transición REAL ─────────────
-- No alcanza con que el trigger exista: se ejerce, se cuenta el antes y el
-- después, y se deshace. *Un trigger que existe y no dispara se ve igual que
-- uno que funciona.*
DO $cinturon$
DECLARE
  v_ped uuid; v_antes int; v_despues int; v_fila uuid; v_dueno uuid;
BEGIN
  -- Un pedido REAL que ya tenga cuenta con dueño. Si no hay, el cinturón
  -- ABORTA en vez de dar verde sobre un universo vacío.
  SELECT p.id, cc.owner_profile_id INTO v_ped, v_dueno
    FROM pedidos p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE cc.owner_profile_id IS NOT NULL
   LIMIT 1;
  IF v_ped IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no hay ningún pedido con cuenta y dueño — el arnés no puede discriminar';
  END IF;

  SELECT count(*) INTO v_antes FROM notificacion_intencion WHERE tipo='pedido_nuevo_vendedor';

  -- La sonda escribe de verdad, adentro de una subtransacción que se deshace.
  BEGIN
    INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
      VALUES (v_ped, 'vendedor_notificado', 'sistema')
      RETURNING id INTO v_fila;

    SELECT count(*) INTO v_despues FROM notificacion_intencion WHERE tipo='pedido_nuevo_vendedor';

    IF v_despues <> v_antes + 1 THEN
      RAISE EXCEPTION 'CINTURÓN: la transición no emitió (antes=% despues=%)', v_antes, v_despues;
    END IF;

    -- Y que el destinatario sea el DUEÑO, no cualquiera.
    IF NOT EXISTS (SELECT 1 FROM notificacion_intencion
                    WHERE tipo='pedido_nuevo_vendedor' AND destinatario_user_id = v_dueno
                      AND datos->>'pedido_id' = v_ped::text) THEN
      RAISE EXCEPTION 'CINTURÓN: emitió, pero no al dueño de la cuenta';
    END IF;

    -- CONTRA-CASO: otro estado NO debe emitir. Sin esto, un trigger que
    -- emitiera en TODA transición pasaría el arnés de arriba.
    v_antes := v_despues;
    INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por_rol)
      VALUES (v_ped, 'liberado_preparacion', 'sistema');
    SELECT count(*) INTO v_despues FROM notificacion_intencion WHERE tipo='pedido_nuevo_vendedor';
    IF v_despues <> v_antes THEN
      RAISE EXCEPTION 'CINTURÓN: emitió en un estado que no es el suyo';
    END IF;

    RAISE EXCEPTION 'ROLLBACK_SONDA';   -- deshace todo lo de este bloque
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_SONDA' THEN RAISE; END IF;
  END;

  -- Residuo 0: la sonda no dejó nada.
  SELECT count(*) INTO v_despues FROM notificacion_intencion WHERE tipo='pedido_nuevo_vendedor';
  IF v_despues <> 4 THEN
    RAISE EXCEPTION 'CINTURÓN: la sonda dejó residuo — hay % intenciones, deberían seguir siendo 4', v_despues;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · emite en vendedor_notificado · al dueño · NO emite en otro estado · residuo 0';
END $cinturon$;

-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · MIGRACIÓN A de la tanda de S102 — LA COLUMNA DEL PAGADOR
--
-- Autoría del cuerpo: **S102-B** (`docs/relevamientos/2026-08-21-s102b-CURA-3-
-- rls-pagos-intentos-cita.sql`, bloques ①②③). **A numera y aplica** — `L-331`:
-- el número se asigna al DEPOSITAR, jamás al redactar.
--
-- Secuencia ② firmada por la mesa (TRES actos, sin ventana roja):
--   [ESTA] → deploy de `pagos-cobro` cableado → MIGRACIÓN B (CHECK + policy)
--
-- **La reversa está escrita ANTES y vive en el archivo de origen, bloque ①**,
-- con su orden obligatorio: primero la function, después las columnas —
-- `DROP COLUMN` se lleva los pagadores que la puerta haya escrito entre medio
-- y **no son recuperables: nadie más los tiene.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Guard de estado: se firmó sobre lo que se midió ────────────────────────
--
-- 🔴 EL SNAPSHOT DE ABAJO SE VUELVE A TOMAR, NO SE EDITA — `L-329` (A, 21-ago),
--    y nació de ESTA migración: sus números `citas=7 · pedidos=34` se midieron
--    el 21-ago bajo veda, y al ir a aplicarla la base ya decía otra cosa.
--    **El guard abortó, que es exactamente lo que tenía que hacer.**
--
--    ⚠️ **La cura NO es cambiar el 7 y el 34 por los de hoy.** Eso sería editar
--    un snapshot para que pase, y un guard que se ajusta hasta pasar dejó de
--    ser un guard. **La cura es RE-MEDIR bajo la veda de esta tanda y
--    reemplazar los dos números como MEDICIÓN NUEVA, declarada con su hora**,
--    en el mismo acto en que se aplica.
--
--    *Y lo que el aborto informa no es «el número está viejo»: informa que
--     ENTRE la firma y el apply hubo tráfico — o sea que la veda no cubrió la
--     ventana, y eso es lo que hay que mirar antes de volver a correr.*
DO $guard$
DECLARE v_q text; v_citas int; v_ped int;
  -- ↓↓↓ RE-MEDIR bajo veda inmediatamente antes de aplicar. Declarar la hora.
  --
  -- 🔴 SNAPSHOT RE-MEDIDO EN EL ACTO DEL APPLY — `L-329` cumplida, no esquivada.
  --
  --    Historia de estos dos números, que es la razón por la que no se editaron:
  --      · 21-ago, bajo veda .......... citas=7 · pedidos=34   (firmado así)
  --      · 21-ago 22:08 UTC ........... la base decía 8 · 35 — el gate de S101-D
  --        creó una cita y un pedido REALES entre la firma y el apply.
  --      · **22-ago 15:00:18 UTC ...... citas=8 · pedidos=35** ← el de acá
  --
  --    **El 7/34 NO se subió a 8/35 para que pasara.** Se declaró veda, se
  --    esperó confirmación de las tres pistas (D 09:46 · B 09:47 · C 10:05,
  --    hora local -05) y se volvió a medir. *Un guard que se acomoda al mundo
  --    dejó de guardar nada.*
  --
  --    Control de la re-medición: **8 + 35 = 43 = total de filas de
  --    `pagos_intentos`**. La partición es exhaustiva ⇒ el invariante
  --    «exactamente uno» se sostiene y ningún intento quedó sin contar.
  --    Y el par estuvo **estable 17 horas** (22:08 → 14:01 → 15:00).
  c_citas_esperadas CONSTANT int := 8;   -- SNAPSHOT NUEVO · 22-ago-2026 15:00:18 UTC, bajo veda
  c_ped_esperados   CONSTANT int := 35;  -- SNAPSHOT NUEVO · 22-ago-2026 15:00:18 UTC, bajo veda
BEGIN
  SELECT qual INTO v_q FROM pg_policies
   WHERE schemaname='public' AND tablename='pagos_intentos' AND policyname='pagos_select';
  IF v_q IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la policy pagos_select no existe. Releer antes de tocar.';
  END IF;
  IF v_q ILIKE '%pagador%' THEN
    RAISE EXCEPTION 'ABORTA: la policy YA conoce al pagador. Alguien la curó antes.';
  END IF;

  SELECT count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL),
         count(*) FILTER (WHERE pedido_id IS NOT NULL)
    INTO v_citas, v_ped FROM public.pagos_intentos;

  -- Snapshot-ancla del backfill. Si el mundo se movió, la firma se dio sobre otro.
  IF v_citas <> c_citas_esperadas OR v_ped <> c_ped_esperados THEN
    RAISE EXCEPTION
      'ABORTA (76g): la población cambió — citas=% (esperadas %), pedidos=% (esperados %). '
      'Hubo tráfico entre la medición y el apply ⇒ la veda no cubrió la ventana. '
      'NO se editan los esperados para que pase: se RE-MIDE bajo veda y se declara la hora (L-329).',
      v_citas, c_citas_esperadas, v_ped, c_ped_esperados;
  END IF;
END $guard$;

-- ── ①  LA COLUMNA DEL PAGADOR ──────────────────────────────────────────────
-- NULLABLE a propósito: las 34 filas de pedido NO se backfillean (su dueño ya
-- se resuelve por `pedidos.user_id`, que es el comprador) y **no hay registro
-- de quién puso la tarjeta**. Inventarlo sería exactamente lo que esta columna
-- existe para no tener que hacer.
ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS pagador_user_id uuid REFERENCES auth.users(id);

-- ── ②  LA MARCA DE PROCEDENCIA — el pedido de la mesa, hecho estructura ────
-- 🔴 *«backfill único y MARCADO»* no se cumple con una nota en un acta: se
--    cumple con una columna que dice, para SIEMPRE y fila por fila, si ese
--    pagador fue REGISTRADO por la sesión o DERIVADO por nosotros.
--    Es el patrón de PROCEDENCIA que la casa ya usa en el expediente
--    (`declarado_por_familia` vs `verificado_por_prestador`).
ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS pagador_origen text;

COMMENT ON COLUMN public.pagos_intentos.pagador_user_id IS
  'Quién pagó. Lo escribe la puerta server-side (pagos-cobro): la sesión ES el pagador. '
  'NULL en las filas anteriores a S102 que no se pudieron derivar. Ver pagador_origen.';
COMMENT ON COLUMN public.pagos_intentos.pagador_origen IS
  'PROCEDENCIA del pagador. sesion = lo registró la puerta en el momento del cobro. '
  'backfill_s102 = lo DERIVAMOS del dueño de la mascota el 21-ago-2026 para 7 filas '
  'historicas: es la mejor evidencia disponible, NO un hecho registrado.';

-- Los dos viajan juntos o ninguno. Un pagador sin procedencia es un dato del
-- que nadie puede decir si se midió o se dedujo.
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_pagador_viaja_con_su_origen
  CHECK (
    (pagador_user_id IS NULL AND pagador_origen IS NULL)
    OR (pagador_user_id IS NOT NULL AND pagador_origen IN ('sesion','backfill_s102'))
  );

-- ── ③  EL BACKFILL — ÚNICO, ACOTADO Y MARCADO ──────────────────────────────
-- Solo las 7 filas de cita sin pedido. Deriva del dueño de la mascota, que es
-- **la mejor evidencia disponible** y hoy coincide con el pagador
-- (medido: 0 familias con más de un miembro; 7 filas → 1 persona).
-- **La marca es lo que impide que dentro de seis meses alguien lea estos 7
-- valores como si los hubiera registrado la puerta.**
UPDATE public.pagos_intentos pi
   SET pagador_user_id = m.user_id,
       pagador_origen  = 'backfill_s102'
  FROM public.evento_cita_servicio c
  JOIN public.mascotas m ON m.id = c.mascota_id
 WHERE c.id = pi.cita_id
   AND pi.pedido_id IS NULL
   AND pi.pagador_user_id IS NULL
   AND m.user_id IS NOT NULL;

-- ═══════════════ FIN MIGRACIÓN A (secuencia ②) ═══════════════════════════
COMMIT;

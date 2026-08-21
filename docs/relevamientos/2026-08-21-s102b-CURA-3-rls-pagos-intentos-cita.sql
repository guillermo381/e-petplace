-- ═══════════════════════════════════════════════════════════════════════════
-- S102-B · CURA 3 — **VARIANTE B**: `pagos_intentos` REGISTRA QUIÉN PAGÓ
--            (y con eso el dueño ve sus intentos de cita)
--
-- 🔴 ESTADO: **PREPARADA Y NO APLICADA.** Vive en docs/relevamientos/ a
--    propósito: en supabase/migrations/ un `db push` la barrería sin firma.
--    **A la mueve el día que el founder firme el apply.**
--
-- ✅ DICTAMEN DE MESA, 21-ago-2026 (relevo 3): **VARIANTE B.**
--    Base: `LETRA_SALDO` §2 (RIGE, firma founder 19-ago) — *«Del usuario que
--    pagó. La plata vuelve a quien la puso, no al hogar ni a la familia.»*
--    **Y el argumento que cerró la discusión: la delegación existente prueba
--    que pagador ≠ dueño POR DISEÑO** — no es un borde raro, es una forma de
--    uso que el producto ya admite.
--
--    *(La variante A —derivar el dueño de la mascota— queda DESCARTADA. Su
--     equivalencia de hoy era un hecho de datos, no del diseño: 0 familias con
--     más de un miembro. Construir sobre eso era construir sobre el censo.)*
--
-- TERRITORIO: la DB es de A. B redacta, A aplica.
--
-- 🔗 **ESTA CURA SIRVE A DOS COSAS, y por eso se hace una sola vez:**
--    ① el ensanche de RLS de este archivo
--    ② el comprobante a quien pagó (dictamen 3 del relevo 2)
--    *Las dos necesitaban la misma pieza faltante: no había columna de pagador.*
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ⓪ 🔴 DECLARACIÓN 76(g) — **LA VEDA RIGE.** Es la única de las tres.       ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- **Esta migración TIENE BACKFILL SOBRE DATOS VIVOS** (los 7 intentos de cita
-- históricos) y su verificación **ancla un conteo antes/después**.
--
-- ⇒ **La ventana rige desde el snapshot-antes hasta el veredicto del cinturón.**
--   Se declara su apertura y su cierre. **El founder no escribe datos vivos de
--   pago en esa ventana** — concretamente: **nadie dispara un cobro** mientras
--   corre, porque un intento nuevo naciendo en el medio cambia el denominador
--   del backfill y el cinturón no podría distinguir "backfilleé 7" de
--   "backfilleé 7 y se me escapó uno".
--
-- *(Las CURAS 1 y 2 declararon "NO RIGE" con su porqué. Ésta no puede.)*


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES DE APLICAR NADA                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: quita las dos columnas y restaura la policy EXACTA de hoy
--              (copiada de `pg_policies` el 21-ago, no re-escrita de memoria).
--
-- ⚠️ QUÉ **NO** DESHACE, y es lo que hay que saber antes de aplicar:
--    · **DROP COLUMN se lleva los datos de pagador que la puerta haya escrito
--      entre el apply y la reversa.** No son recuperables: nadie más los tiene.
--      *Si la puerta ya está cableada y corrió, revertir PIERDE información que
--       solo existía acá.*
--    · No toca `pagos-cobro`: si la edge function ya manda `pagador_user_id`,
--      **el INSERT va a fallar contra una columna que no existe.**
--      ⇒ **ORDEN DE REVERSA OBLIGATORIO: primero se revierte la function,
--        después la columna.** Al revés hay una ventana con el cobro caído.
--      *(Es regla 78: un cambio de contrato se secuencia contra lo vivo.)*

/*  ── REVERSA (no ejecutar salvo que haya que revertir) ──
--  PASO 1 (fuera de acá): revertir `pagos-cobro` a la versión sin pagador_user_id.
--  PASO 2: recién entonces, esto.

DROP POLICY IF EXISTS pagos_select ON public.pagos_intentos;

CREATE POLICY pagos_select ON public.pagos_intentos
  FOR SELECT TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM pedidos p
               WHERE p.id = pagos_intentos.pedido_id
                 AND p.user_id = auth.uid()))
    OR is_admin()
  );

ALTER TABLE public.pagos_intentos
  DROP CONSTRAINT IF EXISTS chk_pagador_viaja_con_su_origen,
  DROP COLUMN IF EXISTS pagador_origen,
  DROP COLUMN IF EXISTS pagador_user_id;

DO $rev$
DECLARE v_q text;
BEGIN
  SELECT qual INTO v_q FROM pg_policies
   WHERE schemaname='public' AND tablename='pagos_intentos' AND policyname='pagos_select';
  IF v_q ILIKE '%pagador_user_id%' THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la policy sigue nombrando pagador_user_id';
  END IF;
END $rev$;
*/


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ── Guard de estado: se firmó sobre lo que se midió ────────────────────────
DO $guard$
DECLARE v_q text; v_citas int; v_ped int;
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
  IF v_citas <> 7 OR v_ped <> 34 THEN
    RAISE EXCEPTION
      'ABORTA (76g): la población cambió — citas=% (medidas 7), pedidos=% (medidos 34). La veda no se respetó o hay tráfico nuevo.',
      v_citas, v_ped;
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

-- ── ④  LA POLICY — SE ENSANCHA, NO SE REEMPLAZA ────────────────────────────
DROP POLICY IF EXISTS pagos_select ON public.pagos_intentos;

CREATE POLICY pagos_select ON public.pagos_intentos
  FOR SELECT TO authenticated
  USING (
    -- ① PAGADOR — el brazo nuevo, y el que rige de acá en adelante.
    pagador_user_id = auth.uid()
    -- ② PEDIDO — 🔴 SE CONSERVA A PROPÓSITO, y no es redundante:
    --    **34 filas históricas tienen `pagador_user_id` NULL** y su dueño solo
    --    se resuelve por acá. Sacarlo las volvería invisibles para su comprador.
    --    *Un ensanche que rompe lo que ya funcionaba no es un ensanche.*
    OR (EXISTS ( SELECT 1 FROM pedidos p
                  WHERE p.id = pagos_intentos.pedido_id
                    AND p.user_id = auth.uid()))
    -- ③ ADMIN — intacto.
    OR is_admin()
  );

-- ── CINTURÓN, con DISCRIMINADOR POR BRAZO ──────────────────────────────────
DO $cinturon$
DECLARE v_bf int; v_sin int; v_uid uuid; v_ped int; v_cita int;
BEGIN
  -- (a) El backfill hizo exactamente lo que dijo que iba a hacer.
  SELECT count(*) FILTER (WHERE pagador_origen = 'backfill_s102'),
         count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL
                            AND pagador_user_id IS NULL)
    INTO v_bf, v_sin FROM public.pagos_intentos;

  IF v_bf <> 7 THEN
    RAISE EXCEPTION 'ABORTA: el backfill marcó % filas, se esperaban 7.', v_bf;
  END IF;
  IF v_sin <> 0 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % intentos de cita sin pagador.', v_sin;
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR: el mismo usuario que antes veía 33/0 tiene que
  --     ver AHORA sus dos clases. Sin este par, el verde no distingue
  --     "la cura funcionó" de "este usuario no tenía citas".
  SELECT m.user_id INTO v_uid
    FROM public.pagos_intentos pi
    JOIN public.evento_cita_servicio c ON c.id = pi.cita_id
    JOIN public.mascotas m ON m.id = c.mascota_id
   WHERE pi.pedido_id IS NULL LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay caso con resultado conocido. Un censo vacío no prueba nada.';
  END IF;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE pedido_id IS NOT NULL),
         count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL)
    INTO v_ped, v_cita FROM public.pagos_intentos;

  RESET ROLE;

  IF v_cita = 0 THEN
    RAISE EXCEPTION 'ABORTA: el brazo del PAGADOR no abrió — sigue viendo 0 intentos de cita.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — backfill: % marcadas · el dueño ve % de cita y % de pedido',
               v_bf, v_cita, v_ped;
END $cinturon$;

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ③ 🔴 LA MITAD QUE ESTA MIGRACIÓN **NO** PUEDE HACER — Y SIN ELLA ES UN
--      MOTOR SIN PUERTA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- **La columna nace vacía para todo lo que venga.** Quien la llena es la
-- puerta, y la puerta es una EDGE FUNCTION, no la DB.
--
-- ⚠️ **Si esta migración se aplica sola, el resultado es exactamente el defecto
--    que S101 nombró cuatro veces en un día: la pieza construida, probada y
--    desconectada del único lugar donde su resultado importa.** Peor: la
--    policy nueva parecería andar (los 7 backfilleados se ven) y **todo cobro
--    NUEVO nacería invisible para su pagador.**
--
-- ── PEDIDO AUTOCONTENIDO PARA QUIEN TOQUE `pagos-cobro` (§6 del método) ─────
--
-- Archivo: `supabase/functions/pagos-cobro/index.ts`
-- El pagador YA está resuelto en el archivo, línea 90:  `const userId = u.user.id;`
--   (viene de `comoUsuario.auth.getUser()` con el header Authorization — o sea
--    **la sesión ES el pagador**, que es literalmente lo que el dictamen pide).
--
-- 🔴 **Y por qué NO alcanza un DEFAULT en la columna:** el cliente `db` de esa
--    function corre con **`service_role`**, y el propio archivo lo dice en su
--    comentario de la línea 141 — *«acá el cliente corre con service_role y
--    `auth.uid()` es NULL»*. **Un `DEFAULT auth.uid()` escribiría NULL en cada
--    fila y nadie se enteraría.** Va explícito o no va.
--
-- **DOS INSERT, los dos necesitan la misma línea:**
--
--   línea ~205 (el fail-closed de IVA ≠ 0):
--       forma: 'tokenizacion', estado: 'rechazado',
--   +   pagador_user_id: userId, pagador_origen: 'sesion',
--
--   línea ~236 (el intento real, antes de disparar):
--       forma: 'tokenizacion', estado: 'iniciado',
--   +   pagador_user_id: userId, pagador_origen: 'sesion',
--
-- **El rechazado también lo lleva, y no es celo:** es la fila que prueba que
-- esa persona intentó pagar y no pudo. *Es justo la que va a querer ver.*
--
-- ── EL OTRO ESCRITOR, medido y declarado ───────────────────────────────────
-- `confirmar_pago_pedido` (DEFINER) también inserta en `pagos_intentos` —
-- rama del pedido, cuando el webhook llega sin intento previo. **Su fila queda
-- con pagador NULL y se resuelve por el brazo ② de la policy.** *Se deja así a
-- propósito: esa función no tiene sesión de pagador, y ponerle el
-- `pedidos.user_id` sería marcarlo como registrado cuando es derivado.*
--
-- ── EL ORDEN DE APLICACIÓN, en piedra (regla 78) ───────────────────────────
--   1. Esta migración (la columna existe y acepta NULL).
--   2. `pagos-cobro` desplegada escribiendo las dos claves.
--   3. Verificar con UN cobro real de cita: la fila nace con
--      `pagador_origen='sesion'` y su dueño la ve.
-- **Al revés, la function insertaría contra una columna inexistente y el cobro
--   caería entero.**

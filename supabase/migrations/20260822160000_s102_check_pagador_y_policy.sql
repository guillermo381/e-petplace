-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · MIGRACIÓN B de la tanda de S102 — EL CHECK VALIDADO Y LA POLICY
--
-- Autoría del cuerpo: **S102-B** (bloques ③bis y ④ de su `CURA-3`).
-- **A numera y aplica** (`L-331`).
--
-- 🔴 SU PRECONDICIÓN NO ES UNA NOTA: `pagos-cobro` **cableado y DESPLEGADO**.
--    Verificado contra el objeto antes de aplicar esto — **v8 → v9, ACTIVE,
--    22-ago-2026**. Sin ese deploy, el CHECK de abajo deja sin poder cobrar a
--    toda cita nueva: la fila sería inexpresable y la puerta todavía no
--    estaría escribiendo el pagador.
--
--    *Ése es el orden que la mesa firmó el 21-ago —«migración + cableado de
--    pagos-cobro juntos, en ese orden, jamás la migración sola»— y el mismo
--    precedente cron→deploy de D-713 en S92-BIS.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ③bis 🔴 EL CINTURÓN DE LA TANDA, HECHO MECANISMO ───────────────────────
-- Orden de mesa (21-ago): *«migración + cableado de pagos-cobro juntos, en ese
-- orden, jamás la migración sola. Escribirlo en la migración misma si el
-- mecanismo lo permite, no en nota.»*
--
-- **El mecanismo existe y es este CHECK.** Una fila de CITA sin pagador pasa a
-- ser INEXPRESABLE.
--
-- 🔴 **HACE DOS TRABAJOS, y por eso es la pieza correcta y no una ceremonia:**
--
--   ① **VALIDA EL BACKFILL AL CREARSE.** Si el UPDATE de arriba se saltó una
--      fila, **la creación del CHECK FALLA y la migración entera aborta**.
--      *No es un cinturón que revisa después: es el mismo acto.*
--
--   ② **OBLIGA AL CABLEADO.** Si `pagos-cobro` se despliega sin las dos claves,
--      su INSERT de una cita **rebota con un error de constraint** en vez de
--      escribir NULL en silencio.
--
-- ⚠️ **EL COSTO, DECLARADO DE ANTEMANO PARA QUE EL PRIMER ROJO NO SORPRENDA:
--    aplicar esta migración SIN cablear la function DEJA EL COBRO DE CITAS
--    CAÍDO.** *Se acepta a propósito, y es exactamente lo que la mesa pidió:
--    la alternativa —permitir NULL— es que cada cobro nuevo nazca invisible
--    para quien lo pagó, en silencio y para siempre.*
--
-- > **Un cobro que falla se nota en el minuto uno. Una fila invisible no se
-- > nota nunca.** *Entre un rojo ruidoso y un estado que miente, la casa ya
-- > eligió: el estado malo se vuelve inexpresable* (L-222).
--
-- **Se crea VALIDADO (no `NOT VALID`) a propósito**: `NOT VALID` eximiría a las
-- filas existentes y con eso perdería el trabajo ①. *Un CHECK que no mira lo
-- que ya está no puede probar que el backfill terminó.*
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_de_cita_declara_pagador
  CHECK (pedido_id IS NOT NULL OR pagador_user_id IS NOT NULL);

COMMENT ON CONSTRAINT chk_intento_de_cita_declara_pagador ON public.pagos_intentos IS
  'S102: un intento de CITA no puede existir sin saber quién pagó. '
  'Las filas de PEDIDO quedan exentas: su dueño se resuelve por pedidos.user_id, '
  'y confirmar_pago_pedido las crea sin sesión de pagador. '
  'Este CHECK es el cinturón de la tanda: si pagos-cobro no manda pagador_user_id, '
  'el cobro de cita REBOTA en vez de nacer invisible.';

-- ── ④  LA POLICY — SE ENSANCHA, NO SE REEMPLAZA ────────────────────────────
DROP POLICY IF EXISTS pagos_select ON public.pagos_intentos;

CREATE POLICY pagos_select ON public.pagos_intentos
  FOR SELECT TO authenticated
  USING (
    -- ① PAGADOR — el brazo nuevo, y el que rige de acá en adelante.
    pagador_user_id = auth.uid()
    -- ② PEDIDO — 🔴 SE CONSERVA A PROPÓSITO, y no es redundante:
    --    **35 filas históricas tienen `pagador_user_id` NULL** (eran 34 al
    --    escribirse esta línea; el gate de S101-D agregó una) y su dueño solo
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
DECLARE v_bf int; v_sin int; v_uid uuid; v_ped int; v_cita int; v_rol_previo text;
BEGIN
  -- (a) El backfill hizo exactamente lo que dijo que iba a hacer.
  SELECT count(*) FILTER (WHERE pagador_origen = 'backfill_s102'),
         count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL
                            AND pagador_user_id IS NULL)
    INTO v_bf, v_sin FROM public.pagos_intentos;

  -- 🔴 SNAPSHOT RE-MEDIDO — y esta línea es la que enseñó algo, así que se
  --    escribe entero el porqué:
  --
  --    **Este 7 abortó la primera corrida de esta migración**, el 22-ago a las
  --    15:0x UTC. Y el guard tenía razón: el backfill marcó **8**.
  --
  --    Lo que destapó no es el número — es que **el snapshot vivía en DOS
  --    lugares**: las constantes del guard de la MIGRACIÓN A (que sí re-medí
  --    bajo veda) y este literal, **que quedó con el valor viejo y era
  --    invisible desde allá**. *Re-medir una copia deja la otra mintiendo, y
  --    la única razón por la que se supo es que ésta gritó.*
  --
  --    Se sube a 8 **por la misma medición bajo veda que la A** —22-ago
  --    15:00:18 UTC, citas=8, con las tres pistas confirmadas— y **no para que
  --    la migración pase**. La prueba de que es re-medición y no acomodo:
  --    `citas_sin_pagador = 0` medido después del backfill, y `8 + 35 = 43`,
  --    que es el total de `pagos_intentos`.
  IF v_bf <> 8 THEN
    RAISE EXCEPTION 'ABORTA: el backfill marcó % filas, se esperaban 8.', v_bf;
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

  /* 🔴 CURA S103-A — EL `RESET ROLE` DESHACÍA MÁS DE LO QUE ESTE BLOQUE PUSO,
     y costó una corrida. Se escribe entero porque el síntoma no señalaba acá.

     **Lo medido:** el cinturón salió `CINTURON VERDE`, el DDL se aplicó… y la
     migración **falló al registrarse**: `permission denied for schema
     supabase_migrations`. *La migración A, que no impersona a nadie, se había
     registrado sin problema.*

     **La causa:** `RESET ROLE` no vuelve al rol que había un renglón antes —
     **vuelve al usuario de la SESIÓN**. El CLI se eleva de rol para correr la
     migración, así que este `RESET` le deshizo **su** elevación, no la nuestra,
     y lo dejó sin permiso para escribir su propio historial.

     **El costo real, que es lo que lo vuelve grave y no molesto:** quedó
     **aplicado y sin registrar** — el DDL vivo en la base y `schema_migrations`
     sin saberlo. *Ese estado no grita: la siguiente pasada lo intenta de nuevo
     y choca contra un constraint que ya existe.* Se reparó con
     `migration repair --status applied`.

     **La cura: guardar el rol previo y restaurar ÉSE**, jamás `RESET`. Así el
     bloque devuelve exactamente lo que tomó — que es lo que la impersonación
     debía hacer desde el principio. */
  SELECT current_user INTO v_rol_previo;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE pedido_id IS NOT NULL),
         count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL)
    INTO v_ped, v_cita FROM public.pagos_intentos;

  EXECUTE format('SET LOCAL ROLE %I', v_rol_previo);

  IF v_cita = 0 THEN
    RAISE EXCEPTION 'ABORTA: el brazo del PAGADOR no abrió — sigue viendo 0 intentos de cita.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — backfill: % marcadas · el dueño ve % de cita y % de pedido',
               v_bf, v_cita, v_ped;
END $cinturon$;

COMMIT;

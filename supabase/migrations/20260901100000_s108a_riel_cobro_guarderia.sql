-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · M1 · EL RIEL DEL COBRO DE GUARDERÍA — la capa de columnas
--
-- 76(g) VEDA DE ESCRITURA: **NO RIGE.** DDL aditiva pura, cero backfill, cero
--   anclas. Ninguna fila viva cambia de valor.
-- REVERSA: `docs/relevamientos/2026-09-01-s108a-REVERSA-M1.sql`, escrita ANTES.
-- D-662 (bundles vivos): **ninguna columna se renombra ni se mueve.** Todo es
--   aditivo ⇒ ningún bundle publicado consulta algo que deje de existir.
--
-- ═══ ① EL VEREDICTO DEL XOR, con su evidencia ══════════════════════════════
-- El criterio era: si un puntero existente EXPRESA el sujeto, no nace columna.
-- Medido contra la base viva, no supuesto:
--   · el mandato vive en `guarderia_suscripciones` (PK propia, 17 columnas)
--   · cruce de id con `suscripciones_servicio` ......... 0
--   · filas de guardería en `suscripciones_servicio` ... 0 (sólo `paseo_mensual`)
--   · columna puente en `guarderia_suscripciones` ...... 0
--   · FK del puntero candidato: `suscripcion_servicio_id → suscripciones_servicio(id)`
-- ⇒ meter un id de `guarderia_suscripciones` en `suscripcion_servicio_id`
--   **viola la FK**, y `recurrencia_id` apunta a la despensa.
--   **Ninguno la expresa ⇒ la columna NACE.** Es el único ensanche de esta
--   tanda, y se hace porque se midió que hacía falta.
--
-- 🟢 EL BONO NO NECESITA NADA: `bono_id` ya está en el XOR con su FK. La tabla
--   ya lo contemplaba — lo que faltaba era que alguien lo usara.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① LA MENSUALIDAD GANA SU PUNTERO ──────────────────────────────────────
ALTER TABLE public.pagos_intentos
  ADD COLUMN guarderia_suscripcion_id uuid
    REFERENCES public.guarderia_suscripciones(id),
  /* El período viaja con su sujeto, igual que los otros dos recurrentes
     (`chk_recurrencia_viaja_con_su_periodo`, `chk_suscripcion_viaja_con_su_periodo`).
     *Un cobro recurrente sin su período no se puede reconciliar: no se sabe QUÉ
     mes pagó.* */
  ADD COLUMN guarderia_suscripcion_periodo date;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_guarderia_susc_viaja_con_su_periodo
  CHECK ((guarderia_suscripcion_id IS NULL) = (guarderia_suscripcion_periodo IS NULL));

-- ── ② EL XOR PASA A SEIS ──────────────────────────────────────────────────
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer
 + (cita_id IS NOT NULL)::integer
 + (recurrencia_id IS NOT NULL)::integer
 + (suscripcion_servicio_id IS NOT NULL)::integer
 + (bono_id IS NOT NULL)::integer
 + (guarderia_suscripcion_id IS NOT NULL)::integer) = 1
);

CREATE INDEX IF NOT EXISTS ix_pagos_intentos_guarderia_susc
  ON public.pagos_intentos (guarderia_suscripcion_id)
  WHERE guarderia_suscripcion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_pagos_intentos_bono
  ON public.pagos_intentos (bono_id) WHERE bono_id IS NOT NULL;

-- ── ③ EL RELOJ DEL HOLD DEL BONO ──────────────────────────────────────────
/* 🔴 COLUMNA NUEVA, Y NO SE REUSA `fecha_vencimiento`. Son DOS RELOJES
   DISTINTOS y el nombre viejo invita a confundirlos:
     · `fecha_vencimiento` = vigencia del SALDO — la que el rollover extiende.
     · `pago_expira_en`    = ventana para pagar — 15 minutos, como la cita.
   *Colgar el hold de `fecha_vencimiento` haría que el rollover moviera la
   ventana de pago, y que un bono impago «venciera» con la fecha del saldo.*
   Un solo campo para dos relojes es la clase de atajo que `L-439` prohíbe:
   se vuelve inexpresable en vez de declararse. */
ALTER TABLE public.bonos ADD COLUMN pago_expira_en timestamptz;

/* El reloj sólo existe mientras el pago no llegó. Un bono `pagado` con ventana
   viva es un estado que no significa nada ⇒ se hace imposible, no se documenta. */
ALTER TABLE public.bonos
  ADD CONSTRAINT chk_bono_hold_solo_si_no_pagado
  CHECK (pago_expira_en IS NULL OR estado_pago = 'pendiente');

CREATE INDEX IF NOT EXISTS ix_bonos_hold_vencido
  ON public.bonos (pago_expira_en)
  WHERE estado_pago = 'pendiente' AND pago_expira_en IS NOT NULL;

-- ── ④ CINTURÓN — aborta con el estado viejo si algo no quedó como se dice ──
DO $$
DECLARE v_n int;
BEGIN
  -- (a) el XOR admite seis y NINGUNA fila viva lo viola
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.pagos_intentos'::regclass AND conname='chk_intento_un_solo_sujeto'
     AND pg_get_constraintdef(oid) LIKE '%guarderia_suscripcion_id%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el XOR no nombra guarderia_suscripcion_id'; END IF;

  -- (b) la FK apunta a la tabla del mandato, no a otra
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.pagos_intentos'::regclass AND contype='f'
     AND pg_get_constraintdef(oid) LIKE '%guarderia_suscripcion_id%REFERENCES guarderia_suscripciones%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: la FK del mandato no existe o apunta mal'; END IF;

  -- (c) 🔴 EL DISCRIMINADOR: el hold NO es `fecha_vencimiento`. Se prueba que
  --     son dos columnas distintas y que el CHECK del hold muerde de verdad.
  BEGIN
    INSERT INTO public.bonos (prestador_id, user_id, familia_id, tipo_servicio,
      unidades_total, unidades_usadas, precio_total, precio_por_unidad,
      fecha_compra, estado, estado_pago, country_code, pago_expira_en)
    SELECT b.prestador_id, b.user_id, b.familia_id, 'guarderia_dia',
      1, 0, 1, 1, public.hoy_local(), 'activo', 'pagado', 'EC', now()
      FROM public.bonos b LIMIT 1;
    RAISE EXCEPTION 'cinturon: un bono PAGADO aceptó ventana de pago viva';
  EXCEPTION
    WHEN check_violation THEN NULL;  -- ✅ lo que se espera
  END;

  -- (d) el vocabulario del bono NO se ensanchó: sigue siendo el de siempre
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.bonos'::regclass AND conname='bonos_estado_pago_valido'
     AND pg_get_constraintdef(oid) LIKE '%pendiente%pagado%reembolsado%';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: el vocabulario de estado_pago cambió — no debía';
  END IF;

  RAISE NOTICE 'cinturon M1: 4/4 ✅ (XOR a seis · FK del mandato · hold ≠ vencimiento · vocabulario intacto)';
END $$;

COMMIT;

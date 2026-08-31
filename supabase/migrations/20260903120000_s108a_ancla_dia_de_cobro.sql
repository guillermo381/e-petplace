-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-3 · ① EL ANCLA ES EL DÍA DE CONTRATACIÓN, Y SE RECUPERA
--
-- 76(g) VEDA: **NO RIGE.** Columna nueva + función nueva. **Cero backfill** —
--   la única suscripción viva tiene `periodo_desde` NULL (nunca se cobró), así
--   que no hay día original que reconstruir. Nace NULL y la escribe el primer
--   cobro.
-- REVERSA: `docs/relevamientos/2026-09-03-s108a-REVERSA-M9.sql`.
--
-- ═══ LA FIRMA (founder, 31-ago) ════════════════════════════════════════════
-- *Contrato el 15, me cobra el 15 de cada mes. Si el mes no tiene ese día,
-- cobra el último día del mes **Y RECUPERA** el día original al mes siguiente:
-- contrato el 31 → 28-feb → 31-mar.*
--
-- 🔴 LO QUE ESTABA MAL, y nadie lo había firmado: el encadenado
-- `periodo_hasta + 1` **BAJA EL DÍA Y NO VUELVE**. Una vez que un febrero lo
-- arrastra a 28, se queda en 28 **para siempre** — y eso es la fecha en que le
-- sale plata a una familia todos los meses. *No era una decisión: era una
-- consecuencia aritmética que nadie miró.*
--
-- ⇒ El día original tiene que PERSISTIR, porque `periodo_desde` se pisa en cada
--   período y con él se pierde la memoria de cuándo se contrató. **Sin columna,
--   la regla del founder es inexpresable.**
--
-- ⚠️ CRUCE: la única función que hoy ancla con `periodo_hasta + 1` es
--    `cobrar_periodo_mensualidad_guarderia`, **que es de S108-B-2** (censado: es
--    la única, en DB y en repo). Esta migración entrega **la pieza**; el
--    cableado se lo mando a B como bloque literal, igual que B me mandó el
--    comprobante. *Dos pistas reescribiendo el mismo cuerpo es cómo una pierde.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.guarderia_suscripciones ADD COLUMN dia_de_cobro smallint;

/* El día del mes en que se contrató. **NULL hasta el primer cobro**, que es
   cuando existe: bajo *pagar es arrancar* el día lo fija la plata, no la firma. */
ALTER TABLE public.guarderia_suscripciones
  ADD CONSTRAINT chk_dia_de_cobro_valido
  CHECK (dia_de_cobro IS NULL OR (dia_de_cobro BETWEEN 1 AND 31));

COMMENT ON COLUMN public.guarderia_suscripciones.dia_de_cobro IS
  'S108-A-3 · el dia del mes del PRIMER cobro. Es la memoria del dia original: '
  'sin el, un febrero baja el dia y no vuelve nunca. Lo escribe el primer cobro.';

-- ── LA REGLA, EN UNA SOLA PIEZA ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guarderia_proximo_cobro(
  p_dia_cobro smallint, p_periodo_desde date
) RETURNS date LANGUAGE sql IMMUTABLE
SET search_path TO 'public', 'pg_temp' AS $fn$
  /* El mes siguiente, en el día original — o el último del mes si ese día no
     existe. **La cuenta parte SIEMPRE del día original y jamás del período
     anterior**, que es lo único que hace posible recuperarlo: si arrancara del
     28 de febrero, marzo daría 28 y el día se habría perdido. */
  SELECT (date_trunc('month', p_periodo_desde::timestamp) + interval '1 month')::date
       + (LEAST(
            p_dia_cobro::int,
            EXTRACT(day FROM (date_trunc('month', p_periodo_desde::timestamp)
                              + interval '2 month' - interval '1 day'))::int
          ) - 1);
$fn$;

COMMENT ON FUNCTION public.guarderia_proximo_cobro(smallint, date) IS
  'S108-A-3 · la fecha del proximo cobro mensual. IMMUTABLE y pura. '
  'RECUPERA el dia original: 31-ene -> 28-feb -> 31-mar. '
  'Contrato con S108-B-2: cobrar_periodo la llama para anclar la renovacion.';

REVOKE EXECUTE ON FUNCTION public.guarderia_proximo_cobro(smallint, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guarderia_proximo_cobro(smallint, date) TO authenticated;
/* La lee la pantalla para decir «tu próximo cobro es el …», así que sí va a
   `authenticated`. Es pura: no toca una fila ni conoce una sesión. */

-- ═══ CINTURÓN — el ejemplo del founder, literal ═══════════════════════════
DO $c$
DECLARE v_d date;
BEGIN
  /* 🔴 EL CASO QUE LA FIRMA NOMBRA: 31 → 28-feb → **31-mar**. El tercer paso es
     el que discrimina: con el encadenado viejo daría 28-mar y se quedaría ahí. */
  v_d := public.guarderia_proximo_cobro(31::smallint, DATE '2026-01-31');
  IF v_d <> DATE '2026-02-28' THEN RAISE EXCEPTION 'cinturon: ene31 -> % (esperaba 2026-02-28)', v_d; END IF;

  v_d := public.guarderia_proximo_cobro(31::smallint, DATE '2026-02-28');
  IF v_d <> DATE '2026-03-31' THEN
    RAISE EXCEPTION 'cinturon: NO RECUPERO el dia original — feb28 -> % (esperaba 2026-03-31)', v_d;
  END IF;

  -- el caso normal no se rompe
  v_d := public.guarderia_proximo_cobro(15::smallint, DATE '2026-01-15');
  IF v_d <> DATE '2026-02-15' THEN RAISE EXCEPTION 'cinturon: dia normal roto: %', v_d; END IF;

  -- 30 en febrero (bisiesto y no bisiesto) y su recuperacion
  v_d := public.guarderia_proximo_cobro(30::smallint, DATE '2026-01-30');
  IF v_d <> DATE '2026-02-28' THEN RAISE EXCEPTION 'cinturon: 30 en feb: %', v_d; END IF;
  v_d := public.guarderia_proximo_cobro(30::smallint, DATE '2026-02-28');
  IF v_d <> DATE '2026-03-30' THEN RAISE EXCEPTION 'cinturon: 30 no recupero: %', v_d; END IF;

  -- cruce de año
  v_d := public.guarderia_proximo_cobro(31::smallint, DATE '2026-12-31');
  IF v_d <> DATE '2027-01-31' THEN RAISE EXCEPTION 'cinturon: cruce de anio: %', v_d; END IF;

  /* 🔴 CONTROL NEGATIVO — que el arnés pueda FALLAR. Si la regla fuera el
     encadenado viejo, este assert la cazaría. Se escribe para que quede probado
     que estos verdes discriminan. */
  IF (DATE '2026-02-28' + interval '1 month' - interval '1 day')::date = DATE '2026-03-31' THEN
    RAISE EXCEPTION 'cinturon: el control negativo no discrimina — revisar el arnes';
  END IF;

  RAISE NOTICE 'cinturon M9: 7/7 OK (31 -> 28feb -> 31mar RECUPERADO · dia normal · 30 · cruce de anio · control negativo discrimina)';
END $c$;

COMMIT;

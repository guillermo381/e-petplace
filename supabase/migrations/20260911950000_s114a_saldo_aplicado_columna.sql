-- S114-A · PAGO MIXTO ② · LA COLUMNA saldo_aplicado NACE CON EL MIXTO.
--
-- Firma del founder (③ de las tres firmas): la columna nace CON el pago mixto,
-- no después — sostiene el reparto per-source de una devolución (§7.14). Guarda,
-- por compra, cuánto de su total se pagó con saldo del hogar; el resto lo cobró
-- el riel de tarjeta. `total = saldo_aplicado + (lo que cobró el riel)`.
--
-- CHECK: no puede ser negativo ni exceder el total de la compra. Un
-- saldo_aplicado que supere el total sería cobrar de menos por el riel sin que
-- nadie lo note — el defecto más caro, hecho inexpresable.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; DEFAULT 0 ⇒ las compras vivas quedan
-- exactamente como estaban: 0 = «no se aplicó saldo», el caso de hoy). Reversa
-- ANTES en docs/relevamientos/2026-09-08-s114a-REVERSA-20260911950000-saldo_aplicado.sql

ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS saldo_aplicado numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.compras
  DROP CONSTRAINT IF EXISTS chk_compra_saldo_aplicado;
ALTER TABLE public.compras
  ADD CONSTRAINT chk_compra_saldo_aplicado
  CHECK (saldo_aplicado >= 0 AND saldo_aplicado <= total);

COMMENT ON COLUMN public.compras.saldo_aplicado IS
  'S114-A pago mixto. Cuánto del total se pagó con saldo del hogar; el resto lo '
  'cobra el riel de tarjeta (total - saldo_aplicado). 0 = pago sin saldo. '
  'Mientras la compra está en esperando_pago con saldo_aplicado>0, ese saldo '
  'queda RESERVADO (saldo_hogar_disponible lo resta): el consumo real ocurre al '
  'confirmar el riel. Sostiene el reparto per-source de la devolución (LETRA_SALDO §7).';

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_col int; v_chk int;
BEGIN
  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='compras' AND column_name='saldo_aplicado'
     AND is_nullable='NO' AND column_default LIKE '%0%';
  IF v_col <> 1 THEN RAISE EXCEPTION 'CINTURÓN: la columna saldo_aplicado no nació NOT NULL DEFAULT 0'; END IF;

  SELECT count(*) INTO v_chk FROM pg_constraint
   WHERE conrelid='public.compras'::regclass AND conname='chk_compra_saldo_aplicado';
  IF v_chk <> 1 THEN RAISE EXCEPTION 'CINTURÓN: falta el CHECK chk_compra_saldo_aplicado'; END IF;

  -- las compras vivas quedaron en 0 (nadie aplicó saldo todavía)
  IF EXISTS (SELECT 1 FROM compras WHERE saldo_aplicado <> 0) THEN
    RAISE EXCEPTION 'CINTURÓN: alguna compra nació con saldo_aplicado <> 0 — el DEFAULT no rigió';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · saldo_aplicado NOT NULL DEFAULT 0 · CHECK [0,total] · compras vivas en 0';
END $cinturon$;

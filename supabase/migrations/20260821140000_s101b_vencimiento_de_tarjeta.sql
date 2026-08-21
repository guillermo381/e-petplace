-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · FASE 5 · LA TARJETA GUARDA SU VENCIMIENTO                      ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821140000.sql ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- 🔴 MEDIDO ANTES DE DIBUJAR LA PANTALLA: el alcance firmado de Fase 5 pide
--    **el vencimiento visible en la lista**, y `tarjetas_guardadas` **no tiene
--    dónde guardarlo**.
--
--    Y el proveedor **sí lo manda**: medido en un `payload_crudo` real —
--    `card.expiry_month = 12`, `card.expiry_year = 2030`. **Lo estábamos
--    tirando.**
--
-- ⇒ *Una pantalla que promete mostrar un dato que el motor no guarda no es una
--   pantalla incompleta: es una promesa que no se puede cumplir. El orden
--   correcto es guardar primero.*
--
-- 🔴 **Nace NULLABLE y así se queda.** Las 6 tarjetas ya guardadas **no lo
--    tienen y no se puede recuperar** — el proveedor lo manda al dar de alta, no
--    después. *La pantalla tiene que saber decir «no lo sabemos» sin romperse:
--    inventarlo sería peor que no mostrarlo.*

ALTER TABLE public.tarjetas_guardadas
  ADD COLUMN IF NOT EXISTS expira_mes  smallint
    CHECK (expira_mes IS NULL OR expira_mes BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS expira_anio smallint
    CHECK (expira_anio IS NULL OR expira_anio BETWEEN 2000 AND 2100);

COMMENT ON COLUMN public.tarjetas_guardadas.expira_mes IS
  'S101-B/Fase 5: mes de vencimiento que devuelve el proveedor al dar de alta. '
  'NULLABLE para siempre: las tarjetas anteriores a esta columna no lo tienen y '
  'no se puede recuperar sin un alta nueva.';

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM information_schema.columns
   WHERE table_schema='public' AND table_name='tarjetas_guardadas'
     AND column_name IN ('expira_mes','expira_anio');
  IF v_n <> 2 THEN RAISE EXCEPTION 'CINTURON: faltan las columnas de vencimiento'; END IF;
  RAISE NOTICE 'cinturon verde: la tarjeta ya puede guardar su vencimiento';
END $$;

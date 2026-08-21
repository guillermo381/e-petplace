-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-C · EL DESGLOSE CONGELADO DE LA CITA                               ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101c-REVERSA-20260822020000.sql ║
-- ║ (escrita ANTES; aborta si hay desgloses, porque no se pueden recalcular)║
-- ║ Regla 76(g): NO RIGE — tabla nueva, sin backfill.                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Letra: `LETRA_PAGO_CITAS` §2 — *nace al reservar, centavo a centavo, y la
-- compuerta 2 del motor compara contra él: **sin desglose congelado no hay
-- cobro** (fail-closed).*
--
-- ═══ 🔴 LA MONEDA, DESDE EL NACIMIENTO ═════════════════════════════════════
--
-- **Medido:** `evento_cita_servicio` tiene `precio` y **NO tiene `moneda`**. Hoy
-- la moneda se resuelve al confirmar, sacándola de la cuenta comercial del
-- prestador.
--
-- ⇒ *Un desglose sin moneda no es un desglose: es un número.* Acá se **congela
--   junto con el precio**, porque **lo que se le prometió al cliente incluye en
--   qué moneda**. Resolverla después sería volver a preguntar algo que ya
--   estaba decidido.
--
-- ⚠️ **La deuda del objeto cita queda registrada, no barrida:** el `precio` sin
--    moneda sigue ahí para las **citas viejas** — quedan como **datos
--    declarados** y las resuelve el corte semilla/real ya firmado. *Esta
--    migración salda lo nuevo; no reescribe el pasado.*

CREATE TABLE IF NOT EXISTS public.cita_desglose (
  cita_id      uuid PRIMARY KEY REFERENCES public.evento_cita_servicio(id) ON DELETE CASCADE,
  subtotal     numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  impuesto     numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total        numeric(12,2) NOT NULL CHECK (total >= 0),
  -- 🔴 NOT NULL a propósito: sin moneda el desglose no dice cuánto se cobra.
  moneda       text NOT NULL CHECK (moneda ~ '^[A-Z]{3}$'),
  -- El fee que las compuertas ya exigen (`sin_fee_config`), congelado con lo demás.
  fee_config_id uuid,
  congelado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (total = subtotal + impuesto)
);

COMMENT ON TABLE public.cita_desglose IS
  'S101-C/§2: lo que se le prometió al cliente al RESERVAR una cita, centavo a '
  'centavo y con su moneda. La compuerta 2 del motor compara contra esto: sin '
  'desglose no hay cobro (fail-closed). No se recalcula: se congela.';

ALTER TABLE public.cita_desglose ENABLE ROW LEVEL SECURITY;

-- 🔴 SOLO LECTURA, y solo del dueño de la cita. **Nadie lo escribe desde una
--    sesión de persona**: lo congela el motor. *Si el cliente pudiera escribir
--    su propio desglose, la compuerta 2 compararía un número contra sí mismo.*
CREATE POLICY cita_desglose_select_propio ON public.cita_desglose
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evento_cita_servicio c
     WHERE c.id = cita_desglose.cita_id
       AND user_tiene_acceso_a_mascota(c.mascota_id)
  ));

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_policies
   WHERE tablename='cita_desglose' AND cmd <> 'SELECT';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: hay policies de escritura sobre el desglose';
  END IF;

  -- El estado malo, inexpresable: un total que no es la suma.
  BEGIN
    INSERT INTO cita_desglose (cita_id, subtotal, impuesto, total, moneda)
      SELECT id, 10, 0, 99, 'USD' FROM evento_cita_servicio LIMIT 1;
    RAISE EXCEPTION 'CINTURON: se pudo congelar un total que no cierra';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'cinturon verde: el desglose se lee, no se escribe, y su total cierra';
END $$;

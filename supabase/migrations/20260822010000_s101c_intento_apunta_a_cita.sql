-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-C · EL INTENTO PUEDE APUNTAR A UNA CITA — y por fin dice a UNA sola ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101c-REVERSA-20260822010000.sql ║
-- ║ (escrita ANTES; aborta si hay intentos de cita, y declara qué reintroduce)║
-- ║ Regla 76(g): NO RIGE — DDL aditivo, sin backfill.                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Letra: `LETRA_PAGO_CITAS` §1 · censo fino:
-- `docs/relevamientos/2026-08-20-s101c-censo-fino-contrato-cita.md`
--
-- ═══ 🔴 EL HALLAZGO QUE AMPLIÓ ESTA MIGRACIÓN ══════════════════════════════
--
-- El censo salió a agregar `cita_id` y encontró otra cosa: **el invariante
-- «exactamente uno» no existía tampoco para la despensa.** El único CHECK de
-- forma de `pagos_intentos` es sobre la redirección
-- (`forma <> 'redireccion' OR …`), **no sobre el objeto**.
--
-- ⇒ Hoy nada impide un intento apuntando a dos objetos, o a ninguno.
--   *El camino vivo se sostenía por disciplina de quien lo escribió.*
--
-- **Se cura en la misma migración**, por firma de mesa: *agregar el objeto nuevo
-- bajo una regla que no existe sería fundar la deuda otra vez, un objeto más
-- grande.*
--
-- ═══ MEDIDO ANTES DE PONER LA LEY (un CHECK que las filas viejas violan no
--     aplica — se mide primero) ════════════════════════════════════════════════
--
--   total 25 · con_pedido 25 · sin_pedido 0 · pedido_Y_compra 11 · ni_uno_ni_otro 0
--
-- 🔴 Y ese `pedido_Y_compra = 11` **confirma la forma del invariante**:
--    `compra_id` **es AGRUPADOR, no sujeto** — un intento de pedido dentro de
--    una compra lleva los dos, legítimamente. *El CHECK va sobre el SUJETO
--    —pedido o cita— y deja `compra_id` libre. Meterlo en el «exactamente uno»
--    habría roto 11 filas sanas.*
--
-- ⇒ Las 25 filas cumplen. **No hay dato que curar antes.**

-- ── ① EL PUNTERO ───────────────────────────────────────────────────────────
ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS cita_id uuid
  REFERENCES public.evento_cita_servicio(id);

COMMENT ON COLUMN public.pagos_intentos.cita_id IS
  'S101-C: el intento cuyo sujeto es una CITA. Excluyente con pedido_id por '
  'chk_intento_un_solo_sujeto. `compra_id` NO participa: es agrupador.';

CREATE INDEX IF NOT EXISTS idx_pagos_intentos_cita ON public.pagos_intentos (cita_id)
  WHERE cita_id IS NOT NULL;

-- ── ② EL INVARIANTE QUE FALTABA ────────────────────────────────────────────
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_un_solo_sujeto
  CHECK ((pedido_id IS NOT NULL)::int + (cita_id IS NOT NULL)::int = 1);

COMMENT ON CONSTRAINT chk_intento_un_solo_sujeto ON public.pagos_intentos IS
  'S101-C: un intento de pago tiene EXACTAMENTE UN sujeto — un pedido o una '
  'cita. Antes no existía: la despensa vivía por disciplina.';

-- ── ③ EL CANDADO DE TRANSACCIÓN, REPLICADO (jamás heredado) ────────────────
--
-- 🔴 `uq_pagos_intentos_tx_por_pedido` es lo único que impide reaplicar una
--    transacción del proveedor sobre otro objeto — **y ya nos rebotó una vez,
--    resultando ser una defensa buena.** Pero **un UNIQUE sobre `pedido_id` no
--    ve una fila cuyo `pedido_id` es NULL** ⇒ para citas **no cubre nada**.
--    *Un candado que no alcanza al objeto nuevo es un candado que da falsa
--    tranquilidad, que es peor que ninguno.*
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_intentos_tx_por_cita
  ON public.pagos_intentos (proveedor, proveedor_transaction_id, cita_id)
  WHERE cita_id IS NOT NULL AND proveedor_transaction_id IS NOT NULL;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int;
BEGIN
  -- El discriminador que importa: el estado malo tiene que ser INEXPRESABLE.
  BEGIN
    INSERT INTO pagos_intentos (pedido_id, cita_id, proveedor, monto, moneda, forma, estado)
      VALUES (NULL, NULL, 'nuvei', 1, 'USD', 'tokenizacion', 'pendiente');
    RAISE EXCEPTION 'CINTURON: se pudo crear un intento SIN sujeto';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  SELECT count(*) INTO v_n FROM pg_indexes
   WHERE tablename='pagos_intentos' AND indexname='uq_pagos_intentos_tx_por_cita';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: falta el candado de tx por cita'; END IF;

  -- Y que las 25 filas vivas siguen siendo legales.
  SELECT count(*) INTO v_n FROM pagos_intentos;
  IF v_n < 25 THEN RAISE EXCEPTION 'CINTURON: se perdieron filas (%)', v_n; END IF;

  RAISE NOTICE 'cinturon verde: un solo sujeto, candado por cita, filas vivas intactas';
END $$;

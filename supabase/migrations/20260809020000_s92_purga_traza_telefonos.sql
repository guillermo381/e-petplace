-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-706 — PURGA DE LOS TELÉFONOS DE `_traza_promocion_e164`
--
-- **Decisión del founder, firmada el 9-ago-2026:** *«PURGA firmada: borrar los
-- 14 números de la base, con conteo antes/después y constancia en el acta.»*
--
-- ⚠️ **ESTA MIGRACIÓN BORRA DATOS, Y ES LA ÚNICA DE S92 QUE LO HACE.** Las
-- otras seis cierran puertas —reversibles por definición—; ésta elimina filas y
-- **no tiene reversa**. Corre por firma explícita y por ninguna otra razón.
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE**, y conviene decir por qué a pesar de que acá SÍ se tocan datos:
-- el borrado no computa anclas ni snapshots sobre datos vivos de terceros —
-- afecta a UNA tabla sin consumidores (cero funciones, cero triggers, cero
-- lectores en el árbol versionado, medido en S92). Una escritura del founder en
-- otra tabla durante la ventana no cambia el resultado ni invalida el conteo.
--
-- ── QUÉ HABÍA, en forma y no en contenido ────────────────────────────────
--   14 filas · 5 con `valor_antes` · 5 con `valor_despues` (los E.164
--   completos) · 7 tablas trazadas · todas del 2026-08-02 23:06:44 UTC, o sea
--   **una sola corrida** de la promoción a E.164, ya ejecutada.
--   **Ningún número se transcribe en esta migración ni en el acta:** copiarlo
--   para dejar constancia sería reintroducir por la puerta de atrás
--   exactamente el dato que se viene a borrar.
--
-- ── POR QUÉ SE PUEDE BORRAR SIN MIEDO, medido en S92 ─────────────────────
--   · cero funciones la mencionan · cero triggers · cero consumidores en código
--   · su puerta ya se cerró (`20260808200000`: RLS on, sin policies, sin grants)
--   ⇒ nadie la lee, nadie la va a extrañar, y el dato personal que guardaba ya
--     cumplió su función.
--
-- ── LO QUE **NO** HACE ───────────────────────────────────────────────────
-- **No dropea la tabla.** El founder firmó borrar los números, no eliminar la
-- estructura; y el DROP arrastra la decisión de si esa traza debe poder
-- reconstruirse. La tabla queda **vacía y cerrada**.
--
-- Reversa: `docs/relevamientos/2026-08-09-s92a-REVERSA-tanda7-purga-traza.sql`
--          — existe y dice, con todas las letras, que NO PUEDE revertir.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $purga$
DECLARE
  v_antes int;
  v_con_tel_antes int;
  v_borradas int;
  v_despues int;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE COALESCE(valor_despues,'') <> '' OR COALESCE(valor_antes,'') <> '')
    INTO v_antes, v_con_tel_antes
    FROM public._traza_promocion_e164;

  RAISE NOTICE 'ANTES — % filas, % con teléfono', v_antes, v_con_tel_antes;

  -- GUARD (a): la firma es sobre 14 filas. Si la tabla creció o encogió desde
  -- la medición, el número que el founder firmó ya no es el que se va a borrar
  -- ⇒ para y que decida de nuevo.
  IF v_antes <> 14 THEN
    RAISE EXCEPTION 'GUARD (a): la traza tiene % filas y la firma fue sobre 14 — no se borra nada', v_antes;
  END IF;

  DELETE FROM public._traza_promocion_e164;
  GET DIAGNOSTICS v_borradas = ROW_COUNT;

  SELECT count(*) INTO v_despues FROM public._traza_promocion_e164;

  -- GUARD (b): el conteo después, medido y no supuesto
  IF v_despues <> 0 OR v_borradas <> 14 THEN
    RAISE EXCEPTION 'GUARD (b): se borraron % y quedan % — ABORTA', v_borradas, v_despues;
  END IF;

  RAISE NOTICE 'DESPUÉS — % filas borradas · quedan % · CERO teléfonos en la tabla', v_borradas, v_despues;
END
$purga$;

COMMENT ON TABLE public._traza_promocion_e164 IS
  'S92: traza histórica de la promoción a E.164. CERRADA (RLS on, sin policies, sin grants a roles de cliente) y VACIADA por firma del founder (9-ago-2026): sus 14 filas contenían teléfonos reales y la traza ya no tenía consumidores. La estructura se conserva; las filas no vuelven.';

COMMIT;

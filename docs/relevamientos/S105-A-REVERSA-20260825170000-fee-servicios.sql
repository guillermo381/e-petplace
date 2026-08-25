-- ===========================================================================
-- REVERSA de 20260825170000_s105a_fee_servicios_10_base_subtotal.sql
-- ===========================================================================
-- Escrita ANTES de aplicar.
--
-- QUE DESHACE: vuelve la comision de SERVICIOS al 15 % sin base declarada,
--   reabriendo las dos filas seed (EC y CO) y cerrando la fila nueva de EC.
--
-- ⚠️ QUE NO DESHACE, y hay que leerlo antes de correrla:
--
--   1. LOS DESGLOSES YA CONGELADOS NO SE TOCAN, ni al aplicar ni al revertir.
--      Es la razon de existir del congelado. Toda cita que se haya congelado
--      contra la fila nueva sigue apuntando a ella y sigue diciendo 10 %.
--
--   2. 🔴 POR ESO ESTA REVERSA PUEDE DEJAR UN PUNTERO COLGADO. Si al revertir
--      ya existe alguna cita congelada contra la fila nueva, BORRARLA romperia
--      su puntero. Por eso la reversa NO borra: la CIERRA con vigencia_hasta y
--      activo=false, igual que se hizo con las filas de productos.
--      *Un ledger de configuracion no se corrige borrando filas (L-231).*
--
--   3. Revertir NO devuelve la plata de ninguna comision ya devengada.
-- ===========================================================================

BEGIN;

-- (a) cerrar la fila nueva de EC — NO se borra, ver nota 2
UPDATE public.fee_configs
   SET activo = false,
       vigencia_hasta = now(),
       notas = COALESCE(notas,'') || ' | REVERTIDA por la reversa de 20260825170000'
 WHERE tipo_actor = 'prestador_servicios'
   AND country_code = 'EC'
   AND (parametros->>'pct') = '10';

-- (b) reabrir las dos filas seed de 15 %
UPDATE public.fee_configs
   SET activo = true, vigencia_hasta = NULL
 WHERE id IN ('11a53cf8-629c-47b3-b7ad-854eeb78b034',   -- EC
              '5a5e2381-1011-4cc9-9e68-e5e8d56bfc70');  -- CO

-- (c) cinturon de la reversa: EC vuelve a resolver 15
DO $rev$
DECLARE v_id uuid; v_pct text; BEGIN
  SELECT f.id, f.parametros->>'pct' INTO v_id, v_pct
    FROM public.fee_configs f
   WHERE f.tipo_actor='prestador_servicios' AND f.country_code='EC'
     AND f.activo AND (f.vigencia_hasta IS NULL OR f.vigencia_hasta > now())
   ORDER BY f.vigencia_desde DESC LIMIT 1;
  IF v_pct IS DISTINCT FROM '15' THEN
    RAISE EXCEPTION 'reversa: EC no volvio a 15, quedo en %', v_pct;
  END IF;
  RAISE NOTICE 'reversa OK: EC vuelve a 15';
END $rev$;

COMMIT;

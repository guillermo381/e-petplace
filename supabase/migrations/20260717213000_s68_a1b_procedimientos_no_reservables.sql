-- ═════════════════════════════════════════════════════════════════════
-- S68-A1b — ADENDA (dictado del arquitecto, origen: nota a la mesa del
-- reporte S68-B): los PROCEDIMIENTOS (filas tipo_servicio='otro',
-- catálogo libre por presupuesto — MODELO_VETERINARIA §8) NO se
-- reservan: backfill reservable=false de toda fila 'otro' creada antes
-- de que el wizard conecte el flag (CONECTAR-A de veterinaria-oferta.ts).
--
-- Nota de forma declarada: la adenda llegó con la migración
-- 20260717210000 YA APLICADA y juez verde — la línea entra como
-- migración hermana para no reescribir una migración del historial
-- remoto. SELECT probatorio antes/después como manda el dictado.
-- Sin ancla sobre datos vivos (UPDATE de valor constante): sin veda.
-- ═════════════════════════════════════════════════════════════════════

DO $do$
DECLARE
  v_antes_total int;
  v_antes_reservables int;
  v_despues_no_reservables int;
BEGIN
  -- SELECT probatorio ANTES
  SELECT count(*), count(*) FILTER (WHERE reservable)
  INTO v_antes_total, v_antes_reservables
  FROM prestador_servicios WHERE tipo_servicio = 'otro';
  RAISE NOTICE 'S68-A1b ANTES: % filas ''otro'' (% reservables)', v_antes_total, v_antes_reservables;

  UPDATE prestador_servicios SET reservable = false WHERE tipo_servicio = 'otro';

  -- SELECT probatorio DESPUÉS
  SELECT count(*) FILTER (WHERE NOT reservable)
  INTO v_despues_no_reservables
  FROM prestador_servicios WHERE tipo_servicio = 'otro';
  RAISE NOTICE 'S68-A1b DESPUÉS: % filas ''otro'', TODAS no-reservables (%)', v_antes_total, v_despues_no_reservables;

  IF v_despues_no_reservables <> v_antes_total THEN
    RAISE EXCEPTION 'S68-A1b abort: backfill incompleto (% de %)', v_despues_no_reservables, v_antes_total;
  END IF;
END;
$do$;

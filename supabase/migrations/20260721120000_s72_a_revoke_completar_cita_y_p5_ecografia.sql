-- S72-A · CIERRE DE VENTANA — REVOKE anon de completar_cita_servicio (L-140)
-- + P5 (limpieza de UNA oferta Ecografia duplicada).
--
-- 76(g): DECLARADA — la veda NO rige (restrictiva + un DELETE de residuo
-- huérfano; no reescribe el pasado ni toca datos vivos referenciados).
--
-- ── L-140: completar_cita_servicio nace con anon=X (relevado S72-A cierre:
--    proacl = postgres | anon | authenticated | service_role). Es la SEGUNDA
--    huérfana de §14.1 (la otra, completar_historia_clinica, se revocó en
--    2c/20260720140000). El DROP de ambas NO se hace acá — queda con disparo
--    (ver §14.1 en DEUDAS): el portal admin legado comparte esta DB y podría
--    invocarlas vía PostgREST; el censo del monorepo no ve el repo congelado.
--    Censo del legado o su apagado = precondición del DROP.
REVOKE EXECUTE ON FUNCTION public.completar_cita_servicio(uuid, text, uuid) FROM PUBLIC, anon;

-- ── P5: la oferta 'Ecografia' del prestador de680000-… quedó DUPLICADA
--    (residuo del bug S68-B7). Dos filas idénticas (precio 25.00, tipo 'otro',
--    activo), creadas con 19s de diferencia — el segundo submit es el residuo.
--    Se conserva la ORIGINAL (cdc99c7d, 04:54:45); se borra la DUPLICADA
--    (d0d286a9, 04:55:04). Relevado (regla 41): CERO referencias en las 7
--    tablas con FK a prestador_servicios (bonos, prestador_empleado_servicios,
--    prestador_horarios, prestador_programas, prestador_servicio_tallas,
--    programas_contratados, suscripciones_servicio). Las tres 'Ecografia' de
--    presupuesto_item.descripcion_libre NO se tocan — son presupuestos vivos.
DO $$
DECLARE
  v_refs int;
BEGIN
  -- guard defensivo (protege ante carrera): el residuo debe seguir sin referencias.
  SELECT
    (SELECT count(*) FROM bonos                        WHERE prestador_servicio_id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM prestador_empleado_servicios WHERE servicio_id           = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM prestador_horarios           WHERE servicio_id           = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM prestador_programas          WHERE prestador_servicio_id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM prestador_servicio_tallas    WHERE prestador_servicio_id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM programas_contratados        WHERE prestador_servicio_id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  + (SELECT count(*) FROM suscripciones_servicio       WHERE prestador_servicio_id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c')
  INTO v_refs;
  IF v_refs > 0 THEN
    RAISE EXCEPTION 'P5 abortada: la oferta duplicada d0d286a9 tiene % referencia(s) — ya no es residuo huérfano', v_refs;
  END IF;
END $$;

DELETE FROM prestador_servicios WHERE id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c';

-- ── ASSERTS ──
DO $$
DECLARE
  v_anon      boolean := has_function_privilege('anon', 'public.completar_cita_servicio(uuid,text,uuid)', 'EXECUTE');
  v_auth      boolean := has_function_privilege('authenticated', 'public.completar_cita_servicio(uuid,text,uuid)', 'EXECUTE');
  v_dup_vive  boolean;
BEGIN
  IF v_anon THEN RAISE EXCEPTION 'L-140: anon aún ejecuta completar_cita_servicio'; END IF;
  IF NOT v_auth THEN RAISE EXCEPTION 'REGRESIÓN: authenticated perdió completar_cita_servicio'; END IF;

  -- la DUPLICADA no existe; la ORIGINAL sí (no se borró la equivocada).
  SELECT EXISTS (SELECT 1 FROM prestador_servicios WHERE id = 'd0d286a9-7dd4-4c58-b356-39b78e70d01c') INTO v_dup_vive;
  IF v_dup_vive THEN RAISE EXCEPTION 'P5: la fila duplicada sigue viva'; END IF;
  IF NOT EXISTS (SELECT 1 FROM prestador_servicios WHERE id = 'cdc99c7d-712e-481e-9d4a-b1bb47f1ba88') THEN
    RAISE EXCEPTION 'P5: se borró la oferta EQUIVOCADA — la original cdc99c7d ya no existe';
  END IF;

  RAISE NOTICE 'S72-A cierre OK: completar_cita_servicio sin anon; oferta Ecografia duplicada borrada, original intacta.';
END $$;

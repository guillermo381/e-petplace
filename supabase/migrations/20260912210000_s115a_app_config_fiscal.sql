-- S115-A · TANDA 1 (g) — LA CONFIG VIVA DE LO FISCAL
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912210000-app-config-fiscal.sql
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DOS VOCABULARIOS CERRADOS QUE NO SE AMPLÍAN, y la casa ya tenía casa:
--    `app_config_categoria_check` no admite 'fiscal', y `app_config_tipo_check`
--    quiere 'numero'/'texto', no 'number'/'string'. En vez de agregar un valor al
--    CHECK para que la migración pase, se usa el vocabulario vivo CON su precedente:
--      · proveedor y ambiente → `integraciones`, igual que `kushki_ambiente`,
--        `vtex_ambiente` y `pagos_actuador_vivo`.
--      · el tope de consumidor final → `legal`, igual que `guarderia_tope_urgencia_usd`
--        (el otro tope en USD que sale de una norma, no de una preferencia nuestra).
--
-- 🔴 `es_publico = false` en las tres, y no es prolijidad: `es_publico` es lo que
--    decide si un valor puede viajar al bundle. Nada fiscal llega jamás al cliente.

BEGIN;

INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico) VALUES
  ('fiscal_tope_consumidor_final', '50', 'numero',
   'Tope en USD por transaccion para facturar a CONSUMIDOR FINAL (9999999999999). Por encima, la identificacion es obligatoria. DATO: lo mueve la norma, no un deploy.',
   'legal', false),
  ('fiscal_proveedor', 'simulador', 'texto',
   'Que implementacion del puerto de facturacion se usa: simulador | manual | <proveedor real>. Cambiar de proveedor es cambiar este valor.',
   'integraciones', false),
  ('fiscal_ambiente', 'pruebas', 'texto',
   'pruebas | produccion. Espeja fiscal_emisor.ambiente (1|2). El encendido es un UPDATE, jamas un deploy.',
   'integraciones', false)
ON CONFLICT (clave) DO NOTHING;

DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM public.app_config
   WHERE clave IN ('fiscal_tope_consumidor_final','fiscal_proveedor','fiscal_ambiente');
  IF v <> 3 THEN RAISE EXCEPTION 'cinturon_app_config: esperaba 3 claves, hay %', v; END IF;

  SELECT count(*) INTO v FROM public.app_config WHERE clave LIKE 'fiscal_%' AND es_publico;
  IF v <> 0 THEN RAISE EXCEPTION 'cinturon_fiscal_publico: % clave(s) fiscal marcadas publicas', v; END IF;

  /* Discriminador: el tope tiene que ser LEÍBLE como número por quien lo consuma.
     Una clave de configuración que no se puede castear es letra muerta con cara de dato. */
  IF (SELECT valor::numeric FROM public.app_config WHERE clave='fiscal_tope_consumidor_final') <> 50 THEN
    RAISE EXCEPTION 'cinturon_tope: el tope no se lee como 50';
  END IF;
END $$;

COMMIT;

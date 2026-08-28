-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — LA BANDERA SE LLAMA `guarderia`, NO `daycare`
--
-- 🔴 CORRECCIÓN DE A SOBRE A, EN LA MIGRACIÓN SIGUIENTE Y NO EDITANDO LA
-- APLICADA. `20260828210000` creó la bandera como **`daycare`** — inglés,
-- porque el resto de `services_enabled` está en inglés (`walking`, `grooming`,
-- `hotel`). **Pero el pedido autocontenido de C decía `guarderia`, y C ya
-- construyó su mitad contra ese nombre.**
--
-- **Gana el nombre del pedido, y la razón no es la cortesía:** el pedido es el
-- contrato entre las dos pistas, y **C tiene su lado INERTE esperando esa
-- clave** (molde S91). *Cambiarle el nombre a la llave después de que el otro
-- fabricó la cerradura es exactamente cómo un pedido autocontenido deja de
-- serlo.*
--
-- ⚠️ Y se dice lo que se pierde: `services_enabled` queda con **once claves en
-- inglés y una en español**. Es feo y es correcto — *la coherencia del
-- vocabulario es de la mesa, y hoy vale menos que un contrato entre pistas que
-- ya está construido de un lado.* Si la mesa quiere uniformarlo, es una
-- migración de renombre con sus dos consumidores a la vista.
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828220000-clave-guarderia.sql
-- 76(g): NO RIGE — dato de catálogo; el cinturón sólo LEE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.country_config
   SET services_enabled = (services_enabled - 'daycare')
                          || jsonb_build_object('guarderia', COALESCE(services_enabled->'daycare', 'false'::jsonb)),
       updated_at = now()
 WHERE services_enabled ? 'daycare';

DO $c$
DECLARE v_sin int; v_viejo int; v_on int;
BEGIN
  SELECT count(*) INTO v_sin   FROM country_config WHERE NOT (services_enabled ? 'guarderia');
  SELECT count(*) INTO v_viejo FROM country_config WHERE services_enabled ? 'daycare';
  SELECT count(*) INTO v_on    FROM country_config WHERE (services_enabled->>'guarderia')::boolean IS TRUE;
  IF v_sin <> 0   THEN RAISE EXCEPTION 'ROJO: % pais(es) sin la clave guarderia.', v_sin; END IF;
  IF v_viejo <> 0 THEN RAISE EXCEPTION 'ROJO: % pais(es) conservan la clave vieja daycare.', v_viejo; END IF;
  IF v_on <> 0    THEN RAISE EXCEPTION 'ROJO: la bandera nacio ENCENDIDA en % pais(es).', v_on; END IF;
  RAISE NOTICE '✅ CINTURON: clave `guarderia` en todos los paises · `daycare` retirada · 0 encendidas';
END $c$;

COMMIT;

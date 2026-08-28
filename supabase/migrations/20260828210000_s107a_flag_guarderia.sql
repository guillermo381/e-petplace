-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — GUARDERÍA GANA SU PROPIO FLAG DE PAÍS
--
-- Qué destraba: **hoy la guardería cuelga del flag de HOTEL.** Medido en
-- `apps/cliente/src/app/(tabs)/explorar/index.tsx:105`:
--
--     if (!servicios.hotel) proximamente.push({ proxHotel }, { proxGuarderia });
--
-- ⇒ **son dos servicios distintos compartiendo un interruptor**, y encender la
-- guardería encendería el hotel — que la letra manda FUERA de v1
-- (`LETRA_GUARDERIA` §5 · §7: *«la noche NO es guardería: es hotel, otro
-- servicio con su propia letra»*). Sin este flag, **el calendario del dueño no
-- se puede enchufar aunque la oferta exista**.
--
-- 🔴 NACE EN `false` EN LOS DOS PAÍSES, Y ESO ES LO CORRECTO: el oficio
-- todavía no tiene su camino de reserva ni su cobro. **Encenderlo es una firma
-- del founder, y es UNA LÍNEA** — igual que el reloj del recurrente de S103,
-- que nació inerte a propósito. *Un cable que se tiende bajo presión se tiende
-- mal.*
--
-- ⚠️ **Y el flag de `hotel` NO se toca.** Sigue en `false` y con su propio
-- significado; lo único que cambia es que dejan de ser el mismo interruptor.
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828210000-flag-guarderia.sql
-- 76(g): NO RIGE — dato de catálogo, sin fixtures; el cinturón sólo LEE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.country_config
   SET services_enabled = services_enabled || '{"daycare": false}'::jsonb,
       updated_at = now()
 WHERE NOT (services_enabled ? 'daycare');

DO $c$
DECLARE v_sin int; v_encendidos int; v_hotel int;
BEGIN
  SELECT count(*) INTO v_sin FROM country_config WHERE NOT (services_enabled ? 'daycare');
  IF v_sin <> 0 THEN
    RAISE EXCEPTION 'ROJO: % pais(es) quedaron sin la clave daycare.', v_sin;
  END IF;

  /* 🔴 EL DISCRIMINADOR: nace APAGADA. Un flag nuevo que naciera en true
     publicaría un oficio sin camino de reserva — y lo haría en silencio, que
     es la peor forma. */
  SELECT count(*) INTO v_encendidos FROM country_config
   WHERE (services_enabled->>'daycare')::boolean IS TRUE;
  IF v_encendidos <> 0 THEN
    RAISE EXCEPTION 'ROJO: % pais(es) nacieron con guarderia ENCENDIDA.', v_encendidos;
  END IF;

  /* Y que no se haya tocado el vecino del que colgaba. */
  SELECT count(*) INTO v_hotel FROM country_config
   WHERE (services_enabled->>'hotel')::boolean IS TRUE;
  IF v_hotel <> 0 THEN
    RAISE EXCEPTION 'ROJO: el flag de hotel se movio, y esta migracion no lo toca.';
  END IF;

  RAISE NOTICE '✅ CINTURON flag: daycare presente en todos los paises · 0 encendidos · hotel intacto';
END $c$;

COMMIT;

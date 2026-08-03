-- REVERSA de 20260803180000_s85_telefono_novena_fila.sql
-- Escrita ANTES de aplicar.
--
-- Devuelve `profiles.telefono` de dd024680-… a su valor previo: '320848790'
-- (nueve dígitos, sin '+', al que le faltaba uno).
--
-- ⚠️ REVERTIR ESTO RESTAURA UN NÚMERO QUE EL FOUNDER DECLARÓ INCOMPLETO
-- (*"3208408790 este es correcto"*, 3-ago). No es un rollback neutro: deja
-- la fila con un teléfono al que le falta un dígito **y** con el formato
-- que la ley derogó. *Se dice acá para que quien la corra sepa que está
-- deshaciendo una corrección, no un experimento.*
--
-- El predicado va sobre el valor NUEVO por la misma razón que la migración
-- lo puso sobre el viejo: si alguien editó el teléfono desde la app en el
-- medio, esta reversa NO lo pisa — se declara no-op y lo dice.

BEGIN;

DO $$
DECLARE v_antes text; v_tocadas integer;
BEGIN
  SELECT telefono INTO v_antes FROM public.profiles
  WHERE id = 'dd024680-3d1c-4465-b38b-dedab45da037';

  UPDATE public.profiles
     SET telefono = '320848790'
   WHERE id = 'dd024680-3d1c-4465-b38b-dedab45da037'
     AND telefono = '+573208408790';
  GET DIAGNOSTICS v_tocadas = ROW_COUNT;

  IF v_tocadas = 0 THEN
    RAISE WARNING
      'REVERSA NO-OP: la fila no tenía +573208408790 sino %. NO se pisó nada. '
      'Alguien la editó después de la migración — decidí a mano.', coalesce(v_antes, '(null)');
  ELSE
    RAISE NOTICE 'reversa OK — % → 320848790', v_antes;
  END IF;
END $$;

COMMIT;

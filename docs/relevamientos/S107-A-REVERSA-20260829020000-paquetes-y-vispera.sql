-- REVERSA de 20260829020000_s107a_paquetes_y_vispera.sql · ESCRITA ANTES.
-- 🔴 NO deshace:
-- ① Los paquetes que el prestador haya configurado (se van con la tabla).
--    ⓪ ABORTA si algún bono ya nombra un paquete: eso es plata vendida.
-- ② La compuerta de la víspera: revertirla **vuelve a permitir reservas para
--    HOY**, que es justo lo que la mesa cerró. Se dice antes de correrla.
BEGIN;

DO $$
DECLARE v_bonos int;
BEGIN
  SELECT count(*) INTO v_bonos FROM public.bonos WHERE tipo_servicio = 'guarderia_dia';
  IF v_bonos > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % paquete(s) de guarderia vendidos. Su tamano y su precio congelado viven acá.', v_bonos;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.obtener_paquetes_guarderia(uuid);
DROP FUNCTION IF EXISTS public.definir_paquete_guarderia(uuid, integer, numeric, boolean);
DROP FUNCTION IF EXISTS public.primer_dia_reservable_guarderia(uuid);
DROP FUNCTION IF EXISTS public._guarderia_dia_operativo(uuid, date);
DROP TABLE IF EXISTS public.guarderia_paquetes;

-- la oferta vuelve a aceptar un precio de paquete único
DROP FUNCTION IF EXISTS public.definir_oferta_guarderia(uuid, numeric, numeric, boolean);
-- (el cuerpo con p_precio_paquete vive en 20260828190000)
COMMIT;

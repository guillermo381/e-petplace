-- REVERSA de 20260903200000_s108b2_compuerta_pre_cobro_mensualidad.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE, y hay que leerlo: revertir devuelve el motor al estado en
--    que **la plata se toma antes de saber si el mes se puede entregar**.
--    Medido el 31-ago con un cobro real (DF-2107864, $100): el débito salió, el
--    acto 2 se cayó por `duplicate key` de `(mascota, fecha)` y quedó la plata
--    tomada, el plan sin arrancar y cero días comprometidos.
--    No es una regresión de forma: es plata de una familia sin contraprestación.
--
--    ⚠️ Y hay que revertir TAMBIÉN `pagos-cobro` al código que no llama a la
--    compuerta. Revertir sólo la base deja la edge llamando a una función que
--    no existe ⇒ el cobro de mensualidad falla ENTERO, que es más seguro que lo
--    contrario pero igual de roto. Las dos o ninguna.

BEGIN;
DROP FUNCTION IF EXISTS public.verificar_compuertas_mensualidad_guarderia(uuid, date);
COMMIT;

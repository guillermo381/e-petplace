-- REVERSA de 20260903100000_s108b2_barrido_por_sujeto.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE, y hay que leerlo antes de correrla:
--    Revertir DEVUELVE EL PUNTO CIEGO. `pagos_pendientes_de_conciliar` vuelve a
--    ser el único lector y vuelve a ver sólo compras ⇒ los huérfanos de cita,
--    bono y mensualidad dejan de ser barridos otra vez.
--    Medido al construir: existen 12 huérfanos con forma de huérfano y el
--    lector viejo ve 6. Revertir es volver a esa mitad.
--
--    ⚠️ Y hay que revertir TAMBIÉN las dos edge functions (`pagos-conciliar`,
--    `pagos-deuna-barrido`) al código anterior. Revertir sólo la base las deja
--    llamando a una función que no existe ⇒ el barrido no corre en absoluto,
--    que es PEOR que el punto ciego. Las dos cosas o ninguna.
--
--    `cat_sujetos_de_pago` se dropea con sus filas: es el vocabulario cerrado
--    de los sujetos. Sin él, el guard de cobertura tampoco existe y el séptimo
--    sujeto vuelve a poder entrar sin que nada lo note.

BEGIN;

DROP FUNCTION IF EXISTS public.pagos_huerfanos_por_sujeto(integer, text);
DROP FUNCTION IF EXISTS public.verificar_cobertura_sujetos_de_pago();
DROP TABLE IF EXISTS public.cat_sujetos_de_pago;

-- `pagos_pendientes_de_conciliar` NO se toca en esta migración, así que la
-- reversa no la recrea: sigue viva y sigue siendo compra-only.

COMMIT;

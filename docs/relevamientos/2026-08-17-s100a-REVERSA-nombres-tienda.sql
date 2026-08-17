-- REVERSA de `20260820050000_s100a_nombres_de_tienda.sql`. Escrita ANTES.
--
-- QUÉ DESHACE: retira `obtener_nombres_tienda_por_pedido`.
-- 🔴 QUÉ NO DESHACE: nada de dato — solo LEE. Revertirla deja a la familia
-- sin saber QUÉ TIENDA le prepara cada entrega, que es justo lo que explica
-- por qué su compra llegó partida en dos.
-- Y no reabre nada: la función expone UN campo (`nombre_comercial`) y jamás
-- razón social, RUC, dirección ni dueño.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_nombres_tienda_por_pedido(uuid[]);
COMMIT;

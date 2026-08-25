-- ===========================================================================
-- REVERSA de 20260825180000_s105a_uid_estable_por_proveedor.sql
-- ===========================================================================
-- Escrita ANTES de aplicar.
--
-- QUE DESHACE: retira la tabla del uid estable y su productor.
--
-- ⚠️ QUE NO DESHACE, y decide CUANDO se puede correr:
--
--   1. Mientras el motor este INERTE (nadie llama a la funcion), revertir es
--      gratis: no hay uid entregado a Nuvei que quede huerfano.
--
--   2. 🔴 UNA VEZ QUE EL FLIP OCURRA, REVERTIR ES DESTRUCTIVO. Los uid ya
--      entregados al proveedor viven en SU lado atados a tarjetas reales.
--      Borrar la tabla NO los borra alla: deja tarjetas cuyo uid nadie puede
--      volver a calcular, y con eso se pierde la unica forma de volver a
--      listar o cobrar esa identidad. **Despues del flip, esto no se revierte:
--      se enmienda hacia adelante.**
--
--   3. `tarjetas_guardadas.proveedor_uid` NO se toca ni al aplicar ni al
--      revertir: es dato historico de con que uid nacio cada tarjeta, y es lo
--      que permite seguir cobrando las viejas.
-- ===========================================================================

BEGIN;
DROP FUNCTION IF EXISTS public.obtener_uid_proveedor(uuid, text);
DROP TABLE IF EXISTS public.usuario_proveedor_uid;
COMMIT;

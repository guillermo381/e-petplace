-- REVERSA de `20260911660000_s114a_saldo_hogar.sql` (A4). Escrita ANTES.
-- 🔴 QUÉ NO DESHACE, y hay que leerlo: el saldo es un PASIVO — plata que le
--    debemos a una familia. Borrar la tabla borra la constancia de esa deuda.
--    Si ya hay movimientos con saldo positivo, esto NO se corre: se conversa.
--    Censo obligatorio antes: select coalesce(sum(monto),0) from saldo_hogar_movimientos;
--    si <> 0, PARAR.
DROP FUNCTION IF EXISTS public.consumir_saldo_hogar(uuid, numeric, text, uuid);
DROP FUNCTION IF EXISTS public.acreditar_saldo_hogar(uuid, numeric, text, text, uuid);
DROP FUNCTION IF EXISTS public.saldo_hogar_disponible(uuid);
DROP FUNCTION IF EXISTS public._familia_del_user(uuid);
DROP TABLE IF EXISTS public.saldo_hogar_movimientos;

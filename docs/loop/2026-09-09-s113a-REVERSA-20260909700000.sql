-- REVERSA de 20260909700000_s113a_coach_actor_sistema.sql · escrita ANTES.
--
-- QUÉ DESHACE: vuelve las tres puertas a su firma sin `p_user_id`.
-- QUÉ **NO** DESHACE: nada de datos.
--
-- ⚠️ Pero **rompe las edges `coach` y `coach-parte`**, que las llaman con
-- ese parámetro. Revertir esto sin revertir las edges deja a Nexo mudo con un
-- error de firma. *Van juntas o no van.*

drop function if exists public.obtener_contexto_coach(uuid, uuid);
drop function if exists public.obtener_avisos_coach(uuid, uuid);
drop function if exists public._coach_puerta(uuid, uuid);

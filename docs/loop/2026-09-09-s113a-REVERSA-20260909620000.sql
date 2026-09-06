-- REVERSA de 20260909620000_s113a_contexto_coach.sql · escrita ANTES de aplicar.
--
-- QUÉ DESHACE: la función `obtener_contexto_coach`.
-- QUÉ NO DESHACE: nada — es un LECTOR puro, no escribe una sola fila.
--   Revertirla deja a Nexo sin poder hablar de una mascota (la edge `coach`
--   recibiría un 404 de la RPC), pero **ningún dato del expediente se toca**.
--   *Es la reversa más barata que hay: la que sólo apaga una lectura.*

drop function if exists public.obtener_contexto_coach(uuid);

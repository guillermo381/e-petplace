-- REVERSA de 20260909740000_s113a_avisos_forma_edge.sql · escrita ANTES.
-- QUÉ DESHACE: la forma de `obtener_avisos_coach(uuid,uuid)`.
-- QUÉ NO DESHACE: nada de datos. Los avisos generados quedan.
-- ⚠️ Revertir deja `coach-parte` en silencio permanente (204 siempre):
--    esperaría un array con `titulo` y recibiría un objeto. El silencio de
--    esta pieza es indistinguible de «no hay nada que decir», así que la
--    reversa NO produce error visible — sólo un Nexo que dejó de avisar.
select 1;

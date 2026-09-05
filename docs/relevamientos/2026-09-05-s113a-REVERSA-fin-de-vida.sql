-- REVERSA de 20260909200000_s113a_fin_de_vida.sql (S113-A · A9)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE, y es lo importante:
-- ① Las despedidas YA REGISTRADAS no se borran. El evento `fin_vida` y el
--    `estado_vida='fallecida'` que el trigger propagó QUEDAN. *Y está bien que
--    queden: revertir un cambio de código no puede desandar un duelo.*
-- ② Al soltar el guard de A3.9, el expediente memorial vuelve a aceptar
--    eventos posteriores a la partida — que es exactamente el estado que esta
--    migración vino a cerrar.
begin;
drop trigger if exists trg_eventos_memorial_solo_lectura on public.eventos_mascota;
drop function if exists public._trg_eventos_memorial_solo_lectura();
drop function if exists public.registrar_fin_de_vida(uuid, date, text);
commit;

-- REVERSA de 20260909120000 (S113-A · 1.0 · A5 · el plan vacunal ENSANCHADO)
-- Escrita ANTES de aplicar. Cero datos que perder: la función sólo LEE.
--
-- ⚠️ Revertir NO alcanza con dropear: hay que RECREAR la firma de UN argumento
-- que existía desde S82 r7, o el wrapper vivo `obtenerPlanVacunal` deja de
-- resolver. Su cuerpo se recupera del propio ensanche (es el mismo, con los
-- tres agregados sacados) o de la migración de S82 que la creó.
begin;
drop function if exists public.obtener_plan_vacunal(uuid, date, int);
-- ...y acá va el CREATE de la versión de un argumento.
commit;

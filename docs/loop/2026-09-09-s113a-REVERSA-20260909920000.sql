-- REVERSA de 20260909920000_s113a_indice_diario_parcial.sql · escrita ANTES.
-- QUÉ DESHACE: vuelve el índice diario a cubrir TODOS los avisos.
-- 🔴 QUÉ NO DESHACE: revertir **rompe la anticipación** — una mascota con dos
--    predisposiciones firmadas vuelve a chocar con  y el
--    generador FALLA ENTERO, no sólo ese aviso. Antes de correr, medí si hay
--    alguna mascota con más de una anticipación el mismo día.
drop index if exists public.uq_avisos_coach_uno_por_tipo_por_dia;
create unique index uq_avisos_coach_uno_por_tipo_por_dia
  on public.avisos_coach (mascota_id, tipo, fecha);

-- REVERSA de 20260909980000_s113a_dosis_anticipacion.sql · escrita ANTES.
-- QUÉ DESHACE: la cola, la prioridad y el ritmo semanal.
-- 🔴 QUÉ NO DESHACE, y es lo que importa: revertir **suelta la cola entera de
--    golpe**. Las anticipaciones que estaban esperando su semana pasan a
--    visibles todas juntas, que es exactamente la avalancha que esto vino a
--    evitar. Antes de correr:
--      select mascota_id, count(*) from public.avisos_coach
--       where tipo='anticipacion' and estado='en_cola' group by 1;
alter table public.avisos_coach drop column if exists estado;
alter table public.avisos_coach drop column if exists prioridad;
alter table public.avisos_coach drop column if exists entregado_en;

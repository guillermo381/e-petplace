-- REVERSA de 20260909880000_s113a_predisposiciones_en_revision.sql · escrita ANTES.
-- QUÉ DESHACE: el estado, la evidencia y la confianza de raza_predisposicion,
--   y devuelve la regla a disparar sobre cualquier fila.
-- 🔴 QUÉ **NO** DESHACE, y es lo grave: **revertir hace que las 583 filas SIN
--   REVISAR empiecen a disparar avisos**. Hoy no disparan porque la regla exige
--   `estado='revisada'` y hay CERO revisadas. Quitar el estado no apaga nada:
--   lo ENCIENDE, y los avisos que salgan hablan de la salud de un animal con
--   un texto que nadie leyó.
--   Antes de correr:  select count(*) from public.raza_predisposicion;
alter table public.raza_predisposicion drop column if exists estado;
alter table public.raza_predisposicion drop column if exists evidencia;
alter table public.raza_predisposicion drop column if exists confianza;

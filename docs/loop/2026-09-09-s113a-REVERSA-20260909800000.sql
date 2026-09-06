-- REVERSA de 20260909800000_s113a_predisposiciones.sql · escrita ANTES.
--
-- QUÉ DESHACE: el catálogo de sistemas y las reglas raza×etapa.
--
-- 🔴 QUÉ **NO** DESHACE: los avisos que ya nacieron de estas reglas. Una
--    familia que ya leyó «vale la pena hablar con tu vet de un estudio de
--    cadera» **no des-lee eso**, y su aviso queda en `avisos_coach` sin
--    regla que lo explique. *Revertir un catálogo no revierte lo que la gente
--    ya sabe.* Si hay avisos de este tipo, se listan antes:
--      select count(*) from public.avisos_coach where tipo='predisposicion_etapa';

drop table if exists public.raza_predisposicion;
drop table if exists public.cat_predisposicion;

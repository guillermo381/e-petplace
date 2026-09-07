-- REVERSA de 20260909900000_s113a_firma_predisposiciones.sql · escrita ANTES.
-- QUÉ DESHACE: las columnas de firma y el estado 'revisada' de las 22 filas.
-- 🔴 QUÉ NO DESHACE: los avisos que ya nacieron de esas reglas. Y **volver
--    todo a 'en_revision' APAGA la anticipación** para las seis razas con
--    mascotas reales, sin fallar ruidoso: Nexo simplemente deja de adelantarse.
--    Antes de correr: select count(*) from public.avisos_coach where tipo='anticipacion';
update public.raza_predisposicion set estado='en_revision'
 where estado='revisada';
alter table public.raza_predisposicion drop column if exists revisado_por;
alter table public.raza_predisposicion drop column if exists revisado_en;

-- REVERSA de 20260909720000_s113a_contexto_plano.sql · escrita ANTES.
-- QUÉ DESHACE: los campos planos del contexto y el paso del memorial.
-- QUÉ NO DESHACE: nada de datos.
-- ⚠️ Revertir **deja muda la edge `coach`**: lee `c.nombre` en la raíz y
--    volvería a recibirlo sólo anidado. Y peor: **reactiva el rebote de
--    memorial**, con lo cual una mascota fallecida devolvería «no pudimos leer
--    el expediente» en vez de la voz serena. Van juntas.
select 1;

-- REVERSA de 20260909760000_s113a_peso_reciente.sql · escrita ANTES.
-- QUÉ DESHACE: el peso del contexto vuelve a ser sólo el clínico.
-- QUÉ NO DESHACE: nada de datos.
-- ⚠️ Revertir hace que Nexo diga «no tengo su peso» sobre mascotas cuya
--    familia SÍ lo pesó en casa. No es un error visible: es un dato que
--    desaparece de la conversación sin que nadie lo note.
select 1;

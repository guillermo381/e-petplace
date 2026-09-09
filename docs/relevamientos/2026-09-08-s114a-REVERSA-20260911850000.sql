-- REVERSA de 20260911850000_s114a_casa_toma_caso.sql — escrita ANTES.
-- Deshace: la transición con_prestador→con_casa actor 'casa'; el branch is_admin
-- de caso_pedir_casa; el guard temprano de caso_resolver.
-- NO revierte datos (ningún caso movido se devuelve). Es puro DDL + código.
DELETE FROM cat_transiciones_caso WHERE desde='con_prestador' AND hasta='con_casa' AND actor='casa';
-- caso_pedir_casa y caso_resolver: se re-aplican sus versiones previas
-- (20260911610000 rpcs_del_caso para pedir_casa; 20260911830000 para resolver).

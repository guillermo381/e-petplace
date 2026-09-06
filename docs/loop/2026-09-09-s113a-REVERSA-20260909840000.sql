-- REVERSA de 20260909840000_s113a_contanos.sql · escrita ANTES.
-- QUÉ DESHACE: el despachador del «contanos» y el lector de la sugerencia.
-- QUÉ **NO** DESHACE: lo que las familias contaron. Cada hecho ya se guardó
--   por su puerta propia y vive en su tabla; este despachador sólo elegía cuál.
--   *Revertirlo cierra el camino corto, no borra lo que entró por él.*
drop function if exists public.guardar_hecho_clasificado(uuid, text, text, jsonb);
drop function if exists public.obtener_sugerencia_conociendolo(uuid);

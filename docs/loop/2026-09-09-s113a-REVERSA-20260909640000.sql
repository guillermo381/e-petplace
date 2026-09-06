-- REVERSA de 20260909640000_s113a_buscar_en_mi_familia.sql · escrita ANTES.
--
-- QUÉ DESHACE: la función de búsqueda y los seis índices GIN.
-- QUÉ NO DESHACE: nada de datos — es un lector puro más índices.
--
-- ⚠️ Lo único que hay que saber: **soltar los índices no rompe la búsqueda,
-- la vuelve lenta**. Si algún día hay que revertir sólo por espacio, la
-- función sigue contestando (recorriendo las tablas enteras) y el síntoma va a
-- ser latencia, no error. *Un modo de falla silencioso se declara.*

drop function if exists public.buscar_en_mi_familia(text, integer);
drop index if exists public.idx_fts_mascotas;
drop index if exists public.idx_fts_productos;
drop index if exists public.idx_fts_prestadores;
drop index if exists public.idx_fts_pedido_items;
drop index if exists public.idx_fts_eventos_texto;

-- REVERSA de 20260912610000 · escrita ANTES.
-- ⚠️ Borra el registro de firmas: el gate `verify:edge-desplegada` pierde su
--    camino EXACTO y cae al heurístico de tiempos para todo — que compara
--    proxies y no contenido.
DROP TABLE IF EXISTS public.edge_despliegues;

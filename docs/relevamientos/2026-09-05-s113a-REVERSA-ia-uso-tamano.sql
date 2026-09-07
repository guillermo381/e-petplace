-- REVERSA de 20260909300000_s113a_ia_uso_tamano_del_prompt.sql (S113-A)
-- Escrita ANTES de aplicar.
-- 🔴 QUÉ NO DESHACE: los tamaños ya registrados se pierden con la columna, y
-- **son irrecuperables**: nadie guarda el prompt que produjo cada llamada.
begin;
drop view if exists public.v_ia_costo_por_pieza_dia;
alter table public.ia_uso drop column if exists prompt_chars;
alter table public.ia_uso drop column if exists imagen_chars;
create view public.v_ia_costo_por_pieza_dia as
 SELECT (created_at AT TIME ZONE 'America/Guayaquil'::text)::date AS dia, pieza, modelo,
    count(*) AS llamadas, count(*) FILTER (WHERE resultado <> 'ok'::text) AS fallidas,
    sum(tokens_entrada) AS tokens_entrada, sum(tokens_salida) AS tokens_salida,
    sum(tokens_cache_lectura) AS tokens_cache_lectura,
    sum(tokens_cache_escritura) AS tokens_cache_escritura,
    round(sum(costo_estimado_usd), 4) AS costo_usd,
    round(avg(costo_estimado_usd), 6) AS costo_promedio_por_llamada,
    round(avg(latencia_ms)) AS latencia_promedio_ms, max(latencia_ms) AS latencia_peor_ms
   FROM ia_uso GROUP BY 1,2,3;
commit;

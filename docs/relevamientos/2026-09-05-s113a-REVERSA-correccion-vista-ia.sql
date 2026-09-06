-- REVERSA de 20260909320000_s113a_correccion_tokens_de_imagen.sql (S113-A)
-- Escrita ANTES de aplicar.
-- 🔴 QUÉ NO DESHACE: revertir devuelve `imagen_chars_promedio` a la vista, y con
-- ella vuelve la lectura equivocada que esta migración vino a sacar. La columna
-- no se borra en ningún caso: el dato es real, lo que estaba mal era leerlo como
-- si midiera tokens.
begin;
drop view if exists public.v_ia_costo_por_pieza_dia;
create view public.v_ia_costo_por_pieza_dia as
 SELECT (created_at AT TIME ZONE 'America/Guayaquil'::text)::date AS dia, pieza, modelo,
    count(*) AS llamadas, count(*) FILTER (WHERE resultado <> 'ok'::text) AS fallidas,
    sum(tokens_entrada) AS tokens_entrada, sum(tokens_salida) AS tokens_salida,
    sum(tokens_cache_lectura) AS tokens_cache_lectura,
    sum(tokens_cache_escritura) AS tokens_cache_escritura,
    round(sum(costo_estimado_usd), 4) AS costo_usd,
    round(avg(costo_estimado_usd), 6) AS costo_promedio_por_llamada,
    round(avg(prompt_chars)) AS prompt_chars_promedio,
    round(avg(imagen_chars)) AS imagen_chars_promedio,
    count(*) FILTER (WHERE prompt_chars IS NOT NULL) AS llamadas_con_tamano,
    round(avg(latencia_ms)) AS latencia_promedio_ms, max(latencia_ms) AS latencia_peor_ms
   FROM ia_uso GROUP BY 1,2,3;
commit;

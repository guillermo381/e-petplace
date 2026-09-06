-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — `ia_uso` guarda EL TAMAÑO DEL PROMPT, no sólo lo que costó
--
-- ── EL HUECO QUE ESTO CIERRA, con su caso ───────────────────────────────────
-- E midió que la edge parecía mandar **~1.200 tokens de entrada MÁS** que el
-- mismo prompt por API, y **no se pudo cerrar**: `ia_uso` guardaba los tokens y
-- nada decía de qué TAMAÑO tenía el prompt que los produjo. *Un prompt que
-- crece es indistinguible de una imagen que crece cuando lo único que se
-- registra es la suma de los dos.* D lo dejó medido en el LOG de la edge; acá
-- pasa a ser una columna, que es lo que se puede consultar seis meses después.
--
-- 🔴 SON CARACTERES Y NO TOKENS, Y ESO SE DECLARA EN LUGAR DE DISIMULARSE.
-- La API devuelve `input_tokens` como **un solo número que ya suma texto e
-- imagen**: no hay forma de pedirle el desglose. Contar los tokens del prompt
-- aparte exigiría una segunda llamada al tokenizador por cada corrida — pagar
-- una medición para explicar otra. **Los caracteres son exactos, gratis y se
-- miden en la puerta**, y con `tokens_entrada` al lado alcanzan para contestar
-- la única pregunta que hacía falta: *cuando esto suba, ¿subió el prompt o subió
-- la imagen?* Un número aproximado de tokens habría contestado peor y **parecido
-- más preciso**, que es la peor combinación.
--
-- ⚠️ LAS FILAS VIEJAS QUEDAN EN NULL Y ESO ES CORRECTO: nadie guardó el prompt
-- de las 482 llamadas anteriores, así que **el dato no existe**. Rellenarlas con
-- un cero diría que el prompt estaba vacío. *Un NULL que dice «no se midió» vale
-- más que un número que miente.*
--
-- ⚠️ Y EL EFECTO ES DIFERIDO POR CONSTRUCCIÓN: cada edge empaqueta su propia
-- copia de `_shared`, así que la columna **sólo se llena en las edges que se
-- vuelvan a desplegar**. Las demás siguen escribiendo NULL hasta su próximo
-- deploy — y el NULL, otra vez, dice la verdad.
--
-- 76(g) — VEDA: NO RIGE. Dos columnas nullables y una vista recreada.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

alter table public.ia_uso add column if not exists prompt_chars integer;
alter table public.ia_uso add column if not exists imagen_chars integer;

comment on column public.ia_uso.prompt_chars is
  'Caracteres del sistema + los mensajes que se mandaron. NULL = no se midió '
  '(llamada anterior a S113 o edge sin redesplegar). Con tokens_entrada al lado '
  'permite distinguir un prompt que creció de una imagen que creció.';
comment on column public.ia_uso.imagen_chars is
  'Caracteres del base64 de las imágenes, o NULL si la llamada no llevó ninguna.';

drop view if exists public.v_ia_costo_por_pieza_dia;
create view public.v_ia_costo_por_pieza_dia as
 SELECT (created_at AT TIME ZONE 'America/Guayaquil'::text)::date AS dia,
    pieza, modelo,
    count(*) AS llamadas,
    count(*) FILTER (WHERE resultado <> 'ok'::text) AS fallidas,
    sum(tokens_entrada) AS tokens_entrada,
    sum(tokens_salida) AS tokens_salida,
    sum(tokens_cache_lectura) AS tokens_cache_lectura,
    sum(tokens_cache_escritura) AS tokens_cache_escritura,
    round(sum(costo_estimado_usd), 4) AS costo_usd,
    round(avg(costo_estimado_usd), 6) AS costo_promedio_por_llamada,
    -- Las tres que contestan «¿de dónde salió el costo?». Se promedian SÓLO
    -- sobre las que midieron: un `avg` sobre NULLs los ignora, así que una edge
    -- sin redesplegar no arrastra el promedio hacia abajo.
    round(avg(prompt_chars)) AS prompt_chars_promedio,
    round(avg(imagen_chars)) AS imagen_chars_promedio,
    count(*) FILTER (WHERE prompt_chars IS NOT NULL) AS llamadas_con_tamano,
    round(avg(latencia_ms)) AS latencia_promedio_ms,
    max(latencia_ms) AS latencia_peor_ms
   FROM ia_uso
  GROUP BY 1, 2, 3;

comment on view public.v_ia_costo_por_pieza_dia is
  'Costo por pieza y día. `llamadas_con_tamano` dice sobre cuántas se pudo medir '
  'el tamaño del prompt: si es 0, esa edge todavía no se redesplegó.';

commit;

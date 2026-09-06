-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — CORRECCIÓN: el largo del base64 NO mide los tokens de una imagen
--
-- 🔴 LO QUE ESTABA MAL, y era MÍO, no de la columna.
-- `20260909300000` puso `prompt_chars` e `imagen_chars` con un porqué escrito
-- así: *«un prompt que crece es indistinguible de una imagen que crece»* — y de
-- ahí saqué, mirando la primera llamada, que el prompt era «el 6 % del cuerpo» y
-- que la divergencia de ~1.200 tokens no podía venir de él.
--
-- **Los tokens de una imagen NO salen de su base64: salen de sus PÍXELES**
-- (ancho × alto, del orden de 1.500 fijos para las fotos de esta app). Así que
-- 5.891 caracteres de prompt contra 93.616 de base64 **no reparten nada** — son
-- dos magnitudes que no se pueden dividir una por otra. *La cuenta daba un
-- número, y un número que sale de dividir peras por litros se lee igual de firme
-- que uno correcto.*
--
-- ✅ EL REPARTO REAL LO MIDIÓ D CON `count_tokens`, que es el instrumento que
-- contesta esta pregunta: **3.175 tokens del prompt nuevo contra 1.718 del
-- viejo** ⇒ ahí está la divergencia entera, **y era el prompt** — exactamente lo
-- contrario de lo que yo había inferido.
--
-- ── QUÉ QUEDA, ENTONCES ─────────────────────────────────────────────────────
-- La columna **se queda y sirve**, pero para lo que de verdad puede contestar:
-- **ver crecer un prompt en el tiempo.** Si el mismo `pieza` pasa de 5.891 a
-- 12.000 caracteres entre dos semanas, eso se ve acá y no hace falta ningún
-- tokenizador para verlo. Lo que NO se puede es usarla para repartir el costo de
-- una llamada entre texto e imagen.
--
-- `imagen_chars_promedio` **sale de la vista de costo**: al lado de
-- `prompt_chars_promedio` invita justo a la división que no se puede hacer. La
-- columna sigue en la tabla —mide algo real, el tamaño del cuerpo que se manda,
-- que importa para latencia y para límites de subida— pero **deja de estar donde
-- se lee el costo**.
--
-- *La corrección no es que el dato estuviera mal: es que yo lo leí como si
-- midiera otra cosa. El instrumento correcto para tokens es `count_tokens`, y
-- cuesta una llamada.*
--
-- 76(g) — VEDA: NO RIGE. Comentarios y una vista recreada.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

comment on column public.ia_uso.prompt_chars is
  'Caracteres del sistema + los mensajes. Sirve para VER CRECER UN PROMPT EN EL '
  'TIEMPO. 🔴 NO sirve para repartir el costo entre texto e imagen: los tokens de '
  'una imagen salen de sus PÍXELES, no de su base64. Para el reparto, count_tokens.';

comment on column public.ia_uso.imagen_chars is
  'Caracteres del base64 de las imágenes; NULL si no llevó ninguna. Mide el '
  'TAMAÑO DEL CUERPO que se manda (latencia, límites de subida). 🔴 NO es un '
  'proxy de tokens de imagen — ésos se calculan por píxeles.';

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
    -- Sólo el prompt, y sólo para verlo crecer. `imagen_chars` NO está acá a
    -- propósito: al lado de esta columna invitaba a repartir el costo entre
    -- texto e imagen, y ese reparto no se puede hacer con caracteres.
    round(avg(prompt_chars)) AS prompt_chars_promedio,
    count(*) FILTER (WHERE prompt_chars IS NOT NULL) AS llamadas_con_tamano,
    round(avg(latencia_ms)) AS latencia_promedio_ms,
    max(latencia_ms) AS latencia_peor_ms
   FROM ia_uso
  GROUP BY 1, 2, 3;

comment on view public.v_ia_costo_por_pieza_dia is
  'Costo por pieza y día. `prompt_chars_promedio` es para ver crecer un prompt '
  'en el tiempo, jamás para repartir el costo de una llamada. '
  '`llamadas_con_tamano` dice sobre cuántas se pudo medir: 0 = edge sin redesplegar.';

commit;

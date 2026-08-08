-- REVERSA de 20260808100000_s91a_vista_publica_ensanche.sql (escrita ANTES)
-- Devuelve la vista a sus 21 columnas (sin portadas, sin clip_url, sin
-- `categoria` en servicios). ⚠️ Correrla deja la ficha pública MÁS POBRE que
-- la que el prestador cree mostrar, y al cliente sin poder componer la voz de
-- oficio: tendría que re-implementar el mapa de 29 códigos, que es la segunda
-- verdad que esta enmienda vino a evitar.
-- El definidor previo se repone re-aplicando la migración de S84 que la creó
-- + el `security_invoker=false` de `20260808080000` (que NO se revierte acá:
-- revertirlo reabriría la fuga).
BEGIN; SELECT 1; COMMIT;

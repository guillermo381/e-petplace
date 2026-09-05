-- REVERSA de 20260909120000 (S113-A · 1.0.1 · vacuna_codigo por ítem)
-- Escrita ANTES de aplicar.
-- ⚠️ NO deshace datos: los `vacuna_codigo` ya escritos por esta puerta quedan
-- en las filas. Revertir sólo hace que la puerta deje de ACEPTARLO — y el
-- resultado es peor que antes: la extracción lo va a seguir mandando y se va a
-- perder en silencio, que es exactamente lo que esta migración vino a curar.
begin;
drop function if exists public.registrar_vacunas_de_carnet(uuid, jsonb, text);
-- Y hay que recrear la versión de 20260909060000 (sin `vacuna_codigo`).
commit;

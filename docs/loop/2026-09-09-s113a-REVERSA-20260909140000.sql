-- REVERSA de 20260909140000 (S113-A · la cobertura de una aplicación)
-- Escrita ANTES de aplicar.
--
-- ⚠️ NO DESHACE DATOS: dropear `codigos_cubiertos` borra qué casillas cubría
-- cada combinada, y eso no vive en ningún otro lado. `vacuna_codigo` NO alcanza
-- para reconstruirlo — es justo la información que la columna agrega.
--
-- ⚠️ Y DEJA UNA INCOHERENCIA PEOR QUE EL ESTADO ANTERIOR: si se revierte sólo
-- el motor, las apps van a seguir mandando `codigos_cubiertos` y se va a perder
-- en silencio; y una mascota que hoy está «al día» por una combinada va a pasar
-- a «nunca_aplicada» sin que nada cambie en su expediente.
begin;
drop function if exists public.obtener_plan_vacunal(uuid, date, int);
drop function if exists public.evaluar_requisitos_guarderia(uuid);
drop function if exists public.registrar_vacunas_de_carnet(uuid, jsonb, text);
alter table public.evento_vacuna_aplicada drop constraint if exists chk_vacuna_codigos_cubiertos;
alter table public.evento_vacuna_aplicada drop column if exists codigos_cubiertos;
-- Y hay que recrear las TRES funciones en su versión anterior:
--   obtener_plan_vacunal          → 20260909100000
--   registrar_vacunas_de_carnet   → 20260909120000
--   evaluar_requisitos_guarderia  → su migración original (S107, guardería)
commit;

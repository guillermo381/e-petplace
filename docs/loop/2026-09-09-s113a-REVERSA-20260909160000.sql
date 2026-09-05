-- REVERSA de 20260909160000 (S113-A · precision_fecha de la vacuna)
-- Escrita ANTES de aplicar.
--
-- ⚠️ NO DESHACE DATOS, y su pérdida es de las silenciosas: al dropear la
-- columna, una fila con `precision_fecha='mes'` queda con `fecha_aplicada` en el
-- PRIMER DÍA del mes y **nada que diga que ese día es un ancla y no un dato**.
-- El expediente pasa a afirmar «se aplicó el 1 de mayo» sobre algo que sólo se
-- sabía del mes. *Revertir no devuelve la duda: la borra.*
begin;
drop function if exists public.registrar_vacunas_de_carnet(uuid, jsonb, text);
drop function if exists public.obtener_plan_vacunal(uuid, date, int);
drop function if exists public._cobertura_vacunal(uuid);
alter table public.evento_vacuna_aplicada drop constraint if exists chk_vacuna_precision_fecha;
alter table public.evento_vacuna_aplicada drop column if exists precision_fecha;
-- Y hay que recrear las tres funciones de 20260909140000.
commit;

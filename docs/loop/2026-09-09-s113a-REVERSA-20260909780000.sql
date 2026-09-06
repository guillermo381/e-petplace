-- REVERSA de 20260909780000_s113a_puertas_familia_salud.sql · escrita ANTES.
-- QUÉ DESHACE: las tres puertas de familia.
-- 🔴 QUÉ **NO** DESHACE: lo que las familias ya declararon. Una alergia
--    sospechada que alguien anotó porque a su perro se le hincha la cara con
--    pollo **queda en el expediente** — y debe quedar. La reversa cierra la
--    puerta; no borra lo que entró por ella.
--    Antes de correrla, qué hay:
--      select count(*) from public.evento_alergia_diagnosticada where prestador_id is null;
--      select count(*) from public.eventos_mascota where tipo='observacion_comportamiento';

drop function if exists public.registrar_observacion_comportamiento(uuid, text, timestamptz);
drop function if exists public.declarar_alergia_familia(uuid, text, text, text, date);
drop function if exists public.declarar_condicion_familia(uuid, text, text, date);

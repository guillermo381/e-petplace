-- REVERSA de la migracion S78-A7 (motor minimo de la vitrina).
-- Escrita ANTES de aplicar, el 26-jul-2026.
--
-- NOTA HONESTA: revertir el CODIGO no revierte los DATOS.
--  · El DROP COLUMN pierde qué negocios habian encendido la vitrina.
--    Hoy eso es inofensivo (nace `false` en las 5 filas y el guard
--    IMPIDE encenderla mientras el aviso no exista), pero deja de serlo
--    el dia que alguna este en `true`.
--  · Las citas creadas con persona ELEGIDA por la familia conservan esa
--    persona: revertir el motor no las devuelve al reparto automatico,
--    y esta bien que asi sea (la verdad firme es con ese alguien).
--
-- Las tres funciones se restituyen a su firma de 4/3/6 argumentos. El
-- cuerpo vivo de cada una, leido ANTES de tocarlas, esta en:
--   docs/relevamientos/2026-07-26-s78a-REVERSA-crear_bloqueo_agenda.sql
-- (para crear_bloqueo_agenda; las otras dos se restituyen quitando el
-- parametro y su clausula, que es un cambio de una linea en cada una).

DROP TRIGGER IF EXISTS trg_prestadores_gate_vitrina ON public.prestadores;
DROP FUNCTION IF EXISTS public._trg_prestadores_gate_vitrina();

DROP FUNCTION IF EXISTS public.obtener_personas_que_atienden(uuid, uuid);

-- Las firmas NUEVAS (con p_empleado_id). Al dropearlas hay que volver a
-- crear las viejas desde el cuerpo guardado — no basta con este DROP.
DROP FUNCTION IF EXISTS public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time without time zone, text, uuid);
DROP FUNCTION IF EXISTS public.obtener_inicios_vet_disponibles(date, text, uuid, uuid);
DROP FUNCTION IF EXISTS public._inicios_disponibles_prestador(uuid, uuid, date, integer, uuid);

ALTER TABLE public.prestadores DROP COLUMN IF EXISTS expone_personas;

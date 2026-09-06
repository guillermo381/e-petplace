-- REVERSA de 20260909860000_s113a_propuestas_memoria.sql · escrita ANTES.
--
-- QUÉ DESHACE: la tabla de propuestas y sus puertas, y le devuelve a
--   `agregar_memoria_coach` su parámetro `p_fuente`.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que hay que leer: **devolver `p_fuente`
--   REABRE el agujero** que esta migración cierra — cualquiera vuelve a poder
--   escribir un hecho declarando que lo confirmó la IA. Y no falla ruidoso:
--   la memoria sigue funcionando, sólo que su procedencia vuelve a ser una
--   afirmación de quien llama en vez de un hecho del sistema.
--   Las propuestas ya confirmadas quedan en `coach_memoria` con su fuente —
--   eso está bien: el hecho ocurrió.
--
-- ANTES DE CORRER:  select count(*) from public.propuestas_memoria;

drop function if exists public.rechazar_propuesta_memoria(uuid);
drop function if exists public.confirmar_propuesta_memoria(uuid);
drop function if exists public.listar_propuestas_memoria(uuid);
drop function if exists public.proponer_memoria_coach(uuid, text, text, uuid);
drop table if exists public.propuestas_memoria;

drop function if exists public.agregar_memoria_coach(uuid, text);
create or replace function public.agregar_memoria_coach(
  p_mascota_id uuid, p_hecho text, p_fuente text default 'familia')
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$ begin
  raise exception 'reversa_incompleta: el cuerpo original vive en 20260909600000';
end $function$;

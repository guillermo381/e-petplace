-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910040000_s113a_cat_rasgos.sql          (ESCRITA ANTES)
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Devuelve `registrar_observacion_comportamiento` a sus TRES parámetros y
-- borra `cat_rasgos`.
--
-- 🔴 QUÉ **NO** DESHACE:
-- ① Las observaciones ya escritas con códigos QUEDAN. Su `rasgos` jsonb sigue
--    guardando los códigos, que después de borrar el catálogo ya no resuelven
--    a ninguna etiqueta. *Un rasgo sin catálogo no es un dato perdido: es un
--    dato que dejó de poder leerse.* Por eso la reversa NO borra `cat_rasgos`
--    si alguna observación lo referencia — aborta y obliga a decidir.
-- ② El wrapper y la pantalla de C siguen mandando `codigos`: revertir la base
--    sin revertir el bundle deja el «contanos» rebotando.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if exists (
    select 1 from evento_temperamento_observacion o
     where jsonb_typeof(o.rasgos) = 'array' and jsonb_array_length(o.rasgos) > 0
  ) then
    raise exception 'hay observaciones con rasgos: decidí qué hacer con ellas antes de revertir';
  end if;
end $$;

drop function if exists public.registrar_observacion_comportamiento(uuid, text, timestamptz, text[]);

create or replace function public.registrar_observacion_comportamiento(
  p_mascota_id uuid, p_texto text, p_fecha timestamptz default now()
) returns jsonb language plpgsql security definer
set search_path to 'public','pg_temp' as $$
begin
  raise exception 'reversa parcial: el cuerpo original vive en su migración de origen';
end $$;

drop table if exists public.cat_rasgos;

select 'reversa 20260910040000 · el cuerpo original se restaura de su migración' as nota;

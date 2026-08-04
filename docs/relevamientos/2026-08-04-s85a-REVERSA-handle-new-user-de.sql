-- ============================================================================
-- REVERSA de 20260804130000_s85_handle_new_user_de.sql   (salida (d+e))
-- Escrita ANTES de aplicar.
--
-- QUÉ REVIERTE:
--   ① el cuerpo de `handle_new_user()` vuelve a leer SOLO `'nombre'` y a caer
--      al local-part del correo.
--   ② el nombre de Satori vuelve a `'satorilatam'`.
--
-- ⚠️ AVISO PROPIO — REVERTIR REPONE UN DEFECTO MEDIDO, no una preferencia:
--   la clave `'nombre'` NO LA MANDA NINGÚN PROVEEDOR (Google manda `full_name`
--   y `name`), así que el `coalesce` cae SIEMPRE al correo: no es un fallback,
--   es el único camino. Revertir devuelve el sembrado de username-como-nombre
--   en TODA alta nueva por registro propio.
--   Y ese defecto NO SE VE: no rompe nada, no tira error, y produce un nombre
--   plausible que la persona obedece. Sobrevivió en 7 de 7 titulares sin que
--   ningún typecheck, lint ni gate lo viera.
--
-- ⚠️ EL `SET search_path` NO SE TOCA ACÁ. Vive en la migración anterior
--   (20260804110000) y tiene su propia reversa. Revertir el comportamiento no
--   debe revertir el endurecimiento — por eso son dos migraciones.
--
-- ANCLA DEL BACKFILL (76(g)): profiles.id = '97d163e1-4b08-43cf-8c07-883799d9fdb1'
--   (única fila tocada; su valor previo medido: 'satorilatam').
-- ============================================================================

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

update public.profiles
   set nombre = 'satorilatam'
 where id = '97d163e1-4b08-43cf-8c07-883799d9fdb1'
   and nombre = 'Satori Latam';

-- verificación de la reversa:
--   select nombre from public.profiles
--   where id = '97d163e1-4b08-43cf-8c07-883799d9fdb1';   -- espera 'satorilatam'

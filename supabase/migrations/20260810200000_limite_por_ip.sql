-- ═══════════════════════════════════════════════════════════════════
-- EL RATE LIMIT, EN LA BASE — porque en memoria NO FRENABA.
--
-- Medido con un POST real: 8 envíos seguidos desde la misma IP contra un
-- tope declarado de 5, y los OCHO devolvieron 200. El contador vivía en un
-- `Map` del isolate, y las edge functions escalan a varios: cada request
-- puede caer en uno nuevo, con el contador en cero.
--
-- Es L-192 de la casa en su forma exacta: **una verificación cuyo modo de
-- falla es el SILENCIO no es una verificación.** Se veía implementado, no
-- daba error, y no frenaba nada.
--
-- ⚠️ NO SE GUARDA LA IP. Se guarda un SHA-256 de la IP con un salt del
-- entorno: alcanza para contar y no alcanza para identificar a nadie. La
-- política de privacidad publicada enumera lo que se recoge y no menciona
-- IP — guardarla en claro la contradiría.
-- ═══════════════════════════════════════════════════════════════════

begin;

create table marketing.limite_ip (
  hash_ip     text        primary key,
  ventana     timestamptz not null default now(),
  conteo      int         not null default 0
);

comment on table marketing.limite_ip is
  'Contador de intentos por IP HASHEADA para frenar abuso del formulario. No contiene datos personales: el hash no permite recuperar la IP.';

/**
 * Devuelve TRUE si el intento se permite, FALSE si superó el tope.
 * La ventana se reinicia sola al vencer: sin cron, sin barredor.
 */
create or replace function public.registrar_intento_lead(
  p_hash  text,
  p_tope  int default 5,
  p_horas int default 1
) returns boolean
language plpgsql
security definer
set search_path = marketing, pg_temp
as $$
declare
  v_conteo int;
begin
  insert into marketing.limite_ip (hash_ip, ventana, conteo)
  values (p_hash, now(), 1)
  on conflict (hash_ip) do update
    set conteo  = case when marketing.limite_ip.ventana < now() - make_interval(hours => p_horas)
                       then 1 else marketing.limite_ip.conteo + 1 end,
        ventana = case when marketing.limite_ip.ventana < now() - make_interval(hours => p_horas)
                       then now() else marketing.limite_ip.ventana end
  returning conteo into v_conteo;

  -- Higiene perezosa: lo viejo se borra al pasar, sin cron.
  delete from marketing.limite_ip where ventana < now() - interval '24 hours';

  return v_conteo <= p_tope;
end;
$$;

revoke all on function public.registrar_intento_lead(text,int,int) from public, anon, authenticated;
grant execute on function public.registrar_intento_lead(text,int,int) to service_role;
grant usage on schema marketing to service_role;
grant select, insert, update, delete on marketing.limite_ip to service_role;

commit;

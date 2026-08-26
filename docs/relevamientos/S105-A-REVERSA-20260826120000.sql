-- REVERSA de 20260826120000_s105a_email_valido_y_correo_visible.sql
-- Escrita ANTES de aplicar.
-- QUÉ DESHACE: `invitar_a_familia` vuelve a aceptar cualquier texto con una
-- arroba, y se retira `estado_correo_invitacion`.
-- 🔴 QUÉ NO DESHACE: las invitaciones ya creadas quedan; las filas fallidas de
-- la cola siguen fallidas.
-- CONSECUENCIA: vuelve el defecto medido — un email con un ESPACIO adentro
-- (`karina charry@satorilatam.com`) pasa la puerta, la persona ve «enviada»,
-- y el correo muere 20 minutos después con un 422 del proveedor **en una fila
-- que ninguna pantalla lee**.
DROP FUNCTION IF EXISTS public.estado_correo_invitacion(uuid);

CREATE OR REPLACE FUNCTION public.invitar_a_familia(p_familia_id uuid, p_email text, p_nombre text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, token text, expira_en timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_email));
  v_token text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.familia_miembro fm
    where fm.familia_id = p_familia_id and fm.user_id = v_uid
      and fm.rol = 'adulto_titular' and fm.hasta is null
  ) then
    raise exception 'solo_titular_invita' using errcode = '42501';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.familia_miembro fm
    join auth.users u on u.id = fm.user_id
    where fm.familia_id = p_familia_id and fm.hasta is null and lower(u.email) = v_email
  ) then
    raise exception 'ya_es_miembro' using errcode = '23505';
  end if;

  -- 256 bits de CSPRNG sin depender de `extensions` (ver cabecera).
  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  return query
  insert into public.familia_invitaciones (familia_id, email, nombre, token, invitado_por)
  values (p_familia_id, v_email, nullif(btrim(coalesce(p_nombre,'')),''), v_token, v_uid)
  returning familia_invitaciones.id, familia_invitaciones.token, familia_invitaciones.expira_en;
end;
$function$
;

-- REVERSA de 20260826130000_s105a_ya_invitada.sql
-- Escrita ANTES de aplicar.
-- QUÉ DESHACE: `invitar_a_familia` vuelve a dejar que el índice único parcial
-- `ux_familia_inv_pendiente` rechace en silencio.
-- 🔴 CONSECUENCIA MEDIDA: re-invitar a alguien con invitación viva vuelve a dar
-- `23505` sin causa nombrada ⇒ el wrapper lo mapea a `error_desconocido` ⇒ la
-- pantalla dice «prueba de nuevo» sobre algo que va a fallar SIEMPRE hasta que
-- esa invitación venza. *Un guard que vive en un índice no puede explicarse:
-- sólo puede negarse.*
-- ⚠️ El índice NO se toca ni acá ni en la migración: es la red, y sigue siendo
-- correcto que exista.
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

  /* 🔴 VALIDACIÓN DE VERDAD — la anterior sólo pedía que HUBIERA una arroba.
     **Medido en carne el 25-ago:** entró `karina charry@satorilatam.com`
     —con un ESPACIO en el medio—, la persona vio «invitación enviada», y el
     correo murió **20 minutos después** con un `422` del proveedor *en una
     fila que ninguna pantalla lee*.
     *Un validador que sólo busca `@` no valida un email: confirma que alguien
     escribió una arroba.*

     ⚠️ ALCANCE DECLARADO: esto **no** pretende ser el RFC 5322 —ese regex es
     inmantenible y rechaza direcciones legítimas—. Ataja lo que el proveedor
     rechaza y lo que un dedo produce: espacios, arrobas de más o de menos,
     dominio sin punto, punto al borde. *Una dirección rara que pase acá va a
     rebotar en el envío, y para eso está la otra mitad de esta migración: que
     ese rebote se vea.* */
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@.]+$' then
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

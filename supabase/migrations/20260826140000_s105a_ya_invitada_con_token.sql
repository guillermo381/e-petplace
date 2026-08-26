-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · `ya_invitada` GANA EL TOKEN — la otra mitad de la voz
--
-- **Pedido de la pista C, medido:** con fecha e id se puede ofrecer *«cancelá
-- esa invitación»*, pero **no** *«compartile el enlace»* — y el founder dictó
-- las dos. *Un rebote que nombra la causa y ofrece una sola de las dos salidas
-- deja a la persona a mitad de camino.*
--
-- ⚠️ EL TOKEN ES UNA CREDENCIAL y por eso se declara a quién se le da: **sólo
-- a quien invitó**. El gate de titular ya corrió más arriba en la función, y
-- es alguien que **ya lo tenía** — se lo devolvimos cuando creó la invitación.
-- *No se revela nada nuevo: se le devuelve lo suyo a quien lo perdió de vista.*
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826140000.sql`
-- ══════════════════════════════════════════════════════════════════════════

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

  /* 🔴 ¿YA HAY UNA INVITACIÓN VIVA? — LA PREGUNTA QUE FALTABA.
     **Existía un guard y no podía hablar:** el índice único parcial
     `ux_familia_inv_pendiente (familia_id, lower(email)) WHERE estado =
     'pendiente'` rechaza el INSERT con un `23505` pelado. El wrapper mapea por
     MENSAJE, y ese mensaje no dice ninguno de los cuatro códigos ⇒ cae en
     `error_desconocido` ⇒ **la pantalla dice «prueba de nuevo» sobre algo que
     va a fallar SIEMPRE** hasta que la invitación previa venza.

     *Un guard que vive en un índice no puede explicarse: sólo puede negarse.*

     **Medido en carne (25-ago):** el founder invitó dos veces a la misma
     persona y las dos vio el genérico. La invitación previa era del 23-ago y
     **no vence hasta el 22-sep** — o sea que «prueba de nuevo» lo mandaba a
     repetir algo imposible durante cuatro semanas.

     ⚠️ EL ÍNDICE NO SE TOCA. Queda como **red**, no como puerta: si dos
     pedidos llegaran a la vez, él sigue siendo el que garantiza la unicidad.
     *Reemplazar la red por la pregunta dejaría una carrera abierta; poner la
     pregunta delante de la red es lo que la vuelve explicable.* */
  if exists (
    select 1 from public.familia_invitaciones fi
    where fi.familia_id = p_familia_id
      and lower(fi.email) = v_email
      and fi.estado = 'pendiente'
  ) then
    /* 🔴 EL TOKEN VIAJA — pedido de la pista C, y sin él **la mitad de la voz
       que el founder dictó no se puede construir**: se podía ofrecer «cancelá
       esa invitación» pero no «compartile el enlace».

       ⚠️ ES UNA CREDENCIAL: quien la tiene puede aceptar la invitación. Se
       entrega **sólo a quien invitó** —el gate de titular ya corrió arriba— y
       es alguien que **ya lo tenía**: se lo devolvimos al crearla. *No se
       revela nada nuevo; se le devuelve lo suyo a quien lo perdió de vista.* */
    raise exception 'ya_invitada|%|%|%',
      (select to_char(fi.created_at at time zone 'America/Guayaquil', 'YYYY-MM-DD')
         from public.familia_invitaciones fi
        where fi.familia_id = p_familia_id and lower(fi.email) = v_email
          and fi.estado = 'pendiente' limit 1),
      (select fi.id from public.familia_invitaciones fi
        where fi.familia_id = p_familia_id and lower(fi.email) = v_email
          and fi.estado = 'pendiente' limit 1),
      (select fi.token from public.familia_invitaciones fi
        where fi.familia_id = p_familia_id and lower(fi.email) = v_email
          and fi.estado = 'pendiente' limit 1)
      using errcode = '23505';
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


DO $cint$
DECLARE v_titular uuid; v_fam uuid; v_msg text; r record; v_tok text;
BEGIN
  SELECT fm.user_id, fm.familia_id INTO v_titular, v_fam
    FROM familia_miembro fm JOIN auth.users u ON u.id=fm.user_id
   WHERE u.email='guillo381+8@gmail.com' AND fm.rol='adulto_titular' AND fm.hasta IS NULL LIMIT 1;
  SELECT token INTO v_tok FROM familia_invitaciones
   WHERE lower(email)='kcharry1990@gmail.com' AND estado='pendiente' LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_titular::text,'role','authenticated')::text, true);
  PERFORM set_config('role','authenticated', true);
  BEGIN
    SELECT * INTO r FROM invitar_a_familia(v_fam, 'kcharry1990@gmail.com', NULL);
    v_msg := 'ACEPTÓ (mal)';
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM;
  END;
  PERFORM set_config('role','postgres', true);

  -- ① las CUATRO partes viajan
  IF array_length(string_to_array(v_msg,'|'),1) <> 4 THEN
    RAISE EXCEPTION 'CINTURÓN: el mensaje no trae las cuatro partes — %', v_msg;
  END IF;
  -- ② y el token es EL de la invitación viva, no otro
  IF split_part(v_msg,'|',4) <> v_tok THEN
    RAISE EXCEPTION 'CINTURÓN: el token devuelto NO es el de la invitación viva';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · partes=4 · fecha=% · token coincide con la invitación viva',
    split_part(v_msg,'|',2);
END $cint$;

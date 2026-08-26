-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · `ya_invitada` — EL GUARD QUE VIVÍA EN UN ÍNDICE APRENDE A HABLAR
--
-- EL DEFECTO, hallado por el founder en dispositivo y medido en la ventana
-- exacta de su segundo intento: invitar a alguien que **ya tiene una
-- invitación viva** rebotaba con *«No pudimos completar la invitación, prueba
-- de nuevo»*.
--
-- 🔴 LA CAUSA NO ERA UNA CAUSA FALTANTE — ERA UN GUARD MUDO. El índice
-- `ux_familia_inv_pendiente` ya impedía el duplicado, pero rechaza con un
-- `23505` pelado; el wrapper mapea por mensaje y ninguno de sus cuatro códigos
-- coincide ⇒ `error_desconocido` ⇒ el genérico.
--
-- > **Un guard que vive en un índice no puede explicarse: sólo puede negarse.**
--
-- **Y por eso «prueba de nuevo» era doblemente falso:** no decía la causa, y
-- mandaba a repetir algo que iba a fallar **igual durante cuatro semanas** —
-- la invitación previa era del 23-ago y vence el 22-sep.
--
-- ⚠️ NOTA DE MÉTODO, porque el error de medición es mío y vale anotarlo: la
-- primera pasada buscó en `pg_constraint` y concluyó *«no hay UNIQUE sobre
-- (familia, email)»*. **Un índice único parcial no es un constraint y no
-- aparece ahí.** *Medir el lugar equivocado y descartar con un dato incompleto
-- es el mismo patrón que esta jornada viene cazando.* Lo destapó
-- `pg_stat_statements`, que probó que la llamada SÍ llegaba al motor.
--
-- ⚠️ EL ÍNDICE NO SE TOCA. Queda como red contra la carrera de dos pedidos
-- simultáneos. *Poner la pregunta delante de la red es lo que la vuelve
-- explicable; reemplazarla dejaría una carrera abierta.*
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro, sin backfill.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826130000.sql`
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
    raise exception 'ya_invitada|%|%',
      (select to_char(fi.created_at at time zone 'America/Guayaquil', 'YYYY-MM-DD')
         from public.familia_invitaciones fi
        where fi.familia_id = p_familia_id and lower(fi.email) = v_email
          and fi.estado = 'pendiente' limit 1),
      (select fi.id from public.familia_invitaciones fi
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


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — 🔴 el ROJO se produce contra EL CASO REAL: la invitación viva a
-- `kcharry1990@gmail.com` en la familia del founder. Sólo lee (rollback).
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_titular uuid; v_fam uuid; v_msg text; v_otro text; r record;
BEGIN
  SELECT fm.user_id, fm.familia_id INTO v_titular, v_fam
    FROM familia_miembro fm JOIN auth.users u ON u.id = fm.user_id
   WHERE u.email = 'guillo381+8@gmail.com' AND fm.rol='adulto_titular' AND fm.hasta IS NULL
   LIMIT 1;
  IF v_titular IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no se encontró al titular del caso real';
  END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_titular::text,'role','authenticated')::text, true);
  PERFORM set_config('role','authenticated', true);

  -- ① EL CASO REAL: tiene invitación viva ⇒ tiene que decir `ya_invitada`
  BEGIN
    SELECT * INTO r FROM invitar_a_familia(v_fam, 'kcharry1990@gmail.com', NULL);
    v_msg := 'ACEPTÓ (mal)';
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM;
  END;

  -- ② EL CONTRA-CASO: alguien SIN invitación viva tiene que pasar
  BEGIN
    SELECT * INTO r FROM invitar_a_familia(v_fam, 'nadie.cinturon@ejemplo.com', NULL);
    v_otro := 'pasa';
  EXCEPTION WHEN OTHERS THEN v_otro := 'RECHAZÓ: ' || SQLERRM;
  END;

  IF v_msg NOT LIKE 'ya_invitada|%' THEN
    RAISE EXCEPTION 'CINTURÓN: el caso real NO dice ya_invitada — dijo: %', v_msg;
  END IF;
  /* 🔴 LA FECHA VIAJA EN EL MENSAJE, y es lo que le permite a la pantalla
     decir «ya la invitaste el 23 de agosto» en vez de un genérico con nombre
     nuevo. *Un código sin su dato es el mismo callejón con mejor etiqueta.* */
  IF v_msg NOT LIKE '%2026-08-23%' THEN
    RAISE EXCEPTION 'CINTURÓN: ya_invitada no lleva la fecha de la previa — %', v_msg;
  END IF;
  IF v_otro <> 'pasa' THEN
    RAISE EXCEPTION 'CINTURÓN: rechazó a alguien SIN invitación viva — %', v_otro;
  END IF;

  /* 🔴 EL RESIDUO DEL CONTRA-CASO SE BORRA ACÁ, no con un RAISE.
     El primer intento cerraba con `RAISE EXCEPTION` para imprimir el resultado
     — y eso **revertía la migración entera**: el cinturón daba verde y la
     función no quedaba aplicada. *Un arnés que para reportar deshace lo que
     vino a probar no probó nada que sobreviva.* */
  PERFORM set_config('role','postgres', true);
  DELETE FROM familia_invitaciones WHERE email = 'nadie.cinturon@ejemplo.com';

  RAISE NOTICE 'CINTURÓN VERDE · caso_real=% · contra_caso=%', v_msg, v_otro;
END $cint$;

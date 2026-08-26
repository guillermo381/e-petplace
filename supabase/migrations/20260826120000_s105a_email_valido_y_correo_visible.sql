-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · EL EMAIL SE VALIDA DE VERDAD, Y EL CORREO QUE FALLA SE VE
--
-- EL DEFECTO, hallado por el founder en dispositivo y medido en la cola:
--
--     email:  'karina charry@satorilatam.com'   ← un ESPACIO en el medio
--     estado: fallido · resend_422 "Invalid `to` field"
--
-- `invitar_a_familia` validaba con `position('@' in v_email) = 0` — **sólo
-- pedía que hubiera una arroba.** El espacio pasó, la persona vio «invitación
-- enviada», y **el correo murió 20 minutos después en una fila que ninguna
-- pantalla lee.**
--
-- 🔴 SON DOS DEFECTOS Y LOS DOS SE CURAN ACÁ, porque curar uno solo deja el
-- daño:
--   ① la puerta acepta basura ⇒ **se valida de verdad**;
--   ② el fallo del envío es **invisible** ⇒ nace `estado_correo_invitacion`.
-- *Validar mejor achica el problema pero no lo cierra: una dirección puede ser
-- válida y rebotar igual (buzón lleno, dominio caído). Lo que no puede seguir
-- pasando es que nadie se entere.*
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** HACE: el correo de invitación **sí funciona**
-- —medido: dos enviados de verdad el 23-ago— así que no se toca el despacho.
-- *El defecto no era que el correo no existiera: era que uno malo se aceptaba
-- y su fallo no se veía.*
--
-- 76(g) — VEDA: **NO RIGE.** DDL puro. Sin backfill: **las direcciones ya
-- guardadas no se revalidan** — *aplicar la regla nueva al pasado convertiría
-- invitaciones vivas en inválidas sin que nadie lo pidiera.*
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826120000.sql`
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


/* ② EL FALLO DEL CORREO, VISIBLE. Antes esto vivía sólo en
   `invitacion_correo_pendiente`, que ninguna pantalla lee ⇒ *quien invitaba
   se quedaba esperando un correo que ya había muerto.* */
CREATE OR REPLACE FUNCTION public.estado_correo_invitacion(p_invitacion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv familia_invitaciones;
  v_c   invitacion_correo_pendiente;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_inv FROM familia_invitaciones WHERE id = p_invitacion_id;
  /* Sólo quien invitó puede preguntar por su correo. Mismo código para «no
     existe» y «es de otro»: la diferencia confirmaría que existe. */
  IF NOT FOUND OR v_inv.invitado_por <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'invitacion_no_existe');
  END IF;

  SELECT * INTO v_c FROM invitacion_correo_pendiente
   WHERE invitacion_id = p_invitacion_id
   ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    /* 🔴 «SIN COLA» NO ES «FALLÓ». Si el invitado tiene cuenta, el aviso va
       por el motor de notificaciones y nunca pasa por esta tabla. *Decir
       «no se envió» acá sería inventar un fallo donde hubo otro camino.* */
    RETURN jsonb_build_object('ok', true, 'estado', 'sin_cola',
      'fallo_visible', false,
      'nota', 'no pasó por la cola: o va por el motor de avisos, o no se pidió');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'estado', v_c.estado,
    'intentos', v_c.intentos,
    'enviado_en', v_c.enviado_en,
    /* El motivo crudo del proveedor. **Es para diagnóstico, no para pintar**:
       `resend_422: {"statusCode":422,...}` no es una frase que una familia
       deba leer. La pantalla dice lo suyo; esto explica el porqué a quien
       tenga que arreglarlo. */
    'motivo', v_c.motivo,
    'fallo_visible', (v_c.estado = 'fallido'));
END $$;

REVOKE ALL ON FUNCTION public.estado_correo_invitacion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.estado_correo_invitacion(uuid) TO authenticated, service_role;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — 🔴 el ROJO se produce con LA DIRECCIÓN REAL que causó el fallo.
-- Sólo lee: no inserta ninguna invitación.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_rx text := '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@.]+$';
  v_malos text[] := ARRAY[
    'karina charry@satorilatam.com',   -- 🔴 EL CASO REAL, con su espacio
    'sinarroba.com', 'dos@@arrobas.com', 'sin@dominio',
    'punto@final.', '@sindueno.com', 'con espacio@x.com'];
  v_buenos text[] := ARRAY[
    'kcharry1990@gmail.com', 'guillo381+8@gmail.com',
    'a@b.co', 'nombre.apellido@sub.dominio.com'];
  v_x text; v_falla text;
BEGIN
  FOREACH v_x IN ARRAY v_malos LOOP
    IF v_x ~ v_rx THEN
      RAISE EXCEPTION 'CINTURÓN: el validador ACEPTA una dirección inválida: %', v_x;
    END IF;
  END LOOP;

  /* 🔴 EL CONTRA-CASO IMPORTA MÁS QUE EL CASO: un validador que rechaza todo
     también pasaría la mitad de arriba. *Rechazar una dirección legítima le
     cierra la puerta a una familia real, y eso es peor que un correo que
     rebota.* */
  FOREACH v_x IN ARRAY v_buenos LOOP
    IF v_x !~ v_rx THEN
      RAISE EXCEPTION 'CINTURÓN: el validador RECHAZA una dirección legítima: %', v_x;
    END IF;
  END LOOP;

  -- ② el lector existe y no lo alcanza anon
  IF has_function_privilege('anon','public.estado_correo_invitacion(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: el lector del correo es alcanzable por anon';
  END IF;

  -- ③ la fila real que motivó todo esto ahora tiene lector
  SELECT c.motivo INTO v_falla FROM invitacion_correo_pendiente c
   WHERE c.estado='fallido' ORDER BY c.created_at DESC LIMIT 1;

  RAISE NOTICE 'CINTURÓN VERDE · % inválidas rechazadas · % legítimas aceptadas · fallo real visible: %',
    array_length(v_malos,1), array_length(v_buenos,1), left(coalesce(v_falla,'(ninguno)'), 60);
END $cint$;

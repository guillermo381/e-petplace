-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · TANDA 3 — LA SALIDA: cerrar la cuenta y llevarse la copia
-- P15 (firmada 22-ago) · POLITICA-PRIVACIDAD-APP §19 (publicada 24-ago)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── LA REGLA QUE GOBIERNA ESTA TANDA, Y LA HACE DISTINTA DE TODAS ─────────
-- **Acá un defecto no se corrige con una OTA, porque los datos ya no están.**
-- Por eso: reversa escrita ANTES (`2026-08-24-s104a-REVERSA-cierre-cuenta.sql`),
-- el cinturón corre en **subtransacción que se deshace sola** (`L-406`), y el
-- reloj **nace inerte con llave del founder** (`L-408`).
--
-- ── 🔴 EL DISEÑO, Y POR QUÉ NO BORRA NADA DE `auth.users` ─────────────────
-- P15 §1: **«Cerrar la cuenta la vuelve INALCANZABLE. No destruye el registro.»**
-- ⇒ **NUNCA hay `DELETE FROM auth.users`.** Y eso no es una preferencia: es lo
-- que la base permite y lo que no. Medido hoy: **64 FKs** apuntan a `auth.users`
-- —**26 bloqueantes**, **21 en CASCADE**, 17 SET NULL—.
--
-- *El `DELETE` no solo rebota contra las bloqueantes: **donde NO rebota, hace
-- daño callado**.* `familia_miembro` y `mascota_codueño` están en CASCADE ⇒
-- borrar al humano **desengancha su vínculo con la mascota sin preguntarle a los
-- otros cuidadores**. Es literalmente el arrastre que P15 §1 declara temer.
--
-- ⚠️ **El censo firmado de S103 decía 62/24. Hoy son 64/26 — y no es un error de
-- S103: era exacto el 22-ago. Nuestra propia tanda movió el número** (nacieron
-- `familia_invitaciones` y su parentela). *Se anota para que nadie «corrija» el
-- censo viejo: los dos son verdaderos en su fecha.* (`L-166`)
--
-- ── 🔴 EL HALLAZGO DE DISEÑO QUE CAMBIÓ EL ORDEN, Y NADIE LO PIDIÓ ────────
-- El plan decía «identidades externas removidas» junto con perder el acceso.
-- **Medido contra la letra, eso rompe la ventana de arrepentimiento**: §19.2
-- promete 30 días para revertir, y quien entra con Google **no puede volver si
-- su identidad ya se retiró**. *La reversión existiría en la tabla y no en la
-- vida.*
-- ⇒ **Se parte en dos actos, y el reparto sale de la letra, no de la comodidad:**
--   · **HOY** — lo que quita el ACCESO y es reversible: `banned_until` + sesiones.
--   · **DÍA 30** — lo terminal: identidades, correo a tombstone, perfil
--     seudonimizado, objetos de Storage.
-- *§19.3 enumera las dos mitades juntas porque describe el resultado; el motor
-- las separa porque tiene que atravesar los 30 días que §19.2 promete.*
--
-- ── LA PALABRA, ENMENDADA EL MISMO DÍA ────────────────────────────────────
-- **SEUDONIMIZACIÓN, no anonimización** (§19.5, y P15 §2 enmendada acá por
-- hallazgo de S104-D). *Un identificador interno sigue uniendo los registros
-- que la ley obliga a conservar; sin él se pierde la trazabilidad de pagos y
-- consentimientos.* ⇒ **sigue siendo dato personal, y el titular conserva sus
-- derechos sobre él (§19.6).**
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LAS DOS LLAVES, INERTES ─────────────────────────────────────────────
-- Nacen ausentes a propósito: **el cable se tiende, la llave es del founder.**
-- Sin la clave, el reloj devuelve `cierre_apagado` y no toca una fila.
-- *Un mecanismo que borra datos no se enciende porque alguien lo desplegó.*

-- ── ② LA SOLICITUD DE CIERRE ──────────────────────────────────────────────
create table if not exists public.cierre_cuenta (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  solicitado_en    timestamptz not null default now(),
  programado_para  timestamptz not null,
  estado           text not null default 'programado'
                   check (estado in ('programado', 'revertido', 'ejecutado')),
  ejecutado_en     timestamptz,
  revertido_en     timestamptz,
  revertido_por    uuid references auth.users(id) on delete set null,
  motivo_reversion text,
  -- 🔴 el estado y sus marcas no pueden divergir: un 'ejecutado' sin fecha, o
  -- una fecha sin su estado, dejan el registro sin poder contestar QUÉ pasó.
  constraint chk_cierre_coherente check (
    (estado = 'programado' and ejecutado_en is null and revertido_en is null) or
    (estado = 'ejecutado'  and ejecutado_en is not null) or
    (estado = 'revertido'  and revertido_en is not null)
  )
);

comment on table public.cierre_cuenta is
  'P15 · la solicitud de cierre y su ventana de 30 días. UNA fila por persona: '
  'el PK sobre user_id hace que «dos cierres a la vez» sea inexpresable, en vez '
  'de defenderlo con un IF que alguien puede olvidar.';

alter table public.cierre_cuenta enable row level security;

-- Ve SU propia fila y nada más. No hay INSERT/UPDATE/DELETE para nadie: se
-- escribe SOLO por las funciones DEFINER de abajo. *Una tabla que decide quién
-- pierde el acceso no se escribe desde una pantalla.*
create policy cierre_cuenta_select_propio on public.cierre_cuenta
  for select to authenticated using (auth.uid() = user_id);

-- ── ③ LA COPIA (portabilidad, P15 cl.5 · LOPDP) ───────────────────────────
create table if not exists public.exportacion_datos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  solicitada_en timestamptz not null default now(),
  estado        text not null default 'pendiente'
                check (estado in ('pendiente', 'enviada', 'fallida')),
  archivo_path  text,
  enviada_a     text,
  enviada_en    timestamptz,
  expira_en     timestamptz,
  motivo_fallo  text
);

comment on table public.exportacion_datos is
  'P15 cl.5 · la copia que la persona se lleva. El archivo vive en bucket '
  'PRIVADO y viaja como URL firmada CON VENCIMIENTO, por correo. La URL jamás '
  'vuelve a la app: quedaría en el estado de la pantalla y en cualquier log, y '
  'es una URL firmada a los datos personales completos de alguien.';

alter table public.exportacion_datos enable row level security;

create policy exportacion_select_propia on public.exportacion_datos
  for select to authenticated using (auth.uid() = user_id);

-- una sola exportación en vuelo por persona: cada una escribe un archivo y
-- manda un correo. El índice lo vuelve imposible, no improbable.
create unique index if not exists ux_exportacion_pendiente
  on public.exportacion_datos (user_id) where estado = 'pendiente';

-- ── ④ LOS DOS TIPOS DE AVISO (contrato literal de S104-D) ─────────────────
-- D ya construyó los cuerpos en `despachar-correo` y me pasó qué espera cada
-- uno. **Nacen `en_sombra` como todo lo nuevo**: el correo no sale hasta que
-- el founder lo saque de sombra.
insert into public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
values
  ('copia_datos_lista', 'seguridad_cuenta',
   'Tu copia de datos está lista. Espera datos.url_copia (firmada) y datos.copia_vence (texto).',
   true, true, 'ambas', 'email', true),
  ('cierre_cuenta_confirmado', 'seguridad_cuenta',
   'Confirmación del cierre y su fecha efectiva. Espera datos.cierre_efectivo (texto, el día 30).',
   true, true, 'ambas', 'email', true)
on conflict (codigo) do nothing;

-- ⚠️ `audiencia = 'ambas'` **por la LEY DE PARIDAD DE CUENTA**, no por comodidad:
-- toda pieza del ciclo de cuenta nace en las dos apps. Y `seguridad_cuenta` en
-- vez de `operacion` porque es la categoría que ya existe para esta clase —
-- **medida contra los valores en uso, no elegida**. *El primer intento escribió
-- `audiencia = 'usuario'`, que no existe; lo frenó el CHECK. La regla de la
-- casa se cobró sola: el valor de un enum se MIDE, no se adivina.*

-- 🔴 `ignora_techo = true` en los dos, y es deliberado: **un aviso legal no se
-- pierde por un límite de frecuencia**. Quien pidió su copia o cerró su cuenta
-- tiene que recibir la constancia aunque ese día haya alcanzado su tope.
-- `canal_forzado = email` porque **el push no sirve para esto**: quien cierra
-- su cuenta pierde el acceso a la app, y el aviso tiene que llegarle AFUERA.

-- ── ⑤ EL PRE-CHEQUEO: ¿este cierre dejaría algo acéfalo? ──────────────────
create or replace function public._cierre_requiere_camino_asistido(p_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_negocio_acefalo boolean;
  v_familia_acefala boolean;
begin
  -- ① Titular de un prestador que tiene OTRA gente con acceso.
  --    Cerrar su cuenta personal dejaría a ese equipo sin dueño.
  --    ⚠️ NO es «el cierre del negocio»: eso no existe en la app por decisión
  --    del founder (excepción ② de la LEY DE PARIDAD). Esto solo detecta que
  --    su cierre PERSONAL arrastraría un negocio, y manda al camino asistido.
  select exists (
    select 1
    from public.prestador_empleados yo
    join public.prestador_empleados otros
      on otros.prestador_id = yo.prestador_id
     and otros.user_id is distinct from yo.user_id
     and otros.activo
    where yo.user_id = p_user
      and yo.activo
      and yo.rol = 'dueño'
  ) into v_negocio_acefalo;

  -- ② Único adulto titular de una familia que TIENE mascotas.
  --    *Si no hay mascotas no hay nada que quede huérfano: la familia vacía
  --    se va con él y eso no necesita a nadie del otro lado.*
  --    `hasta IS NULL` es como esta tabla marca vigencia — medido, no supuesto.
  select exists (
    select 1
    from public.familia_miembro fm
    where fm.user_id = p_user
      and fm.hasta is null
      and fm.rol = 'adulto_titular'
      and exists (select 1 from public.mascotas m where m.familia_id = fm.familia_id)
      and not exists (
        select 1 from public.familia_miembro otros
        where otros.familia_id = fm.familia_id
          and otros.user_id is distinct from p_user
          and otros.hasta is null
          and otros.rol = 'adulto_titular'
      )
  ) into v_familia_acefala;

  return coalesce(v_negocio_acefalo, false) or coalesce(v_familia_acefala, false);
end;
$$;

comment on function public._cierre_requiere_camino_asistido(uuid) is
  'TRUE si el cierre personal dejaría un negocio o una familia sin titular. '
  'Es el BACKSTOP DEL SERVIDOR: la pantalla ya lo avisa antes de confirmar, '
  'pero un cliente no se cree — y acá el error no se corrige con una OTA.';

revoke all on function public._cierre_requiere_camino_asistido(uuid) from public, anon;

-- ── ⑥ LA PUERTA: solicitar el cierre ──────────────────────────────────────
create or replace function public.solicitar_cierre_cuenta()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_uid       uuid := auth.uid();
  v_existente public.cierre_cuenta%rowtype;
  v_fecha     timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  end if;

  -- IDEMPOTENCIA HECHA DATO: repetir el pedido devuelve el MISMO resultado con
  -- la fecha real, jamás un error. *Pedir el cierre cuando ya lo pediste no es
  -- un fallo: es la misma intención, ya cumplida.* (contrato cerrado con C)
  select * into v_existente from public.cierre_cuenta
   where user_id = v_uid and estado = 'programado';
  if found then
    return jsonb_build_object(
      'ok', true,
      'programado_para', v_existente.programado_para,
      'ya_estaba', true
    );
  end if;

  if public._cierre_requiere_camino_asistido(v_uid) then
    return jsonb_build_object('ok', false, 'codigo', 'requiere_camino_asistido');
  end if;

  v_fecha := now() + interval '30 days';

  insert into public.cierre_cuenta (user_id, programado_para)
  values (v_uid, v_fecha)
  on conflict (user_id) do update
    set estado = 'programado', programado_para = excluded.programado_para,
        solicitado_en = now(), revertido_en = null, revertido_por = null,
        motivo_reversion = null, ejecutado_en = null;

  -- ── EL ACTO DE HOY: pierde el acceso, y NADA MÁS ────────────────────────
  -- 🔴 Las identidades externas NO se tocan acá. Ver la cabecera: retirarlas
  -- hoy dejaría a quien entra con Google sin poder ejercer los 30 días que
  -- §19.2 le promete. *La reversión existiría en la tabla y no en la vida.*
  update auth.users
     set banned_until = 'infinity'::timestamptz
   where id = v_uid;

  delete from auth.sessions where user_id = v_uid;

  -- la constancia sale por correo (tipo de D), porque después de esto la
  -- persona ya no entra a la app a leer nada.
  perform public.registrar_intencion_notificacion(
    'cierre_cuenta_confirmado', v_uid, null, null,
    jsonb_build_object('cierre_efectivo', to_char(v_fecha, 'DD/MM/YYYY')),
    'cierre-' || v_uid::text
  );

  return jsonb_build_object('ok', true, 'programado_para', v_fecha, 'ya_estaba', false);
end;
$$;

revoke all on function public.solicitar_cierre_cuenta() from public, anon;
grant execute on function public.solicitar_cierre_cuenta() to authenticated;

-- ── ⑦ LA PUERTA: llevarse la copia ────────────────────────────────────────
create or replace function public.exportar_mis_datos()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_uid    uuid := auth.uid();
  v_correo text;
  v_prev   public.exportacion_datos%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  end if;

  select email into v_correo from auth.users where id = v_uid;
  if v_correo is null then
    return jsonb_build_object('ok', false, 'codigo', 'error_desconocido');
  end if;

  select * into v_prev from public.exportacion_datos
   where user_id = v_uid and estado = 'pendiente';
  if found then
    return jsonb_build_object('ok', true, 'enviada_a', v_correo, 'ya_estaba', true);
  end if;

  insert into public.exportacion_datos (user_id, enviada_a)
  values (v_uid, v_correo);

  return jsonb_build_object('ok', true, 'enviada_a', v_correo, 'ya_estaba', false);
end;
$$;

revoke all on function public.exportar_mis_datos() from public, anon;
grant execute on function public.exportar_mis_datos() to authenticated;

-- ── ⑧ LA VUELTA ATRÁS (soporte, dentro de los 30 días) ────────────────────
create or replace function public.revertir_cierre_cuenta(p_user uuid, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare v_n int;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'codigo', 'no_autorizado');
  end if;

  update public.cierre_cuenta
     set estado = 'revertido', revertido_en = now(),
         revertido_por = auth.uid(), motivo_reversion = p_motivo
   where user_id = p_user and estado = 'programado';
  get diagnostics v_n = row_count;

  if v_n = 0 then
    return jsonb_build_object('ok', false, 'codigo', 'sin_cierre_programado');
  end if;

  -- devolver el acceso es lo único que hay que deshacer: hoy no se tocó nada más.
  update auth.users set banned_until = null where id = p_user;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.revertir_cierre_cuenta(uuid, text) from public, anon, authenticated;

-- ── ⑨ EL RELOJ, INERTE ────────────────────────────────────────────────────
create or replace function public.ejecutar_cierres_vencidos()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_vivo text;
  v_n    int := 0;
  r      record;
begin
  select valor into v_vivo from public.app_config where clave = 'cierre_cuenta_vivo';
  if coalesce(v_vivo, 'false') <> 'true' then
    return jsonb_build_object('ok', true, 'resultado', 'cierre_apagado');
  end if;

  for r in
    select user_id from public.cierre_cuenta
     where estado = 'programado' and programado_para <= now()
     for update skip locked
  loop
    -- ① lo terminal de auth: ahora sí, pasados los 30 días
    delete from auth.identities where user_id = r.user_id;
    delete from auth.sessions   where user_id = r.user_id;

    -- ② el correo a tombstone: la dirección deja de ser utilizable y deja de
    --    colisionar si esa persona vuelve a registrarse algún día.
    update auth.users
       set email = 'cerrada+' || r.user_id::text || '@epetplace.invalid',
           phone = null,
           raw_user_meta_data = '{}'::jsonb
     where id = r.user_id;

    -- ③ el perfil, SEUDONIMIZADO (§19.5): se van los datos de contacto, queda
    --    el vínculo interno que sostiene la trazabilidad que la ley exige.
    update public.profiles
       set nombre = null, telefono = null, avatar_url = null, email = null
     where id = r.user_id;

    update public.cierre_cuenta
       set estado = 'ejecutado', ejecutado_en = now()
     where user_id = r.user_id;

    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ok', true, 'ejecutados', v_n);
end;
$$;

revoke all on function public.ejecutar_cierres_vencidos() from public, anon, authenticated;

comment on function public.ejecutar_cierres_vencidos() is
  'El reloj del día 30. Nace INERTE: sin app_config.cierre_cuenta_vivo=true '
  'devuelve cierre_apagado sin tocar una fila. El cable se tiende hoy; la '
  'llave es del founder (L-408). Devuelve cuántos ejecutó: si un día empieza '
  'a ejecutar muchos, eso se lee — un reloj mudo no se puede vigilar.';

-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · LA LLAVE DEL CIERRE — la RPC gana la suya, y la clave NACE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 **DEFECTO MÍO, DIAGNOSTICADO POR S104-D, y la clase es peor que el caso.**
--
-- Puse la llave `cierre_cuenta_vivo` **solo en el reloj del día 30** y no en la
-- RPC de solicitud. **Tenía un argumento** —la solicitud es reversible, lo
-- irreversible es el día 30— **y el argumento estaba mal por una razón que no
-- había mirado: la solicitud NO es inocua.** Banea la cuenta y borra las
-- sesiones **en el acto**. *Reversible no es lo mismo que sin efecto.*
--
-- ⚠️ **Y el modo de falla es el que importa: el founder ENCENDIÓ algo creyendo
-- que habilitaba el circuito, y nadie lo leía.** Medido: `cierre_cuenta_vivo`
-- **no existía en `app_config`** — la única clave `*_vivo` de la tabla era
-- `pagos_actuador_vivo`. *Un interruptor que no está conectado a nada no falla:
-- se siente encendido.* **Es `L-402` en su forma de gobierno** — no «¿está
-- alcanzable?» sino **«¿alguien lee esto?»**.
--
-- ⇒ **DECISIÓN, y se declara para que no se relea como olvido: LA RPC GANA SU
-- LLAVE.** Las tres razones, en orden de peso:
--   ① **La solicitud tiene efecto real e inmediato** (ban + sesiones). Un acto
--      que le quita el acceso a alguien no puede correr sin llave mientras el
--      resto del circuito la tiene.
--   ② **El founder esperaba que la llave gobernara el circuito entero**, y esa
--      expectativa es la correcta: *una llave que gobierna la mitad de un
--      circuito es peor que ninguna, porque nadie puede razonar sobre el todo.*
--   ③ Es el patrón ya probado de la casa —el recurrente, el correo de
--      invitación, la retención— y **desviarse de él exigía una razón mejor que
--      la que yo tenía.**
--
-- **LA CLAVE NACE EN LA TABLA, EN `false`.** *Que exista apagada es distinto de
-- que no exista: lo primero se puede encender y se puede auditar; lo segundo se
-- enciende «con éxito» sin efecto.* **Ese fue exactamente el daño.**
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.app_config (clave, valor, tipo, descripcion, categoria, es_publico)
values (
  'cierre_cuenta_vivo', 'false', 'booleano',
  'P15 · gobierna el CIRCUITO ENTERO del cierre: la solicitud (que banea y '
  'revoca sesiones) y el reloj del día 30 (que seudonimiza y encola borrados). '
  'Con esta clave en false, solicitar_cierre_cuenta devuelve cierre_apagado sin '
  'tocar una fila. NACE APAGADA: un mecanismo que quita accesos y borra archivos '
  'no se enciende porque alguien lo desplegó.',
  'integraciones', false
)
on conflict (clave) do nothing;

create or replace function public.solicitar_cierre_cuenta()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_uid       uuid := auth.uid();
  v_vivo      text;
  v_existente public.cierre_cuenta%rowtype;
  v_fecha     timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  end if;

  -- ── LA LLAVE, ANTES DE TODO LO DEMÁS ────────────────────────────────────
  -- Va primero a propósito: **si está apagada, ni siquiera se evalúa el
  -- pre-chequeo.** *Un circuito apagado no debería poder decirle a nadie si su
  -- cierre requeriría camino asistido — eso es información sobre un mecanismo
  -- que no está operando.*
  select valor into v_vivo from public.app_config where clave = 'cierre_cuenta_vivo';
  if coalesce(v_vivo, 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'codigo', 'cierre_apagado');
  end if;

  select * into v_existente from public.cierre_cuenta
   where user_id = v_uid and estado = 'programado';
  if found then
    return jsonb_build_object(
      'ok', true, 'programado_para', v_existente.programado_para, 'ya_estaba', true);
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

  update auth.users set banned_until = 'infinity'::timestamptz where id = v_uid;
  delete from auth.sessions where user_id = v_uid;

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

-- ── Y LA MISMA LLAVE PARA LA COPIA ────────────────────────────────────────
-- 🔴 Por qué también acá, aunque exportar no borre nada: **hoy la copia se
-- encola y NADIE la procesa** — no hay worker. ⇒ la RPC devolvía `ok` sobre una
-- promesa que el sistema no cumple, **que es exactamente lo que P15 cl.5 no
-- tolera**: *la copia se ofrece ANTES de irse.* **Mientras el worker no exista,
-- decir `copia_apagada` es la verdad; decir `ok` era motor sin puerta con cara
-- de éxito.**
create or replace function public.exportar_mis_datos()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_uid    uuid := auth.uid();
  v_vivo   text;
  v_correo text;
  v_prev   public.exportacion_datos%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  end if;

  select valor into v_vivo from public.app_config where clave = 'exportacion_datos_viva';
  if coalesce(v_vivo, 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'codigo', 'copia_apagada');
  end if;

  select email into v_correo from auth.users where id = v_uid;
  if v_correo is null then
    return jsonb_build_object('ok', false, 'codigo', 'error_desconocido');
  end if;

  select * into v_prev from public.exportacion_datos
   where user_id = v_uid and estado = 'pendiente';
  if found then
    return jsonb_build_object('ok', true, 'enviado_a', v_correo, 'ya_estaba', true);
  end if;

  insert into public.exportacion_datos (user_id, enviado_a) values (v_uid, v_correo);

  return jsonb_build_object('ok', true, 'enviado_a', v_correo, 'ya_estaba', false);
end;
$$;

revoke all on function public.exportar_mis_datos() from public, anon;
grant execute on function public.exportar_mis_datos() to authenticated;

insert into public.app_config (clave, valor, tipo, descripcion, categoria, es_publico)
values (
  'exportacion_datos_viva', 'false', 'booleano',
  'P15 cl.5 · gobierna la copia de datos. NACE APAGADA y NO se enciende hasta '
  'que exista el worker que produce el archivo: hoy la RPC solo encola, y sin '
  'worker la persona recibiría un ok por una copia que nunca llega.',
  'integraciones', false
)
on conflict (clave) do nothing;

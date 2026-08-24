-- ═══════════════════════════════════════════════════════════════════════════
-- S104-A · el campo se llama `enviado_a`, no `enviada_a`
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 **CURA DE UN ERROR MÍO, y la clase importa más que el caso.**
--
-- Le pasé a S104-C el contrato en dos mensajes: en el primero escribí
-- `enviado_a`, en el segundo `enviada_a`. **Cambié el nombre de un campo del
-- contrato entre dos mensajes y no declaré el cambio.** C construyó cuatro
-- pantallas contra el primero — correctamente, porque era el que tenía.
--
-- ⚠️ **Y NO LO IBA A CAZAR NINGÚN GATE HASTA DEMASIADO TARDE:** el typecheck de
-- C no llega a mirar los campos, porque el módulo todavía no resuelve
-- (`TS2305: has no exported member`). *El error de campo estaba TAPADO por el
-- error de import — se habría destapado recién al mergear, y ahí se lee como
-- «el motor de A está mal» en vez de «el contrato mutó».*
--
-- **Gana `enviado_a`: es el nombre acordado primero y el que ya está escrito en
-- cuatro pantallas.** *Entre tener razón gramatical y no hacerle tocar cuatro
-- archivos a quien construyó contra lo que le di, gana lo segundo — sobre todo
-- porque la divergencia la introduje yo.*
--
-- **La lección, que es de coordinación y no de SQL: un contrato entre pistas se
-- cierra UNA vez. Si cambia, el cambio se anuncia como cambio — no se reescribe
-- el contrato entero y se confía en que el otro note la diferencia.**
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.exportacion_datos rename column enviada_a to enviado_a;

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
    return jsonb_build_object('ok', true, 'enviado_a', v_correo, 'ya_estaba', true);
  end if;

  insert into public.exportacion_datos (user_id, enviado_a)
  values (v_uid, v_correo);

  return jsonb_build_object('ok', true, 'enviado_a', v_correo, 'ya_estaba', false);
end;
$$;

revoke all on function public.exportar_mis_datos() from public, anon;
grant execute on function public.exportar_mis_datos() to authenticated;

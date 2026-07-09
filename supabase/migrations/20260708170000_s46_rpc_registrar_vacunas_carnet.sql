-- ═════════════════════════════════════════════════════════════════════
-- S46-B1.1 — registrar_vacunas_de_carnet: escritura atómica de las
-- vacunas extraídas del carnet (output de extract-vacuna re-targeteada).
--
-- SECURITY INVOKER (decisión arquitecto, regla 74): el relevamiento
-- S46-B1.0 demostró con test JWT+ROLE que la RLS YA autoriza al dueño
-- (primera rama del WITH CHECK de vacuna_insert: mascota_id IN
-- (SELECT id FROM mascotas WHERE user_id = auth.uid())) y que el
-- trigger INVOKER _trg_vacuna_crear_evento crea el evento padre bajo
-- authenticated sin fricción (eventos_mascota_insert pasa). DEFINER
-- sin necesidad no (consistente con D-165).
--
-- Contrato: (p_mascota_id uuid, p_vacunas jsonb array de
--   { nombre, fecha_aplicada, fecha_proxima, veterinario_nombre_externo,
--     tipo_vacuna, lote[, via_administracion] })
-- ATÓMICA: cualquier RAISE revierte los N INSERTs (una transacción).
-- El trigger existente crea eventos_mascota solo — acá JAMÁS se
-- inserta el padre a mano.
-- Errores (RAISE, normalización L-115 por prefijo):
--   auth_required · sin_acceso_mascota · vacunas_vacias ·
--   item_invalido: <índice>: <motivo>
-- Guards por ítem: nombre obligatorio; fechas date válidas
--   (pg_input_is_valid, PG17); fecha_aplicada NO futura (guard
--   propuesto S46 — un carnet solo registra aplicaciones pasadas);
--   via_administracion contra el CHECK real SOLO si viene (error
--   tipado en lugar del 23514 crudo); ''→null en todos los opcionales.
-- FUERA de esta versión: archivo_url (guardar la foto del carnet es
--   espec pendiente — nota, no se resuelve acá). country_code queda
--   en su default de DDL ('EC'): el carnet no trae país.
-- ═════════════════════════════════════════════════════════════════════
begin;

create function public.registrar_vacunas_de_carnet(
  p_mascota_id uuid,
  p_vacunas   jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path to 'public', 'pg_temp'
as $$
declare
  v_item           jsonb;
  v_idx            int := 0;
  v_nombre         text;
  v_fecha_aplicada date;
  v_fecha_proxima  date;
  v_via            text;
  v_id             uuid;
  v_ids            uuid[] := '{}';
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  -- INVOKER: esta lectura pasa por la RLS de mascotas; la condición es
  -- la MISMA puerta que la rama del dueño en vacuna_insert (relevada
  -- literal en S46-B1.0) — el error tipado llega antes que un 42501.
  if not exists (
    select 1 from mascotas m
     where m.id = p_mascota_id and m.user_id = auth.uid()
  ) then
    raise exception 'sin_acceso_mascota';
  end if;

  if p_vacunas is null
     or jsonb_typeof(p_vacunas) <> 'array'
     or jsonb_array_length(p_vacunas) = 0 then
    raise exception 'vacunas_vacias';
  end if;

  for v_item in select * from jsonb_array_elements(p_vacunas) loop
    v_idx := v_idx + 1;

    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'item_invalido: %: no es un objeto', v_idx;
    end if;

    v_nombre := nullif(btrim(v_item->>'nombre'), '');
    if v_nombre is null then
      raise exception 'item_invalido: %: nombre obligatorio', v_idx;
    end if;

    if v_item->>'fecha_aplicada' is not null then
      if not pg_input_is_valid(v_item->>'fecha_aplicada', 'date') then
        raise exception 'item_invalido: %: fecha_aplicada no es una fecha válida', v_idx;
      end if;
      v_fecha_aplicada := (v_item->>'fecha_aplicada')::date;
      if v_fecha_aplicada > current_date then
        raise exception 'item_invalido: %: fecha_aplicada futura', v_idx;
      end if;
    else
      v_fecha_aplicada := null;
    end if;

    if v_item->>'fecha_proxima' is not null then
      if not pg_input_is_valid(v_item->>'fecha_proxima', 'date') then
        raise exception 'item_invalido: %: fecha_proxima no es una fecha válida', v_idx;
      end if;
      v_fecha_proxima := (v_item->>'fecha_proxima')::date;
    else
      v_fecha_proxima := null;
    end if;

    -- espejo literal del CHECK evento_vacuna_aplicada_via_administracion_check
    v_via := nullif(btrim(v_item->>'via_administracion'), '');
    if v_via is not null
       and v_via not in ('subcutanea','intramuscular','intranasal','oral') then
      raise exception 'item_invalido: %: via_administracion fuera del catálogo', v_idx;
    end if;

    -- evento_id NO se pasa: _trg_vacuna_crear_evento crea el padre.
    insert into evento_vacuna_aplicada
      (mascota_id, nombre_vacuna, fecha_aplicada, fecha_proxima,
       veterinario_nombre_externo, tipo_vacuna, lote, via_administracion)
    values
      (p_mascota_id, v_nombre, v_fecha_aplicada, v_fecha_proxima,
       nullif(btrim(v_item->>'veterinario_nombre_externo'), ''),
       nullif(btrim(v_item->>'tipo_vacuna'), ''),
       nullif(btrim(v_item->>'lote'), ''),
       v_via)
    returning id into v_id;

    v_ids := v_ids || v_id;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'insertadas', coalesce(array_length(v_ids, 1), 0),
    'ids', to_jsonb(v_ids)
  );
end;
$$;

revoke all on function public.registrar_vacunas_de_carnet(uuid, jsonb) from public;
grant execute on function public.registrar_vacunas_de_carnet(uuid, jsonb) to authenticated;

commit;

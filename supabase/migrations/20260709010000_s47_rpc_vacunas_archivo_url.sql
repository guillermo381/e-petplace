-- ═════════════════════════════════════════════════════════════════════
-- S47-B1.2-A — registrar_vacunas_de_carnet acepta p_archivo_url.
-- Decisión de producto founder (D-308 disparada): el carnet SE
-- CONSERVA — la foto respalda TODAS las vacunas del lote (un carnet =
-- N filas con el mismo archivo_url en evento_vacuna_aplicada.archivo_url,
-- columna existente relevada: text nullable, hoy vacía).
--
-- p_archivo_url es un PATH del bucket mascotas (carpeta del dueño),
-- nullable — la carga sin foto sigue siendo primera clase. Guard
-- tipado nuevo 'archivo_invalido' (L-115 por prefijo): ni URL (mismo
-- principio que el CHECK mascotas_foto_url_es_path) ni carpeta ajena
-- (la firma posterior fallaría en silencio — mejor rebotar acá).
-- Atomicidad y errores existentes INTACTOS.
--
-- L-119: la firma cambia (uuid, jsonb) → (uuid, jsonb, text): DROP
-- explícito de la vieja — CREATE OR REPLACE crearía una sobrecarga
-- zombi. Callers relevados contra la DB (L-129): cero en pg_proc;
-- el único consumidor es el wrapper TS, que se actualiza en el mismo
-- bloque post-gate.
-- ═════════════════════════════════════════════════════════════════════
begin;

drop function public.registrar_vacunas_de_carnet(uuid, jsonb);

create function public.registrar_vacunas_de_carnet(
  p_mascota_id  uuid,
  p_vacunas     jsonb,
  p_archivo_url text default null
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
  v_archivo        text;
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

  -- El carnet que respalda el lote: path del bucket mascotas, carpeta
  -- del dueño. Ni URL ni carpeta ajena (S47-B1.2).
  v_archivo := nullif(btrim(p_archivo_url), '');
  if v_archivo is not null then
    if v_archivo like 'http%' then
      raise exception 'archivo_invalido: es una URL, se espera un path del bucket';
    end if;
    if split_part(v_archivo, '/', 1) <> auth.uid()::text then
      raise exception 'archivo_invalido: el path no está en la carpeta del dueño';
    end if;
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
       veterinario_nombre_externo, tipo_vacuna, lote, via_administracion,
       archivo_url)
    values
      (p_mascota_id, v_nombre, v_fecha_aplicada, v_fecha_proxima,
       nullif(btrim(v_item->>'veterinario_nombre_externo'), ''),
       nullif(btrim(v_item->>'tipo_vacuna'), ''),
       nullif(btrim(v_item->>'lote'), ''),
       v_via,
       v_archivo)
    returning id into v_id;

    v_ids := v_ids || v_id;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'insertadas', coalesce(array_length(v_ids, 1), 0),
    'ids', to_jsonb(v_ids),
    'archivo_url', v_archivo
  );
end;
$$;

revoke all on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) from public;
grant execute on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) to authenticated;

commit;

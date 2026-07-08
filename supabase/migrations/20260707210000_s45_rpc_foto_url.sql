-- ═════════════════════════════════════════════════════════════════════
-- S45-B4.1 — crear_familia_con_primera_mascota + p_foto_url.
-- Cierra el vínculo storage→mascota del onboarding dueño: el cierre
-- sube la foto a mascotas/{uid}/... (policy existente 'Users upload
-- own pet photos') y pasa la URL acá. El dueño NO puede UPDATE
-- mascotas por RLS (solo co-dueño/admin) — por eso el vínculo entra
-- por la RPC en el mismo INSERT.
--
-- L-119: CREATE OR REPLACE con firma distinta NO reemplaza — DROP
-- explícito de la firma vieja (6 params) antes de crear la de 7.
-- Guards y grants IDÉNTICOS a 20260707170000. Idempotente: el DROP
-- usa IF EXISTS y el CREATE es OR REPLACE.
-- ═════════════════════════════════════════════════════════════════════
begin;

drop function if exists public.crear_familia_con_primera_mascota(text, text, text, date, text, text);

create or replace function public.crear_familia_con_primera_mascota(
  p_nombre_familia text,
  p_nombre_mascota text,
  p_especie text,
  p_fecha_nacimiento date default null,
  p_precision_fecha text default null,
  p_sexo text default null,
  p_foto_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_miembro_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_familia, '')) = '' then
    raise exception 'nombre_familia_requerido';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- Un onboarding por user: si ya es miembro vigente de una familia
  -- estandar, el front debe mandarlo al home, no acá.
  if exists (
    select 1
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
    where fm.user_id = v_uid
      and fm.hasta is null
      and f.tipo = 'estandar'
  ) then
    raise exception 'familia_ya_existe';
  end if;

  -- Mismo guard y código que crear_alta_asistida_* (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  -- Guards tipados espejo de los CHECKs (el error de constraint no es tipado)
  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  -- familia: tipo estandar + cuenta NULL (chk_familia_virtual_tiene_cuenta),
  -- created_by_user_id seteado + created_by_sistema NULL (chk_familia_creador_xor)
  insert into familia (nombre, tipo, created_by_user_id)
  values (btrim(p_nombre_familia), 'estandar', v_uid)
  returning id into v_familia_id;

  insert into familia_miembro (familia_id, user_id, rol, motivo_alta)
  values (v_familia_id, v_uid, 'adulto_titular', 'onboarding_dueno')
  returning id into v_miembro_id;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url
  )
  values (
    btrim(p_nombre_mascota), p_especie, 'desconocido', v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$$;

revoke all on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text) from public;
grant execute on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text) to authenticated;

commit;

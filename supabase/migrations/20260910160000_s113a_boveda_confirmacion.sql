-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · LA CONFIRMACIÓN SE VUELVE INEXPRESABLE DE EVITAR (rojos ③④⑤⑥ de E)
--
-- 🔴 EL DEFECTO, y es de diseño y no de código: la puerta ponía
-- `confirmado_por = auth.uid()`, o sea **quien llama**. Con eso, *confirmar no
-- era un acto: era un efecto de llamar* — y E llegó al último guard desde
-- PostgREST sin confirmar nada, porque no había nada que confirmar.
--
-- La cura es la misma que `propuestas_memoria`: **partir en dos actos**, y que
-- el estado intermedio EXISTA.
--   ① `registrar_papel_extraido` → nace `por_confirmar`. **No crea evento.**
--   ② `confirmar_papel`          → pasa a `confirmado` y **recién ahí** el
--                                  papel entra al expediente.
--
-- Lo que lo vuelve inexpresable no es un guard: es que **el evento sólo nace en
-- el segundo acto**. No hay camino que deposite en la vida de una mascota sin
-- pasar por ahí — *un guard se puede saltear con otra llamada; una pieza que
-- no existe en el primer acto, no.*
--
-- ── ⑤ EL `modo_captura` LO ESTAMPA LA PUERTA ───────────────────────────────
-- Nunca llega del cliente. `registrar_papel_extraido` escribe SIEMPRE
-- `extraido_por_ia`, porque es lo que pasó: que un humano lo confirme después
-- **no cambia de dónde salió el texto**.
--
-- ── ⑥ EL LITERAL Y EL RANGO VIAJAN HASTA LA FILA ───────────────────────────
-- El extractor devuelve `literal` (lo que el papel dice tal cual) y
-- `referencia` (el rango impreso, como UN texto), y la puerta los perdía al
-- guardar. *El literal es la única red cuando el parseo sale mal: sin él, un
-- valor mal leído es indistinguible de uno bien leído.*
-- `ref_min`/`ref_max` se conservan para lo que sí se pudo partir; `referencia`
-- guarda el crudo aunque no se haya podido.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.papeles_familia
  add column if not exists estado text not null default 'confirmado'
    check (estado in ('por_confirmar', 'confirmado'));

alter table public.papel_valor
  add column if not exists literal text,
  add column if not exists referencia text;

comment on column public.papel_valor.literal is
  'Lo que el papel DICE, tal cual lo leyó el extractor. La red cuando el parseo '
  'sale mal: sin él, un valor mal leído es indistinguible de uno bien leído.';
comment on column public.papel_valor.referencia is
  'El rango impreso como UN texto, aunque no se haya podido partir en min/max.';

-- 🔴 Un papel sin confirmar NO tiene confirmante, y uno confirmado SÍ. El CHECK
-- vuelve inexpresable la fila que dice «confirmado» sin que nadie lo haya hecho.
alter table public.papeles_familia
  drop constraint if exists chk_papel_confirmacion;
alter table public.papeles_familia
  add constraint chk_papel_confirmacion check (
    (estado = 'por_confirmar' and confirmado_por is null)
    or (estado = 'confirmado' and confirmado_por is not null));

-- `confirmado_por` deja de ser NOT NULL: un papel recién extraído no lo tiene.
alter table public.papeles_familia alter column confirmado_por drop not null;
alter table public.papeles_familia alter column confirmado_en  drop not null;
alter table public.papeles_familia alter column confirmado_en  drop default;


-- ── ① EL PRIMER ACTO · lo que el extractor propuso ─────────────────────────
create or replace function public.registrar_papel_extraido(
  p_mascota_id   uuid,
  p_clase        text,
  p_archivo_path text,
  p_titulo       text default null,
  p_fecha_papel  date default null,
  p_origen       text default null,
  p_valores      jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_uid uuid := auth.uid(); v_country text; v_papel uuid; v_n int := 0;
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode='42501';
  end if;
  if p_archivo_path is null
     or (storage.foldername(p_archivo_path))[1] is distinct from p_mascota_id::text then
    raise exception 'archivo_fuera_de_carpeta' using errcode='22023';
  end if;
  if not exists (select 1 from storage.objects
                  where bucket_id='papeles-familia' and name = p_archivo_path) then
    raise exception 'archivo_no_subido' using errcode='22023';
  end if;

  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into papeles_familia
    (mascota_id, subido_por, clase, titulo, fecha_papel, origen, archivo_path,
     -- ⑤ SIEMPRE lo estampa la puerta. Nunca llega del cliente.
     modo_captura, estado, confirmado_por, confirmado_en, country_code)
  values
    (p_mascota_id, v_uid, p_clase, nullif(btrim(coalesce(p_titulo,'')),''),
     p_fecha_papel, nullif(btrim(coalesce(p_origen,'')),''), p_archivo_path,
     'extraido_por_ia', 'por_confirmar', null, null, v_country)
  returning id into v_papel;

  insert into papel_valor (papel_id, analito, valor, unidad, ref_min, ref_max,
                           referencia, literal, orden)
  select v_papel,
         btrim(x->>'analito'), btrim(x->>'valor'),
         nullif(btrim(coalesce(x->>'unidad','')),''),
         nullif(btrim(coalesce(x->>'ref_min','')),''),
         nullif(btrim(coalesce(x->>'ref_max','')),''),
         -- ⑥ el rango crudo y el literal, aunque no se hayan podido partir
         nullif(btrim(coalesce(x->>'referencia','')),''),
         nullif(btrim(coalesce(x->>'literal','')),''),
         (ord - 1)
    from jsonb_array_elements(coalesce(p_valores,'[]'::jsonb)) with ordinality as t(x, ord)
   where btrim(coalesce(x->>'analito','')) <> '' and btrim(coalesce(x->>'valor','')) <> '';
  get diagnostics v_n = row_count;

  -- 🔴 NO se crea evento. Todavía no pasó nada en la vida de la mascota.
  return jsonb_build_object('ok', true, 'papel_id', v_papel,
                            'estado', 'por_confirmar', 'valores', v_n);
end;
$$;


-- ── ② EL SEGUNDO ACTO · una persona lo miró ────────────────────────────────
create or replace function public.confirmar_papel(
  p_papel_id uuid,
  -- Los valores CORREGIDOS. Si viene null, se confirman los extraídos tal cual;
  -- si viene una lista, REEMPLAZA — que es lo que pasa cuando alguien arregla
  -- una fila mal leída.
  p_valores  jsonb default null
) returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid(); v_p record; v_evento uuid; v_n int;
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;

  select * into v_p from papeles_familia where id = p_papel_id;
  if not found then raise exception 'papel_no_existe' using errcode='22023'; end if;
  if not public.user_tiene_acceso_a_mascota(v_p.mascota_id) then
    raise exception 'sin_acceso' using errcode='42501';
  end if;
  -- Confirmar dos veces no es idempotente por accidente: se dice.
  if v_p.estado = 'confirmado' then
    raise exception 'papel_ya_confirmado' using errcode='22023';
  end if;

  if p_valores is not null then
    delete from papel_valor where papel_id = p_papel_id;
    insert into papel_valor (papel_id, analito, valor, unidad, ref_min, ref_max,
                             referencia, literal, orden)
    select p_papel_id,
           btrim(x->>'analito'), btrim(x->>'valor'),
           nullif(btrim(coalesce(x->>'unidad','')),''),
           nullif(btrim(coalesce(x->>'ref_min','')),''),
           nullif(btrim(coalesce(x->>'ref_max','')),''),
           nullif(btrim(coalesce(x->>'referencia','')),''),
           nullif(btrim(coalesce(x->>'literal','')),''),
           (ord - 1)
      from jsonb_array_elements(p_valores) with ordinality as t(x, ord)
     where btrim(coalesce(x->>'analito','')) <> '' and btrim(coalesce(x->>'valor','')) <> '';
  end if;
  select count(*) into v_n from papel_valor where papel_id = p_papel_id;

  update papeles_familia
     set estado = 'confirmado', confirmado_por = v_uid, confirmado_en = now()
   where id = p_papel_id;

  -- 🔴 RECIÉN ACÁ el papel entra a la vida de la mascota. Es lo que vuelve la
  -- confirmación inevitable: no hay otro camino que cree este evento.
  insert into eventos_mascota
    (mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, procedencia,
     modo_captura, country_code, datos)
  values
    (v_p.mascota_id, 'examen_diagnostico', 'salud',
     coalesce(v_p.fecha_papel::timestamptz, now()), v_uid,
     -- Lo trajo la familia. Que el papel lo haya firmado un veterinario de otra
     -- clínica NO lo vuelve verificado por nosotros: no hubo handshake.
     'declarado_por_familia', 'extraido_por_ia', v_p.country_code,
     jsonb_build_object('papel_id', p_papel_id, 'clase', v_p.clase,
                        'titulo', v_p.titulo, 'origen', v_p.origen, 'valores', v_n))
  returning id into v_evento;

  return jsonb_build_object('ok', true, 'papel_id', p_papel_id,
                            'evento_id', v_evento, 'valores', v_n);
end;
$$;

-- ☠️ La puerta vieja MUERE: era la que hacía de confirmar un efecto de llamar.
drop function if exists public.registrar_papel_de_familia(uuid, text, text, text, date, text, jsonb);

revoke all on function public.registrar_papel_extraido(uuid, text, text, text, date, text, jsonb) from public, anon;
revoke all on function public.confirmar_papel(uuid, jsonb) from public, anon;
grant execute on function public.registrar_papel_extraido(uuid, text, text, text, date, text, jsonb) to authenticated;
grant execute on function public.confirmar_papel(uuid, jsonb) to authenticated;

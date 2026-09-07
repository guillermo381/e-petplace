-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · FASE 3 — LA BÓVEDA DE PAPELES
--
-- La familia trae su historia de otra clínica. Foto o PDF → `extract-papel` →
-- **confirmación fila por fila** → eventos tipados + el documento entero.
--
-- ── LA LEY QUE GOBIERNA CADA COLUMNA: TRANSCRIBE, JAMÁS INTERPRETA ─────────
-- 🔴 Por eso acá **no hay** una columna `estado`, ni `alto`, ni `bajo`, ni
-- `diagnostico`. Un valor de laboratorio viaja **con su unidad y su referencia
-- SI ESTÁN IMPRESAS**, y nada más. *Decir «alto» sobre un hemograma es un acto
-- clínico, y quien lo haría acá es un modelo de lenguaje leyendo una foto.*
--
-- Si la referencia no está impresa, la columna queda **NULL y se dice**: la
-- pantalla muestra el valor sin referencia en vez de inventarle una de tabla
-- general — *un rango de otra especie o de otro laboratorio se lee igual de
-- convincente y es exactamente igual de falso.*
--
-- ── DOS TABLAS, PORQUE SON DOS COSAS ───────────────────────────────────────
-- `papeles_familia` es EL DOCUMENTO —lo que se puede volver a mirar—; y
-- `papel_valor` son las filas transcritas. *Un papel sin valores sigue siendo
-- útil (una receta, un informe); un valor sin su papel no se puede verificar.*
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.papeles_familia (
  id            uuid primary key default gen_random_uuid(),
  mascota_id    uuid not null references public.mascotas(id) on delete cascade,
  -- Quién lo trajo. Es de FAMILIA por definición: un papel que sube una
  -- clínica entra por la puerta clínica, no por acá.
  subido_por    uuid not null references auth.users(id),
  -- Qué es, con vocabulario cerrado. `otro` existe a propósito: *sin él, quien
  -- traiga algo que no está en la lista lo va a clasificar mal con tal de
  -- poder subirlo.*
  clase         text not null check (clase in ('laboratorio','imagen','receta','informe','certificado','otro')),
  -- El nombre impreso, tal cual («Hemograma completo»). NO se normaliza.
  titulo        text,
  -- La del papel, no la de la subida. NULL si no está impresa — y esa
  -- distinción importa: un examen sin fecha no se puede ordenar en el tiempo.
  fecha_papel   date,
  -- De dónde viene, tal como lo escribió la familia. Texto libre a propósito:
  -- no hay catálogo de clínicas del mundo.
  origen        text,
  archivo_path  text not null,
  -- 🔴 Siempre `extraido_por_ia` cuando pasó por el modelo, aunque un humano
  -- lo haya confirmado. *La confirmación dice que alguien lo miró; no cambia
  -- de dónde salió el texto.*
  modo_captura  text not null default 'extraido_por_ia'
                check (modo_captura in ('tecleado','extraido_por_ia')),
  -- Quién confirmó y cuándo. Sin esto la fila no debería existir, y el CHECK
  -- lo vuelve inexpresable: **nada entra al expediente sin que un humano lo
  -- haya mirado.**
  confirmado_por uuid not null references auth.users(id),
  confirmado_en  timestamptz not null default now(),
  country_code  text,
  creado_en     timestamptz not null default now()
);

create index if not exists ix_papeles_familia_mascota
  on public.papeles_familia (mascota_id, fecha_papel desc nulls last);

create table if not exists public.papel_valor (
  id          uuid primary key default gen_random_uuid(),
  papel_id    uuid not null references public.papeles_familia(id) on delete cascade,
  -- El nombre del analito TAL COMO ESTÁ IMPRESO («Hematocrito», «HCT»). No se
  -- traduce ni se normaliza: *normalizarlo es interpretar, y dos laboratorios
  -- que llaman distinto a lo mismo pueden no estar midiendo lo mismo.*
  analito     text not null,
  -- Texto y no numérico: hay resultados que no son números («Negativo»,
  -- «< 0,1», «Trazas»). *Forzarlos a número obliga a decidir qué significan.*
  valor       text not null,
  unidad      text,
  -- 🔴 SÓLO SI ESTÁN IMPRESAS. NULL = el papel no las traía, y la pantalla lo
  -- dice. Jamás se completan de una tabla general.
  ref_min     text,
  ref_max     text,
  orden       int not null default 0
);

create index if not exists ix_papel_valor_papel on public.papel_valor (papel_id, orden);

-- ── RLS · la misma puerta que todo el expediente ───────────────────────────
alter table public.papeles_familia enable row level security;
alter table public.papel_valor enable row level security;

drop policy if exists papeles_familia_lee on public.papeles_familia;
create policy papeles_familia_lee on public.papeles_familia
  for select to authenticated
  using (public.user_tiene_acceso_a_mascota(mascota_id));

drop policy if exists papel_valor_lee on public.papel_valor;
create policy papel_valor_lee on public.papel_valor
  for select to authenticated
  using (exists (select 1 from public.papeles_familia p
                  where p.id = papel_id and public.user_tiene_acceso_a_mascota(p.mascota_id)));

-- 🔴 Sin policy de INSERT: **se escribe SÓLO por la puerta**. Una policy de
-- escritura dejaría entrar una fila sin `confirmado_por` real — el CHECK exige
-- la columna, no exige que sea verdad.
revoke all on public.papeles_familia from anon, public;
revoke all on public.papel_valor from anon, public;
grant select on public.papeles_familia to authenticated;
grant select on public.papel_valor to authenticated;


-- ── EL BUCKET · privado, por mascota ───────────────────────────────────────
-- 🔴 **Propio, y no `mascotas`.** Se pensó reusarlo —también es privado y ya
-- tiene policies por carpeta— y se descartó por MEDICIÓN, no por gusto: ahí
-- viven las fotos de perfil, que pesan ~60 kB y se muestran en cada pantalla.
-- Un PDF de laboratorio pesa órdenes más y **tiene otra retención**: la foto de
-- un perfil se reemplaza; el examen de 2019 es la razón por la que la familia
-- se cambió de app. *Dos cosas con reglas de borrado distintas no comparten
-- bucket: el día que alguien barra una, se lleva la otra.*
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papeles-familia', 'papeles-familia', false, 20971520,
        array['image/jpeg','image/png','image/heic','image/webp','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 20971520,
      allowed_mime_types = excluded.allowed_mime_types;

-- La carpeta es la MASCOTA: `papeles-familia/<mascota_id>/<archivo>`. Así el
-- permiso se contesta con la misma pregunta que todo el expediente.
drop policy if exists papeles_lee on storage.objects;
create policy papeles_lee on storage.objects
  for select to authenticated
  using (bucket_id = 'papeles-familia'
     and public.user_tiene_acceso_a_mascota((storage.foldername(name))[1]::uuid));

drop policy if exists papeles_sube on storage.objects;
create policy papeles_sube on storage.objects
  for insert to authenticated
  with check (bucket_id = 'papeles-familia'
     and public.user_tiene_acceso_a_mascota((storage.foldername(name))[1]::uuid));

-- Borrar sí, y por la misma puerta: *un bucket sin DELETE deja a la familia sin
-- poder sacar lo que ella misma subió* — el defecto exacto de `avatars` que
-- S92-BIS midió.
drop policy if exists papeles_borra on storage.objects;
create policy papeles_borra on storage.objects
  for delete to authenticated
  using (bucket_id = 'papeles-familia'
     and public.user_tiene_acceso_a_mascota((storage.foldername(name))[1]::uuid));


-- ── LA PUERTA ──────────────────────────────────────────────────────────────
-- Un solo acto: el papel, sus valores y el evento del expediente. *Si fueran
-- tres llamadas, una familia con mala señal puede quedar con el archivo subido
-- y sin fila, o con fila y sin evento — y ningún reintento sabría en cuál de
-- los tres estados quedó.*
create or replace function public.registrar_papel_de_familia(
  p_mascota_id  uuid,
  p_clase       text,
  p_archivo_path text,
  p_titulo      text default null,
  p_fecha_papel date default null,
  p_origen      text default null,
  p_valores     jsonb default '[]'::jsonb   -- [{analito, valor, unidad?, ref_min?, ref_max?}]
) returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid     uuid := auth.uid();
  v_country text;
  v_papel   uuid;
  v_evento  uuid;
  v_n       int := 0;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode = '42501';
  end if;

  -- 🔴 EL ARCHIVO TIENE QUE ESTAR ARRIBA Y EN SU CARPETA. Sin esto, la fila
  -- podría apuntar a un path que no existe o —peor— al de OTRA mascota.
  -- *Una referencia cruzada acá le muestra a una familia el examen de otra.*
  if p_archivo_path is null
     or (storage.foldername(p_archivo_path))[1] is distinct from p_mascota_id::text then
    raise exception 'archivo_fuera_de_carpeta' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects
                  where bucket_id = 'papeles-familia' and name = p_archivo_path) then
    raise exception 'archivo_no_subido' using errcode = '22023';
  end if;

  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into papeles_familia
    (mascota_id, subido_por, clase, titulo, fecha_papel, origen,
     archivo_path, confirmado_por, country_code)
  values
    -- `confirmado_por` es quien llama: esta puerta se invoca DESPUÉS de la
    -- pantalla de confirmación fila por fila. *No hay forma de escribir acá
    -- sin que alguien haya apretado un botón.*
    (p_mascota_id, v_uid, p_clase, nullif(btrim(coalesce(p_titulo,'')),''),
     p_fecha_papel, nullif(btrim(coalesce(p_origen,'')),''),
     p_archivo_path, v_uid, v_country)
  returning id into v_papel;

  -- Los valores, en el orden en que venían en el papel.
  insert into papel_valor (papel_id, analito, valor, unidad, ref_min, ref_max, orden)
  select v_papel,
         btrim(x->>'analito'), btrim(x->>'valor'),
         nullif(btrim(coalesce(x->>'unidad','')),''),
         nullif(btrim(coalesce(x->>'ref_min','')),''),
         nullif(btrim(coalesce(x->>'ref_max','')),''),
         (ord - 1)
    from jsonb_array_elements(coalesce(p_valores,'[]'::jsonb)) with ordinality as t(x, ord)
   where btrim(coalesce(x->>'analito','')) <> ''
     and btrim(coalesce(x->>'valor','')) <> '';
  get diagnostics v_n = row_count;

  -- El evento del expediente: es lo que hace que el papel APAREZCA en la vida
  -- de la mascota y no sólo en una carpeta.
  insert into eventos_mascota
    (mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id, procedencia,
     modo_captura, country_code, datos)
  values
    (p_mascota_id, 'examen_diagnostico', 'salud',
     coalesce(p_fecha_papel::timestamptz, now()), v_uid,
     -- 🔴 `declarado_por_familia`: lo trajo la familia. Que el papel lo haya
     -- firmado un veterinario de otra clínica **no lo vuelve verificado por
     -- nosotros** — no hubo handshake, y esa distinción es toda la procedencia.
     'declarado_por_familia', 'extraido_por_ia', v_country,
     jsonb_build_object('papel_id', v_papel, 'clase', p_clase,
                        'titulo', p_titulo, 'origen', p_origen, 'valores', v_n))
  returning id into v_evento;

  return jsonb_build_object('ok', true, 'papel_id', v_papel,
                            'evento_id', v_evento, 'valores', v_n);
end;
$$;

revoke all on function public.registrar_papel_de_familia(uuid, text, text, text, date, text, jsonb)
  from public, anon;
grant execute on function public.registrar_papel_de_familia(uuid, text, text, text, date, text, jsonb)
  to authenticated;

comment on function public.registrar_papel_de_familia(uuid, text, text, text, date, text, jsonb) is
  'S113-A fase 3 · la puerta de la bóveda. Transcribe, JAMÁS interpreta: sin '
  'estado, sin alto/bajo, sin diagnóstico. La referencia viaja sólo si estaba '
  'impresa. Un acto: papel + valores + evento.';

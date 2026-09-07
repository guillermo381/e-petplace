-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 2.2 — EL CATÁLOGO DE RASGOS DEL «CONTANOS»
--
-- C midió que ninguno de los dos catálogos existentes sirve: `cat_conductas_
-- bitacora` son HECHOS DEL DÍA («tiró de la correa»), no rasgos («le tiene
-- miedo a los truenos»). *Dos vocabularios que se parecen y no son lo mismo
-- se unifican una vez y se lamentan durante años.*
--
-- ── LA TABLA Y LA PUERTA YA EXISTÍAN — se ENSANCHA, no se duplica ──────────
-- `evento_temperamento_observacion` tiene `rasgos jsonb` desde antes, y
-- `registrar_observacion_comportamiento` ya escribe ahí (texto libre, S113 2.1).
-- Lo que faltaba no era una puerta: era el VOCABULARIO.
--
-- 🔴 EL OVERLOAD SE EVITA BORRANDO, NO AGREGANDO. Un parámetro nuevo con
-- DEFAULT crea una SEGUNDA función que compite en la misma aridad, y toda
-- llamada de tres argumentos pasa a `is not unique`. Esta sesión ya lo pagó
-- cuatro veces. Acá se DROPEA la de tres y se crea una sola de cuatro, con un
-- cinturón que exige `count = 1` al final.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.cat_rasgos (
  codigo    text primary key,
  familia   text not null check (familia in ('miedos','manias','con_animales','con_ninos')),
  -- 🔴 EN TUTEO. La casa firmó tuteo neutro en S51 y lo vigila R66. Esta
  -- columna la pinta la pantalla TAL CUAL: un voseo acá sale a la familia.
  etiqueta  text not null,
  -- NULL = todas las especies. *Una lista vacía y «todas» son cosas distintas
  -- y se distinguen: `'{}'` no aplicaría a ninguna.*
  especies  text[],
  orden     int not null default 0,
  activo    boolean not null default true
);

comment on table public.cat_rasgos is
  'S113-A 2.2 · vocabulario del «contanos». NO es cat_conductas_bitacora: '
  'eso son hechos del día, esto son rasgos. Etiquetas en TUTEO (R66).';

insert into public.cat_rasgos (codigo, familia, etiqueta, especies, orden) values
  -- MIEDOS
  ('miedo_truenos',   'miedos','Le asustan los truenos y los fuegos artificiales', null, 1),
  ('miedo_autos',     'miedos','Se pone nervioso en el auto',                      null, 2),
  ('miedo_solo',      'miedos','Le cuesta quedarse solo',                          null, 3),
  ('miedo_extranos',  'miedos','Desconfía de la gente que no conoce',              null, 4),
  ('miedo_veterinario','miedos','Se estresa en el veterinario',                    null, 5),
  ('miedo_agua',      'miedos','No le gusta el agua ni el baño',                   null, 6),
  -- MANÍAS
  ('mania_esconde',   'manias','Esconde sus cosas',                                null, 1),
  ('mania_sofa',      'manias','Se sube a los muebles',                            null, 2),
  ('mania_comida',    'manias','Es muy selectivo con la comida',                   null, 3),
  ('mania_cava',      'manias','Cava o rasca el piso',                             array['perro'], 4),
  ('mania_ladra',     'manias','Ladra cuando suena el timbre',                     array['perro'], 5),
  ('mania_amasa',     'manias','Amasa con las patitas',                            array['gato'], 6),
  -- CON OTROS ANIMALES
  ('anim_juega',      'con_animales','Le encanta jugar con otros',                 null, 1),
  ('anim_ignora',     'con_animales','Los ignora, va a lo suyo',                   null, 2),
  ('anim_tenso',      'con_animales','Se pone tenso con otros de su especie',      null, 3),
  ('anim_gatos',      'con_animales','Se lleva bien con gatos',                    array['perro'], 4),
  ('anim_perros',     'con_animales','Se lleva bien con perros',                   array['gato'], 5),
  ('anim_dominante',  'con_animales','Marca territorio con los que llegan',        null, 6),
  -- CON NIÑOS
  ('ninos_paciente',  'con_ninos','Es muy paciente con los chicos',                null, 1),
  ('ninos_juega',     'con_ninos','Juega con ellos sin brusquedad',                null, 2),
  ('ninos_evita',     'con_ninos','Prefiere alejarse cuando hay chicos',           null, 3),
  ('ninos_cuida',     'con_ninos','Los cuida, se queda cerca',                     null, 4),
  ('ninos_sin_trato', 'con_ninos','Todavía no estuvo con chicos',                  null, 5),
  ('ninos_brusco',    'con_ninos','Se entusiasma y se pone brusco',                null, 6)
on conflict (codigo) do nothing;

-- Lectura pública para quien tenga sesión: es un vocabulario, no un dato.
alter table public.cat_rasgos enable row level security;
drop policy if exists cat_rasgos_lectura on public.cat_rasgos;
create policy cat_rasgos_lectura on public.cat_rasgos
  for select to authenticated using (true);
revoke all on public.cat_rasgos from anon, public;
grant select on public.cat_rasgos to authenticated;


-- ── LA PUERTA, ENSANCHADA ──────────────────────────────────────────────────
drop function if exists public.registrar_observacion_comportamiento(uuid, text, timestamptz);

create or replace function public.registrar_observacion_comportamiento(
  p_mascota_id uuid,
  p_texto      text default null,
  p_fecha      timestamptz default now(),
  p_codigos    text[] default null
) returns jsonb
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_id      uuid;
  v_malos   text[];
  v_rasgos  jsonb;
  v_country text;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode = '42501';
  end if;

  -- Ni códigos ni texto = no hay observación. *Una fila vacía en el expediente
  -- de un animal es peor que ninguna: parece que alguien contó algo.*
  if (p_codigos is null or cardinality(p_codigos) = 0)
     and (p_texto is null or btrim(p_texto) = '') then
    raise exception 'sin_contenido' using errcode = '22023';
  end if;

  -- 🔴 CÓDIGO QUE NO ESTÁ EN EL CATÁLOGO REBOTA, y rebota DICIENDO CUÁL.
  -- *«Datos inválidos» manda a adivinar; el código de más se arregla solo
  -- cuando la puerta lo nombra.*
  if p_codigos is not null and cardinality(p_codigos) > 0 then
    select array_agg(c) into v_malos
      from unnest(p_codigos) as c
     where not exists (select 1 from cat_rasgos r where r.codigo = c and r.activo);
    if v_malos is not null then
      raise exception 'rasgo_desconocido: %', array_to_string(v_malos, ', ')
        using errcode = '22023';
    end if;
    select jsonb_agg(jsonb_build_object('codigo', r.codigo, 'familia', r.familia)
                     order by r.familia, r.orden)
      into v_rasgos from cat_rasgos r where r.codigo = any(p_codigos);
  end if;

  -- `country_code` es NOT NULL en el evento padre: el país es el de la MASCOTA,
  -- igual que en `declarar_alergia_familia`. *No se toma del usuario: una
  -- familia puede estar de viaje y el animal sigue siendo de donde es.*
  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into evento_temperamento_observacion
    (mascota_id, country_code, contexto, rasgos, descripcion, fecha_observacion)
  values
    -- La procedencia es de FAMILIA: `prestador_id` y `empleado_id` quedan NULL
    -- a propósito. Es lo que distingue «lo dijo la familia» de «lo registró la
    -- clínica», y esa distinción se pierde para siempre si no se escribe acá.
    -- 🔴 `'familia'` NO es un contexto válido: el CHECK dice visita_clinica ·
    -- grooming · paseo · hotel · guarderia · entrenamiento · casa ·
    -- consulta_telemedicina · otro. Va `'casa'`, que es literalmente donde la
    -- familia observa. **La procedencia NO se marca acá**: la marca
    -- `prestador_id IS NULL`, que es lo que distingue «lo dijo la familia» de
    -- «lo registró la clínica».
    (p_mascota_id, v_country, 'casa', coalesce(v_rasgos, '[]'::jsonb),
     nullif(btrim(coalesce(p_texto,'')), ''), coalesce(p_fecha, now()))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id,
                            'rasgos', coalesce(jsonb_array_length(v_rasgos), 0));
end;
$$;

revoke all on function public.registrar_observacion_comportamiento(uuid, text, timestamptz, text[])
  from public, anon;
grant execute on function public.registrar_observacion_comportamiento(uuid, text, timestamptz, text[])
  to authenticated;

-- ── CINTURÓN · UNA SOLA FUNCIÓN CON ESE NOMBRE ─────────────────────────────
-- El defecto que esto caza no da error al aplicar: da `is not unique` la
-- próxima vez que alguien la llame con tres argumentos, en producción.
do $$
declare n int;
begin
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'registrar_observacion_comportamiento';
  if n <> 1 then
    raise exception 'quedaron % sobrecargas de registrar_observacion_comportamiento (debe ser 1)', n;
  end if;
  raise notice 'cinturon: 1 sola funcion ✓';
end $$;


-- ── 🔴 EL TRIGGER NOMBRABA UN TIPO DE EVENTO QUE NO EXISTE ─────────────────
-- `_trg_temperamento_crear_evento` pide el padre con `'temperamento_
-- observacion'`; en `cat_tipos_evento` el código es `observacion_
-- comportamiento`. La FK rebota ⇒ **`evento_temperamento_observacion` NUNCA
-- PUDO ESCRIBIRSE**, y la tabla lo confirma: 0 filas, medido.
--
-- *No tenía síntoma porque no tenía tráfico*: la puerta de familia nació en
-- S113 2.1 y su primer uso real es éste. Es `L-402` otra vez — «¿está
-- alcanzable?» no alcanza; hay que preguntar «¿CORRIÓ ALGUNA VEZ?».
--
-- Se cura el TRIGGER, no el catálogo: agregar el código inventado dejaría dos
-- vocabularios para el mismo hecho, que es peor que el error.
create or replace function public._trg_temperamento_crear_evento()
returns trigger language plpgsql as $$
declare v_eje text;
begin
  if new.evento_id is null then
    v_eje := case new.contexto
      when 'visita_clinica' then 'salud'
      when 'grooming' then 'cuidado_externo'
      when 'paseo' then 'cuidado_externo'
      when 'hotel' then 'cuidado_externo'
      when 'guarderia' then 'cuidado_externo'
      when 'entrenamiento' then 'cuidado_externo'
      when 'casa' then 'comportamiento'
      when 'consulta_telemedicina' then 'salud'
      -- 🔴 `cuidado_diario` TAMPOCO EXISTE: los ocho ejes son administrativo ·
      -- alimentacion · comportamiento · cuidado_externo · datos_pasivos ·
      -- etapa_vida · identidad · salud. El trigger nombraba DOS valores
      -- inventados —el tipo y el eje— y ninguno de los dos daba error hasta
      -- que alguien intentó escribir de verdad.
      -- 'familia' cae acá, y `comportamiento` es el eje que S65 firmó para esto
      -- (BIO_EXPEDIENTE Eje 6).
      else 'comportamiento'
    end;
    new.evento_id := _crear_evento_padre_auto(
      new.mascota_id, 'observacion_comportamiento', v_eje,   -- ← el código REAL
      new.fecha_observacion, new.prestador_id, new.empleado_id,
      auth.uid(), case when auth.uid() is null then 'sistema' else null end,
      new.country_code,
      jsonb_build_object('contexto', new.contexto, 'rasgos', new.rasgos));
  end if;
  return new;
end $$;

-- Y el catálogo apunta a su tabla: estaba en NULL, la misma clase que se curó
-- en `registrar_medicacion_administrada`. Sin esto, nada puede ir del evento
-- padre a su fila tipada.
update public.cat_tipos_evento
   set tabla_tipada = 'evento_temperamento_observacion'
 where codigo = 'observacion_comportamiento' and tabla_tipada is null;

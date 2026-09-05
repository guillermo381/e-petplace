/* ══ S113-A · LA COBERTURA DE UNA APLICACIÓN ══════════════════════════════════
 *
 * ── VEDA 76(g): NO RIGE. Una columna nullable, un CHECK vacuosamente cierto
 * sobre lo existente, y tres funciones reemplazadas. **Cero backfill.**
 *
 * ── EL CENSO, corrido para ESTA intención (regla de CLAUDE.md) ──────────────
 * *«quién lee la cobertura»* — por CUERPO en `pg_proc`, no por nombre:
 * `pg_get_functiondef(oid) like '%a.vacuna_codigo = p.vacuna_codigo%'` ⇒ **DOS
 * y sólo dos: `obtener_plan_vacunal` y `evaluar_requisitos_guarderia`.**
 * `codigos_cubiertos`: **ninguna** (nace acá). Ninguna función nueva.
 *
 * ── 🔴 LO MEDIDO ANTES, Y ES LO QUE DECIDE EL DISEÑO ────────────────────────
 * **Los dos leen la cobertura IDÉNTICO.** Misma CTE
 * (`distinct on (vacuna_codigo) … where vacuna_codigo is not null … order by
 * vacuna_codigo, fecha_aplicada desc`), mismo `left join … on a.vacuna_codigo =
 * p.vacuna_codigo`, misma derivación
 * `coalesce(fecha_proxima, _proxima_vacuna_derivada(...))`.
 *
 * ⇒ **Por eso se tocan LOS DOS y no sólo el plan.** Si `codigos_cubiertos`
 * entrara sólo en `obtener_plan_vacunal`, **los dos dejarían de leer lo mismo**:
 * una mascota con una combinada quedaría *«al día»* en su plan y *«falta»* en
 * guardería, **por la misma vacuna**. *Un lector que se queda atrás no da un
 * error: da una contradicción, y la familia la ve como que el producto no se
 * pone de acuerdo consigo mismo.*
 *
 * ── LO QUE **SÍ** DIVERGE, y se declara en vez de emparejarse ───────────────
 * La COBERTURA es igual; **los ESTADOS no**, y está bien que no lo sean:
 * · guardería filtra `p.exigida_guarderia`; el plan muestra todas;
 * · guardería tiene **`sin_carnet`** (`archivo_url is null`) — *para entrar a
 *   una guardería no alcanza con haberla puesto: hay que poder mostrarlo*;
 * · el plan tiene `aun_no_corresponde` (por edad) y `vence_en`; guardería no;
 * · el plan acepta `p_hoy`; guardería usa `hoy_local()` fijo (`D-1029`).
 * **Esta migración NO empareja nada de eso.** *Emparejar estados que responden
 * a preguntas distintas sería trasplantar un criterio correcto a otra pregunta.*
 *
 * ── POR QUÉ UN ARRAY Y NO UNA TABLA PUENTE ──────────────────────────────────
 * La cobertura es un atributo **de esta aplicación concreta** —lo que este
 * frasco cubrió— y no una relación con vida propia: no se consulta al revés, no
 * lleva metadata y muere con la fila. *Una tabla puente para eso es un JOIN
 * permanente a cambio de nada.* El CHECK contra el catálogo hace el trabajo que
 * haría la FK.
 *
 * ── VACÍO HONESTO ───────────────────────────────────────────────────────────
 * `NULL` = *no se declaró qué cubre*. `{}` **también se acepta** y significa lo
 * mismo que NULL para los lectores (`nullif(...,'{}')`), pero **se distingue en
 * el dato**: alguien que mandó `[]` dijo *«no cubre nada además de su código»*,
 * y eso no es igual a no haber contestado. *La columna guarda las dos; los
 * lectores tratan a las dos igual, y eso se dice acá para que nadie lo lea como
 * un olvido.*
 */

alter table public.evento_vacuna_aplicada
  add column if not exists codigos_cubiertos text[];

comment on column public.evento_vacuna_aplicada.codigos_cubiertos is
  'Qué casillas del plan cubre ESTA aplicación, además de `vacuna_codigo`. '
  'Para las combinadas: una séxtuple es `multiple` y además cubre '
  '`leptospirosis`. NULL o {} = no se declaró. Validado contra cat_vacunas '
  'activo (S113-A).';

/* 🔴 UN TRIGGER Y NO UN CHECK — y el motor me corrigió el diseño en el primer
   intento: `cannot use subquery in check constraint (0A000)`. Postgres no deja
   consultar otra tabla desde un CHECK, **y tiene razón**: un CHECK se evalúa
   como si su verdad fuera eterna, y la pertenencia a un catálogo no lo es.

   El trigger hace lo que el CHECK no podía **y una cosa más que importa: mira
   `activo`.** Un código jubilado existe en `cat_vacunas` y ya no se puede usar;
   una FK lo habría dejado pasar. *La puerta explica con el índice del ítem; el
   trigger vuelve el estado inexpresable venga por donde venga* — y hay otro
   productor, `registrar_vacuna_mostrador`, que no pasa por la puerta (L-424). */
create or replace function public._trg_vacuna_valida_cobertura()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_malos text;
begin
  if new.codigos_cubiertos is null or array_length(new.codigos_cubiertos, 1) is null then
    return new;
  end if;
  select string_agg(x, ', ') into v_malos
    from unnest(new.codigos_cubiertos) x
   where not exists (select 1 from cat_vacunas c where c.codigo = x and c.activo);
  if v_malos is not null then
    raise exception 'codigos_cubiertos fuera del catálogo activo: %', v_malos
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_vacuna_valida_cobertura on public.evento_vacuna_aplicada;
create trigger trg_vacuna_valida_cobertura
  before insert or update of codigos_cubiertos on public.evento_vacuna_aplicada
  for each row execute function public._trg_vacuna_valida_cobertura();

/* ── LA COBERTURA, EN UN SOLO LUGAR ─────────────────────────────────────────
   Los DOS lectores la resuelven llamando acá. *Antes cada uno tenía su copia de
   la misma CTE — dos copias de una regla es una regla que se va a bifurcar el
   día que alguien toque una sola* (y este lote es ese día). */
create or replace function public._cobertura_vacunal(p_mascota_id uuid)
returns table (cod text, fecha_aplicada date, fecha_proxima date, archivo_url text)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  /* Cada aplicación se ABRE en una fila por casilla que cubre: su propio
     `vacuna_codigo` MÁS los de `codigos_cubiertos`. Después, la más reciente
     por casilla — el mismo `distinct on` que las dos tenían. */
  select distinct on (z.cod) z.cod, z.fecha_aplicada, z.fecha_proxima, z.archivo_url
    from (
      select unnest(
               coalesce(
                 case when e.vacuna_codigo is not null then array[e.vacuna_codigo] else '{}'::text[] end
                 || coalesce(e.codigos_cubiertos, '{}'::text[]),
                 '{}'::text[]
               )
             ) as cod,
             e.fecha_aplicada, e.fecha_proxima, e.archivo_url
        from evento_vacuna_aplicada e
       where e.mascota_id = p_mascota_id
    ) z
   where z.cod is not null
   order by z.cod, z.fecha_aplicada desc nulls last
$function$;

revoke all on function public._cobertura_vacunal(uuid) from public, anon;
grant execute on function public._cobertura_vacunal(uuid) to authenticated;

create or replace function public.obtener_plan_vacunal(
  p_mascota_id   uuid,
  p_hoy          date default null,
  p_ventana_dias int  default 30
) returns table (
  vacuna_codigo       text,
  nombre              text,
  obligatoria         boolean,
  periodicidad_meses  integer,
  exigida_guarderia   boolean,
  ultima_aplicada     date,
  proxima             date,
  proxima_es_derivada boolean,
  estado              text,
  aplicadas_sin_clasificar integer
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_especie    text;
  v_edad_meses integer;
  v_hoy        date := coalesce(p_hoy, public.hoy_local());
  v_huerf      integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  -- la puerta del expediente: el MISMO helper que gobierna la lectura clínica
  -- de la mascota (jamás una regla nueva acá)
  if not user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;

  select m.especie,
         case when m.fecha_nacimiento is null then null
              else (extract(year from age(v_hoy, m.fecha_nacimiento)) * 12
                  + extract(month from age(v_hoy, m.fecha_nacimiento)))::integer end
    into v_especie, v_edad_meses
    from mascotas m where m.id = p_mascota_id;

  select count(*) into v_huerf
    from evento_vacuna_aplicada e
   where e.mascota_id = p_mascota_id and e.vacuna_codigo is null;

  return query
  /* ⭐ LA COBERTURA SALE DEL HELPER ÚNICO: una casilla está cubierta si su
     código está en `vacuna_codigo` **O** en `codigos_cubiertos` de alguna
     aplicación. `evaluar_requisitos_guarderia` llama al MISMO helper — es la
     única forma de que los dos no se bifurquen. */
  with aplicadas as (
    select c.cod as vacuna_codigo, c.fecha_aplicada, c.fecha_proxima
      from public._cobertura_vacunal(p_mascota_id) c
  )
  select p.vacuna_codigo,
         c.nombre,
         p.obligatoria,
         p.periodicidad_meses,
         coalesce(p.exigida_guarderia, false),
         a.fecha_aplicada,
         -- LA CAPTURADA GANA A LA DERIVADA (siempre)
         coalesce(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)),
         (a.fecha_proxima is null
          and _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses) is not null),
         case
           when a.vacuna_codigo is null and v_edad_meses is not null
                and p.edad_inicio_meses is not null and v_edad_meses < p.edad_inicio_meses
             then 'aun_no_corresponde'
           when a.vacuna_codigo is null then 'nunca_aplicada'
           when coalesce(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) is null
             then 'sin_fecha'
           when coalesce(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) < v_hoy
             then 'vencida'
           /* ② el estado NUEVO. Va DESPUÉS de 'vencida' a propósito: lo que ya
              venció no «vence pronto», ya venció. */
           when coalesce(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses))
                  <= v_hoy + (p_ventana_dias || ' days')::interval
             then 'vence_en'
           else 'al_dia'
         end,
         v_huerf
    from cat_plan_vacunal p
    join cat_vacunas c on c.codigo = p.vacuna_codigo
    left join aplicadas a on a.vacuna_codigo = p.vacuna_codigo
   where p.especie_codigo = v_especie and p.activo and c.activo
   order by p.orden, c.nombre;
end;
$function$;

revoke all on function public.obtener_plan_vacunal(uuid, date, int) from public, anon;
grant execute on function public.obtener_plan_vacunal(uuid, date, int) to authenticated;

create or replace function public.evaluar_requisitos_guarderia(p_mascota_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_especie text; v_faltan jsonb := '[]'::jsonb; v_duro boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false) INTO v_duro;
  SELECT especie INTO v_especie FROM mascotas WHERE id = p_mascota_id;

  WITH aplicadas AS (
    /* ⭐ EL MISMO helper que el plan. Antes acá vivía una COPIA de la misma
       CTE, y este lote es exactamente el día en que una copia se habría
       quedado atrás: sin esto, una combinada dejaría a la mascota «al día» en
       su plan y «falta» en guardería, por la misma vacuna. */
    SELECT c.cod AS vacuna_codigo, c.fecha_aplicada, c.fecha_proxima, c.archivo_url
      FROM public._cobertura_vacunal(p_mascota_id) c
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'codigo', x.vacuna_codigo, 'nombre', x.nombre,
           'estado', x.estado, 'vence', x.vence) ORDER BY x.orden), '[]'::jsonb)
    INTO v_faltan
    FROM (
      SELECT p.vacuna_codigo, c.nombre, p.orden,
             COALESCE(a.fecha_proxima,
                      _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) AS vence,
             CASE
               WHEN a.vacuna_codigo IS NULL THEN 'nunca_aplicada'
               WHEN a.archivo_url IS NULL   THEN 'sin_carnet'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) IS NULL
                                            THEN 'sin_fecha'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses))
                    < public.hoy_local()    THEN 'vencida'
               ELSE 'al_dia'
             END AS estado
        FROM cat_plan_vacunal p
        JOIN cat_vacunas c ON c.codigo = p.vacuna_codigo
        LEFT JOIN aplicadas a ON a.vacuna_codigo = p.vacuna_codigo
       WHERE p.especie_codigo = v_especie AND p.activo AND c.activo AND p.exigida_guarderia
    ) x
   WHERE x.estado <> 'al_dia';

  RETURN jsonb_build_object(
    'estado',    CASE WHEN jsonb_array_length(v_faltan) = 0 THEN 'al_dia' ELSE 'faltan' END,
    'faltantes', v_faltan,
    /* 🔴 LA PERILLA VIAJA ACÁ. `false` = el semáforo INFORMA y la reserva pasa
       igual; `true` = frena. La pantalla lo PINTA, no lo decide. */
    'bloquea',   v_duro);
END $function$

;

create or replace function public.registrar_vacunas_de_carnet(
  p_mascota_id uuid,
  p_vacunas    jsonb,
  p_archivo_url text default null
) returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_item           jsonb;
  v_idx            int := 0;
  v_nombre         text;
  v_fecha_aplicada date;
  v_fecha_proxima  date;
  v_venc           date;
  v_via            text;
  v_codigo         text;
  v_cubre          text[];
  v_malos          text;
  v_id             uuid;
  v_evento         uuid;
  v_ids            uuid[] := '{}';
  v_archivo        text;
  v_evs            uuid[] := '{}';
  v_marcados       int;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  -- INVOKER: esta lectura pasa por la RLS de mascotas; la condición es la
  -- MISMA puerta que la rama del dueño en vacuna_insert (relevada literal en
  -- S46-B1.0) — el error tipado llega antes que un 42501.
  if not exists (
    select 1 from mascotas m
     where m.id = p_mascota_id and m.user_id = auth.uid()
  ) then
    raise exception 'sin_acceso_mascota';
  end if;

  -- El carnet que respalda el lote: path del bucket mascotas, carpeta del
  -- dueño. Ni URL ni carpeta ajena (S47-B1.2).
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

    /* ⭐ 1.0.1 · EL CÓDIGO DEL CATÁLOGO, con su rebote HABLADO.
       Contra `cat_vacunas` **filtrando por `activo`**: el FK garantiza que
       exista, no que se pueda usar. NULL es legal y honesto — una vacuna cuyo
       nombre comercial no mapea a ningún código entra sin código, y el plan la
       cuenta aparte en `aplicadas_sin_clasificar`. */
    v_codigo := nullif(btrim(v_item->>'vacuna_codigo'), '');
    if v_codigo is not null
       and not exists (select 1 from cat_vacunas c where c.codigo = v_codigo and c.activo) then
      raise exception 'item_invalido: %: vacuna_codigo % no está en el catálogo activo', v_idx, v_codigo;
    end if;

    if v_item->>'fecha_aplicada' is not null then
      if not pg_input_is_valid(v_item->>'fecha_aplicada', 'date') then
        raise exception 'item_invalido: %: fecha_aplicada no es una fecha válida', v_idx;
      end if;
      v_fecha_aplicada := (v_item->>'fecha_aplicada')::date;
      if v_fecha_aplicada > public.hoy_local() then
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

    /* ⭐ A2 — EL VENCIMIENTO DEL FRASCO, con su rebote HABLADO.
       El CHECK de la tabla ya lo vuelve inexpresable; este guard existe para
       que el dueño lea POR QUÉ y CUÁL ítem, en vez de un 23514 crudo. */
    if v_item->>'vencimiento_biologico' is not null then
      if not pg_input_is_valid(v_item->>'vencimiento_biologico', 'date') then
        raise exception 'item_invalido: %: vencimiento_biologico no es una fecha válida', v_idx;
      end if;
      v_venc := (v_item->>'vencimiento_biologico')::date;
      if v_fecha_aplicada is not null and v_venc < v_fecha_aplicada then
        raise exception
          'item_invalido: %: vencimiento_biologico (%) anterior a la aplicación (%)',
          v_idx, v_venc, v_fecha_aplicada;
      end if;
    else
      v_venc := null;
    end if;

    /* ⚠️ `via` Y `via_administracion` — LAS DOS, y se declara por qué.
       La columna se llama `via_administracion`; el brief del lote 1 nombra la
       clave `via`. Medido: la edge de HOY (`extract-vacuna`, su contrato en
       index.ts:133) **no emite ninguna de las dos** — las va a emitir la v2 de
       D, y todavía no está firmada cuál. *Aceptar sólo una obliga a adivinar
       hoy lo que se decide después; aceptar las dos no cuesta nada y ninguna
       puede llegar con dos valores distintos porque la fuente es una sola.*
       `via_administracion` gana si vinieran ambas: es el nombre de la columna. */
    /* ⭐ LOS CÓDIGOS QUE ESTA APLICACIÓN CUBRE ADEMÁS DEL SUYO.
       Mismo criterio que `vacuna_codigo`: contra `cat_vacunas` **activo** —el
       CHECK de la tabla sólo garantiza que existan— y con el rebote HABLADO,
       que nombra el ítem y **cuáles** valores fallaron, no sólo que algo falló.
       `{}` se acepta y se guarda: dice *«no cubre nada más»*, que no es lo
       mismo que no haber contestado (NULL). */
    if v_item ? 'codigos_cubiertos' and jsonb_typeof(v_item->'codigos_cubiertos') = 'array' then
      select array_agg(x) into v_cubre
        from jsonb_array_elements_text(v_item->'codigos_cubiertos') t(x)
       where nullif(btrim(x), '') is not null;
      v_cubre := coalesce(v_cubre, '{}'::text[]);
      select string_agg(x, ', ') into v_malos
        from unnest(v_cubre) x
       where not exists (select 1 from cat_vacunas c where c.codigo = x and c.activo);
      if v_malos is not null then
        raise exception 'item_invalido: %: codigos_cubiertos fuera del catálogo activo: %', v_idx, v_malos;
      end if;
    else
      v_cubre := null;
    end if;

    v_via := coalesce(
      nullif(btrim(v_item->>'via_administracion'), ''),
      nullif(btrim(v_item->>'via'), '')
    );
    -- espejo literal del CHECK evento_vacuna_aplicada_via_administracion_check
    if v_via is not null
       and v_via not in ('subcutanea','intramuscular','intranasal','oral') then
      raise exception 'item_invalido: %: via_administracion fuera del catálogo', v_idx;
    end if;

    -- evento_id NO se pasa: _trg_vacuna_crear_evento crea el padre.
    insert into evento_vacuna_aplicada
      (mascota_id, nombre_vacuna, fecha_aplicada, fecha_proxima,
       veterinario_nombre_externo, tipo_vacuna, lote, via_administracion,
       laboratorio, vencimiento_biologico, vacuna_codigo, codigos_cubiertos, archivo_url)
    values
      (p_mascota_id, v_nombre, v_fecha_aplicada, v_fecha_proxima,
       nullif(btrim(v_item->>'veterinario_nombre_externo'), ''),
       nullif(btrim(v_item->>'tipo_vacuna'), ''),
       nullif(btrim(v_item->>'lote'), ''),
       v_via,
       nullif(btrim(v_item->>'laboratorio'), ''),
       v_venc,
       v_codigo,
       v_cubre,
       v_archivo)
    returning id, evento_id into v_id, v_evento;

    v_ids := v_ids || v_id;
    v_evs := v_evs || v_evento;
  end loop;

  /* ─── S113-A · LA MARCA DE ESTE CAMINO ────────────────────────────────────
     Sin parámetro: por acá SIEMPRE se entra desde la extracción del carnet por
     IA. No hay otro llamador — medido: los productores SQL de
     `evento_vacuna_aplicada` son DOS (`registrar_vacuna_mostrador`, DEFINER, y
     ésta), y el mostrador no pasa por acá.

     🔴 POR QUÉ NO ES UN `UPDATE` ACÁ ADENTRO: esta función es INVOKER y
     `eventos_mascota` tiene RLS con policies de SELECT e INSERT y **ninguna de
     UPDATE** (medido en `pg_policies`). Un UPDATE desde acá afectaría CERO
     filas y devolvería ok igual: verde falso perfecto. Por eso la marca pasa
     por `_marcar_modo_captura_evento`, que es DEFINER, re-chequea el acceso con
     el MISMO predicado que la policy de INSERT, y devuelve cuántas marcó — y
     acá se ASSERTEA contra las que se insertaron. */
  v_marcados := public._marcar_modo_captura_evento(v_evs, 'extraido_por_ia');
  if v_marcados <> coalesce(array_length(v_ids, 1), 0) then
    raise exception 'marca_incompleta: marcó % de %', v_marcados, coalesce(array_length(v_ids,1),0);
  end if;

  return jsonb_build_object(
    'ok', true,
    'mascota_id', p_mascota_id,
    'insertadas', coalesce(array_length(v_ids, 1), 0),
    'ids', to_jsonb(v_ids),
    'archivo_url', v_archivo
  );
end;
$function$;

revoke all on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) from public, anon;
grant execute on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) to authenticated;

revoke all on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) from public, anon;
grant execute on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) to authenticated;

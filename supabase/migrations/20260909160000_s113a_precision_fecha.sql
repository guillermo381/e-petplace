/* ══ S113-A · LA PRECISIÓN DE LA FECHA DE UNA VACUNA ══════════════════════════
 *
 * ── VEDA 76(g): NO RIGE. Columna con DEFAULT sobre filas existentes — todas
 * pasan a `'dia'`, que es **lo que ya afirmaban**: hasta hoy toda fecha del
 * carnet se guardaba como si el día fuera sabido. *No es un backfill que cambie
 * un hecho: es escribir el supuesto que estaba implícito.*
 *
 * ── EL CENSO (regla de CLAUDE.md), por cuerpo en `pg_proc` ──────────────────
 * Tocan `evento_vacuna_aplicada`: `registrar_vacunas_de_carnet` ·
 * `registrar_vacuna_mostrador` · `obtener_plan_vacunal` · `_cobertura_vacunal` ·
 * `ejecutar_cierres_vencidos`. **`precision_fecha`: ninguna** (nace acá).
 *
 * ⚠️ **HAY UN PRECEDENTE EN LA CASA Y NO SE REUSA — se declara la diferencia.**
 * `mascotas.fecha_nacimiento_precision` existe con vocabulario
 * `exacta | aproximada | estimada`. **Responde OTRA pregunta:** ésa dice *cuán
 * confiable* es la fecha; ésta dice *qué granularidad* tiene. *Un carnet que
 * dice «05/2024» no es una fecha «aproximada»: es una fecha EXACTA de un mes.*
 * ⇒ vocabulario propio `dia | mes`. **Dos columnas de nombre parecido y
 * vocabulario distinto son una trampa**, y por eso queda escrito acá: quien
 * busque unificarlas va a estar juntando dos ejes que no son el mismo.
 *
 * ── LO QUE SE GUARDA Y LO QUE SE CALCULA, que NO son lo mismo ───────────────
 * · **Se guarda el PRIMER día del mes.** Es el ancla honesta: la única fecha que
 *   no inventa nada más allá del mes que el carnet dice.
 * · **El plan cuenta desde el FIN de mes** (firma del founder: *conservador*).
 *
 * 🔴 **Y el precio de esa elección va escrito, porque es real:** tomar fin de
 * mes empuja la próxima hasta 30 días más tarde ⇒ **una vacuna aplicada el día
 * 1 puede estar vencida hasta un mes antes de que el plan lo diga.** *Se eligió
 * ese lado a propósito: la alternativa —contar desde el día 1— gritaría
 * «vencida» hasta 30 días antes de tiempo, y una alarma que se adelanta enseña a
 * ignorar las alarmas.* **Con la precisión al lado, la pantalla puede decir «en
 * mayo 2024» y la familia completar el día si lo sabe.**
 */

alter table public.evento_vacuna_aplicada
  add column if not exists precision_fecha text not null default 'dia';

alter table public.evento_vacuna_aplicada
  drop constraint if exists chk_vacuna_precision_fecha;
alter table public.evento_vacuna_aplicada
  add constraint chk_vacuna_precision_fecha
  check (precision_fecha in ('dia', 'mes'));

comment on column public.evento_vacuna_aplicada.precision_fecha is
  'Granularidad de `fecha_aplicada`: «dia» = el carnet dice el día; «mes» = sólo '
  'dice mes y año, y `fecha_aplicada` guarda el PRIMER día como ancla. NO es lo '
  'mismo que mascotas.fecha_nacimiento_precision, que mide confiabilidad y no '
  'granularidad (S113-A).';

/* ── EL HELPER DE COBERTURA, con la fecha CONSERVADORA ──────────────────────
   Vive en un solo lugar y lo llaman los DOS lectores del plan, así que la regla
   del fin de mes entra una vez y no se puede bifurcar. */
create or replace function public._cobertura_vacunal(p_mascota_id uuid)
returns table (cod text, fecha_aplicada date, fecha_proxima date, archivo_url text)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select distinct on (z.cod) z.cod, z.fecha_aplicada, z.fecha_proxima, z.archivo_url
    from (
      select unnest(
               coalesce(
                 case when e.vacuna_codigo is not null then array[e.vacuna_codigo] else '{}'::text[] end
                 || coalesce(e.codigos_cubiertos, '{}'::text[]),
                 '{}'::text[]
               )
             ) as cod,
             /* ⭐ CONSERVADOR: si sólo se sabe el mes, el plan cuenta desde el
                ÚLTIMO día. La fila guarda el primero —el ancla honesta— y acá se
                deriva el borde. *Guardar y calcular responden preguntas
                distintas: uno dice qué se sabe, el otro cuánto se puede esperar
                sin acusar de vencido a quien no lo está.* */
             case
               when e.precision_fecha = 'mes' and e.fecha_aplicada is not null
                 then (date_trunc('month', e.fecha_aplicada) + interval '1 month - 1 day')::date
               else e.fecha_aplicada
             end as fecha_aplicada,
             e.fecha_proxima, e.archivo_url
        from evento_vacuna_aplicada e
       where e.mascota_id = p_mascota_id
    ) z
   where z.cod is not null
   order by z.cod, z.fecha_aplicada desc nulls last
$function$;

revoke all on function public._cobertura_vacunal(uuid) from public, anon;
grant execute on function public._cobertura_vacunal(uuid) to authenticated;

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
  v_precision      text;
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
    /* ⭐ LA PRECISIÓN DE LA FECHA. `'mes'` ⇒ **se guarda el PRIMER día**: es el
       ancla que no inventa nada más allá del mes que el carnet dice. La app lo
       lee y escribe «mayo 2024»; el plan cuenta desde fin de mes. */
    v_precision := coalesce(nullif(btrim(v_item->>'precision_fecha'), ''), 'dia');
    if v_precision not in ('dia', 'mes') then
      raise exception 'item_invalido: %: precision_fecha % no es «dia» ni «mes»', v_idx, v_precision;
    end if;
    if v_precision = 'mes' and v_fecha_aplicada is not null then
      v_fecha_aplicada := date_trunc('month', v_fecha_aplicada)::date;
    end if;

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
       laboratorio, vencimiento_biologico, vacuna_codigo, codigos_cubiertos,
       precision_fecha, archivo_url)
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
       v_precision,
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

revoke all on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) from public, anon;
grant execute on function public.registrar_vacunas_de_carnet(uuid, jsonb, text) to authenticated;

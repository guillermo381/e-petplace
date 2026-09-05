/* ══ S113-A · LOTE 1.0 · A1+A2 — EL CARNET DICE LA VERDAD ═════════════════════
 *
 * ── VEDA 76(g): NO RIGE ──────────────────────────────────────────────────────
 * Dos columnas nuevas nullable, un CHECK que sobre filas existentes es
 * vacuosamente cierto (ambas columnas nacen NULL) y un CREATE OR REPLACE de
 * una función. **Cero backfill, cero anclas movidas, cero filas tocadas.**
 *
 * ── LO MEDIDO ANTES, y contra qué ────────────────────────────────────────────
 * `information_schema.columns` sobre `evento_vacuna_aplicada` (base viva,
 * 9-sep). Control positivo: `lote` **está** ⇒ el instrumento lee esta tabla.
 * Ya existían: lote · via_administracion · fecha_proxima ·
 * veterinario_nombre_externo · dosis · tipo_vacuna · vacuna_codigo.
 * **Faltaban las dos que agrega esta migración.**
 *
 * ── POR QUÉ EL CHECK Y ADEMÁS EL GUARD, y no uno solo (L-424) ────────────────
 * Un guard que vive SOLO en un índice o en un CHECK **sabe negarse y no sabe
 * explicar**: el dueño recibiría un `23514` crudo sobre un carnet que acaba de
 * fotografiar. Un guard que vive SOLO en la función **no protege al otro
 * productor** — y hay otro: `registrar_vacuna_mostrador` (DEFINER), medido.
 * ⇒ **Las dos capas, cada una con su trabajo:** el CHECK vuelve el estado
 * inexpresable; la función lo explica con `item_invalido` y su índice.
 */

-- ─── A1 · las dos columnas ──────────────────────────────────────────────────
alter table public.evento_vacuna_aplicada
  add column if not exists laboratorio            text,
  add column if not exists vencimiento_biologico  date;

comment on column public.evento_vacuna_aplicada.laboratorio is
  'Quién fabricó el biológico, tal como lo dice el carnet. Texto libre a '
  'propósito: no hay catálogo de laboratorios y no se inventa uno (S113-A).';

comment on column public.evento_vacuna_aplicada.vencimiento_biologico is
  'Vencimiento IMPRESO del frasco. ⚠️ NO es «cuándo toca la próxima»: eso es '
  '`fecha_proxima`. Confundirlas fue el defecto que L-139 midió en S48 — el '
  'modelo tomaba la fecha del sticker como fecha de aplicación.';

alter table public.evento_vacuna_aplicada
  drop constraint if exists chk_vacuna_vencimiento_no_anterior;
alter table public.evento_vacuna_aplicada
  add constraint chk_vacuna_vencimiento_no_anterior
  check (
    vencimiento_biologico is null
    or fecha_aplicada is null
    or vencimiento_biologico >= fecha_aplicada
  );

-- ─── A2 · la puerta acepta el carnet fino ───────────────────────────────────
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
       laboratorio, vencimiento_biologico, archivo_url)
    values
      (p_mascota_id, v_nombre, v_fecha_aplicada, v_fecha_proxima,
       nullif(btrim(v_item->>'veterinario_nombre_externo'), ''),
       nullif(btrim(v_item->>'tipo_vacuna'), ''),
       nullif(btrim(v_item->>'lote'), ''),
       v_via,
       nullif(btrim(v_item->>'laboratorio'), ''),
       v_venc,
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

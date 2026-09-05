/* ══ S113-A · LOTE 1.0 · A3 — LA PLAGA EN EL EVENTO ═══════════════════════════
 *
 * ── VEDA 76(g): NO RIGE ─────────────────────────────────────────────────────
 * Una columna nueva nullable, un CHECK vacuosamente cierto sobre lo existente
 * (todas las filas nacen con `plagas` NULL) y el reemplazo de una función.
 * **Cero backfill.** `tipo_desparasitacion` SE CONSERVA y no se toca: no es
 * un sinónimo de `plagas` — «externa» no dice si era pulgas o garrapatas, y
 * ésa es justamente la razón por la que la columna nueva existe.
 *
 * ── LO MEDIDO ANTES ─────────────────────────────────────────────────────────
 * `information_schema` + `pg_constraint` sobre `evento_desparasitacion_aplicada`
 * (base viva, 9-sep). Tenía: producto · tipo_desparasitacion (CHECK
 * interna|externa|mixta) · fecha_aplicada · fecha_proxima · lote · notas ·
 * archivo_url. **`plagas` no existía.** Control positivo: `lote` sí está.
 *
 * ── `<@` Y NO `&&`, y la casa ya pagó por saberlo ───────────────────────────
 * S95 midió que con `&&` («se solapan») un array como {'pulgas','basura'}
 * PASA, porque comparte un elemento con el catálogo. `<@` («está contenido
 * en») exige que **todos** sus elementos estén. *Un vocabulario cerrado en
 * apariencia, con basura adentro, es peor que no tener vocabulario: nadie lo
 * va a ir a verificar.*
 *
 * ── Y EL ARRAY VACÍO TAMBIÉN SE CIERRA ──────────────────────────────────────
 * `'{}' <@ cualquier_cosa` es CIERTO, así que sin la segunda condición un
 * `plagas = '{}'` entraría. **No es lo mismo que NULL:** NULL dice «no sé qué
 * trataba»; `{}` diría «trataba ninguna plaga», que no es un hecho posible.
 */

alter table public.evento_desparasitacion_aplicada
  add column if not exists plagas text[];

comment on column public.evento_desparasitacion_aplicada.plagas is
  'Qué se trató, del catálogo cerrado {pulgas, garrapatas, mosquitos, internos}. '
  'NULL = no se declaró, y se dice. Convive con tipo_desparasitacion, que '
  'responde otra pregunta (dónde actúa el producto, no contra qué).';

alter table public.evento_desparasitacion_aplicada
  drop constraint if exists chk_desparasitacion_plagas;
alter table public.evento_desparasitacion_aplicada
  add constraint chk_desparasitacion_plagas
  check (
    plagas is null
    or (
      array_length(plagas, 1) >= 1
      and plagas <@ array['pulgas','garrapatas','mosquitos','internos']::text[]
    )
  );

/* ⚠️ L-119 — UN PARÁMETRO CON DEFAULT *SOBRECARGA*, NO REEMPLAZA.
   Sin este DROP quedarían DOS funciones con el mismo nombre y toda llamada
   con 6 argumentos sería ambigua. Se dropea la firma vieja EXPLÍCITA y al
   cierre se verifica `sobrecargas = 1` contra `pg_proc`. */
drop function if exists public.registrar_desparasitacion(uuid, text, text, date, date, text);

create or replace function public.registrar_desparasitacion(
  p_mascota_id     uuid,
  p_producto       text,
  p_tipo           text   default null,
  p_fecha_aplicada date   default null,
  p_fecha_proxima  date   default null,
  p_notas          text   default null,
  p_plagas         text[] default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_auth uuid := auth.uid();
  v_id uuid;
  v_country text;
  v_evento uuid;
  v_marcados int;
  v_plagas text[];
begin
  if v_auth is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;
  if p_producto is null or length(trim(p_producto)) = 0 then
    raise exception 'producto_requerido' using errcode = '22023';
  end if;
  if p_tipo is not null and p_tipo not in ('interna', 'externa', 'mixta') then
    raise exception 'tipo_invalido' using errcode = '22023';
  end if;

  /* ⭐ A3 · LAS PLAGAS, con su rebote HABLADO.
     El CHECK ya vuelve el estado inexpresable; este guard existe para que la
     familia lea CUÁL valor no se conoce, en vez de un 23514 crudo (L-424: el
     índice sabe negarse, el guard sabe explicar). */
  v_plagas := p_plagas;
  if v_plagas is not null then
    if array_length(v_plagas, 1) is null then
      raise exception 'plagas_vacio' using errcode = '22023';
    end if;
    if not (v_plagas <@ array['pulgas','garrapatas','mosquitos','internos']::text[]) then
      raise exception 'plaga_invalida: %',
        (select string_agg(x, ', ') from unnest(v_plagas) x
          where x not in ('pulgas','garrapatas','mosquitos','internos'))
        using errcode = '22023';
    end if;
  end if;

  -- lo declarado por familia es un hecho PASADO: la aplicación no es futura
  if p_fecha_aplicada is not null and p_fecha_aplicada > public.hoy_local() then
    raise exception 'fecha_futura' using errcode = '22023';
  end if;
  if p_fecha_proxima is not null and p_fecha_aplicada is not null and p_fecha_proxima < p_fecha_aplicada then
    raise exception 'orden_fechas_invalido' using errcode = '22023';
  end if;

  -- eventos_mascota.country_code es NOT NULL (hallazgo del rojo crudo):
  -- el país del evento es el de la MASCOTA, derivado — jamás pedido.
  select country_code into v_country from mascotas where id = p_mascota_id;

  insert into evento_desparasitacion_aplicada
    (mascota_id, country_code, producto, tipo_desparasitacion,
     fecha_aplicada, fecha_proxima, notas, plagas)
  values
    (p_mascota_id, v_country, trim(p_producto), p_tipo,
     p_fecha_aplicada, p_fecha_proxima, p_notas, v_plagas)
  returning id, evento_id into v_id, v_evento;

  /* S113-A · MODO DE CAPTURA. Misma regla que el carnet y la nota clínica:
     la marca no viaja en el INSERT porque la escribe el trigger, y esta
     función es DEFINER pero `eventos_mascota` no tiene policy de UPDATE —
     así que pasa por el marcador, que re-chequea el acceso.
     Por esta puerta entra SIEMPRE la familia tecleando: no hay parámetro. */
  v_marcados := public._marcar_modo_captura_evento(array[v_evento], 'tecleado');
  if v_marcados <> 1 then
    raise exception 'marca_incompleta: marcó % de 1', v_marcados;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'mascota_id', p_mascota_id);
end;
$function$;

revoke all on function public.registrar_desparasitacion(uuid, text, text, date, date, text, text[]) from public, anon;
grant execute on function public.registrar_desparasitacion(uuid, text, text, date, date, text, text[]) to authenticated;

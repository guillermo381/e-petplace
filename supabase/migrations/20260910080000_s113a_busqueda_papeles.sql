-- ════════════════════════════════════════════════════════════════════════════
-- S113-A · FASE 3 — LA BÚSQUEDA ENCUENTRA LOS PAPELES
--
-- **Se AMPLÍA, no se reescribe** (el brief lo dice y el censo lo confirmó: la
-- función ya mira seis fuentes). Entra un séptimo brazo y **nada más cambia**:
-- el cuerpo se sacó de `pg_get_functiondef` —del OBJETO, no de un archivo— y se
-- le agregó el `union`. *Reescribirla habría sido la forma más cómoda de
-- perder, sin que nadie lo note, una de las seis que ya funcionaban.*
--
-- El brazo busca por título, origen **y el nombre de cada analito**. Sin eso la
-- bóveda sería un cajón: se puede guardar y no se puede encontrar.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.buscar_en_mi_familia(p_q text, p_limite integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_familias uuid[];
  v_q tsquery;
  v_lim int := greatest(1, least(coalesce(p_limite, 20), 50));
  v_filas jsonb;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if p_q is null or length(trim(p_q)) < 2 then
    -- Con una sola letra no se busca: se devuelve vacío HABLANDO, no un error.
    -- *Rebotar a quien todavía está escribiendo es castigarlo por escribir.*
    return jsonb_build_object('ok', true, 'consulta', coalesce(p_q,''), 'resultados', '[]'::jsonb);
  end if;

  v_q := plainto_tsquery('spanish', trim(p_q));
  if v_q is null or v_q::text = '' then
    -- La consulta era toda palabras vacías («de», «el»). Vacío honesto.
    return jsonb_build_object('ok', true, 'consulta', p_q, 'resultados', '[]'::jsonb);
  end if;

  -- Las familias de quien pregunta. TODO lo privado cuelga de acá.
  select coalesce(array_agg(fm.familia_id), '{}') into v_familias
    from familia_miembro fm where fm.user_id = v_uid and fm.hasta is null;

  with
  m as (
    select 'mascota' as tipo, x.id::text as id, x.nombre as titulo,
           nullif(concat_ws(' · ', x.especie, x.raza), '') as subtitulo,
           null::timestamptz as fecha,
           '/hogar/mascota/' || x.id as ruta,
           ts_rank(to_tsvector('spanish', coalesce(x.nombre,'') || ' ' || coalesce(x.raza,'')), v_q) as rank
      from mascotas x
     where x.familia_id = any(v_familias)
       and to_tsvector('spanish', coalesce(x.nombre,'') || ' ' || coalesce(x.raza,'')) @@ v_q
  ),
  c as (
    select 'cita' as tipo, ci.id::text, coalesce(ts.nombre, ci.tipo_servicio) as titulo,
           nullif(concat_ws(' · ', ma.nombre, pr.nombre_comercial), '') as subtitulo,
           (ci.fecha + coalesce(ci.hora, '00:00'::time))::timestamptz as fecha,
           '/citas/' || ci.mascota_id as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(ts.nombre,'') || ' ' || coalesce(pr.nombre_comercial,'') || ' ' || coalesce(ma.nombre,'')), v_q) as rank
      from evento_cita_servicio ci
      join mascotas ma on ma.id = ci.mascota_id
      left join tipos_servicio ts on ts.codigo = ci.tipo_servicio
      left join prestadores pr on pr.id = ci.prestador_id
     where ma.familia_id = any(v_familias)
       and to_tsvector('spanish',
             coalesce(ts.nombre,'') || ' ' || coalesce(pr.nombre_comercial,'') || ' ' || coalesce(ma.nombre,'')) @@ v_q
  ),
  p as (
    select distinct on (pe.id)
           'pedido' as tipo, pe.id::text, 'Pedido ' || pe.numero_orden as titulo,
           pi.nombre_producto as subtitulo, pe.created_at as fecha,
           '/pedidos/pedido/' || pe.id as ruta,
           ts_rank(to_tsvector('spanish', coalesce(pi.nombre_producto,'')), v_q) as rank
      from pedidos pe
      join pedido_items pi on pi.pedido_id = pe.id
     where pe.user_id = v_uid
       and (to_tsvector('spanish', coalesce(pi.nombre_producto,'')) @@ v_q
            or pe.numero_orden ilike '%' || trim(p_q) || '%')
  ),
  e as (
    select 'recuerdo' as tipo, ev.id::text,
           coalesce(nullif(left(coalesce(ev.datos->>'texto', ev.datos->>'nota', ev.datos->>'mensaje'), 60), ''), 'Nota') as titulo,
           ma.nombre as subtitulo, ev.fecha_evento as fecha,
           '/hogar/mascota/' || ev.mascota_id as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(ev.datos->>'texto','') || ' ' || coalesce(ev.datos->>'nota','') || ' ' ||
             coalesce(ev.datos->>'mensaje','')), v_q) as rank
      from eventos_mascota ev
      join mascotas ma on ma.id = ev.mascota_id
     where ma.familia_id = any(v_familias)
       and not ev.soft_delete
       and to_tsvector('spanish',
             coalesce(ev.datos->>'texto','') || ' ' || coalesce(ev.datos->>'nota','') || ' ' ||
             coalesce(ev.datos->>'mensaje','')) @@ v_q
  ),
  pr as (
    -- Público: sólo lo PUBLICADO. Un producto retirado no se encuentra.
    select 'producto' as tipo, pd.id::text, pd.nombre as titulo,
           nullif(pd.marca, '') as subtitulo, null::timestamptz as fecha,
           '/despensa/producto/' || pd.id as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(pd.nombre,'') || ' ' || coalesce(pd.marca,'') || ' ' || coalesce(pd.descripcion,'')), v_q) as rank
      from productos pd
     where pd.estado = 'publicado'
       and to_tsvector('spanish',
             coalesce(pd.nombre,'') || ' ' || coalesce(pd.marca,'') || ' ' || coalesce(pd.descripcion,'')) @@ v_q
  ),
  ne as (
    -- Los prestadores salen de la VISTA pública, jamás de la tabla: la vista
    -- es la que ya decide qué se muestra y no expone la coordenada exacta.
    select 'prestador' as tipo, vp.id::text, vp.nombre_comercial as titulo,
           nullif(vp.ciudad, '') as subtitulo, null::timestamptz as fecha,
           '/prestador/' || vp.id as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(vp.nombre_comercial,'') || ' ' || coalesce(vp.descripcion,'')), v_q) as rank
      from v_prestadores_publicos vp
     where to_tsvector('spanish',
             coalesce(vp.nombre_comercial,'') || ' ' || coalesce(vp.descripcion,'')) @@ v_q
  ),
  pa as (
    -- ⑦ LOS PAPELES DE LA BÓVEDA (S113 fase 3). Se busca por el título impreso,
    -- el origen y **el nombre de cada analito**: quien busca «hematocrito»
    -- quiere el examen donde aparece, no un papel que se llame así.
    -- *Sin los analitos, la bóveda sería un cajón: se puede guardar y no se
    -- puede encontrar.*
    select 'papel' as tipo, pf.id::text,
           coalesce(pf.titulo, initcap(pf.clase)) as titulo,
           trim(both ' · ' from coalesce(ma.nombre,'') || ' · ' || coalesce(pf.origen,'')) as subtitulo,
           pf.fecha_papel::timestamptz as fecha,
           '/hogar/mascota/' || pf.mascota_id || '/papeles' as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(pf.titulo,'') || ' ' || coalesce(pf.origen,'') || ' ' ||
             coalesce((select string_agg(pv.analito, ' ') from papel_valor pv where pv.papel_id = pf.id), '')), v_q) as rank
      from papeles_familia pf
      join mascotas ma on ma.id = pf.mascota_id
     where to_tsvector('spanish',
             coalesce(pf.titulo,'') || ' ' || coalesce(pf.origen,'') || ' ' ||
             coalesce((select string_agg(pv.analito, ' ') from papel_valor pv where pv.papel_id = pf.id), '')) @@ v_q
  ),
  todo as (
    select * from m union all select * from c union all select * from p
    union all select * from e union all select * from pr union all select * from ne
    union all select * from pa
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'tipo', t.tipo, 'id', t.id, 'titulo', t.titulo,
           'subtitulo', t.subtitulo, 'fecha', t.fecha, 'ruta', t.ruta)
         /* Lo PROPIO primero y después lo público: quien busca «Thor» quiere a
            su perro, no un producto que se llame así. Dentro de cada grupo,
            relevancia; y a igual relevancia, lo más reciente. */
         order by case t.tipo when 'mascota' then 0 when 'cita' then 1
                              when 'pedido' then 2 when 'recuerdo' then 3
                              when 'producto' then 4 else 5 end,
                  t.rank desc, t.fecha desc nulls last), '[]'::jsonb)
    into v_filas
    from (select * from todo order by rank desc limit v_lim) t;

  return jsonb_build_object('ok', true, 'consulta', trim(p_q), 'resultados', v_filas);
end;
$function$


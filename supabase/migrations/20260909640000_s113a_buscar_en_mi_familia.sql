-- ============================================================================
-- S113-A · LOTE 2.0 · A2 — LA MISMA CAJA ENCUENTRA CUALQUIER COSA
--
-- ── EL CENSO ────────────────────────────────────────────────────────────────
-- `pg_proc` por nombre y por cuerpo (`buscar`, `tsvector`): existen
-- `buscar_cliente_por_email`, `buscar_cliente_por_telefono` (los dos del
-- MOSTRADOR del prestador: buscan personas para registrar una atención) y
-- `buscar_refugios` (público, por nombre). **Ninguno busca en el expediente de
-- una familia.** Nada que ensanchar.
--
-- ── POR QUÉ FTS Y NO `ILIKE '%...%'` ────────────────────────────────────────
-- `ILIKE` no puede usar índice con comodín adelante, no entiende plurales y no
-- ordena por relevancia. El FTS en español da las tres cosas de una.
--
-- 🔴 **CERO EXTENSIONES NUEVAS, y es una decisión medida, no una omisión.**
-- Se probó antes de escribir:
--   `to_tsvector('spanish','Bulldog inglés') @@ plainto_tsquery('spanish','ingles')` → **true**
--   `to_tsvector('spanish','Bulldog ingles') @@ plainto_tsquery('spanish','inglés')` → **true**
-- El diccionario español **ya desacentúa de los dos lados**, así que `unaccent`
-- —que estaba disponible— no agrega nada. *Instalar una extensión que no
-- cambia el resultado es superficie gratis.*
-- ⚠️ Su límite, medido y declarado: **la Ñ se conserva** (`'muñec'`), así que
-- buscar «muneca» NO encuentra «Muñeca». Es correcto —la ñ es una letra, no un
-- acento— y se dice para que nadie lo descubra como bug.
--
-- ── LO QUE NUNCA DEVUELVE ───────────────────────────────────────────────────
-- Nada de otra familia. Lo privado se filtra por la familia de quien pregunta;
-- lo público (productos y prestadores) se filtra por estar publicado. *El
-- rojo con dos cuentas está en el cinturón, y sin él esto sería una promesa.*
--
-- 76(g): **NO RIGE.** Lector puro + índices. Cero escritura, cero backfill.
-- ============================================================================

-- ── LOS ÍNDICES ─────────────────────────────────────────────────────────────
-- De EXPRESIÓN y no columnas generadas: no tocan una sola fila existente.
create index if not exists idx_fts_mascotas on public.mascotas
  using gin (to_tsvector('spanish', coalesce(nombre,'') || ' ' || coalesce(raza,'')));

create index if not exists idx_fts_productos on public.productos
  using gin (to_tsvector('spanish', coalesce(nombre,'') || ' ' || coalesce(marca,'') || ' ' || coalesce(descripcion,'')));

create index if not exists idx_fts_prestadores on public.prestadores
  using gin (to_tsvector('spanish', coalesce(nombre_comercial,'') || ' ' || coalesce(descripcion,'')));

create index if not exists idx_fts_pedido_items on public.pedido_items
  using gin (to_tsvector('spanish', coalesce(nombre_producto,'')));

create index if not exists idx_fts_eventos_texto on public.eventos_mascota
  using gin (to_tsvector('spanish', coalesce(datos->>'texto','') || ' ' ||
                                    coalesce(datos->>'nota','') || ' ' ||
                                    coalesce(datos->>'mensaje','')));

-- ── LA PUERTA ───────────────────────────────────────────────────────────────
create or replace function public.buscar_en_mi_familia(
  p_q text, p_limite integer default 20)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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
  todo as (
    select * from m union all select * from c union all select * from p
    union all select * from e union all select * from pr union all select * from ne
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
$function$;

comment on function public.buscar_en_mi_familia is
  'Una caja que encuentra mascotas, citas, pedidos, recuerdos, productos y '
  'prestadores. Lo privado, sólo de la familia de quien pregunta.';

revoke all on function public.buscar_en_mi_familia(text, integer) from public, anon;
grant execute on function public.buscar_en_mi_familia(text, integer) to authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_otro text; v_r jsonb; v_rebotes int := 0; v_n int;
  v_t0 timestamptz; v_ms numeric;
begin
  /* El nombre de la mascota AJENA se lee con el rol de la conexión, ANTES de
     simular la sesión: ya como `authenticated` la RLS lo esconde — que es
     justo la defensa que este cinturón viene a probar. *Un arnés que no puede
     ver el caso no puede medir si el sujeto lo filtra.* */
  select m.nombre into v_otro from mascotas m
   where m.familia_id <> (select familia_id from mascotas where id = 'd2e31d70-54fc-4d47-b425-1617239257eb')
     and m.nombre is not null and length(m.nombre) > 3
   limit 1;
  if v_otro is null then
    raise exception 'CINTURON: no hay mascota de otra familia — el rojo no se puede ejercer';
  end if;

  -- ROJO 1 · sin sesión
  begin perform public.buscar_en_mi_familia('Thor');
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  if v_rebotes <> 1 then raise exception 'CINTURON: sin sesión no rebotó'; end if;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  -- VERDE 1 · encuentra su propia mascota
  v_t0 := clock_timestamp();
  v_r := public.buscar_en_mi_familia('Thor');
  v_ms := extract(epoch from (clock_timestamp() - v_t0)) * 1000;
  if not exists (select 1 from jsonb_array_elements(v_r->'resultados') x
                  where x->>'tipo' = 'mascota' and x->>'titulo' = 'Thor') then
    raise exception 'CINTURON: no encontró a Thor';
  end if;
  raise notice 'CINTURON: «Thor» en % ms · % resultado(s)',
    round(v_ms), jsonb_array_length(v_r->'resultados');

  -- VERDE 2 · el acento no importa en NINGUNA dirección
  if not exists (select 1 from jsonb_array_elements(
                   public.buscar_en_mi_familia('ingles')->'resultados') x
                  where x->>'tipo' = 'mascota') then
    raise exception 'CINTURON: «ingles» sin tilde no encontró «Bulldog inglés»';
  end if;

  -- VERDE 3 · una consulta de basura devuelve vacío, no error
  if jsonb_array_length(public.buscar_en_mi_familia('xqzwkjhg')->'resultados') <> 0 then
    raise exception 'CINTURON: una consulta sin coincidencias debería dar vacío';
  end if;
  if (public.buscar_en_mi_familia('a')->>'ok')::boolean is not true then
    raise exception 'CINTURON: una sola letra debería devolver vacío, no error';
  end if;

  /* 🔴 EL ROJO QUE IMPORTA · CON OTRA CUENTA. *Sin este brazo, «sólo lo de tu
     familia» es una intención escrita en un comentario.* Se busca una mascota
     que existe y NO es de esta familia: tiene que dar cero. */
  if exists (select 1 from jsonb_array_elements(
               public.buscar_en_mi_familia(v_otro)->'resultados') x
              where x->>'tipo' = 'mascota' and x->>'titulo' = v_otro) then
    raise exception 'CINTURON: encontró «%», que es de OTRA familia', v_otro;
  end if;
  raise notice 'CINTURON: «%» (de otra familia) no aparece ✓', v_otro;

  raise notice 'CINTURON OK · 1 rojo de sesión · 1 rojo de familia ajena · 4 verdes';
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else raise; end if;
end $$;

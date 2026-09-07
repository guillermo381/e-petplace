-- ════════════════════════════════════════════════════════════════════════════
-- S113-A · el papel lleva a la bóveda de C, no al perfil
--
-- C ya tiene la pantalla (`(tabs)/hogar/mascota/documentos.tsx`, rama
-- `pista/s113-c-3.0`), y **es la de la bóveda**: lee `papeles_familia` y
-- `papel_valor`. La mascota viaja como QUERY PARAM, no en el path.
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
             /* 🔴 TODOS LOS VALORES DEL JSONB, no tres claves elegidas a mano.
                Medido por D: con `texto`/`nota`/`mensaje` el índice veía **8 de
                520 eventos** — sólo `fin_vida` usa `nota`, y cada tipo guarda lo
                suyo en su propia clave (`vacuna`, `palabras`, `clave_hito`…).
                *Una lista de claves escrita a mano mide la convención del día
                que se escribió, y el tipo número doce no la conoce.*
                Se toman los VALORES y no `datos::text`: con las claves adentro,
                buscar «nota» devolvería todos los eventos que tengan ese campo.
                + el nombre de la vacuna, que vive en su TABLA TIPADA y no en
                `datos` — el rojo puntual de E. */
             coalesce((select string_agg(v.value, ' ')
                         from jsonb_each_text(ev.datos) v), '') || ' ' ||
             coalesce((select string_agg(va.nombre_vacuna, ' ')
                         from evento_vacuna_aplicada va where va.evento_id = ev.id), '')), v_q) as rank
      from eventos_mascota ev
      join mascotas ma on ma.id = ev.mascota_id
     where ma.familia_id = any(v_familias)
       and not ev.soft_delete
       and to_tsvector('spanish',
             /* 🔴 TODOS LOS VALORES DEL JSONB, no tres claves elegidas a mano.
                Medido por D: con `texto`/`nota`/`mensaje` el índice veía **8 de
                520 eventos** — sólo `fin_vida` usa `nota`, y cada tipo guarda lo
                suyo en su propia clave (`vacuna`, `palabras`, `clave_hito`…).
                *Una lista de claves escrita a mano mide la convención del día
                que se escribió, y el tipo número doce no la conoce.*
                Se toman los VALORES y no `datos::text`: con las claves adentro,
                buscar «nota» devolvería todos los eventos que tengan ese campo.
                + el nombre de la vacuna, que vive en su TABLA TIPADA y no en
                `datos` — el rojo puntual de E. */
             coalesce((select string_agg(v.value, ' ')
                         from jsonb_each_text(ev.datos) v), '') || ' ' ||
             coalesce((select string_agg(va.nombre_vacuna, ' ')
                         from evento_vacuna_aplicada va where va.evento_id = ev.id), '')) @@ v_q
  ),
  pr as (
    -- 🔴 SE FILTRA POR LA OFERTA, NO POR `productos.estado` — y la diferencia
    -- no es de literal. Medido: los 470 productos dicen `activo` (jamás
    -- «publicado», así que el filtro viejo devolvía CERO SIEMPRE), y la
    -- publicación de verdad vive en `ofertas.estado='publicada'`.
    -- `productos.estado` dice «existe en el catálogo»; la oferta dice «se puede
    -- comprar». *Un producto activo sin oferta publicada no debe aparecerle a
    -- una familia: no lo puede comprar, y encontrarlo es una promesa falsa.*
    -- Hoy los dos números coinciden (470 de 470) y por eso el defecto no se
    -- veía por ahí; el día que se retire una oferta, dejan de coincidir.
    select 'producto' as tipo, pd.id::text, pd.nombre as titulo,
           nullif(pd.marca, '') as subtitulo, null::timestamptz as fecha,
           '/despensa/producto/' || pd.id as ruta,
           ts_rank(to_tsvector('spanish',
             coalesce(pd.nombre,'') || ' ' || coalesce(pd.marca,'') || ' ' || coalesce(pd.descripcion,'')), v_q) as rank
      from productos pd
     where exists (select 1 from producto_variantes pv
                     join ofertas o on o.variante_id = pv.id
                    where pv.producto_id = pd.id and o.estado = 'publicada')
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
           /* LA RUTA REAL DE LA BÓVEDA, pedida a C y verificada en su rama:
              `/hogar/mascota/documentos`, con la mascota **como query param** y
              no en el path — ese detalle es la diferencia entre llegar y no
              llegar, y por eso se leyó del archivo de C en vez de deducirse del
              nombre.
              Y se verificó que sea la pantalla CORRECTA, no sólo una que
              existe: la de C lee `papeles_familia` y `papel_valor`. *Apuntar a
              la pantalla equivocada es tan malo como apuntar a una que no
              existe, y se ve mejor.*
              Antes decía `/hogar/mascota/<id>/papeles`, que no estaba en
              ninguna rama: yo la inventé y la cazó el gate de rutas de E. */
           '/hogar/mascota/documentos?mascotaId=' || pf.mascota_id as ruta,
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
  /* El orden y el techo se resuelven en el subquery, y el `jsonb_agg` repite el
     mismo orden: *un `limit` afuera del agregado recorta el AGREGADO —una
     fila— y no las filas, que es la forma más silenciosa de no recortar nada.*
     Lo cazó el rojo de E: «clinica» devolvía 161 citas con `limit 20`. */
  select coalesce(jsonb_agg(jsonb_build_object(
           'tipo', t.tipo, 'id', t.id, 'titulo', t.titulo,
           'subtitulo', t.subtitulo, 'fecha', t.fecha, 'ruta', t.ruta)
         order by t.orden), '[]'::jsonb)
    into v_filas
    from (
      select g.*,
             row_number() over (
               order by (g.rn <= 5) desc,
                        case g.tipo when 'mascota' then 0 when 'cita' then 1
                                    when 'pedido' then 2 when 'recuerdo' then 3
                                    when 'papel' then 4 when 'producto' then 5 else 6 end,
                        g.rank desc, g.fecha desc nulls last) as orden
        from (
          /* 🔴 EL MÍNIMO SE GARANTIZA, NO SE IMPONE — corrección de un primer
             intento propio que curaba un rojo rompiendo el otro. Con techo DURO
             de 5 por grupo, «clinica» quedaba bien pero «alimento» devolvía 5
             de los 11 que casan: *un techo por grupo protege al grupo chico y
             castiga al que está solo.*
             Los primeros 5 de cada tipo van ADELANTE —ningún grupo queda
             tapado— y el resto compite por el espacio que sobre. */
          select *, row_number() over (
                      partition by tipo order by rank desc, fecha desc nulls last) as rn
            from todo) g
       order by orden
       limit v_lim
    ) t;

  return jsonb_build_object('ok', true, 'consulta', trim(p_q), 'resultados', v_filas);
end;
$function$


-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 2.2 — EL TABLERO DEL PERFIL, EN UNA SOLA IDA
--
-- El brief pide UN wrapper. La razón es de S94 y está medida: *no hay consultas
-- que optimizar, hay VIAJES que eliminar* — cada pedido paga ~150 ms fijos sin
-- importar cuánto traiga, y este tablero necesita seis datos. Seis lectores
-- serían seis peajes encadenados para pintar una pantalla.
--
-- ── LO QUE **NO** SE ESCRIBE ACÁ, y es la mitad del trabajo ─────────────────
-- `obtener_serie_peso` y `obtener_plan_vacunal` YA EXISTÍAN, medidas en pg_proc
-- antes de escribir una línea. Se REUSAN. *Reemplazar sin leer no duplica
-- trabajo: pierde criterio que alguien ya pagó* — la de peso ya deriva el
-- origen clínico/familia, que es justo lo que el detalle necesita.
--
-- ── LAS TRES LEYES QUE GOBIERNAN LA FORMA DE LA RESPUESTA ──────────────────
-- ① **NULL VIAJA Y SE DICE.** Sin dato no va un cero: va `null`. Un cero se lee
--    como una medición («pesa 0», «cero paseos») y un `null` se lee como lo que
--    es. E mide esto: *sin dato ⇒ sin gráfico.*
-- ② **NINGÚN SCORE.** `MODELO_LOYALTY` §3. Este tablero no devuelve un número
--    de completitud ni nada que se le parezca. El anillo de «Conociéndolo» lo
--    alimenta `obtener_sugerencia_conociendolo`, que ya existe y habla en voz.
-- ③ 🔴 **MEMORIAL APAGA LO QUE MIRA HACIA ADELANTE.** `MODELO_LOYALTY` §8. La
--    historia de un animal que murió se conserva entera —es suya—; lo que se
--    apaga es toda proyección: próxima vacuna, próxima dosis, próxima cita.
--    *Decirle a una familia que a su perro muerto «le toca la antirrábica en
--    agosto» es la clase de daño que ningún typecheck ve.* Van en `null` con
--    `memorial: true` al lado, para que la superficie sepa POR QUÉ están vacíos
--    y no lo lea como «no hay datos».
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.obtener_tablero_mascota(p_mascota_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_memorial   boolean;
  v_estado_vida text;
  v_especie    text;
  v_peso       jsonb;
  v_vacunas    jsonb;
  v_antipar    jsonb;
  v_medicacion jsonb;
  v_citas      jsonb;
  v_actividad  jsonb;
  v_hoy        date := (now() at time zone 'America/Guayaquil')::date;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  -- La MISMA puerta que todo el expediente: no se inventa un gate nuevo.
  if not public.user_tiene_acceso_a_mascota(p_mascota_id) then
    raise exception 'sin_acceso' using errcode = '42501';
  end if;

  -- 🔴 SE PREGUNTA POR `activa`, NO POR EL VALOR MUERTO — y la primera versión
  -- de esta función comparaba contra `'memorial'`, **un valor que no existe**:
  -- el CHECK dice `activa | perdida | fallecida`. Con ese literal, Sombra
  -- devolvía el tablero entero con `memorial:false`, y nada fallaba.
  -- Se adivinó un vocabulario en vez de medirlo, y lo cazó el rojo del brief.
  --
  -- La forma correcta es la que la casa YA usa en sus triggers de memorial
  -- (`estado_vida IS DISTINCT FROM 'activa'`): **lista blanca**. Así el día que
  -- aparezca un cuarto estado el tablero se APAGA por defecto en vez de
  -- encenderse por olvido. *Con lista negra, un estado nuevo hereda el
  -- comportamiento de una mascota viva sin que nadie lo decida.*
  select (m.estado_vida is distinct from 'activa'), m.estado_vida, m.especie
    into v_memorial, v_estado_vida, v_especie
    from mascotas m where m.id = p_mascota_id;
  if not found then
    return jsonb_build_object('ok', false, 'codigo', 'mascota_no_existe');
  end if;

  -- 🔴 **MEMORIAL NO TIENE TABLERO** (firma del founder, 6-sep · LOYALTY §8).
  -- Y la primera versión de esta función se equivocó acá: devolvía el tablero
  -- con las proyecciones apagadas una por una. *Apagar seis campos deja seis
  -- lugares donde el próximo que agregue un séptimo se olvida.* La forma que
  -- no se puede olvidar es que no haya tablero: `data: null`, y la superficie
  -- lee la HISTORIA, que es lo que le queda a una familia.
  if coalesce(v_memorial, false) then
    -- Se devuelve el estado REAL, no un booleano: la superficie le habla
    -- distinto a una familia que perdió a su animal que a una que lo está
    -- buscando. *Un `memorial:true` para los dos casos obliga a la pantalla a
    -- elegir una de las dos voces para las dos situaciones.*
    return jsonb_build_object('ok', true, 'memorial', true,
                              'estado_vida', v_estado_vida, 'tablero', null);
  end if;

  -- ① PESO · último + tendencia + serie para el sparkline.
  --    La tendencia se DERIVA de dos mediciones; con una sola es `null`, jamás
  --    'estable': *una tendencia inventada sobre un punto es una línea recta
  --    que nadie midió.*
  with s as (
    select fecha, peso_kg, metodo, origen,
           row_number() over (order by fecha desc) as n
      from public.obtener_serie_peso(p_mascota_id, 12)
  )
  select case when not exists (select 1 from s) then null else jsonb_build_object(
      'actual',  (select peso_kg from s where n = 1),
      'fecha',   (select fecha   from s where n = 1),
      'fuente',  (select origen  from s where n = 1),
      -- La serie del sparkline: los 12 últimos, en orden cronológico, cada
      -- punto con SU fuente — el detalle pinta distinto lo clínico y lo de casa.
      'serie',   (select coalesce(jsonb_agg(jsonb_build_object(
                    'fecha', fecha, 'kg', peso_kg, 'fuente', origen) order by fecha), '[]'::jsonb)
                    from s)
    ) end
    into v_peso;

  -- ② VACUNAS · `n de N` del plan. Los CINCO estados salen del cuerpo de
  --    `obtener_plan_vacunal`, medidos y no supuestos: al_dia · vencida ·
  --    nunca_aplicada · aun_no_corresponde · sin_fecha. *Contar sólo dos habría
  --    hecho que «n de N» no cerrara nunca.*
  with p as (select * from public.obtener_plan_vacunal(p_mascota_id, v_hoy, 365))
  select case when not exists (select 1 from p) then null else jsonb_build_object(
      'aplicadas_del_plan', (select count(*) from p where estado = 'al_dia'),
      'total_plan',         (select count(*) from p),
      'vencidas',           (select count(*) from p where estado = 'vencida'),
      'nunca_aplicada',     (select count(*) from p where estado = 'nunca_aplicada'),
      'proxima',            (select jsonb_build_object(
                                'nombre', nombre, 'fecha', proxima, 'estado', estado,
                                -- la superficie tiene que poder decir «estimada»:
                                -- una fecha derivada no es una que alguien escribió.
                                'derivada', proxima_es_derivada)
                               from p where proxima is not null
                              order by proxima limit 1)
    ) end
    into v_vacunas;

  -- ③ ANTIPARASITARIO · chips por plaga + próxima.
  --    `plagas` es un array: se despliega para que la superficie dibuje un chip
  --    por plaga real, jamás una etiqueta genérica.
  -- 🔴 NO HAY CATÁLOGO DE PLAGAS — medido: cero tablas `%plaga%`, y la única
  -- plaga registrada en toda la base es 'pulgas'. El conjunto que SÍ existe es
  -- `tipo_desparasitacion` ∈ {interna, externa, mixta}, con su CHECK.
  -- *Inventar un catálogo para poder decir «sin_registro» sería fabricar la
  -- vara con la que uno mismo se mide.* Así `sin_registro` es un hecho: nunca
  -- se registró desparasitación de ese tipo. `mixta` cuenta para los dos.
  with tipos as (select unnest(array['interna','externa']) as tipo),
  ult as (
    select tp.tipo,
           max(d.fecha_aplicada) as ultima,
           min(d.fecha_proxima) filter (where d.fecha_proxima >= v_hoy) as proxima,
           max(d.fecha_proxima) as proxima_cualquiera
      from tipos tp
      left join evento_desparasitacion_aplicada d
        on d.mascota_id = p_mascota_id
       and (d.tipo_desparasitacion = tp.tipo or d.tipo_desparasitacion = 'mixta')
     group by tp.tipo
  )
  select jsonb_build_object(
      'plagas', (select jsonb_agg(jsonb_build_object(
                    'plaga', tipo,
                    'estado', case
                      when ultima is null then 'sin_registro'
                      when proxima_cualquiera is null then 'sin_registro'
                      when proxima_cualquiera < v_hoy then 'vencida'
                      else 'al_dia' end,
                    'ultima', ultima) order by tipo) from ult),
      -- las plagas concretas que alguien escribió, como detalle: son texto
      -- libre y no un vocabulario, así que viajan tal cual llegaron.
      'registradas', (select coalesce(jsonb_agg(distinct pl), '[]'::jsonb)
                        from evento_desparasitacion_aplicada d,
                             lateral unnest(coalesce(d.plagas, array[]::text[])) as pl
                       where d.mascota_id = p_mascota_id),
      'proxima', (select min(proxima) from ult)
    )
    into v_antipar;

  -- ④ MEDICACIÓN · activas + próxima dosis.
  --    Activa = prescrita y su ventana de días todavía cubre hoy. Sin
  --    `duracion_dias` NO se asume que sigue: se cuenta aparte y SE DICE.
  select case when not exists (
      select 1 from evento_medicacion_prescrita where mascota_id = p_mascota_id
    ) then null else jsonb_build_object(
      'activas', (select count(*) from evento_medicacion_prescrita r
                   where r.mascota_id = p_mascota_id
                     and r.duracion_dias is not null
                     and (r.created_at::date + r.duracion_dias) >= v_hoy),
      'sin_duracion', (select count(*) from evento_medicacion_prescrita r
                        where r.mascota_id = p_mascota_id and r.duracion_dias is null),
      'ultima_administrada', (select max(fecha_administracion)
                                from evento_medicacion_administrada
                               where mascota_id = p_mascota_id)
    ) end
    into v_medicacion;

  -- ⑤ CITAS · la próxima y cuántas. Sólo firmes (la verdad firme de S51):
  --    una reserva sin pagar no es una cita que va a ocurrir.
  select jsonb_build_object(
      'pasadas', (select count(*) from evento_cita_servicio
                   where mascota_id = p_mascota_id and fecha < v_hoy
                     and estado in ('confirmada','completada')),
      'futuras', (select count(*) from evento_cita_servicio
                   where mascota_id = p_mascota_id and fecha >= v_hoy
                     and estado in ('confirmada','pendiente')),
      'proxima', (select jsonb_build_object(
                     'fecha', c.fecha, 'hora', c.hora, 'servicio', c.tipo_servicio,
                     'prestador', pr.nombre_comercial, 'id', c.id)
                    from evento_cita_servicio c
                    left join prestadores pr on pr.id = c.prestador_id
                   where c.mascota_id = p_mascota_id and c.fecha >= v_hoy
                     and c.estado in ('confirmada','pendiente')
                   order by c.fecha, c.hora limit 1)
    )
    into v_citas;

  -- ⑥ ACTIVIDAD · siete números, uno por día, más los minutos.
  --    Se cuentan atenciones CERRADAS: una abierta todavía no es un paseo que
  --    ocurrió. Los minutos salen de `iniciada_en`→`cerrada_en`, medidos, jamás
  --    de la duración contratada — *lo contratado es una promesa; lo caminado
  --    es un hecho.*
  select case when not exists (
      select 1 from evento_atencion a
       where a.mascota_id = p_mascota_id and a.cerrada_en is not null
    ) then null else jsonb_build_object(
      'paseos_semana', (select jsonb_agg(coalesce(c.n, 0) order by d.dia)
                          from generate_series(v_hoy - 6, v_hoy, interval '1 day') as d(dia)
                          left join (
                            select (a.cerrada_en at time zone 'America/Guayaquil')::date as dia,
                                   count(*) as n
                              from evento_atencion a
                             where a.mascota_id = p_mascota_id and a.cerrada_en is not null
                             group by 1
                          ) c on c.dia = d.dia::date),
      'minutos', (select coalesce(sum(extract(epoch from (a.cerrada_en - a.iniciada_en)) / 60)::int, 0)
                    from evento_atencion a
                   where a.mascota_id = p_mascota_id and a.cerrada_en is not null
                     and a.iniciada_en is not null
                     and (a.cerrada_en at time zone 'America/Guayaquil')::date > v_hoy - 7),
      'total_historico', (select count(*) from evento_atencion a
                           where a.mascota_id = p_mascota_id and a.cerrada_en is not null)
    ) end
    into v_actividad;

  return jsonb_build_object(
    'ok', true,
    'memorial', false,
    'especie', v_especie,
    'peso', v_peso,
    'vacunas', v_vacunas,
    'antiparasitario', v_antipar,
    'medicacion', v_medicacion,
    'citas', v_citas,
    'actividad', v_actividad
  );
end;
$$;

-- L-140: ninguna función nace alcanzable por `anon` ni por PUBLIC.
revoke all on function public.obtener_tablero_mascota(uuid) from public, anon;
grant execute on function public.obtener_tablero_mascota(uuid) to authenticated;

comment on function public.obtener_tablero_mascota(uuid) is
  'S113-A 2.2 · el tablero del perfil en UNA ida. Reusa obtener_serie_peso y '
  'obtener_plan_vacunal. NULL viaja y se dice; memorial apaga toda proyección '
  '(LOYALTY §8); ningún score en la respuesta (LOYALTY §3).';

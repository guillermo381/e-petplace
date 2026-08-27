-- ============================================================================
-- AUDITORÍA DEL REGISTRO DE VIDEOLLAMADA — S106-D, tanda 3
--
-- Para correr DESPUÉS del gate del recorrido completo:
--   npx supabase --experimental db query --linked --file scripts/auditar-hechos-videollamada.sql
--
-- Devuelve UNA FILA POR CHEQUEO, con `ok` en true/false. **Lo que hay que
-- mirar es la columna `ok`: si alguna dice false, ahí está el descuadre.**
--
-- 🔴 POR QUÉ ES UN SOLO `SELECT` Y NO TRES — medido el 26-ago:
-- la primera versión tenía tres consultas separadas y **el CLI devolvió sólo
-- el resultado de la ÚLTIMA**. Las otras dos corrieron y su salida se
-- descartó **en silencio** ⇒ *un instrumento que parece auditar tres cosas y
-- reporta una, y cuyo verde se lee como si las tres hubieran pasado.*
-- Es `L-427`: la señal venía del CLI, no de mis consultas.
-- ⇒ **Todo va en un resultset, o no se ve.**
-- ============================================================================

with hechos as (
  select * from public.videollamada_hechos
),
por_sala as (
  select
    h.sala,
    h.cita_id,
    count(*)                                                       as n,
    count(*) filter (where h.evento = 'participant_joined')        as joins,
    count(*) filter (where h.evento = 'participant_left')          as lefts,
    count(distinct h.participante_identidad)
      filter (where h.participante_identidad is not null)          as personas,
    bool_or(h.evento = 'room_started')                             as start_ok,
    bool_or(h.evento = 'room_finished')                            as finish_ok,
    max(h.ocurrido_en)                                             as ultimo
  from hechos h
  group by h.sala, h.cita_id
),
-- ¿entró alguien que NO es el dueño ni el profesional de esa cita?
intrusos as (
  select p.sala, count(*) as cuantos
  from (
    select distinct h.sala, h.cita_id, h.participante_identidad::uuid as uid
    from hechos h
    where h.cita_id is not null and h.participante_identidad is not null
  ) p
  join evento_cita_servicio c on c.id = p.cita_id
  left join prestador_empleados pe on pe.id = c.empleado_id
  where p.uid <> c.user_id
    and (pe.user_id is null or p.uid <> pe.user_id)
  group by p.sala
),
-- ¿la sala apunta a una cita de telemedicina de verdad?
modalidad as (
  select s.sala, c.modalidad, (c.fecha::text || ' ' || c.hora::text) as cuando
  from por_sala s join evento_cita_servicio c on c.id = s.cita_id
),
-- contra-cuenta del estimador, en SQL
tramos as (
  select h.sala, h.participante_identidad as uid, h.evento, h.ocurrido_en,
         lead(h.ocurrido_en) over (
           partition by h.sala, h.participante_identidad order by h.ocurrido_en
         ) as sig
  from hechos h
  where h.evento in ('participant_joined', 'participant_left')
    and h.ocurrido_en >= date_trunc('month', now())
),
consumo as (
  select
    round(sum(extract(epoch from (sig - ocurrido_en))) / 60.0, 1) as part_min,
    round((sum(extract(epoch from (sig - ocurrido_en))) * 1700000 / 8 / 1e9)::numeric, 3) as gb
  from tramos where evento = 'participant_joined' and sig is not null
)

-- ① una fila por sala, con todos sus chequeos
select
  'sala' as chequeo,
  s.sala as sujeto,
  format('hechos=%s joins=%s lefts=%s personas=%s %s',
         s.n, s.joins, s.lefts, s.personas,
         coalesce(m.modalidad, '(sin cita)')) as detalle,
  (s.joins = s.lefts                            -- nadie quedó dentro
   and s.start_ok and s.finish_ok               -- abrió y cerró
   and coalesce(i.cuantos, 0) = 0               -- 🔴 sin intrusos
   and (s.cita_id is null                       -- el cable no tiene cita: ok
        or (s.personas = 2 and m.modalidad = 'telemedicina'))
  ) as ok,
  s.ultimo::text as ultimo
from por_sala s
left join intrusos  i on i.sala = s.sala
left join modalidad m on m.sala = s.sala

union all

-- ② la contra-cuenta: se compara a mano contra lo que devuelve `video-consumo`
select
  'consumo_sql',
  'mes en curso',
  format('part_min=%s gb=%s  ← comparar con video-consumo', c.part_min, c.gb),
  true,
  now()::text
from consumo c

order by 1, 5 desc;

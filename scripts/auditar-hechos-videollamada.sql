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
        or (m.modalidad = 'telemedicina'
            /* 🔴 CORREGIDO 27-ago — este criterio EXIGÍA `personas = 2` y
               estaba MAL, con una firma en contra:
               `LETRA_TELEMEDICINA` §4 dice que la consulta se cobra **aunque
               el dueño no asista** — «si el veterinario entra y determina que
               el caso necesita atención presencial, eso ES el servicio
               prestado». ⇒ **una sala con UNA sola persona es un caso
               LEGÍTIMO y firmado**, no un descuadre.
               *Mi chequeo marcaba en rojo justo el caso que la letra
               protege* — y lo habría reportado como defecto del registro.
               Lo que SÍ es rojo: 0 personas (nadie entró y sin embargo hubo
               sala) o 3+ (alguien que no es ninguno de los dos). */
            and s.personas between 1 and 2))
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

union all

-- ═══ ③ EL CUADRO CONGELADO ════════════════════════════════════════════════
-- 🔴 Lo que prueba que la marca SIRVE no es que exista: es que apunte a la
-- cita correcta. **Una marca que apunta a la cita equivocada es peor que
-- ninguna** — una foto en el expediente del animal que no es.
select
  'cuadro',
  a.id::text,
  format('origen=%s cita=%s mascota_coincide=%s',
         a.origen_captura,
         coalesce(c.id::text, '(sin cita)'),
         (a.mascota_id = c.mascota_id)),
  -- ok ⟺ tiene su marca Y cuelga de una teleconsulta Y es la mascota de ESA cita
  (a.origen_captura = 'videoconsulta'
   and c.id is not null
   and c.modalidad = 'telemedicina'
   and a.mascota_id = c.mascota_id),
  a.created_at::text
from evento_archivo_adjunto a
left join evento_cita_servicio c on c.evento_id = a.evento_id
where a.origen_captura = 'videoconsulta'

union all

-- ═══ ④ LA ASIGNACIÓN — ¿nacen del TITULAR? ════════════════════════════════
-- Mismo criterio que se le aplicó a los hechos de sala: **que haya un
-- asignado no prueba nada; que sea el titular, sí.**
--
-- Medido el 27-ago: `rol='dueño'` son 10 filas y **las 10** coinciden con
-- `prestadores.user_id`; los 21 `empleado`, ninguna. Los dos criterios son
-- consistentes hoy ⇒ **se exigen LOS DOS**, para que el día que divergan el
-- chequeo lo cace en vez de elegir uno y no enterarse.
select
  'asignacion',
  c.id::text,
  format('empleado=%s rol=%s es_titular_por_rol=%s es_titular_por_user_id=%s',
         coalesce(pe.id::text, '(SIN ASIGNAR)'),
         coalesce(pe.rol, '—'),
         (pe.rol = 'dueño'),
         (pe.user_id = p.user_id)),
  (pe.id is not null and pe.rol = 'dueño' and pe.user_id = p.user_id),
  (c.fecha::text || ' ' || c.hora::text)
from evento_cita_servicio c
left join prestador_empleados pe on pe.id = c.empleado_id
left join prestadores p        on p.id  = c.prestador_id
where c.modalidad = 'telemedicina'
  and c.created_at >= now() - interval '2 days'   -- sólo las nuevas

order by 1, 5 desc;

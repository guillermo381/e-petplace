/* ══ S113-A · LOTE 1.0 · A5 — EL PLAN VACUNAL, **ENSANCHADO Y NO REINVENTADO** ═
 *
 * 🔴 ERROR DE MÉTODO DECLARADO, Y ES EL MISMO DEL LOTE 0.
 * El brief pedía «construí obtenerPlanVacunal». **Ya existía entero desde
 * S82 r7** — motor (`obtener_plan_vacunal(uuid)`, DEFINER) y wrapper
 * (`salud.ts:196`, exportado). Escribí una segunda función antes de
 * preguntárselo a `pg_proc`, y el resultado no fue una duplicación inocente:
 * **dejó ambigua toda llamada de un argumento** —`is not unique`— que es
 * exactamente lo que el wrapper vivo hace. *La rompí y la arreglé en la misma
 * hora; si hubiera pasado a un candidato, el plan vacunal dejaba de responder
 * en las dos apps.* Mi duplicado quedó retirado y su número, revertido en el
 * ledger. **Una cosa, una puerta.**
 *
 * ── LO QUE LA VIEJA YA HACÍA MEJOR QUE MI VERSIÓN, y por eso se conserva ────
 * · gate por `user_tiene_acceso_a_mascota` — el helper clínico de la casa,
 *   no una regla nueva (yo había usado la RLS de `mascotas`, que es MÁS
 *   angosta y habría escondido el plan a un familiar legítimo);
 * · **la capturada GANA a la derivada**: si el carnet trae `fecha_proxima`,
 *   ésa manda, y `proxima_es_derivada` le dice a la superficie cuál está
 *   viendo (yo la ignoraba y derivaba siempre — habría pisado lo que el
 *   veterinario escribió con una cuenta nuestra);
 * · `aun_no_corresponde` por `edad_inicio_meses`: *lo que todavía no toca no
 *   es una falta*, y yo no lo contemplaba.
 *
 * ── LO QUE SÍ FALTABA, y es lo único que esta migración agrega ──────────────
 * ① `exigida_guarderia` — la columna existe en `cat_plan_vacunal` y la función
 *    no la devolvía: dato que ya viaja y se tiraba en el mapeo.
 * ② `vence_en` — estado nuevo. ⚠️ **Su umbral no tiene fuente en la casa:**
 *    30 días es una ELECCIÓN, va como parámetro y se declara como elección.
 *    *Un número inventado que se presenta como derivado es peor que uno
 *    inventado que se admite.*
 * ③ `p_hoy` — el día de la FAMILIA. Medido, 9-sep: **la casa no tiene zona
 *    horaria de la familia en ningún lado** (`hoy_local()` es Guayaquil fijo;
 *    `zona_horaria` existe en cinco tablas y las cinco son del negocio;
 *    `country_config`, `profiles` y `user_preferencias` no la tienen). ⇒ el
 *    día entra por parámetro desde el aparato, que sí lo sabe, y sin parámetro
 *    cae a `hoy_local()` **declarándolo**. Es seguro porque esta función NO
 *    ESCRIBE NADA: adelantar el reloj sólo cambia lo que uno ve.
 * ④ `aplicadas_sin_clasificar` — medido: `vacuna_codigo` está lleno en **22 de
 *    32** filas. Las otras diez no se pueden atar al plan, y **no se adivinan
 *    por nombre** (los reales son comerciales: «Nobivac DHPPi», «Canigen LR»).
 *    Sin este número, una vacuna que la familia SÍ puso se leería como
 *    «nunca_aplicada». *El número la rescata del silencio.*
 *
 * ── VEDA 76(g): NO RIGE. Función de solo lectura, cero filas tocadas ────────
 * Y sigue en pie lo que ya regía: `proxima` es un CÁLCULO cuando es derivada
 * — **jamás se escribe en `fecha_proxima`**.
 *
 * ⚠️ L-119: se DROPEA la firma de un argumento y se recrea con defaults, para
 * que `obtener_plan_vacunal(p_mascota_id)` siga resolviendo a UNA sola función
 * y el wrapper vivo no cambie. Al cierre se verifica `sobrecargas = 1`.
 */

drop function if exists public.obtener_plan_vacunal(uuid);

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
  with aplicadas as (
    -- la ÚLTIMA aplicación por vacuna del catálogo (el puente ②)
    select distinct on (e.vacuna_codigo)
           e.vacuna_codigo, e.fecha_aplicada, e.fecha_proxima
      from evento_vacuna_aplicada e
     where e.mascota_id = p_mascota_id and e.vacuna_codigo is not null
     order by e.vacuna_codigo, e.fecha_aplicada desc nulls last
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

comment on function public.obtener_plan_vacunal(uuid, date, int) is
  'S82 r7, ENSANCHADA en S113-A. `proxima` es CÁLCULO cuando proxima_es_derivada '
  '= true: jamás se escribe en fecha_proxima. `p_hoy` es el día de la familia — '
  'la casa no tiene su zona horaria (medido) y sin parámetro cae a hoy_local(). '
  '`aplicadas_sin_clasificar` cuenta las vacunas sin vacuna_codigo: no se '
  'adivinan por nombre.';

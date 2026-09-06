-- ============================================================================
-- S113-A · lote 2 — EL PESO QUE NEXO DICE ES EL MÁS RECIENTE, CON SU FUENTE
--
-- El contexto traía sólo `peso_clinico_kg`. Pero el perfil tiene DOS pesos con
-- historias distintas: el **clínico** (lo pesó un veterinario) y el
-- **reportado** (lo pesó la familia en casa, con su método). Quedarse con el
-- clínico hace que Nexo diga «no tengo su peso» sobre un animal que la familia
-- pesó ayer — *un dato que existe y desaparece de la conversación sin que
-- nadie lo note.*
--
-- 🔴 **Y GANA EL MÁS RECIENTE, NO EL MÁS CONFIABLE.** Un peso de báscula de
-- clínica de hace un año dice menos sobre el animal de hoy que uno de casa de
-- la semana pasada. *Preferir la fuente sobre la fecha es preferir la
-- ceremonia sobre el hecho.*
--
-- ⚠️ Por eso viaja **`peso_fuente`**: quien redacta tiene que poder decir «lo
-- pesaron en la clínica» o «lo pesaste en casa». Sin la fuente, las dos frases
-- salen iguales y una de las dos miente por omisión.
--
-- 76(g): **NO RIGE.** Reemplazo de un lector.
-- ============================================================================

/* La que ya existe pasa a ser la BASE, con su cuerpo intacto: se renombra en
   vez de copiarse. *Copiar un cuerpo de 130 líneas para agregarle un campo
   deja dos versiones que divergen en la próxima corrección.* */
do $$
begin
  if to_regprocedure('public._contexto_coach_base(uuid,uuid)') is null then
    alter function public.obtener_contexto_coach(uuid, uuid) rename to _contexto_coach_base;
  end if;
end $$;

revoke all on function public._contexto_coach_base(uuid, uuid) from public, anon, authenticated;

create or replace function public.obtener_contexto_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_base jsonb; v_p record; v_kg numeric; v_fecha timestamptz; v_fuente text;
begin
  -- la puerta, el contexto y la identidad prestada: todo eso ya está resuelto
  v_base := public._contexto_coach_base(p_mascota_id, p_user_id);

  select peso_clinico_kg, peso_clinico_medido_en,
         peso_reportado_kg, peso_reportado_medido_en, peso_reportado_metodo
    into v_p from mascota_perfil_vigente where mascota_id = p_mascota_id;

  /* El más reciente. `nulls last` no alcanza: hay que comparar los dos y que
     cualquiera pueda faltar. */
  if v_p.peso_reportado_kg is not null
     and (v_p.peso_clinico_kg is null
          or coalesce(v_p.peso_reportado_medido_en, '-infinity'::timestamptz)
             > coalesce(v_p.peso_clinico_medido_en, '-infinity'::timestamptz)) then
    v_kg := v_p.peso_reportado_kg; v_fecha := v_p.peso_reportado_medido_en;
    v_fuente := coalesce('en casa · ' || v_p.peso_reportado_metodo, 'en casa');
  else
    v_kg := v_p.peso_clinico_kg; v_fecha := v_p.peso_clinico_medido_en;
    v_fuente := case when v_kg is not null then 'clínico' end;
  end if;

  return v_base
    || jsonb_build_object('peso_kg', v_kg, 'peso_fecha', v_fecha, 'peso_fuente', v_fuente)
    || jsonb_build_object('salud', (v_base->'salud') || jsonb_build_object(
         'peso_kg', v_kg, 'peso_fecha', v_fecha, 'peso_fuente', v_fuente));
end $function$;

revoke all on function public.obtener_contexto_coach(uuid, uuid) from public, anon;
grant execute on function public.obtener_contexto_coach(uuid, uuid) to authenticated, service_role;

do $$
declare v jsonb;
begin
  v := public.obtener_contexto_coach('d2e31d70-54fc-4d47-b425-1617239257eb',
                                     'dd024680-3d1c-4465-b38b-dedab45da037');
  if v->>'nombre' <> 'Thor' then raise exception 'CINTURON: el contexto se rompió'; end if;
  if (v->>'peso_kg') is null then raise exception 'CINTURON: Thor tiene peso y no llegó'; end if;
  if (v->>'peso_fuente') is null then
    raise exception 'CINTURON: hay peso y no dice de dónde salió — la frase saldría igual para los dos casos';
  end if;
  raise notice 'CINTURON OK · peso % kg · fuente % · fecha %',
    v->>'peso_kg', v->>'peso_fuente', left(coalesce(v->>'peso_fecha','—'),10);
end $$;

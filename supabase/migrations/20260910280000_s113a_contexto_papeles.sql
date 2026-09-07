-- ════════════════════════════════════════════════════════════════════════════
-- S113-A · Nexo ve los papeles de la bóveda
--
-- Medido antes de escribir: el contexto NO los tenía (`ilike '%papel%'` → false
-- sobre el cuerpo vivo). Los valores confirmados de un examen son lo que Nexo
-- tiene que poder citar — con su fecha y su referencia, y **sin interpretar**.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_contexto_coach(p_mascota_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  /* ── LOS PAPELES DE LA BÓVEDA (S113 · fase 3) ─────────────────────────────
     Los valores de un examen confirmado son **exactamente lo que Nexo tiene
     que poder citar**: con su fecha, su unidad y su referencia impresa.
     *Sin esto, Nexo habla de la salud de una mascota sin ver el examen que la
     familia trajo, y contesta «no tengo eso cargado» sobre algo que SÍ está.*

     🔴 **SÓLO LOS CONFIRMADOS.** Un papel `por_confirmar` es lo que el
     extractor propuso y nadie miró todavía; que Nexo lo cite sería darle voz
     de dato a una lectura de OCR sin revisar.

     🔴 **Y VIAJAN SIN INTERPRETAR, que es lo que el muro de D vigila:** valor,
     unidad y referencia TAL COMO ESTÁN, más el `literal` del papel. Cero
     «alto», cero «bajo», cero comparación contra el rango — *si el contexto
     trajera un juicio, el muro no podría evitar que Nexo lo repita: ya vendría
     dicho desde acá.* Interpretar es del veterinario; citar es de Nexo. */
  return v_base
    || jsonb_build_object('peso_kg', v_kg, 'peso_fecha', v_fecha, 'peso_fuente', v_fuente)
    || jsonb_build_object('papeles', coalesce((
         select jsonb_agg(jsonb_build_object(
                  'titulo', pf.titulo, 'clase', pf.clase,
                  'fecha', pf.fecha_papel, 'origen', pf.origen,
                  'valores', coalesce((
                    select jsonb_agg(jsonb_build_object(
                             'analito', pv.analito, 'valor', pv.valor,
                             'unidad', pv.unidad,
                             /* la referencia como vino: partida si se pudo,
                                cruda si no, y `null` si el papel no la traía */
                             'referencia', coalesce(pv.referencia,
                               case when pv.ref_min is not null or pv.ref_max is not null
                                    then concat_ws(' - ', pv.ref_min, pv.ref_max) end),
                             'literal', pv.literal)
                           order by pv.orden)
                      from papel_valor pv where pv.papel_id = pf.id), '[]'::jsonb))
                order by pf.fecha_papel desc nulls last)
           from papeles_familia pf
          where pf.mascota_id = p_mascota_id
            and pf.estado = 'confirmado'), '[]'::jsonb))
    || jsonb_build_object('salud', (v_base->'salud') || jsonb_build_object(
         'peso_kg', v_kg, 'peso_fecha', v_fecha, 'peso_fuente', v_fuente));
end $function$;


comment on function public.obtener_contexto_coach(uuid, uuid) is
  'S113-A · el contexto de Nexo. Incluye los papeles CONFIRMADOS de la bóveda '
  'con sus valores tal como fueron transcritos: valor, unidad, referencia y el '
  'literal del papel. NUNCA un juicio (alto/bajo/normal): si el contexto '
  'trajera uno, el muro clínico no podría evitar que Nexo lo repita.';

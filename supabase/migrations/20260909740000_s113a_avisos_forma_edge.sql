-- ============================================================================
-- S113-A · lote 2.1 — LOS AVISOS SALEN CON LA FORMA QUE LA EDGE NOMBRA
--
-- `coach-parte` (D) hace `Array.isArray(filas)` y filtra por `a.titulo`. Mi
-- lector devolvía `{ok, avisos:[{tipo, detalle}]}`: ni array, ni `titulo`.
-- Resultado medido: **HTTP 204 siempre**, con seis avisos reales en la tabla.
--
-- 🔴 Y ese modo de falla es el peor de todos: **el silencio de esta pieza es
-- indistinguible de «hoy no hay nada que decir»**. No hay error, no hay log,
-- no hay pantalla rota — hay un Nexo que simplemente no avisa nunca. *Un
-- desajuste de contrato que produce silencio no se descubre: se hereda.*
--
-- La firma de DOS argumentos tiene UN solo consumidor (esta edge), así que se
-- le da su forma exacta. La de cero argumentos —la que usa la app por la
-- puerta única— **no se toca**.
--
-- ── EL TÍTULO SE ESCRIBE ACÁ, y es una decisión ─────────────────────────────
-- Podría armarlo la edge, pero entonces la frase de un aviso viviría en el
-- borde y cada consumidor nuevo escribiría la suya. *El dato y su voz mínima
-- salen juntos del mismo lugar; adjetivarla es del modelo.*
--
-- 76(g): **NO RIGE.**
-- ============================================================================

create or replace function public.obtener_avisos_coach(p_mascota_id uuid, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid; v jsonb;
begin
  v_uid := public._coach_puerta(p_mascota_id, p_user_id);
  select coalesce(jsonb_agg(x order by x->>'orden'), '[]'::jsonb) into v from (
    select jsonb_build_object(
      'tipo', a.tipo,
      'titulo', case a.tipo
        when 'vacuna_vence' then
          'La vacuna ' || coalesce(a.detalle->>'vacuna', 'pendiente') ||
          case when a.detalle->>'estado' = 'vencida' then ' está vencida' else ' vence pronto' end
        when 'antiparasitario_vence' then
          'Toca el antiparasitario' ||
          coalesce(' (' || (a.detalle->>'producto') || ')', '')
        when 'cita_manana' then
          'Mañana tiene ' || coalesce(a.detalle->>'servicio', 'una cita') ||
          coalesce(' a las ' || substring(a.detalle->>'hora' from 1 for 5), '')
        else a.tipo end,
      'detalle', a.detalle->>'proxima',
      /* `dias` en NEGATIVO cuando ya venció, y **NULL cuando no se sabe**: un
         cero diría «vence hoy», que es un hecho distinto de «no tengo la
         fecha». */
      'dias', case when (a.detalle->>'proxima') is not null
                   then (a.detalle->>'proxima')::date - public.hoy_local() end,
      'severidad', case
        when a.detalle->>'estado' = 'vencida' then 'vencido'
        when a.tipo = 'cita_manana' then 'info'
        else 'pronto' end,
      'orden', case a.tipo when 'vacuna_vence' then '1' when 'antiparasitario_vence' then '2' else '3' end
    ) as x
    from avisos_coach a
   where a.mascota_id = p_mascota_id and a.leido_en is null
     and a.fecha > public.hoy_local() - 7
  ) t;
  return v;   -- ARRAY plano: es lo que `Array.isArray(filas)` necesita
end $function$;

revoke all on function public.obtener_avisos_coach(uuid, uuid) from public, anon;
grant execute on function public.obtener_avisos_coach(uuid, uuid) to authenticated, service_role;

do $$
declare v jsonb; v_thor uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
begin
  v := public.obtener_avisos_coach(v_thor, 'dd024680-3d1c-4465-b38b-dedab45da037');
  if jsonb_typeof(v) <> 'array' then
    raise exception 'CINTURON: la edge hace Array.isArray y esto es %', jsonb_typeof(v);
  end if;
  if jsonb_array_length(v) < 2 then
    raise exception 'CINTURON: Thor tiene 2 avisos vivos y llegaron %', jsonb_array_length(v);
  end if;
  if coalesce(v->0->>'titulo','') = '' then
    raise exception 'CINTURON: sin `titulo` la edge descarta el aviso en silencio';
  end if;
  -- la de CERO argumentos, la de la app, sigue con su forma
  raise notice 'CINTURON OK · array de % · primer título: %',
    jsonb_array_length(v), v->0->>'titulo';
end $$;

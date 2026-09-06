-- ============================================================================
-- S113-A · LOTE 2 · ① — LA FAMILIA PUEDE ANOTAR UNA DOSIS
--
-- ── EL CENSO, corrido antes de escribir (regla de la casa) ──────────────────
-- ① POR CUERPO en `pg_proc`, buscando `medicacion` (no por nombre: la que te
--    muerde se llama distinto). Aparecen 13 funciones y **ninguna es una
--    puerta de familia**: son triggers, el sedimentador de la nota clínica y
--    lectores. Todo lo que hoy escribe medicación entra por el VETERINARIO.
-- ② POR IMPORT en `packages/api`: cero wrappers de escritura de medicación.
-- ③ La tabla `evento_medicacion_administrada` existe **con cero filas** y con
--    su trigger de evento padre listo desde que nació. *Escritor preparado,
--    puerta ausente* — la clase `L-318`, motor sin puerta.
--
-- 🔴 Y EL CENSO ENCONTRÓ ALGO QUE NO VENÍA A BUSCAR: `cat_tipos_evento` tiene
-- `medicacion_administrada` **activo con `tabla_tipada` NULL**, mientras la
-- tabla existe. El gate `verificar_coherencia_tablas_tipadas()` **no lo caza**:
-- mide el sentido contrario —apuntar a una tabla inexistente—, así que este
-- hueco es invisible para él. *Un gate que mide una dirección deja la otra sin
-- vigilancia, y el silencio se lee como salud.* Se cura acá, en el mismo acto.
--
-- ── POR QUÉ ESTA PUERTA, y es la ley del founder ────────────────────────────
-- «Hacemos lo mejor que podamos; lo que falta lo completa la familia; y
-- siempre se dice dónde no pudimos.» La familia le da la pastilla todos los
-- días: hoy ese hecho no tiene dónde vivir, y el expediente muestra lo que
-- prescribió el vet sin lo que de verdad pasó.
--
-- ⚠️ **NO propaga a `medicacion_actual` del perfil, y es a propósito.** Ese
-- campo dice qué está tomando la mascota —lo vigente—, y lo escribe el
-- trigger de la PRESCRIPCIÓN. Una dosis es un hecho puntual: sumarla ahí haría
-- que darle un antibiótico una vez lo dejara «tomando antibiótico» para
-- siempre. *Administrar no es prescribir, y confundirlos ensucia el dato que
-- lee el pasaporte en una urgencia.*
--
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE.** Función nueva + un UPDATE de una
-- fila de catálogo cuyo único lector es un gate. Sin backfill, sin anclas.
-- ============================================================================

create or replace function public.registrar_medicacion_administrada(
  p_mascota_id       uuid,
  p_medicamento      text,
  p_dosis            text,
  p_via              text default 'oral',
  p_fecha            timestamptz default null,
  p_principio_activo text default null,
  p_notas            text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_auth uuid := auth.uid();
  v_country text;
  v_id uuid;
  v_evento uuid;
  v_fecha timestamptz;
  v_marcados int;
  v_vias text[] := array['oral','subcutanea','intramuscular','intravenosa',
                         'intranasal','topica','oftalmica','auricular','otra'];
begin
  if v_auth is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if not user_es_familiar_adulto_de_mascota(p_mascota_id) then
    raise exception 'no_access_to_mascota' using errcode = '42501';
  end if;

  if p_medicamento is null or length(trim(p_medicamento)) = 0 then
    raise exception 'medicamento_requerido' using errcode = '22023';
  end if;
  if p_dosis is null or length(trim(p_dosis)) = 0 then
    raise exception 'dosis_requerida' using errcode = '22023';
  end if;

  /* El CHECK de la tabla ya vuelve el estado inexpresable; este guard existe
     para que la familia lea CUÁL vía no se conoce en vez de un 23514 crudo
     (L-424: el índice sabe negarse, el guard sabe explicar). */
  if p_via is null or not (p_via = any(v_vias)) then
    raise exception 'via_invalida: %', coalesce(p_via, '(vacía)') using errcode = '22023';
  end if;

  -- Una dosis es un hecho PASADO. Un minuto de tolerancia porque el reloj del
  -- teléfono y el del servidor no son el mismo, y rebotar por eso sería
  -- rebotar por nuestra infraestructura, no por lo que la familia hizo.
  v_fecha := coalesce(p_fecha, now());
  if v_fecha > now() + interval '1 minute' then
    raise exception 'fecha_futura' using errcode = '22023';
  end if;

  -- `eventos_mascota.country_code` es NOT NULL: el país es el de la MASCOTA,
  -- derivado y jamás pedido (el rojo crudo que costó `registrar_fin_de_vida`).
  select country_code into v_country from mascotas where id = p_mascota_id;
  if v_country is null then
    raise exception 'mascota_sin_pais' using errcode = '22023';
  end if;

  insert into evento_medicacion_administrada
    (mascota_id, country_code, nombre_medicamento, principio_activo,
     dosis_administrada, via_administracion, fecha_administracion, notas)
  values
    (p_mascota_id, v_country, trim(p_medicamento), nullif(trim(coalesce(p_principio_activo,'')),''),
     trim(p_dosis), p_via, v_fecha, nullif(trim(coalesce(p_notas,'')),''))
  returning id, evento_id into v_id, v_evento;

  /* La marca no viaja en el INSERT porque la escribe el marcador, que
     re-chequea el acceso. Por esta puerta entra SIEMPRE la familia tecleando:
     no hay parámetro que elegir. */
  v_marcados := public._marcar_modo_captura_evento(array[v_evento], 'tecleado');
  if v_marcados <> 1 then
    raise exception 'marca_incompleta: marcó % de 1', v_marcados;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'evento_id', v_evento,
                            'mascota_id', p_mascota_id);
end;
$function$;

comment on function public.registrar_medicacion_administrada is
  'Puerta de FAMILIA para anotar una dosis dada. No toca `medicacion_actual` '
  'del perfil: administrar no es prescribir.';

-- L-140: ninguna función nace alcanzable por `anon` ni por `PUBLIC`.
revoke all on function public.registrar_medicacion_administrada(uuid, text, text, text, timestamptz, text, text) from public, anon;
grant execute on function public.registrar_medicacion_administrada(uuid, text, text, text, timestamptz, text, text) to authenticated;

-- La cura del catálogo (arriba). Único lector: el gate de coherencia.
update public.cat_tipos_evento
   set tabla_tipada = 'evento_medicacion_administrada'
 where codigo = 'medicacion_administrada';

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
do $$
declare
  v_titular uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';  -- titular de Thor
  v_thor    uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';
  v_ajeno   uuid;
  v_r jsonb;
  v_rebotes int := 0;
  v_antes int; v_despues int;
  v_perfil_antes int; v_perfil_despues int;
  -- Un nombre que NO puede estar ya en el perfil. *El primer control usó
  -- «Meloxicam» y dio rojo: Thor ya lo tenía prescrito por el vet. Un control
  -- que pregunta «¿existe X?» mide el estado del mundo, no mi cambio.*
  v_inventado text := 'ZZ-Control-' || substr(md5(random()::text), 1, 8);
begin
  if (select tabla_tipada from cat_tipos_evento where codigo='medicacion_administrada')
     is distinct from 'evento_medicacion_administrada' then
    raise exception 'CINTURON: el catálogo quedó sin su tabla';
  end if;

  -- ROJO 1 · sin sesión
  begin perform public.registrar_medicacion_administrada(v_thor,'X','1 comp');
  exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;

  perform set_config('request.jwt.claim.sub', v_titular::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_titular, 'role','authenticated')::text, true);
  perform set_config('role','authenticated',true);

  -- ROJO 2, 3 y 4 · los guards hablados
  begin perform public.registrar_medicacion_administrada(v_thor,'  ','1 comp');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  begin perform public.registrar_medicacion_administrada(v_thor,'X','1 comp','inyectada');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;
  begin perform public.registrar_medicacion_administrada(v_thor,'X','1 comp','oral', now() + interval '2 days');
  exception when sqlstate '22023' then v_rebotes := v_rebotes + 1; end;

  -- ROJO 5 · una mascota que NO es de esta familia
  select id into v_ajeno from mascotas where familia_id <> (select familia_id from mascotas where id=v_thor) limit 1;
  if v_ajeno is not null then
    begin perform public.registrar_medicacion_administrada(v_ajeno,'X','1 comp');
    exception when sqlstate '42501' then v_rebotes := v_rebotes + 1; end;
  else
    v_rebotes := v_rebotes + 1;  -- sin mascota ajena no hay caso; se cuenta y se dice
    raise notice 'CINTURON: no hay mascota de otra familia — el rojo 5 no se pudo ejercer';
  end if;

  if v_rebotes <> 5 then
    raise exception 'CINTURON: se esperaban 5 rebotes y hubo %', v_rebotes;
  end if;

  -- VERDE · el camino real, y se mide que el evento NACIÓ y quedó marcado
  select count(*) into v_antes from evento_medicacion_administrada where mascota_id = v_thor;
  select jsonb_array_length(coalesce(medicacion_actual,'[]'::jsonb)) into v_perfil_antes
    from mascota_perfil_vigente where mascota_id = v_thor;

  v_r := public.registrar_medicacion_administrada(
           v_thor, v_inventado, '0,5 ml', 'oral', now() - interval '2 hours',
           'meloxicam', 'Se la tomó con la comida.');
  if (v_r->>'ok')::boolean is not true then raise exception 'CINTURON: el verde no devolvió ok'; end if;

  select count(*) into v_despues from evento_medicacion_administrada where mascota_id = v_thor;
  if v_despues <> v_antes + 1 then raise exception 'CINTURON: no se insertó la fila'; end if;

  if not exists (select 1 from eventos_mascota
                  where id = (v_r->>'evento_id')::uuid
                    and tipo = 'medicacion_administrada'
                    and modo_captura = 'tecleado') then
    raise exception 'CINTURON: el evento padre no nació con su tipo y su marca';
  end if;

  /* ⚠️ CONTROL DEL NO-EFECTO, en sus dos mitades: el perfil no crece **y** el
     nombre que acabo de anotar no aparece. La primera prueba que no entró
     nada; la segunda, que no entró ESTO. *Una sola de las dos deja pasar el
     caso en que algo entra y otra cosa sale.* */
  select jsonb_array_length(coalesce(medicacion_actual,'[]'::jsonb)) into v_perfil_despues
    from mascota_perfil_vigente where mascota_id = v_thor;
  if v_perfil_despues is distinct from v_perfil_antes then
    raise exception 'CINTURON: la medicación vigente pasó de % a % — administrar no prescribe',
      v_perfil_antes, v_perfil_despues;
  end if;
  if exists (
    select 1 from mascota_perfil_vigente p,
                  jsonb_array_elements(coalesce(p.medicacion_actual,'[]'::jsonb)) m
     where p.mascota_id = v_thor and m->>'medicamento' = v_inventado) then
    raise exception 'CINTURON: administrar propagó a medicacion_actual — no debe';
  end if;

  raise notice 'CINTURON OK · 5 rojos · 1 verde con evento marcado · perfil intacto en % entradas', v_perfil_antes;
  raise exception 'ROLLBACK_DEL_CINTURON';
exception when others then
  if sqlstate = 'P0001' and sqlerrm = 'ROLLBACK_DEL_CINTURON' then
    raise notice 'CINTURON: verificado y deshecho, residuo 0';
  else
    raise;
  end if;
end $$;

-- ═════════════════════════════════════════════════════════════════════
-- CLEANUP QUIRÚRGICO DE CITAS DE TEST — helper dev (cierra D-322).
-- El baile L-065 que en S54/S55 se ejecutó a mano 5 veces, con el
-- orden de FKs adentro. SOLO para citas de test/gates (jamás datos
-- reales — regla 7.8 del financiero: en producción no se borra).
--
-- Uso: editar v_citas con los ids a borrar y correr entero con
--   npx supabase --experimental db query --linked "$(cat supabase/dev/cleanup_citas_test.sql)"
-- Después correr la VERIFICACIÓN de abajo en un run SEPARADO (L-135).
--
-- Qué cubre (relevado S55 contra pg_constraint):
--   · hijas RESTRICT de la cita (evento_atencion y su árbol) — si hay
--     atención cerrada, usar cleanup_demo_s44.sql como referencia del
--     árbol completo de paseo/grooming; este helper cubre el caso
--     hold/pagada SIN atención (el de los gates de agendamiento).
--   · prestador_atencion_log: append-only (triggers no_update/no_delete)
--     — el DELETE del evento padre dispara SET NULL = UPDATE bloqueado;
--     se deshabilitan los triggers DENTRO de la transacción y las filas
--     de log de las citas de test se borran por id (residuo de test en
--     un ledger anónimo — no auditoría real).
--   · eventos_mascota padre (FK RESTRICT desde la cita: cita primero).
--   · mascota_perfil_vigente.ultimo_evento_*: el trigger es solo-INSERT
--     (S48-B8) — se RECOMPUTA para cada mascota tocada; sin eventos
--     restantes queda NULL honesto.
-- ═════════════════════════════════════════════════════════════════════
begin;

do $cleanup$
declare
  -- EDITAR ACÁ: ids de las citas de test a borrar
  v_citas uuid[] := array[]::uuid[];
  v_eventos uuid[];
  v_mascotas uuid[];
  v_atenciones int;
begin
  if array_length(v_citas, 1) is null then
    raise exception 'v_citas vacío — editá el array con los ids de test';
  end if;

  select array_agg(distinct evento_id), array_agg(distinct mascota_id)
    into v_eventos, v_mascotas
    from evento_cita_servicio
   where id = any(v_citas) and evento_id is not null;

  -- guard: este helper es para citas SIN atención (holds/pagadas de gates)
  select count(*) into v_atenciones from evento_atencion where cita_id = any(v_citas);
  if v_atenciones > 0 then
    raise exception 'hay % atención(es) colgando — usar el árbol completo (cleanup_demo_s44.sql como referencia)', v_atenciones;
  end if;

  alter table prestador_atencion_log disable trigger trg_atencion_log_no_update;
  alter table prestador_atencion_log disable trigger trg_atencion_log_no_delete;

  delete from prestador_atencion_log where evento_origen_id = any(v_eventos);
  delete from evento_cita_servicio   where id = any(v_citas);
  delete from eventos_mascota        where id = any(v_eventos);

  alter table prestador_atencion_log enable trigger trg_atencion_log_no_update;
  alter table prestador_atencion_log enable trigger trg_atencion_log_no_delete;

  -- recómputo del puntero vigente por mascota tocada (S48-B8)
  update mascota_perfil_vigente mpv
     set ultimo_evento_id = ult.id, ultimo_evento_fecha = ult.fecha_evento
    from (select distinct on (mascota_id) mascota_id, id, fecha_evento
            from eventos_mascota
           where mascota_id = any(v_mascotas) and soft_delete = false
           order by mascota_id, fecha_evento desc) ult
   where mpv.mascota_id = ult.mascota_id;
end
$cleanup$;

commit;

-- ─── VERIFICACIÓN (correr en run SEPARADO, con los mismos ids) ───────
-- select
--   (select count(*) from evento_cita_servicio where id = any('{...}'::uuid[])) as citas_residuo,
--   (select count(*) from eventos_mascota em where em.tipo='cita_servicio'
--      and not exists (select 1 from evento_cita_servicio c where c.evento_id = em.id)) as eventos_huerfanos,
--   (select count(*) from prestador_atencion_log where tipo_evento_origen='cita_servicio'
--      and evento_origen_id is null) as log_huerfano,
--   (select count(*) from pg_trigger where tgrelid='public.prestador_atencion_log'::regclass
--      and not tgisinternal and tgenabled='O') as triggers_activos; -- debe dar 2

-- ═════════════════════════════════════════════════════════════════════
-- CLEANUP DEMO VET S68 — reversa quirúrgica del seed_demo_vet_s68.sql
-- (borra SOLO los uuids fijos de680000-; el user de Auth y su profile
-- los administra el founder). Regla 41: primero hijas, después padres;
-- las citas que el gate haya creado sobre la clínica demo se borran con
-- sus eventos padre.
-- Ejecuta SOLO con gate del founder. NO es migración.
-- ═════════════════════════════════════════════════════════════════════
do $cleanup$
declare
  v_prest uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_cc    uuid := 'de680000-0000-4000-8000-0000000000cc';
  v_n     int;
begin
  -- citas del gate sobre la clínica demo (hijas → padre evento)
  delete from evento_cita_servicio ecs
  where ecs.prestador_id = v_prest;
  get diagnostics v_n = row_count;
  raise notice 'cleanup_demo_vet_s68: % citas del gate borradas', v_n;
  delete from eventos_mascota em
  where em.prestador_id = v_prest and em.tipo = 'cita_servicio'
    and not exists (select 1 from evento_cita_servicio e where e.evento_id = em.id);

  delete from prestador_horarios where prestador_id = v_prest;
  delete from prestador_especialidades where prestador_id = v_prest;
  delete from prestador_servicios where prestador_id = v_prest;
  delete from prestador_documentos where prestador_id = v_prest;
  delete from prestador_empleados where prestador_id = v_prest;
  delete from prestadores where id = v_prest;
  delete from cuenta_roles where cuenta_comercial_id = v_cc;
  delete from cuentas_comerciales where id = v_cc;

  raise notice 'cleanup_demo_vet_s68: OK — [DEMO S68] Clínica Aurora revertida';
end;
$cleanup$;
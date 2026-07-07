-- ═════════════════════════════════════════════════════════════════════
-- CLEANUP DEMO S44 — par reversible de seed_demo_s44.sql.
-- Borra SOLO lo colgado de los UUIDs fijos de300000-*; el user de
-- auth (c5d54e3a-…) NO se toca (lo administra el founder en Studio).
-- Orden: hojas → capa → citas → hitos (self-FK: hijos primero) → 
-- mascota → familia → prestador → cuenta.
-- ═════════════════════════════════════════════════════════════════════
do $cleanup$
declare
  v_cc    uuid := 'de300000-0000-4000-8000-0000000000cc';
  v_prest uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_fam   uuid := 'de300000-0000-4000-8000-0000000000fa';
  v_masc  uuid := 'de300000-0000-4000-8000-000000000a5c';
  v_citas uuid[] := array['de300000-0000-4000-8000-00000000c001',
                          'de300000-0000-4000-8000-00000000c002',
                          'de300000-0000-4000-8000-00000000c003']::uuid[];
begin
  delete from evento_paseo_novedades where paseo_id in
    (select p.id from eventos_mascota_paseo p join evento_atencion a on a.id = p.evento_atencion_id where a.cita_id = any(v_citas));
  delete from evento_grooming_pausas      where evento_atencion_id in (select id from evento_atencion where cita_id = any(v_citas));
  delete from evento_grooming_notas       where evento_atencion_id in (select id from evento_atencion where cita_id = any(v_citas));
  delete from evento_grooming_incidencias where evento_atencion_id in (select id from evento_atencion where cita_id = any(v_citas));
  delete from evento_archivo_adjunto      where mascota_id = v_masc;
  delete from eventos_mascota_paseo       where evento_atencion_id in (select id from evento_atencion where cita_id = any(v_citas));
  delete from evento_atencion             where cita_id = any(v_citas);
  delete from evento_cita_servicio        where id = any(v_citas);
  -- hitos de la mascota demo: hijos del árbol primero (evento_padre_id)
  delete from eventos_mascota where mascota_id = v_masc and evento_padre_id is not null;
  delete from eventos_mascota where mascota_id = v_masc;
  delete from mascota_acceso_prestador where mascota_id = v_masc;
  delete from mascotas    where id = v_masc;
  delete from familia     where id = v_fam;
  delete from prestadores where id = v_prest;
  delete from cuentas_comerciales where id = v_cc;
  raise notice 'cleanup demo S44 OK';
end
$cleanup$;

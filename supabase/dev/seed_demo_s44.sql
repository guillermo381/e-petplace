-- ═════════════════════════════════════════════════════════════════════
-- SEED DEMO S44 — datos de demostración para el gate de B4 (Agenda).
-- IDEMPOTENTE (re-ancla fecha/hora/estado a "hoy" en cada corrida) y
-- REVERSIBLE con su par cleanup_demo_s44.sql.
-- Todo lleva UUIDs fijos con prefijo de300000- y nombres "[DEMO S44]".
-- Ejecuta SOLO con gate del founder (regla 73). NO es migración.
--
-- Nota de flujo real (hallazgo B4.0): el acceso prestador→mascota nace
-- del trigger AFTER UPDATE OF estado al confirmar — por eso las citas
-- se INSERTAN pendientes y se CONFIRMAN con UPDATE.
-- Reset completo de una demo mutada: correr cleanup + seed.
-- ═════════════════════════════════════════════════════════════════════
do $seed$
declare
  -- user demo creado por el founder en Supabase Auth (S44-B4.0)
  v_uid   uuid := 'c5d54e3a-cf1a-45c6-8605-dfd826b022ee';
  v_cc    uuid := 'de300000-0000-4000-8000-0000000000cc';
  v_prest uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_fam   uuid := 'de300000-0000-4000-8000-0000000000fa';
  v_masc  uuid := 'de300000-0000-4000-8000-000000000a5c';
  v_ev1   uuid := 'de300000-0000-4000-8000-00000000e001';
  v_ev2   uuid := 'de300000-0000-4000-8000-00000000e002';
  v_ev3   uuid := 'de300000-0000-4000-8000-00000000e003';
  v_c1    uuid := 'de300000-0000-4000-8000-00000000c001';
  v_c2    uuid := 'de300000-0000-4000-8000-00000000c002';
  v_c3    uuid := 'de300000-0000-4000-8000-00000000c003';
  -- hora local del founder (soft launch EC)
  v_ahora timestamp := (now() at time zone 'America/Guayaquil');
begin
  if not exists (select 1 from auth.users where id = v_uid) then
    raise exception 'seed_demo_s44: el user demo % no existe en auth.users', v_uid;
  end if;
  insert into profiles (id, email) values (v_uid, 'demo-prestador@epetplace.dev')
    on conflict (id) do nothing;

  insert into cuentas_comerciales (id, owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    values (v_cc, v_uid, 'persona_natural', 'DEMO-S44-001', '[DEMO S44] Paseos Andres', '[DEMO S44] Paseos Andres', 'EC')
    on conflict (id) do nothing;

  insert into prestadores (id, user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id, estado)
    values (v_prest, v_uid, 'paseador', '[DEMO S44] Paseos Andres', '593999000333', v_cc, 'activo')
    on conflict (id) do update set estado = 'activo';

  insert into familia (id, created_by_user_id) values (v_fam, v_uid)
    on conflict (id) do nothing;

  insert into mascotas (id, nombre, especie, origen, familia_id, user_id)
    values (v_masc, 'Zeus', 'perro', 'nacido_en_casa', v_fam, v_uid)
    on conflict (id) do nothing;

  -- hitos padre de las citas
  insert into eventos_mascota (id, mascota_id, tipo, eje_jtbd, fecha_evento, country_code, prestador_id, creado_por_user_id)
    values (v_ev1, v_masc, 'cita_servicio', 'salud', now(), 'EC', v_prest, v_uid),
           (v_ev2, v_masc, 'cita_servicio', 'salud', now(), 'EC', v_prest, v_uid),
           (v_ev3, v_masc, 'cita_servicio', 'salud', now(), 'EC', v_prest, v_uid)
    on conflict (id) do nothing;

  -- c1: HOY hace 45 min → lista para iniciar · c2: HOY +2h → futura · c3: HOY +4h → pendiente
  insert into evento_cita_servicio (id, evento_id, mascota_id, prestador_id, user_id, tipo_servicio, estado, fecha, hora)
    values (v_c1, v_ev1, v_masc, v_prest, v_uid, 'paseo_30min', 'pendiente', v_ahora::date, (v_ahora - interval '45 min')::time),
           (v_c2, v_ev2, v_masc, v_prest, v_uid, 'paseo_60min', 'pendiente', v_ahora::date, (v_ahora + interval '2 hour')::time),
           (v_c3, v_ev3, v_masc, v_prest, v_uid, 'paseo_30min', 'pendiente', v_ahora::date, (v_ahora + interval '4 hour')::time)
    on conflict (id) do update set
      fecha  = excluded.fecha,
      hora   = excluded.hora,
      estado = 'pendiente';

  -- transición REAL a confirmada (dispara el trigger de acceso) — c3 queda pendiente
  update evento_cita_servicio set estado = 'confirmada' where id in (v_c1, v_c2);

  raise notice 'seed demo S44 OK: prestador %, mascota %, citas % % %', v_prest, v_masc, v_c1, v_c2, v_c3;
end
$seed$;

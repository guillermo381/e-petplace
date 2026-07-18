-- ═════════════════════════════════════════════════════════════════════
-- SEED DEMO VET S68 — el vet demo con cuenta ACTIVA + rol + documento
-- profesional APROBADO, para que el gate del founder recorra de cero a
-- oferta publicada SIN tocar el guard verificacion_profesional_pendiente.
-- IDEMPOTENTE y REVERSIBLE con su par cleanup_demo_vet_s68.sql.
-- UUIDs fijos con prefijo de680000- y nombre "[DEMO S68]".
-- Ejecuta SOLO con gate del founder (regla 73). NO es migración.
--
-- PRE-REQUISITO (patrón S44): el founder crea el user demo en Supabase
-- Auth (sugerido: demo-vet@epetplace.dev) y pega su uuid en v_uid.
-- La apertura del oficio sigue BLOQUEADA por §14.3 — esto es demo.
-- ═════════════════════════════════════════════════════════════════════
do $seed$
declare
  -- user demo-vet creado por el founder en Supabase Auth (S68-A5):
  -- demo-vet@epetplace.dev
  v_uid   uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_cc    uuid := 'de680000-0000-4000-8000-0000000000cc';
  v_prest uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_emp   uuid := 'de680000-0000-4000-8000-0000000000ee';
  v_doc   uuid := 'de680000-0000-4000-8000-0000000000d0';
begin
  if not exists (select 1 from auth.users where id = v_uid) then
    raise exception 'seed_demo_vet_s68: el user demo % no existe en auth.users — crear en Supabase Auth y pegar el uuid en v_uid', v_uid;
  end if;
  insert into profiles (id, email) values (v_uid, 'demo-vet@epetplace.dev')
    on conflict (id) do nothing;

  -- cuenta comercial ACTIVA (7.13: sin cuenta activa no hay vitrina);
  -- datos bancarios demo completos — chk_datos_bancarios_validos exige
  -- las 7 claves para estado 'activa'.
  insert into cuentas_comerciales
    (id, owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social,
     nombre_comercial, country_code, estado, activado_en, datos_bancarios)
  values
    (v_cc, v_uid, 'persona_natural', 'DEMO-S68-001',
     '[DEMO S68] Clínica Aurora', '[DEMO S68] Clínica Aurora', 'EC',
     'activa', now(),
     '{"banco_codigo":"DEMO","banco_nombre":"[DEMO S68] Banco","tipo_cuenta":"ahorros","numero_cuenta":"0000000068","titular_nombre":"[DEMO S68] Clínica Aurora","titular_tipo_documento":"cedula","titular_documento":"0000000068"}'::jsonb)
    on conflict (id) do nothing;

  insert into cuenta_roles (cuenta_comercial_id, tipo_actor, estado)
  select v_cc, 'prestador_servicios', 'activo'
  where not exists (
    select 1 from cuenta_roles
    where cuenta_comercial_id = v_cc and tipo_actor = 'prestador_servicios'
  );

  insert into prestadores (id, user_id, tipo, nombre_comercial, whatsapp,
                           direccion, ciudad, cuenta_comercial_id, estado)
    values (v_prest, v_uid, 'clinica_veterinaria', '[DEMO S68] Clínica Aurora',
            '593999000668', 'Av. de los Andes 123', 'Quito', v_cc, 'activo')
    on conflict (id) do update set estado = 'activo';

  -- V0: la franja es de una persona — el titular rol='dueño'.
  insert into prestador_empleados (id, prestador_id, user_id, rol, nombre, activo, created_by)
    values (v_emp, v_prest, v_uid, 'dueño', '[DEMO S68] Dra. Aurora', true, v_uid)
    on conflict (id) do nothing;

  -- Documento profesional APROBADO — ANTES de las ofertas: el guard
  -- S68 (verificacion_profesional_pendiente) exige este orden.
  insert into prestador_documentos
    (id, prestador_id, tipo, nombre, archivo_url, estado, revisado_en)
    values (v_doc, v_prest, 'titulo_profesional',
            '[DEMO S68] Título profesional', 'demo/s68-titulo.pdf',
            'aprobado', now())
    on conflict (id) do nothing;

  -- S68-A5 (letra (e) del pedido): CERO ofertas, especialidades ni
  -- franjas pre-creadas — el gate del founder es de CERO a oferta
  -- publicada y el wizard las crea TODAS (menú, especialidades y
  -- horarios). El seed deja solo la base: cuenta activa + rol +
  -- prestador activo + titular + documento aprobado.

  raise notice 'seed_demo_vet_s68: OK — [DEMO S68] Clínica Aurora activa (cuenta+rol+titular+doc aprobado, CERO ofertas: el wizard las crea)';
end;
$seed$;
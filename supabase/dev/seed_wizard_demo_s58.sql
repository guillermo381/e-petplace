-- Prestador DEMO del wizard (S58-B v3.1, cura 2a) — patrón seed_demo_s44:
-- el auth user nace por signUp (scripts/seed-wizard-demo-s58.mjs); acá se
-- linkea por email. SIN oferta, SIN franjas, SIN zonas: peldaño 0 REAL
-- para que el founder gatee el wizard entero. La cuenta comercial queda
-- en su estado default (pendiente_validacion) — 7.13 jamás lo oferta a
-- clientes: el demo no contamina el QUIÉN. Marca DEMO en todo. Limpieza
-- futura por estos ids fijos.
do $$
declare
  v_uid   uuid;
  v_cc    uuid := 'de580000-0000-4000-8000-00000000c0c1';
  v_prest uuid := 'de580000-0000-4000-8000-0000000000b1';
begin
  select id into v_uid from auth.users where email = 'guillo381+wizard@gmail.com';
  if v_uid is null then
    raise exception 'seed_wizard_demo_s58: el auth user guillo381+wizard@gmail.com no existe — corre el signUp primero';
  end if;

  insert into cuentas_comerciales (id, owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    values (v_cc, v_uid, 'persona_natural', 'DEMO-S58-WIZ', '[DEMO S58] Wizard', '[DEMO S58] Wizard', 'EC')
    on conflict (id) do nothing;

  insert into prestadores (id, user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id, estado)
    values (v_prest, v_uid, 'paseador', '[DEMO S58] Wizard', '593999000558', v_cc, 'activo')
    on conflict (id) do nothing;
end $$;

-- S88-A · FIXTURE DE LA TANDA ② — el par COMPLETO, con el admin.
-- Vive acá y no en la migración porque discriminar el ROL exige apagar la pata
-- de PLATAFORMA del admin de prueba, y eso toca `admin_users`: bajo `db push`
-- el rol de la migración no puede. in-txn ROLLBACK, residuo 0.
BEGIN;
DO $$
DECLARE
  v_aur uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_admin uuid := '29cd91e2-7f31-47d2-ab16-166ce100e3bd';
  v_recep uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';
  v_tit uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_s int; v_h int; v_r text := ''; v_rol text := current_user;
BEGIN
  UPDATE admin_users SET activo=false WHERE id=v_admin;   -- el discriminador

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_servicios SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_s = ROW_COUNT;
  UPDATE prestador_horarios  SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_h = ROW_COUNT;
  v_r := v_r || format('ADMIN=%s servicios / %s horarios | ', v_s, v_h);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_recep,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_servicios SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_s = ROW_COUNT;
  UPDATE prestador_horarios  SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_h = ROW_COUNT;
  v_r := v_r || format('RECEPCION=%s/%s | ', v_s, v_h);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_tit,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_servicios SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_s = ROW_COUNT;
  UPDATE prestador_horarios  SET activo=activo WHERE prestador_id=v_aur; GET DIAGNOSTICS v_h = ROW_COUNT;
  v_r := v_r || format('TITULAR=%s/%s', v_s, v_h);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  PERFORM set_config('epp.t2', v_r, true);
END $$;
SELECT current_setting('epp.t2', true) AS par_tanda2;
ROLLBACK;

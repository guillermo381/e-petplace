-- S88-A · FIXTURE TANDA ⑤ + ⑤bis — el par final del lote. in-txn ROLLBACK.
BEGIN;
DO $$
DECLARE
  v_aur uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_admin uuid := '29cd91e2-7f31-47d2-ab16-166ce100e3bd';
  v_recep uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';
  v_rol text := current_user; v_n int; v_r text := ''; v_m text;
BEGIN
  UPDATE admin_users SET activo=false WHERE id=v_admin;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  v_r := v_r || format('resolvedor=%s | ', (public.prestador_que_gestiono() = v_aur));
  UPDATE prestadores SET descripcion=descripcion WHERE id=v_aur; GET DIAGNOSTICS v_n=ROW_COUNT;
  v_r := v_r || format('identidad=%s | ', v_n);
  UPDATE cuentas_comerciales SET nombre_comercial=nombre_comercial
   WHERE id='de680000-0000-4000-8000-0000000000cc'; GET DIAGNOSTICS v_n=ROW_COUNT;
  v_r := v_r || format('cuenta_del_negocio=%s | ', v_n);
  -- el ROJO: borrar el negocio NO es gestión
  DELETE FROM prestadores WHERE id=v_aur; GET DIAGNOSTICS v_n=ROW_COUNT;
  v_r := v_r || format('BORRA_NEGOCIO=%s(debe ser 0) | ', v_n);
  -- el ROJO de D-656: crear una cuenta para el negocio no es suyo
  BEGIN
    INSERT INTO cuentas_comerciales (owner_profile_id, estado, country_code, tipo_fiscal,
      identificacion_fiscal, razon_social, nombre_comercial, moneda)
    VALUES (v_recep,'pendiente_validacion','EC','ruc','9999999999001','X','X','USD');
    v_r := v_r || 'CREA_CUENTA_AJENA=PASO(MAL)';
  EXCEPTION WHEN OTHERS THEN v_r := v_r || 'CREA_CUENTA_AJENA=REBOTE(bien)'; END;

  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  PERFORM set_config('epp.t5', v_r, true);
END $$;
SELECT current_setting('epp.t5', true) AS par_tanda5;
ROLLBACK;

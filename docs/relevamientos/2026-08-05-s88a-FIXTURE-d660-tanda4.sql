-- S88-A · FIXTURE TANDA ④ — las DOS direcciones, con nombre. in-txn ROLLBACK.
BEGIN;
DO $$
DECLARE
  v_aur uuid := 'de680000-0000-4000-8000-0000000000e5';
  v_admin uuid := '29cd91e2-7f31-47d2-ab16-166ce100e3bd';
  v_otro uuid := 'a16ac32c-80fe-45a0-bfbf-cebc69b82a20';  -- +s87prof: la VÍCTIMA
  v_rol text := current_user; v_n int; v_r text := ''; v_m text;
  v_inv uuid; v_fila uuid;
BEGIN
  UPDATE admin_users SET activo=false WHERE id=v_admin;   -- discriminador del ROL
  SELECT id INTO v_fila FROM prestador_empleados WHERE prestador_id=v_aur AND user_id=v_otro;
  -- una invitación pendiente para OTRA persona, que el admin no debe poder aceptar
  INSERT INTO empleado_invitaciones (prestador_id, email, nombre, rol, expira_en, estado, created_by)
  VALUES (v_aur, 'guillo381+s87recep@gmail.com', 'Ajena', 'empleado',
          now()+interval '7 days', 'pendiente', '4f572081-26a5-4d3b-9d80-25ea751fdc9c')
  RETURNING id INTO v_inv;

  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- ══ DIRECCIÓN 1 · GESTIÓN: el admin invita y da de baja ══
  BEGIN
    INSERT INTO empleado_invitaciones (prestador_id, email, nombre, rol, expira_en, estado, created_by)
    VALUES (v_aur,'nuevo-s88@example.com','Nuevo','empleado', now()+interval '7 days','pendiente',v_admin);
    v_r := v_r || 'ADMIN_INVITA=OK | ';
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_m=MESSAGE_TEXT; v_r:=v_r||'ADMIN_INVITA=REBOTE('||v_m||') | '; END;

  UPDATE prestador_empleados SET activo=false WHERE id=v_fila; GET DIAGNOSTICS v_n=ROW_COUNT;
  v_r := v_r || format('ADMIN_DA_DE_BAJA=%s fila | ', v_n);

  -- ══ DIRECCIÓN 2 · EL ROJO: lo que NO debe poder ══
  -- el rojo se CAPTURA: tras la tanda ④ter la RLS lo rebota, no lo ignora
  BEGIN
    UPDATE empleado_invitaciones SET estado='aceptada' WHERE id=v_inv;
    GET DIAGNOSTICS v_n=ROW_COUNT;
    v_r := v_r || format('ADMIN_ACEPTA_AJENA=%s filas(MAL si >0) | ', v_n);
  EXCEPTION WHEN OTHERS THEN
    v_r := v_r || 'ADMIN_ACEPTA_AJENA=REBOTE RLS(bien) | ';
  END;
  -- y el VERBO QUE SÍ ES SUYO: cancelar la invitación
  BEGIN
    UPDATE empleado_invitaciones SET estado='cancelada' WHERE id=v_inv;
    GET DIAGNOSTICS v_n=ROW_COUNT;
    v_r := v_r || format('ADMIN_CANCELA=%s fila(bien) | ', v_n);
  EXCEPTION WHEN OTHERS THEN v_r := v_r || 'ADMIN_CANCELA=REBOTE(MAL) | '; END;

  BEGIN
    INSERT INTO prestador_empleados (prestador_id, user_id, nombre, rol, activo, created_by)
    VALUES (v_aur, v_otro, 'suplantado', 'empleado', true, v_admin);
    v_r := v_r || 'ADMIN_SE_HACE_PASAR=PASO(MAL)';
  EXCEPTION WHEN OTHERS THEN v_r := v_r || 'ADMIN_SE_HACE_PASAR=REBOTE(bien)'; END;

  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  PERFORM set_config('epp.t4', v_r, true);
END $$;
SELECT current_setting('epp.t4', true) AS par_tanda4;
ROLLBACK;

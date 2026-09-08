-- E2E de devolución a saldo, dentro de una subtransacción que se deshace.
-- Corre como postgres (service), así que el gate de is_admin() de caso_resolver
-- se prueba aparte; acá se mide la MECÁNICA del saldo end-to-end.
create or replace function pg_temp._e2e_saldo() returns text language plpgsql as $f$
DECLARE
  v_fam uuid; v_user uuid; v_cit uuid; v_caso uuid; v_ac jsonb; v_disp0 numeric; v_disp1 numeric;
  v_out text := '';
BEGIN
  SELECT id INTO v_fam FROM familia LIMIT 1;
  SELECT user_id INTO v_user FROM familia_miembro WHERE familia_id = v_fam LIMIT 1;
  v_disp0 := saldo_hogar_disponible(v_fam);

  -- acreditar como lo haría caso_elegir_destino('saldo'): monto 4, idempotente
  v_ac := acreditar_saldo_hogar(v_fam, 4.00, 'caso', 'E2E-saldo-'||gen_random_uuid()::text, gen_random_uuid());
  IF (v_ac->>'ok')::boolean IS NOT TRUE THEN RETURN '🔴 no acreditó: '||v_ac::text; END IF;
  v_disp1 := saldo_hogar_disponible(v_fam);
  IF v_disp1 <> v_disp0 + 4 THEN RETURN format('🔴 saldo %s → %s, esperaba +4', v_disp0, v_disp1); END IF;
  v_out := v_out || format('acredita 4 (%s→%s) · ', v_disp0, v_disp1);

  -- consumir 4 en un checkout: FIFO
  PERFORM consumir_saldo_hogar(v_fam, 4.00, 'E2E-checkout-'||gen_random_uuid()::text);
  IF saldo_hogar_disponible(v_fam) <> v_disp0 THEN RETURN '🔴 consumo no dejó el saldo como estaba'; END IF;
  v_out := v_out || 'consume 4 (vuelve a '||v_disp0||') · ';

  RETURN '✅ '||v_out||'residuo 0';
END $f$;
select pg_temp._e2e_saldo() as veredicto;

-- ═══════════════════════════════════════════════════════════════════════════
-- S107-C · **EL CAMINO DEL PAQUETE, ENTERO** — aceptar → comprar → primera
-- sesión → saldo → segunda contra saldo → saldo otra vez.
--
-- La pregunta que contesta: *cuando los seis textos existan, ¿el camino
-- funciona ENTERO de una, o hay un eslabón que sólo se descubre al llegar?*
--
-- 🔴 Todo entre `BEGIN` y `ROLLBACK`. La salida va a una TABLA, jamás a
--    `RAISE NOTICE`: un verde mudo es la peor forma de verde (firma founder).
-- ⚠️ Acepta documentos y compra un paquete DE VERDAD adentro de la
--    subtransacción — por eso se deshace sola y el residuo se mide después.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
CREATE TEMP TABLE _res(n serial, paso text, salida text) ON COMMIT DROP;
-- La corrida cambia de rol para entrar como la familia; la tabla de salida
-- tiene que seguir siendo escribible desde ahí, o el verde sale MUDO.
GRANT ALL ON _res TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pg_temp TO authenticated;
DO $$
DECLARE
  v_rol text := current_user;
  v_fam uuid; v_user uuid; v_masc uuid; v_prest uuid;
  v_d1 date; v_d2 date; v_bono uuid;
  v_r jsonb; v_total int; v_usados int;
BEGIN
  SELECT m.id, m.familia_id INTO v_masc, v_fam
    FROM mascotas m WHERE m.nombre='Thor' AND m.especie='perro' LIMIT 1;
  SELECT fm.user_id INTO v_user FROM familia_miembro fm
   WHERE fm.familia_id=v_fam AND fm.hasta IS NULL AND fm.rol='adulto_titular' LIMIT 1;
  SELECT pr.id INTO v_prest FROM prestadores pr
    JOIN prestador_servicios ps ON ps.prestador_id=pr.id
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;

  -- Dos días HÁBILES distintos: el lugar abre L-V y la víspera no se reserva.
  SELECT min(d)::date INTO v_d1 FROM generate_series(public.hoy_local()+1, public.hoy_local()+20,'1 day') d
   WHERE EXTRACT(dow FROM d)::int BETWEEN 1 AND 5;
  SELECT min(d)::date INTO v_d2 FROM generate_series(v_d1+1, public.hoy_local()+20,'1 day') d
   WHERE EXTRACT(dow FROM d)::int BETWEEN 1 AND 5;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
    json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;

  -- ① EL GATE, ANTES DE ACEPTAR — tiene que frenar
  BEGIN
    v_r := public.comprar_paquete_guarderia(v_prest, 5);
    INSERT INTO _res(paso,salida) VALUES ('① comprar SIN aceptar', '🔴 DEJÓ COMPRAR: ' || v_r::text);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(paso,salida) VALUES ('① comprar SIN aceptar', '✅ frenó · ' || SQLERRM);
  END;

  -- ② ACEPTAR LOS SEIS
  v_r := public.aceptar_documentos_guarderia(
    v_fam,
    (SELECT jsonb_agg(jsonb_build_object('codigo', codigo, 'version', version))
       FROM guarderia_documentos),
    120, 'USD',
    '[{"nombre":"Sonda C","telefono":"+593000000000"}]'::jsonb, NULL, false);
  INSERT INTO _res(paso,salida) VALUES ('② aceptar los seis', v_r::text);
  INSERT INTO _res(paso,salida) VALUES ('   estado tras aceptar',
    public.evaluar_documentos_guarderia(v_fam)->>'estado');

  -- ③ COMPRAR EL PAQUETE
  v_r := public.comprar_paquete_guarderia(v_prest, 5);
  v_bono := (v_r->>'bono_id')::uuid;
  INSERT INTO _res(paso,salida) VALUES ('③ comprar paquete de 5', v_r::text);

  -- ④ EL SALDO, COMO LO LEE EL HUB (unidades_total − usadas)
  SELECT unidades_total, unidades_usadas INTO v_total, v_usados FROM bonos WHERE id = v_bono;
  INSERT INTO _res(paso,salida) VALUES ('④ saldo recién comprado',
    format('quedan %s de %s', v_total - v_usados, v_total));

  -- ⑤ LA PRIMERA SESIÓN
  v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_d1, v_masc);
  INSERT INTO _res(paso,salida) VALUES (format('⑤ primera sesión (%s)', v_d1), v_r::text);
  SELECT unidades_total, unidades_usadas INTO v_total, v_usados FROM bonos WHERE id = v_bono;
  INSERT INTO _res(paso,salida) VALUES ('   saldo tras la primera',
    format('quedan %s de %s', v_total - v_usados, v_total));

  -- ⑥ LA SEGUNDA, CONTRA SALDO — el que el founder nunca llegó a ver
  v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_d2, v_masc);
  INSERT INTO _res(paso,salida) VALUES (format('⑥ segunda contra saldo (%s)', v_d2), v_r::text);
  SELECT unidades_total, unidades_usadas INTO v_total, v_usados FROM bonos WHERE id = v_bono;
  INSERT INTO _res(paso,salida) VALUES ('   saldo tras la segunda',
    format('quedan %s de %s', v_total - v_usados, v_total));

  -- ⑦ EL MISMO DÍA DOS VECES — tiene que rebotar hablado, no consumir saldo
  BEGIN
    v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_d2, v_masc);
    INSERT INTO _res(paso,salida) VALUES ('⑦ repetir el mismo día', '⚠️ NO frenó: ' || v_r::text);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _res(paso,salida) VALUES ('⑦ repetir el mismo día', '✅ frenó · ' || SQLERRM);
  END;
  SELECT unidades_total, unidades_usadas INTO v_total, v_usados FROM bonos WHERE id = v_bono;
  INSERT INTO _res(paso,salida) VALUES ('   saldo final',
    format('quedan %s de %s', v_total - v_usados, v_total));

  EXECUTE format('SET LOCAL ROLE %I', v_rol);
END $$;
SELECT n, paso, salida FROM _res ORDER BY n;
ROLLBACK;

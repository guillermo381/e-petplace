-- ═══════════════════════════════════════════════════════════════════════════
-- S107-C · EL CAMINO DEL PAQUETE, ENTERO Y EN SUBTRANSACCIÓN
--   comprar → primera sesión → segunda contra saldo, con el guard de mascota.
--
-- 🔴 TODO SE DESHACE en el `ROLLBACK`. **Residuo medido el 29-ago tras la
--    corrida verde: bonos=0 · citas=0 · documentos=0.**
--
-- ⚠️ DOS COSAS QUE ESTA CORRIDA APRENDIÓ A LA MALA, escritas para el próximo:
--  ① **El `EXCEPTION` sigue con el ROL cambiado.** El rebote aborta antes de
--     restaurarlo, así que el handler no podía ni escribir en la temporal:
--     hay que restaurar el rol DENTRO del handler.
--  ② **La segunda mascota tiene que ser de LA MISMA FAMILIA.** Sin acotarla
--     tomé una ajena y el motor rebotó `no_access_to_mascota` — *correctamente:
--     el error era de mi fixture, no suyo.*
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
CREATE TEMP TABLE _res(n serial, linea text) ON COMMIT DROP;
DO $$
DECLARE
  v_rol text := current_user; v_masc uuid; v_masc2 uuid; v_duenio uuid; v_prest uuid;
  v_fecha date; v_fecha2 date; v_c jsonb; v_r jsonb; v_bono uuid;
BEGIN
  SELECT m.id, m.familia_id INTO v_masc, v_duenio FROM mascotas m WHERE m.nombre='Thor' AND m.especie='perro' LIMIT 1;
  SELECT fm.user_id INTO v_duenio FROM familia_miembro fm WHERE fm.familia_id=v_duenio AND fm.hasta IS NULL AND fm.rol='adulto_titular' LIMIT 1;
  /* La segunda mascota DE LA MISMA FAMILIA: sin acotar, tome una ajena y el
     motor reboto no_access_to_mascota - correctamente. */
  SELECT m2.id INTO v_masc2 FROM mascotas m2
   WHERE m2.familia_id = (SELECT familia_id FROM mascotas WHERE id = v_masc)
     AND m2.especie IN ('perro','gato') AND m2.id <> v_masc LIMIT 1;
  SELECT pr.id INTO v_prest FROM prestadores pr JOIN prestador_servicios ps ON ps.prestador_id=pr.id
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;
  INSERT INTO guarderia_documentos (codigo, version, contenido, vigente_desde, activo)
  SELECT c,1,'PRUEBA',now(),true FROM unnest(ARRAY['contrato_custodia','declaracion_sanitaria','declaracion_comportamiento','autorizacion_urgencia_veterinaria','autorizacion_transporte','protocolo_no_retiro']) c;
  INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por, aceptado_en)
  SELECT m.familia_id, d.codigo, 1, v_duenio, now() FROM mascotas m, guarderia_documentos d WHERE m.id=v_masc;
  SELECT d::date INTO v_fecha FROM generate_series(public.hoy_local()+1, public.hoy_local()+20,'1 day') d
   WHERE public._guarderia_dia_operativo(v_prest, d::date) LIMIT 1;
  SELECT d::date INTO v_fecha2 FROM generate_series(v_fecha+1, public.hoy_local()+20,'1 day') d
   WHERE public._guarderia_dia_operativo(v_prest, d::date) LIMIT 1;
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_c := public.comprar_paquete_guarderia(v_prest, 5);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  v_bono := (v_c->>'bono_id')::uuid;
  INSERT INTO _res(linea) VALUES (format('1 compra: bono ok, dias=%s total=%s porDia=%s vence=%s saldo=%s',
    v_c->>'dias', v_c->>'total', v_c->>'por_dia', v_c->>'vence_el', v_c->>'saldo_total'));
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_fecha, v_masc);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  INSERT INTO _res(linea) VALUES (format('2 primera sesion %s: saldoRestante=%s', v_fecha, v_r->>'saldo_restante'));
  INSERT INTO _res(linea) VALUES (format('2bis precio congelado en la cita: %s (esperado 8.00)',
    (SELECT precio FROM evento_cita_servicio WHERE id = (v_r->>'cita_id')::uuid)));
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  BEGIN
    v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_fecha2, NULL);
    INSERT INTO _res(linea) VALUES ('3 ROJO: sin mascota NO reboto');
  EXCEPTION WHEN OTHERS THEN
    /* El rebote aborta ANTES de restaurar el rol: el handler sigue como
       authenticated y no puede escribir en la temporal. Se restaura acá. */
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO _res(linea) VALUES (format('3 ok: sin mascota rebota %s', SQLERRM));
  END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_r := public.reservar_dia_de_paquete_guarderia(v_bono, v_fecha2, v_masc2);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  INSERT INTO _res(linea) VALUES (format('4 ok: segunda con OTRA mascota %s, saldoRestante=%s', v_fecha2, v_r->>'saldo_restante'));
END $$;
SELECT n, linea FROM _res ORDER BY n;
ROLLBACK;

-- ═══════════════════════════════════════════════════════════════════════════
-- S107-C · **EL CASO QUE DECIDE**: un lugar con L-V 07:00–09:00 **y** sábados
-- 09:00–11:00 ⇒ la lista tiene que mostrar **la ventana del día elegido**.
--
-- 🔴 Todo entre `BEGIN` y `ROLLBACK`; el residuo se mide después.
-- ⚠️ Este caso NO se puede ejercer leyendo: Aurora tiene una sola franja por
--    tipo. **Crear la segunda es la única forma de probar la cura de A.**
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
CREATE TEMP TABLE _res(n serial, linea text) ON COMMIT DROP;
DO $$
DECLARE
  v_rol text := current_user; v_masc uuid; v_duenio uuid; v_prest uuid;
  v_lun date; v_sab date; v_r record;
BEGIN
  SELECT m.id, m.familia_id INTO v_masc, v_duenio FROM mascotas m WHERE m.nombre='Thor' AND m.especie='perro' LIMIT 1;
  SELECT fm.user_id INTO v_duenio FROM familia_miembro fm
   WHERE fm.familia_id=v_duenio AND fm.hasta IS NULL AND fm.rol='adulto_titular' LIMIT 1;
  SELECT pr.id INTO v_prest FROM prestadores pr JOIN prestador_servicios ps ON ps.prestador_id=pr.id
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;

  -- ⓪ La SEGUNDA ventana: sábados, distinta de la de L-V.
  INSERT INTO guarderia_franjas (prestador_id, tipo, dias_semana, desde, hasta, zona_horaria, activo)
  VALUES (v_prest, 'recogida',   ARRAY[6], '09:00', '11:00', 'America/Guayaquil', true),
         (v_prest, 'devolucion', ARRAY[6], '17:00', '19:00', 'America/Guayaquil', true);
  -- y el sábado tiene que ser día operativo para que el lugar aparezca
  UPDATE guarderia_espacios SET dias_operacion = ARRAY[1,2,3,4,5,6] WHERE prestador_id = v_prest;

  SELECT d::date INTO v_lun FROM generate_series(public.hoy_local()+1, public.hoy_local()+20,'1 day') d
   WHERE EXTRACT(dow FROM d)::int BETWEEN 1 AND 5 LIMIT 1;
  SELECT d::date INTO v_sab FROM generate_series(public.hoy_local()+1, public.hoy_local()+20,'1 day') d
   WHERE EXTRACT(dow FROM d)::int = 6 LIMIT 1;

  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT * INTO v_r FROM public.obtener_guarderias_disponibles(v_lun, v_masc, NULL, NULL, 'dia') LIMIT 1;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  INSERT INTO _res(linea) VALUES (format('DIA HABIL %s: recoge %s-%s devuelve %s-%s',
    v_lun, v_r.recoge_desde, v_r.recoge_hasta, v_r.devuelve_desde, v_r.devuelve_hasta));

  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_duenio,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT * INTO v_r FROM public.obtener_guarderias_disponibles(v_sab, v_masc, NULL, NULL, 'dia') LIMIT 1;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  INSERT INTO _res(linea) VALUES (format('SABADO    %s: recoge %s-%s devuelve %s-%s',
    v_sab, v_r.recoge_desde, v_r.recoge_hasta, v_r.devuelve_desde, v_r.devuelve_hasta));

  IF v_r.recoge_desde = TIME '09:00' AND v_r.recoge_hasta = TIME '11:00' THEN
    INSERT INTO _res(linea) VALUES ('OK: el sabado trae SU ventana, no el envolvente 07:00-11:00');
  ELSE
    INSERT INTO _res(linea) VALUES (format('ROJO: el sabado trajo %s-%s', v_r.recoge_desde, v_r.recoge_hasta));
  END IF;
END $$;
SELECT n, linea FROM _res ORDER BY n;
ROLLBACK;

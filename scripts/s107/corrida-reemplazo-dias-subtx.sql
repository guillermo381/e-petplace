-- ═══════════════════════════════════════════════════════════════════════════
-- S107-C · **EL SELECTOR DE DÍAS, PROBADO CONTRA EL MOTOR.**
--
-- La pregunta que esta corrida contesta —y que ningún typecheck contesta— es:
-- **cuando la pantalla mueve el patrón de L-V a L-S, ¿queda UNA ventana o
-- quedan DOS?** Ese era el defecto que tenía cerrado el selector: `definir`
-- upserta por `(prestador, tipo, dias_semana)` y dejaba la vieja viva.
--
-- 🔴 Todo entre `BEGIN` y `ROLLBACK`. La salida va a una TABLA, jamás a
--    `RAISE NOTICE` — un verde mudo es la peor forma de verde (firma founder).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
CREATE TEMP TABLE _res(n serial, linea text) ON COMMIT DROP;
DO $$
DECLARE
  v_prest uuid; v_antes int; v_despues int; v_inactivas int;
  v_dias int[]; v_ops int[]; v_r jsonb; v_rol text := current_user; v_titular uuid;
BEGIN
  SELECT pr.id INTO v_prest FROM prestadores pr
    JOIN prestador_servicios ps ON ps.prestador_id = pr.id
   WHERE ps.tipo_servicio = 'guarderia_dia' AND ps.activo LIMIT 1;
  IF v_prest IS NULL THEN
    INSERT INTO _res(linea) VALUES ('🔴 SIN LUGAR DE GUARDERÍA — la corrida no prueba nada'); RETURN;
  END IF;

  -- ⓪ EL ESTADO DE PARTIDA, medido y no supuesto
  SELECT count(*) INTO v_antes FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = 'recogida' AND activo;
  SELECT dias_semana INTO v_dias FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = 'recogida' AND activo LIMIT 1;
  INSERT INTO _res(linea) VALUES (format('ANTES · recogidas activas=%s · dias=%s', v_antes, v_dias));

  -- ① ¿EXISTE LA PUERTA? Si no existe, el selector es una pantalla que miente.
  IF to_regprocedure('public.reemplazar_franjas_guarderia(uuid,text,jsonb)') IS NULL THEN
    INSERT INTO _res(linea) VALUES ('🔴 `reemplazar_franjas_guarderia` NO EXISTE con esa firma');
    RETURN;
  END IF;
  INSERT INTO _res(linea) VALUES ('✓ la puerta existe');

  -- La puerta EXIGE sesión (`auth_required` medido). Entramos como el titular
  -- del lugar — que es quien la va a tocar desde el taller.
  SELECT pr.user_id INTO v_titular FROM prestadores pr WHERE pr.id = v_prest;
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
    json_build_object('sub', v_titular, 'role', 'authenticated')::text);

  -- ② EL ACTO QUE ESTABA PROHIBIDO: mover el patrón de L-V a L-S
  SELECT public.reemplazar_franjas_guarderia(
    v_prest, 'recogida',
    jsonb_build_array(jsonb_build_object(
      'desde','07:00','hasta','09:00','dias_semana', jsonb_build_array(1,2,3,4,5,6)))
  ) INTO v_r;
  INSERT INTO _res(linea) VALUES (format('REEMPLAZO devolvió: %s', v_r));

  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  -- ③ EL VEREDICTO: **una sola ventana viva**, con el patrón nuevo
  SELECT count(*) INTO v_despues FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = 'recogida' AND activo;
  SELECT dias_semana INTO v_dias FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = 'recogida' AND activo LIMIT 1;
  SELECT count(*) INTO v_inactivas FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = 'recogida' AND NOT activo;
  INSERT INTO _res(linea) VALUES (format('DESPUÉS · activas=%s · dias=%s · inactivas=%s',
    v_despues, v_dias, v_inactivas));
  INSERT INTO _res(linea) VALUES (
    CASE WHEN v_despues = 1 AND v_dias @> ARRAY[6]
         THEN '✅ UNA ventana viva con el sábado adentro — el patrón se movió de verdad'
         ELSE format('🔴 quedaron %s ventanas vivas — el defecto sigue', v_despues) END);
  INSERT INTO _res(linea) VALUES (
    CASE WHEN v_inactivas > 0 THEN '✓ la vieja quedó INACTIVA, no borrada (la historia se conserva)'
         ELSE '⚠️ no quedó ninguna inactiva: o no había vieja, o se borró duro' END);

  -- ④ LA OTRA MITAD: los días de OPERACIÓN del espacio, que son los que le
  --    pintan `no_opera` a la familia. Sin esto el sábado se elige y no abre.
  PERFORM public.definir_espacio_guarderia(
    v_prest, (SELECT nombre FROM guarderia_espacios WHERE prestador_id=v_prest LIMIT 1),
    (SELECT capacidad_por_dia FROM guarderia_espacios WHERE prestador_id=v_prest LIMIT 1),
    ARRAY[1,2,3,4,5,6], true);
  SELECT dias_operacion INTO v_ops FROM guarderia_espacios WHERE prestador_id = v_prest LIMIT 1;
  INSERT INTO _res(linea) VALUES (
    CASE WHEN v_ops @> ARRAY[6] THEN format('✅ el espacio ABRE sábados · dias_operacion=%s', v_ops)
         ELSE format('🔴 el espacio NO abre sábados · dias_operacion=%s', v_ops) END);
END $$;
SELECT n, linea FROM _res ORDER BY n;
ROLLBACK;

-- ============================================================================
-- S87-A · LA SESIÓN DE SOMBRA — para el ojo del founder (§10.2)
--
-- ⚠️ FIXTURE DECLARADO. Corre in-txn y termina en ROLLBACK: NADA queda en la
-- base. Los escenarios están FABRICADOS a propósito — con 1 suscripción y 3
-- bonos vivos, la lectura real serían tres filas y habría que adivinar el
-- criterio del motor. Acá se lo ve trabajando sobre casos reconocibles.
--
-- DOS FAMILIAS, y esa es la clave de la lectura:
--   · FAMILIA A — sigue activa. Muestra lo que SÍ sale, y lo que no sale por
--     consentimiento (la promo que nace apagada sin que nadie la apague).
--   · FAMILIA B — entra en memorial a mitad del fixture. Muestra el silencio:
--     lo ya encolado se purga, lo nuevo muere, y SOLO lo de la cuenta sobrevive.
-- Sin separarlas, la purga del memorial se lleva los casos normales y no se ve
-- el motor dejando pasar nada.
-- ============================================================================
BEGIN;

DO $$
DECLARE v_a uuid; v_ua uuid; v_b uuid; v_ub uuid; v_ajeno uuid := '31bb74c0-a769-4ce0-9db8-65d9b33f7652';
BEGIN
  SELECT m.id, fm.user_id INTO v_a, v_ua
    FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id
   WHERE m.estado_vida='activa' AND fm.hasta IS NULL ORDER BY m.nombre LIMIT 1;
  SELECT m.id, fm.user_id INTO v_b, v_ub
    FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id
   WHERE m.estado_vida='activa' AND fm.hasta IS NULL AND m.familia_id <>
        (SELECT familia_id FROM mascotas WHERE id=v_a) ORDER BY m.nombre LIMIT 1;

  -- ══ FAMILIA A · sigue activa ══
  PERFORM registrar_intencion_notificacion('cita_recordatorio', v_ua, v_a, NULL,'{}'::jsonb,'s:A-cita');
  PERFORM registrar_intencion_notificacion('paquete_vence',     v_ua, v_a, NULL,'{}'::jsonb,'s:A-paquete');
  PERFORM registrar_intencion_notificacion('promocion',         v_ua, v_a, NULL,'{}'::jsonb,'s:A-promo');
  PERFORM registrar_intencion_notificacion('cita_recordatorio', v_ua, v_a, NULL,'{}'::jsonb,'s:A-cita'); -- duplicado
  PERFORM registrar_intencion_notificacion('cita_recordatorio', v_ajeno, v_a, NULL,'{}'::jsonb,'s:A-ajeno');

  -- ══ FAMILIA B · encola primero, y DESPUÉS pierde a su mascota ══
  PERFORM registrar_intencion_notificacion('programa_vence',    v_ub, v_b, NULL,'{}'::jsonb,'s:B-encolada');
  UPDATE mascotas SET estado_vida='fallecida' WHERE id = v_b;
  PERFORM registrar_intencion_notificacion('cita_recordatorio', v_ub, v_b, NULL,'{}'::jsonb,'s:B-post');
  PERFORM registrar_intencion_notificacion('sistema',           v_ub, v_b, NULL,'{}'::jsonb,'s:B-cuenta');
END $$;

SELECT set_config('request.jwt.claims',
  json_build_object('sub',(SELECT ur.user_id FROM user_roles ur WHERE ur.role='admin' LIMIT 1),
                    'role','authenticated')::text, true);

-- Ventana ancha A PROPÓSITO: incluye las 26 filas de legado, que el founder
-- tiene que ver marcadas como lo que son.
SELECT que, categoria, canal, a_quien, sobre, resultado, por_que, modo
  FROM leer_sombra_notificaciones(now() - interval '120 days', now());

ROLLBACK;

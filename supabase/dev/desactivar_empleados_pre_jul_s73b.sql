-- S73-B · DESACTIVACIÓN de los 3 empleados activos pre-jul (directiva
-- founder: lo anterior al 1-jul es borrable salvo catálogos; la PURGA es
-- D-492 de A — acá NO se borra nada: activo=false, reversible).
--
-- ESTADO: PROPUESTA — cambio de DATOS, espera OK founder antes de correr.
--
-- Las 3 filas (UUIDs COMPLETOS relevados contra DB viva 21-jul; todas de
-- Satori Latam sas 2052f109, creadas 10-may-2026, 0 citas asignadas):
--   2e989931-b884-4c04-9971-3be4b9bd0319  Test Empleado · test@test.com
--   b45e7524-858a-416b-a194-4789b6880dc2  Nuevo 2 · nuevo_test2@e-petplace.com
--   2fc4adc8-0087-4365-9ee8-b96b1ac0c292  Diana · diana23434@gmail.com
-- Las 2 inactivas (4fe0ed86… Guillermo S · 8576a8b3… Diana S) no se
-- tocan: ya están activo=false.
--
-- Efecto: DOBLE PUERTA — cero rol en la hija Y activo=false ⇒ ni el
-- helper ni ninguna de las 28 policies (todas exigen pe.activo=true)
-- les dan lectura. El gate D-464 aterriza sin empleado activo sin rol.
-- Los ACTOS quedan (letra §4: la salida preserva; acá ni siquiera hay —
-- 0 citas asignadas). Reversible: activo=true los vuelve, sin pérdida.

BEGIN;

UPDATE prestador_empleados
SET activo = false
WHERE id IN (
  '2e989931-b884-4c04-9971-3be4b9bd0319'::uuid,
  'b45e7524-858a-416b-a194-4789b6880dc2'::uuid,
  '2fc4adc8-0087-4365-9ee8-b96b1ac0c292'::uuid
);

-- Verificación imperativa en la MISMA transacción:
DO $$
DECLARE v_activos_sin_rol integer;
BEGIN
  -- exactamente 3 filas tocadas se verifica por el estado final:
  -- CERO empleados activos con rol legacy 'empleado' en toda la DB
  SELECT count(*) INTO v_activos_sin_rol
  FROM prestador_empleados pe
  WHERE pe.rol = 'empleado' AND pe.activo = true;
  IF v_activos_sin_rol <> 0 THEN
    RAISE EXCEPTION 'quedan % empleados activos sin rol adjudicado', v_activos_sin_rol;
  END IF;
END $$;

COMMIT;

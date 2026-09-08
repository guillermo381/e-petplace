-- S114-A · ⑦ · la bienvenida de una sola vez cuando la mascota vuelve de perdida
-- Firma founder (7-sep-2026): al volver a activa, Nexo NO celebra ni menciona la
-- ausencia ni pregunta qué pasó. Retoma sin ceremonia. La ÚNICA línea permitida
-- es «Qué bueno tenerlo de vuelta.» y va UNA sola vez. Los recordatorios que se
-- apagaron vuelven solos por el gate dinámico (generar_avisos_coach = 'activa').
--
-- Mecanismo: un flag en la mascota que el trigger prende SÓLO en la transición
-- perdida→activa, y que el Coach CONSUME atómicamente al mostrar la bienvenida
-- (una sola vez, a prueba de doble apertura).
-- 76(g): NO RIGE — columna aditiva + trigger, sin backfill (nace en false).
BEGIN;

ALTER TABLE mascotas
  ADD COLUMN IF NOT EXISTS bienvenida_regreso_pendiente boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN mascotas.bienvenida_regreso_pendiente IS
  'S114 ⑦ · true SÓLO tras la transición perdida→activa, hasta que el Coach muestra la bienvenida una vez y lo consume.';

CREATE OR REPLACE FUNCTION public._mascota_marca_regreso()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  -- SÓLO la vuelta de perdida enciende la bienvenida. Cualquier otra transición
  -- (activa→perdida, activa→fallecida, etc.) no la toca.
  IF OLD.estado_vida = 'perdida' AND NEW.estado_vida = 'activa' THEN
    NEW.bienvenida_regreso_pendiente := true;
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_mascota_marca_regreso ON mascotas;
CREATE TRIGGER trg_mascota_marca_regreso
  BEFORE UPDATE OF estado_vida ON mascotas
  FOR EACH ROW EXECUTE FUNCTION public._mascota_marca_regreso();

COMMIT;

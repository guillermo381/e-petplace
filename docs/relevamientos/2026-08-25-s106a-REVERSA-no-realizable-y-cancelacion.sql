-- REVERSA de 20260826230000_s106a_no_realizable_y_cancelacion.sql — ANTES.
--
-- QUÉ DESHACE: borra las dos RPC nuevas, la tabla de solicitudes de
-- devolución, y devuelve el CHECK de `estado` a su vocabulario sin
-- 'no_realizable'. Devuelve `cancelar_cita_suelta` a aceptar telemedicina.
--
-- ⚠️ QUÉ **NO** DESHACE:
--   · 🔴 **`DROP TABLE solicitudes_devolucion` BORRA PLATA PENDIENTE DE
--     DEVOLVER.** Es el único registro de que a alguien hay que devolverle
--     dinero. Si esta reversa corre con filas `pendiente`, **esas personas
--     dejan de existir para soporte.** Exportar la tabla ANTES, sin
--     excepción.
--   · El CHECK vuelve atrás **solo si ninguna cita quedó en
--     'no_realizable'** — si quedó alguna, el ALTER falla y hay que decidir
--     qué se hace con esas citas ANTES. La reversa no las reescribe sola: no
--     puede saber si fueron canceladas, completadas o qué.

BEGIN;

DROP FUNCTION IF EXISTS public.cancelar_teleconsulta(uuid);
DROP FUNCTION IF EXISTS public.marcar_teleconsulta_no_realizable(uuid, text);

ALTER TABLE public.evento_cita_servicio DROP CONSTRAINT IF EXISTS evento_cita_servicio_estado_check;
ALTER TABLE public.evento_cita_servicio ADD CONSTRAINT evento_cita_servicio_estado_check
  CHECK (estado = ANY (ARRAY['pendiente','confirmada','en_curso','completada','cancelada','no_show','rechazada']));

DROP TABLE IF EXISTS public.solicitudes_devolucion;

-- `cancelar_cita_suelta` vuelve a su versión de la migración 20260826200000
-- (sin el corte por telemedicina). Se restaura desde esa migración, que SÍ
-- vive en el repo — a diferencia del cuerpo del hold, acá no hace falta
-- embeber nada.
\echo 'Restaurar cancelar_cita_suelta desde supabase/migrations/20260826200000_s106a_ventana_cancelacion_parametro.sql (sección 3)'

COMMIT;

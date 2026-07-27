-- REVERSA de la migracion S78-A6 (motor de recepcion). Escrita ANTES de
-- aplicar, el 26-jul-2026.
--
-- La migracion es ADITIVA PURA: una columna nullable y tres funciones
-- nuevas. No toca una sola fila existente ni modifica nada vivo.
--
-- NOTA HONESTA: revertir el CODIGO no revierte los DATOS. Los
-- `llegada_en` ya estampados se pierden con el DROP COLUMN — y esa
-- perdida es IRREVERSIBLE (no hay copia en otra tabla: el timestamp de
-- llegada vive solo ahi). Si la reversa se corre con llegadas ya
-- registradas, se pierde el registro de a que hora entro cada mascota.
-- Antes de correr el DROP COLUMN con datos vivos: volcar la columna.
--
--   SELECT id, llegada_en FROM evento_cita_servicio WHERE llegada_en IS NOT NULL;

DROP FUNCTION IF EXISTS public.obtener_solicitudes_mostrador(uuid);
DROP FUNCTION IF EXISTS public.obtener_jornada_recepcion(uuid, date);
DROP FUNCTION IF EXISTS public.registrar_llegada(uuid);

ALTER TABLE public.evento_cita_servicio DROP COLUMN IF EXISTS llegada_en;

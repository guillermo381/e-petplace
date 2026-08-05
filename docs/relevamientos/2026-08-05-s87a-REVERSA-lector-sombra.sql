-- REVERSA de `20260805020000_lote1_lector_sombra.sql` (S87-A).
-- Escrita ANTES de aplicar.
--
-- ⚠️ NOTA DE DATOS: la reversa del LECTOR es limpia (es solo un lector).
-- La de la PUERTA no lo es del todo: `registrar_intencion_notificacion` se
-- reemplaza para que el registro de sombra guarde ademas el CANAL ELEGIDO.
-- Revertir a la version anterior NO borra datos, pero deja de registrar por
-- donde habria salido cada intencion — y sin ese dato la sesion de sombra
-- del founder no puede contestar una de sus tres preguntas.
--
-- El cuerpo viejo de la puerta vive en la migracion `20260805010000`: si hay
-- que revertir, se re-aplica ESE cuerpo, no se improvisa uno.

BEGIN;
DROP FUNCTION IF EXISTS public.leer_sombra_notificaciones(timestamptz, timestamptz);
-- La puerta se restaura re-aplicando el bloque ③ de 20260805010000.
COMMIT;

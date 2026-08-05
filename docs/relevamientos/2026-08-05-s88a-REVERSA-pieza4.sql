-- REVERSA de `20260805110000_lote2_pieza4_killswitch_techo.sql` (S88-A).
-- Escrita ANTES de aplicar.
--
-- ⚠️ NOTA DE DATOS: aditiva (tabla de config + dos columnas de catálogo + el
-- despachador + un REPLACE del lector). Revertir no pierde intenciones.
--
-- PERO revertir DEJA AL MOTOR SIN MODO DE PARARSE, y eso choca de frente con
-- la vara de S88: «ningún mensaje sale sin que el modo de pararlo exista
-- construido y probado». Si se revierte, el transporte NO puede encenderse
-- hasta que ④ vuelva. Se declara acá para que nadie lo descubra después.
--
-- El cuerpo anterior de `leer_sombra_notificaciones` vive en la migración
-- `20260805020000`: si hay que revertir, se re-aplica ESE, no se improvisa.

BEGIN;

DROP FUNCTION IF EXISTS public.despachar_notificaciones(boolean);
DROP TABLE IF EXISTS public.notificacion_config;

ALTER TABLE public.cat_notificacion_categorias
  DROP COLUMN IF EXISTS vigencia_horas;

COMMIT;

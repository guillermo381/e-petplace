-- REVERSA de `20260805140000_lote2_canal_transporte_vivo.sql` (S88-A).
-- Escrita ANTES. Revertir DEVUELVE la elección a ciegas: push ganaría sin
-- transporte y las intenciones quedarían encoladas esperando un tren que no
-- existe (el hallazgo del gate del primer envío, reabierto). El cuerpo
-- anterior de la puerta vive en 20260805020000.
BEGIN;
ALTER TABLE public.cat_notificacion_canales DROP COLUMN IF EXISTS transporte_vivo;
-- la puerta: re-aplicar el cuerpo de 20260805020000.
COMMIT;

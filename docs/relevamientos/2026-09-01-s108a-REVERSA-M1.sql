-- REVERSA de 20260901100000_s108a_riel_cobro_guarderia.sql
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ QUÉ NO DESHACE: si para cuando esto corra ya existen intentos de pago
--    apuntando a `guarderia_suscripcion_id`, el DROP de la columna **borra el
--    vínculo entre esos cobros y su mandato**. La plata cobrada NO se devuelve
--    y los intentos quedan sin sujeto. Revertir con intentos vivos exige
--    primero decidir qué pasa con ellos — no es un rollback limpio.
--
-- ⚠️ Y el CHECK vuelve a CINCO sujetos: cualquier fila con
--    `guarderia_suscripcion_id` no nulo lo VIOLA ⇒ el ALTER falla y avisa,
--    que es lo correcto: no se revierte en silencio sobre datos vivos.

BEGIN;

ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer
 + (cita_id IS NOT NULL)::integer
 + (recurrencia_id IS NOT NULL)::integer
 + (suscripcion_servicio_id IS NOT NULL)::integer
 + (bono_id IS NOT NULL)::integer) = 1
);

ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_guarderia_susc_viaja_con_su_periodo;
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS guarderia_suscripcion_periodo;
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS guarderia_suscripcion_id;

ALTER TABLE public.bonos DROP CONSTRAINT IF EXISTS chk_bono_hold_solo_si_no_pagado;
ALTER TABLE public.bonos DROP COLUMN IF EXISTS pago_expira_en;

COMMIT;

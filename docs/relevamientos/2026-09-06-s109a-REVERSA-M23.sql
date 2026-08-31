-- REVERSA de 20260906120000_s109a_plan_paseo_columnas_y_riel.sql — ANTES.
-- ⚠️ Revertir borra `tarjeta_id`, `dia_de_cobro`, `riel` y `pago_expira_en` de
--    las suscripciones. Con eso: el mandato pierde su medio de pago, la
--    renovacion pierde el dia original y VUELVE A DEGRADARLO, y el cron pierde
--    por donde ramificar. Si hay planes contratados por riel DeUna, quedan
--    indistinguibles de los de tarjeta.
BEGIN;
DROP FUNCTION IF EXISTS public.verificar_compuerta_plan(uuid);
DROP FUNCTION IF EXISTS public.confirmar_pago_plan_paseo(uuid);
ALTER TABLE public.suscripciones_servicio DROP CONSTRAINT IF EXISTS chk_susc_riel_valido;
ALTER TABLE public.suscripciones_servicio DROP CONSTRAINT IF EXISTS chk_susc_hold_solo_si_no_pagado;
ALTER TABLE public.suscripciones_servicio DROP CONSTRAINT IF EXISTS chk_susc_dia_de_cobro_valido;
ALTER TABLE public.suscripciones_servicio DROP COLUMN IF EXISTS pago_expira_en;
ALTER TABLE public.suscripciones_servicio DROP COLUMN IF EXISTS dia_de_cobro;
ALTER TABLE public.suscripciones_servicio DROP COLUMN IF EXISTS riel;
ALTER TABLE public.suscripciones_servicio DROP COLUMN IF EXISTS tarjeta_id;
COMMIT;

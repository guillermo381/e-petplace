-- REVERSA de 20260905100000_s108a_programa_sujeto_propio.sql — escrita ANTES.
-- ⚠️ NO deshace: si ya hay intentos apuntando a `programa_contratado_id`, el
--    DROP borra el vínculo entre esos cobros y su programa. Y el CHECK vuelve a
--    SEIS sujetos: cualquier fila con la columna llena lo VIOLA ⇒ el ALTER falla
--    y avisa, que es lo correcto — no se revierte en silencio sobre datos vivos.
BEGIN;
DELETE FROM cat_sujetos_de_pago WHERE codigo='programa';
DROP TRIGGER IF EXISTS trg_programa_congela_desglose ON public.programas_contratados;
DROP FUNCTION IF EXISTS public._trg_programa_congela_desglose();
DROP TABLE IF EXISTS public.programa_desglose;
ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer + (cita_id IS NOT NULL)::integer
 + (recurrencia_id IS NOT NULL)::integer + (suscripcion_servicio_id IS NOT NULL)::integer
 + (bono_id IS NOT NULL)::integer + (guarderia_suscripcion_id IS NOT NULL)::integer) = 1);
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS programa_contratado_id;
ALTER TABLE public.programas_contratados DROP CONSTRAINT IF EXISTS chk_programa_hold_solo_si_no_pagado;
ALTER TABLE public.programas_contratados DROP COLUMN IF EXISTS pago_expira_en;
COMMIT;

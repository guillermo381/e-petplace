-- REVERSA de 20260828230000_s107a_cobro_y_gate_sanitario.sql · ESCRITA ANTES.
--
-- 🔴 QUÉ NO DESHACE:
-- ① **Los intentos de pago que ya apunten a un bono.** El bloque ⓪ ABORTA si
--    existen: quitarle su sujeto a un intento cobrado lo dejaría huérfano, y
--    un cobro sin sujeto es plata que se movió sin traza.
-- ② **Los desgloses de bono ya congelados** se van con su tabla. Si hubo
--    cobros, ese dato es el precio que la familia VIO — por eso ⓪ frena.
-- ③ **Las reservas ya creadas** (citas + estadías). Se quedan; lo que se cae
--    es la puerta que las crea.
BEGIN;

DO $$
DECLARE v_intentos int; v_desgloses int;
BEGIN
  SELECT count(*) INTO v_intentos FROM public.pagos_intentos WHERE bono_id IS NOT NULL;
  SELECT count(*) INTO v_desgloses FROM public.bono_desglose;
  IF v_intentos > 0 OR v_desgloses > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % intento(s) de pago y % desglose(s) apuntan a un bono. Eso es plata con traza — se decide a mano.', v_intentos, v_desgloses;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.reservar_dia_guarderia(uuid, uuid, date);
DROP FUNCTION IF EXISTS public.evaluar_requisitos_guarderia(uuid);
DROP TRIGGER IF EXISTS trg_bono_congela_desglose ON public.bonos;
DROP FUNCTION IF EXISTS public._trg_bono_congela_desglose();
DROP TABLE IF EXISTS public.bono_desglose;

ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT chk_intento_un_solo_sujeto CHECK (
  ((pedido_id IS NOT NULL)::integer + (cita_id IS NOT NULL)::integer
   + (recurrencia_id IS NOT NULL)::integer + (suscripcion_servicio_id IS NOT NULL)::integer) = 1);
ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS bono_id;

ALTER TABLE public.cat_plan_vacunal DROP COLUMN IF EXISTS exigida_guarderia;

COMMIT;

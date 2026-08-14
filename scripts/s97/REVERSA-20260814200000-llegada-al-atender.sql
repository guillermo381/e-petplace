-- REVERSA de 20260814200000_s97a_llegada_al_atender.sql
-- ESCRITA ANTES DE APLICAR.
--
-- QUÉ DESHACE: quita el trigger que estampa `llegada_en` al pasar a
-- `en_curso`, y su función.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que hay que saber antes de correrla:
--   · **Las llegadas que el trigger ya estampó QUEDAN.** Son `timestamptz`
--     reales de citas que efectivamente se atendieron — revertir el mecanismo
--     no las vuelve falsas. **No se borran.**
--   · ⚠️ Y deja un hueco de producto: si el interruptor de D ya apagó el
--     botón «Llegó» en la superficie, revertir esto deja a `llegada_en` **sin
--     ningún escritor por el camino real** — nadie registra llegadas y nada
--     avisa. *Revertir el motor sin revertir el bundle es el modo de falla de
--     S94-PERF, y acá se paga en un dato que se pierde en silencio.*
--   · Si hay que revertir, se revierte **junto con** el bundle que apaga el
--     botón, o se restituye `registrar_llegada` en la superficie primero.

BEGIN;

DROP TRIGGER IF EXISTS trg_cita_llegada_al_atender ON public.evento_cita_servicio;
DROP FUNCTION IF EXISTS public._trg_cita_llegada_al_atender();

COMMIT;

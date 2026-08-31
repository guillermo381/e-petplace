-- REVERSA de 20260907240000_s109a_el_indice_deja_pasar_al_muerto.sql
--
-- ⚠️ REVERTIR ESTO **VUELVE A CONVERTIR EL FRENO EN UN BLOQUEO PERMANENTE.**
--    Con el UNIQUE total, una clave por sujeto deja a una familia cuyo primer
--    intento fue rechazado **sin poder reintentar nunca** — que es el reverso
--    exacto de lo que el founder firmó («frenar si hay un pedido EN CURSO»).
--
-- ⚠️ Y NO SE REVIERTE SOLO: las cuatro funciones que hacen `ON CONFLICT` sobre
--    esta clave llevan el predicado del índice parcial. Revertir el índice sin
--    revertirlas las deja pidiendo un índice que no existe.
--    ⇒ El orden de la reversa es: primero las funciones, después el índice.

BEGIN;

DROP INDEX IF EXISTS public.uq_intento_clave_no_terminal;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT pagos_intentos_clave_idempotencia_key UNIQUE (clave_idempotencia);

-- Las cuatro funciones vuelven a `ON CONFLICT (clave_idempotencia)` sin
-- predicado: sus cuerpos previos viven en sus migraciones y
-- `pg_get_functiondef` los da del objeto. No se transcriben acá.

COMMIT;

-- REVERSA de 20260808000000_s91a_hito_del_alta_emision.sql (escrita ANTES)
--
-- ⚠️ NOTA DE DATOS: revertir el CÓDIGO no revierte los HITOS ya emitidos.
-- Las mascotas dadas de alta mientras la emisión estuvo encendida conservan
-- su evento en `eventos_mascota` y su fila en `evento_hito_narrativo` — y
-- ESO ESTÁ BIEN: son hechos que ocurrieron. Borrarlos sería reescribir la
-- línea de vida de una familia por una decisión de ingeniería.
-- Si de verdad hay que retirarlos, se mide primero:
--   SELECT count(*) FROM evento_hito_narrativo;
-- y se decide en mesa, jamás dentro de una reversa.
--
-- Lo que esta reversa SÍ hace: apaga la emisión futura y deja la tercera
-- clave en el catálogo (una clave sin uso no molesta; borrarla rompería las
-- filas ya emitidas por su FK).

BEGIN;

DROP FUNCTION IF EXISTS public._clave_hito_alta(text, date, text);

-- Los dos bodies SIN emisión son los de la migración 20260807220000, que
-- sigue en el repo: re-aplicar ese archivo restaura el estado previo exacto.
-- No se duplican acá para que no existan DOS fuentes del mismo body
-- divergiendo en silencio (el defecto que L-166 describe).

COMMIT;

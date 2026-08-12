-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812233000_s96_entendimiento_alergia.sql
--
-- Deshace: la tabla `alergia_entendimientos` y su puerta
-- `registrar_entendimiento_alergia` (el productor del «paso explícito de
-- entendimiento que queda registrado» de LETRA_RECORRIDO_DESPENSA_S96 §5.4).
--
-- ⚠️ QUÉ NO DESHACE: nada — pero tirar la tabla DESTRUYE el registro de
--    entendimientos, que es exactamente lo que la letra exige conservar
--    («queda registrado»). Con entendimientos reales adentro esta reversa NO
--    se corre: se corrige hacia adelante.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.registrar_entendimiento_alergia(uuid, uuid, text[]);
DROP TABLE IF EXISTS public.alergia_entendimientos;

COMMIT;

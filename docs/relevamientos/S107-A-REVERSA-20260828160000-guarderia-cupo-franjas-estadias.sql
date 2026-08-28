-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260828160000_s107a_guarderia_cupo_franjas_estadias.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa). S107-A · 28-ago-2026.
--
-- 🔴 QUÉ NO DESHACE, y se dice antes de que alguien la corra creyendo que sí:
--
-- ① **No devuelve las citas de guardería que se hayan creado.** Si al revertir
--    existen filas en `guarderia_estadias`, el DROP se las lleva, pero la
--    `evento_cita_servicio` compañera QUEDA — con su `cita_desglose` y, si
--    alguien pagó, con su `pagos_intentos`. **Revertir el motor no devuelve
--    plata ni borra un cobro.** El bloque ⓪ ABORTA si encuentra estadías, para
--    que esa decisión la tome una persona y no un script.
-- ② **No restaura `especies_elegibles = NULL`** en los cinco tipos de
--    hospedaje. El NULL de origen era FAIL-OPEN (medido: `_mascota_elegible_
--    servicio` lo lee como «todas las especies») ⇒ *revertirlo REABRE la
--    guardería a cualquier especie, contra la letra.* Se deja el valor puesto
--    a propósito. Quien de verdad lo quiera vacío, lo hace a mano y sabiendo.
-- ③ **No borra el COMMENT de lápida de `public.estadias`.** Es documentación
--    de una tabla que ya existía y no la toca de ninguna otra forma.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ⓪ CINTURÓN: no se revierte a ciegas sobre datos vivos.
DO $$
DECLARE v_estadias int; v_espacios int;
BEGIN
  SELECT count(*) INTO v_estadias FROM public.guarderia_estadias;
  SELECT count(*) INTO v_espacios FROM public.guarderia_espacios;
  IF v_estadias > 0 THEN
    RAISE EXCEPTION 'REVERSA ABORTADA: % estadias vivas. Sus citas y sus cobros NO se revierten con esto — decidilo a mano.', v_estadias;
  END IF;
  RAISE NOTICE 'reversa: 0 estadias, % espacios configurados (se pierden).', v_espacios;
END $$;

-- ① Las puertas
DROP FUNCTION IF EXISTS public.cupo_guarderia_del_dia(uuid, date);
DROP FUNCTION IF EXISTS public.definir_espacio_guarderia(uuid, text, integer, integer[], boolean);
DROP FUNCTION IF EXISTS public.declarar_excepcion_espacio_guarderia(uuid, date, boolean, text);
DROP FUNCTION IF EXISTS public.definir_franja_guarderia(uuid, text, time, time, integer[], text);
DROP FUNCTION IF EXISTS public.obtener_franjas_guarderia(uuid);

-- ② Las tablas (hijas primero)
DROP TABLE IF EXISTS public.guarderia_estadias;
DROP TABLE IF EXISTS public.guarderia_espacio_excepciones;
DROP TABLE IF EXISTS public.guarderia_franjas;
DROP TABLE IF EXISTS public.guarderia_espacios;

-- ③ El vocabulario de familia del durante vuelve a los tres oficios.
--    ⚠️ Si alguna atención quedó con familia='guarderia', esto ABORTA sola por
--    el CHECK — y está bien: es el mismo caso del ⓪.
ALTER TABLE public.evento_atencion DROP CONSTRAINT IF EXISTS evento_atencion_familia_check;
ALTER TABLE public.evento_atencion ADD CONSTRAINT evento_atencion_familia_check
  CHECK (familia = ANY (ARRAY['grooming'::text, 'paseo'::text, 'adiestramiento'::text]));

-- ④ El catálogo vuelve a como estaba: los cinco hospedaje reservables.
--    (Ver ② arriba: `especies_elegibles` NO vuelve a NULL, a propósito.)
UPDATE public.tipos_servicio
   SET reservable = true
 WHERE codigo IN ('guarderia_mensual','hotel','hotel_dia','hotel_noche');

COMMIT;

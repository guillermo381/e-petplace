-- REVERSA de 20260807220000_s91a_p_origen_y_coherencia.sql (escrita ANTES)
--
-- ⚠️ DOS NOTAS DE DATOS, las dos importantes:
--
-- (1) Revertir el CÓDIGO no revierte los DATOS: las mascotas que ya se
--     dieron de alta con su origen declarado LO CONSERVAN. Lo que se pierde
--     es la capacidad de volver a guardarlo.
--
-- (2) 🔴 EL CHECK ESTRICTO PUEDE NO PODER REPONERSE. Si al revertir existe
--     alguna fila con `origen IN ('refugio','criadero')` y su id en NULL —o
--     sea, un alta hecha por el camino que esta migración abrió— el
--     `ADD CONSTRAINT` de abajo FALLA y la reversa se detiene. Eso es
--     correcto: significa que hay dato real que el CHECK viejo declaraba
--     imposible. Medir ANTES de correr esta reversa:
--       SELECT count(*) FROM mascotas
--        WHERE origen IN ('refugio','criadero')
--          AND criadero_id IS NULL AND refugio_id IS NULL;
--     Si da > 0: la decisión no es técnica — es qué se hace con esas altas.

BEGIN;

DROP FUNCTION IF EXISTS public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text);

-- El estado previo lo repone la reversa hermana, que tiene los bodies
-- literales de la versión CON p_raza/p_tipo_agua y SIN p_origen:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-alta-dueno-raza-acuario.sql
-- (esa reversa lleva a la versión ANTERIOR a la raza; para volver solo un
--  paso, re-aplicar la migración 20260807183000, que sigue en el repo.)

ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS mascotas_origen_coherencia_check;
ALTER TABLE public.mascotas
  ADD CONSTRAINT mascotas_origen_coherencia_check CHECK (
       ((origen = 'criadero') AND (criadero_id IS NOT NULL) AND (refugio_id IS NULL))
    OR ((origen = 'refugio')  AND (refugio_id  IS NOT NULL) AND (criadero_id IS NULL))
    OR ((origen <> ALL (ARRAY['criadero'::text, 'refugio'::text]))
        AND (criadero_id IS NULL) AND (refugio_id IS NULL))
  );

COMMIT;

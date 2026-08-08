-- REVERSA de 20260808050000_s91a_tres_motores_del_perfil.sql (escrita ANTES)
--
-- ⚠️ TRES NOTAS DE DATOS, en orden de gravedad:
-- (1) `fecha_montaje` se BORRA con la columna: el dato de cuándo se montó un
--     acuario se pierde y no se puede reconstruir de ningún otro campo
--     (`fecha_alta` es OTRO hecho). Medir antes:
--       SELECT count(*) FROM mascotas WHERE fecha_montaje IS NOT NULL;
-- (2) Las razas EDITADAS desde el perfil NO se revierten: el texto queda como
--     lo dejó la familia, que es correcto — era su dato.
-- (3) El lector de la serie de peso desaparece; las filas de
--     `evento_peso_medicion` quedan intactas (nunca las tocó).
--
-- Los bodies previos de las dos RPCs se reponen re-aplicando
-- `20260808010000`, que sigue en el repo.

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_serie_peso(uuid, integer);
DROP FUNCTION IF EXISTS public.actualizar_raza_mascota(uuid, text);
DROP FUNCTION IF EXISTS public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text, text, date);
DROP FUNCTION IF EXISTS public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text, text, date);

ALTER TABLE public.mascotas DROP CONSTRAINT IF EXISTS chk_mascotas_montaje_solo_acuario;
ALTER TABLE public.mascotas DROP COLUMN IF EXISTS fecha_montaje;

COMMIT;

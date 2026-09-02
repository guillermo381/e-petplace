-- REVERSA de 20260908120000_s112a_acta_y_firma.sql — ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE, y es lo mas grave de todas las reversas de S112:
--   · Las FIRMAS ya escritas se PIERDEN con la tabla. Son el expediente
--     probatorio del art. 14 de la Ley 67: hash del texto renderizado, hash del
--     documento fuente, version, sello de servidor, IP hasheada y dispositivo.
--     **Sin eso, una adopcion firmada deja de poder demostrarse.** No hay copia
--     en ningun otro lado.
--   · Las CEDULAS y DOMICILIOS cargados por las personas se pierden con las
--     columnas. Son datos que cada uno escribio a mano.
--   · Los traspasos YA EJECUTADOS **no se revierten**: la mascota sigue en su
--     familia nueva y el hito escrito. Correcto — pero el ACTA que los respalda
--     desaparece, y eso deja adopciones consumadas sin su prueba.
-- ⇒ Esta reversa NO se corre sin decirselo al founder y sin exportar antes
--   `adopcion_firma` entera.
BEGIN;
DROP FUNCTION IF EXISTS public.firmar_acta_adopcion(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.solicitar_codigo_firma(uuid);
DROP FUNCTION IF EXISTS public.obtener_acta_adopcion(uuid);
DROP FUNCTION IF EXISTS public._renderizar_acta(uuid);
DROP TABLE IF EXISTS public.adopcion_firma;
DROP TABLE IF EXISTS public.adopcion_codigo_firma;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cedula, DROP COLUMN IF EXISTS domicilio;
ALTER TABLE public.cuenta_roles DROP COLUMN IF EXISTS numero_acuerdo;
COMMIT;

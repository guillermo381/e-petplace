-- BACKFILL DE LOS 6 NOMBRES — PREPARADO, NO EJECUTADO (S81).
-- ESPERA LA LISTA DEL FOUNDER: reemplazar cada ⟨NOMBRE⟩ y correr fila
-- por fila. El guard es EL MISMO condicional de invitar_prestador v2:
-- solo pisa el SEMBRADO (local-part) o el ausente — si alguien ya
-- declaró su nombre entre hoy y la corrida, SU nombre gana.
-- Verificación al final: las 6 filas con su nombre nuevo, cero extra.
--
-- ⚠️ SATORI SE PREGUNTA (no se inventa): es un tercero real —
--    el nombre lo confirma el founder con la persona.
-- Los 3 DEMO son opcionales (decisión founder: pueden quedar).

-- 1 · Paseos Shyris — titular real de prueba (guillo381+vet1)
UPDATE public.profiles pf SET nombre = '⟨NOMBRE vet1⟩'
 WHERE pf.email = 'guillo381+vet1@gmail.com'
   AND (pf.nombre IS NULL OR trim(pf.nombre) = ''
        OR pf.nombre = split_part(pf.email, '@', 1));

-- 2 · Clínica Los Shyris (guillo381+vet2)
UPDATE public.profiles pf SET nombre = '⟨NOMBRE vet2⟩'
 WHERE pf.email = 'guillo381+vet2@gmail.com'
   AND (pf.nombre IS NULL OR trim(pf.nombre) = ''
        OR pf.nombre = split_part(pf.email, '@', 1));

-- 3 · Satori Latam sas — ⚠️ PREGUNTAR a la persona (satorilatam@gmail.com)
UPDATE public.profiles pf SET nombre = '⟨NOMBRE confirmado por Satori⟩'
 WHERE pf.email = 'satorilatam@gmail.com'
   AND (pf.nombre IS NULL OR trim(pf.nombre) = ''
        OR pf.nombre = split_part(pf.email, '@', 1));

-- 4-6 · DEMO (opcionales — nombres de utilería si el founder quiere
-- que los gates se vean como producción):
-- UPDATE ... 'demo-prestador@epetplace.dev'  → '⟨p.ej. Andrés Paseos⟩'
-- UPDATE ... 'demo-vet@epetplace.dev'        → '⟨p.ej. Aurora Vet⟩'
-- UPDATE ... 'guillo381+wizard@gmail.com'    → '⟨…⟩'

-- VERIFICACIÓN (correr tras los UPDATE):
-- SELECT p.email, p.nombre, (p.nombre = split_part(p.email,'@',1)) AS sigue_sembrado
-- FROM public.profiles p
-- WHERE p.email IN ('guillo381+vet1@gmail.com','guillo381+vet2@gmail.com',
--                   'satorilatam@gmail.com','demo-prestador@epetplace.dev',
--                   'demo-vet@epetplace.dev','guillo381+wizard@gmail.com');
-- NOTA: prestador_empleados.nombre (la fila dueño del espejo) NO se
-- actualiza solo — si el founder quiere el espejo alineado, se corre el
-- UPDATE hermano sobre prestador_empleados con el mismo condicional.

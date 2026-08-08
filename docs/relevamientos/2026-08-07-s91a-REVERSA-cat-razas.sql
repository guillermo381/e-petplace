-- REVERSA de 20260807170000_s91a_d379_cat_razas.sql (escrita ANTES de aplicar)
-- Nota de datos: revertir BORRA el catálogo entero (105 filas de seed).
-- El seed es re-derivable de supabase/dev/mapeo-razas-especies.json — no hay
-- dato de usuario en esta tabla, la pérdida es solo de seed.
-- mascotas.raza NO se toca: siempre fue text libre y lo sigue siendo.

BEGIN;

DROP TABLE IF EXISTS public.cat_razas;

COMMIT;

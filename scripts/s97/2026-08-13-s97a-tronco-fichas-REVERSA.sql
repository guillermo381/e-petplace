-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813210000_s97a_tronco_fichas_ingerible_demanda.sql
--
-- Deshace: `cat_familias_producto.ingerible` · la activación de `accesorio` ·
-- las tres tablas de ficha por familia · `busquedas_sin_resultado` · las dos
-- puertas (`declarar_ficha_producto`, `registrar_busqueda_sin_resultado`).
--
-- ⚠️ QUÉ NO DESHACE Y POR QUÉ NO SE CORRE A LA LIGERA:
--   · Los DROP de las fichas BORRAN datos de ficha cargados (análisis,
--     principios activos, registros Agrocalidad) — no hay backup acá.
--   · Borrar `busquedas_sin_resultado` borra DEMANDA MEDIDA — el argumento
--     comercial que la ley de disponibilidad existe para juntar.
--   · Quitar `ingerible` deja al motor de alergias sin su gobernador: las
--     advertencias vuelven a poder dispararse sobre no-ingeribles.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.declarar_ficha_producto(uuid, jsonb);
DROP FUNCTION IF EXISTS public.registrar_busqueda_sin_resultado(text, text, text);
DROP TABLE IF EXISTS public.busquedas_sin_resultado;
DROP TABLE IF EXISTS public.producto_ficha_nutricional;
DROP TABLE IF EXISTS public.producto_ficha_dosificacion;
DROP TABLE IF EXISTS public.producto_ficha_accesorio;
UPDATE public.cat_familias_producto SET activo = false WHERE codigo = 'accesorio';
ALTER TABLE public.cat_familias_producto DROP COLUMN IF EXISTS ingerible;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · EL MAESTRO ENTERO: `vendible` + las familias que faltaban
-- (orden de mesa 13-ago-2026: «cargá el catálogo maestro ENTERO, los 527»)
--
-- ① `productos.vendible` — LA LÍNEA COMERCIAL COMO DATO (firma founder,
--    13-ago): un producto puede estar en el maestro y NO ser comprable.
--    Nace true por default; los no-vendibles se marcan por DATO, no por
--    ausencia. ⚠️ Los flags de los 19-sin-margen y 6-margen-negativo NO se
--    marcan en esta migración: la regla que produce esos números no es
--    derivable del archivo por ninguna medición corrida (freno declarado en
--    docs/relevamientos/2026-08-13-s97a-carga-catalogo-maestro.md) — se
--    marcan cuando llegue el literal de la mesa.
--
-- ② Familias del maestro: nacen `heno` · `acondicionador_agua` · `sustrato`
--    (activas — la puerta canónica exige familia activa) y `higiene` se
--    REACTIVA. ⚠️ DECLARADO, no escondido: `higiene` estaba inactiva como
--    mecanismo de la firma S96 «TOW fuera del lanzamiento». Esa línea NO se
--    borra — SE MUDA al dato: los productos de las cuatro familias fuera
--    del alcance comercial v1 nacen/quedan `vendible = false` (abajo). La
--    familia activa = puede vivir en el MAESTRO; vendible = se puede
--    comprar; el cuarto ① de la configuración solo ofrece las tres
--    familias comerciales (MODELO_DESPENSA §8.6bis).
--    `entra_al_expediente`: heno = true (es alimento — E2bis: cambia el
--    cuerpo) · acondicionador_agua = false · sustrato = false · higiene
--    conserva false.
--
-- 76(g): NO RIGE — migración aditiva (una columna con default + filas de
-- catálogo); sin backfill de datos de negocio, sin anclas.
-- Bundles vivos (D-662): cero `select('*')` sobre `productos` en wrappers
-- (medido S94-PERF y sostenido); una columna NUEVA no rompe lectores
-- existentes. Los grants de `productos` son POR TABLA (el único
-- column-level de la casa es `prestadores`) ⇒ la columna hereda el SELECT.
-- REVERSA escrita ANTES: scripts/s97/2026-08-13-s97a-vendible-familias-REVERSA.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS vendible boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.productos.vendible IS
  'La línea comercial (firma founder 13-ago-2026): en el maestro pero no '
  'comprable. La vitrina y la recomendación excluyen vendible=false; el '
  'maestro los conserva enteros.';

INSERT INTO public.cat_familias_producto (codigo, nombre, entra_al_expediente, activo)
VALUES ('heno', 'Heno', true, true),
       ('acondicionador_agua', 'Acondicionadores de agua', false, true),
       ('sustrato', 'Sustratos', false, true)
ON CONFLICT (codigo) DO NOTHING;

UPDATE public.cat_familias_producto SET activo = true, updated_at = now()
 WHERE codigo = 'higiene' AND activo = false;

-- La línea comercial de S96, mudada al dato: lo que estaba fuera del
-- lanzamiento por FAMILIA queda no-vendible por DATO.
UPDATE public.productos SET vendible = false
 WHERE familia_codigo IN ('higiene','heno','acondicionador_agua','sustrato');

-- ── Cinturón (aborta si el estado no es el declarado) ──────────────────────
DO $$
DECLARE n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='productos'
                    AND column_name='vendible') THEN
    RAISE EXCEPTION 'CINTURON: vendible no existe';
  END IF;
  SELECT count(*) INTO n FROM public.cat_familias_producto
   WHERE codigo IN ('heno','acondicionador_agua','sustrato','higiene')
     AND activo AND NOT deprecado;
  IF n <> 4 THEN RAISE EXCEPTION 'CINTURON: familias activas esperadas 4, hay %', n; END IF;
  IF EXISTS (SELECT 1 FROM public.productos WHERE vendible IS NULL) THEN
    RAISE EXCEPTION 'CINTURON: vendible con NULL';
  END IF;
END $$;

COMMIT;

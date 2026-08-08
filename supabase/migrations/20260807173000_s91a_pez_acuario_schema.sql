-- ============================================================================
-- S91-A · LA CLÁUSULA DEL PEZ — el schema (firma founder, 7-ago-2026)
-- ============================================================================
-- Firma de mesa (opción A): en el alta, especie «Pez» registra el ACUARIO
-- como sujeto. El nombre pedido es el del acuario; el campo dos es el TIPO DE
-- AGUA (dulce/marino), en espejo de la raza. Técnica: fila de `mascotas` con
-- MARCA DE SISTEMA; bitácora, hitos y papeles cuelgan de ella. NO nace
-- entidad nueva ni membresía — eso es arco propio posterior (D-685: el
-- disparo queda; la «migración de peces v1» prevista ahí MUERE SIN NACER,
-- porque ya no habrá peces-individuo que migrar).
--
-- Mínimo indispensable: dos columnas + coherencia en CHECKs. El arco del
-- acuario ENSANCHA después (habitantes, parámetros del agua, etc.) — nada de
-- eso se anticipa acá.
--
--   · sujeto: 'individuo' (default, todas las filas vivas) | 'acuario'.
--     La marca la pone el MOTOR (las RPCs del alta), jamás el cliente.
--   · tipo_agua: 'dulce' | 'marino' | NULL — solo legal en acuarios.
--   · acuario ⟹ especie='pez' y raza NULL (el campo dos REEMPLAZA a la
--     raza, no convive con ella — letra de la firma).
--
-- Medido antes de escribir: 0 mascotas especie='pez' en la DB ⇒ cero
-- backfill, cero ambigüedad sobre filas vivas (todas nacen 'individuo' por
-- DEFAULT y es correcto).
--
-- Veda 76(g): NO RIGE — aditiva pura (2 columnas con default, sin backfill).
-- D-662 (bundles vivos): los bundles leen mascotas por columnas nombradas o
-- con RLS intacta; dos columnas nuevas con DEFAULT no rompen ningún SELECT
-- vivo. Ningún bundle escribe mascotas directo (puerta única).
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-pez-acuario-schema.sql
-- ============================================================================

BEGIN;

ALTER TABLE public.mascotas
  ADD COLUMN sujeto text NOT NULL DEFAULT 'individuo',
  ADD COLUMN tipo_agua text;

ALTER TABLE public.mascotas
  ADD CONSTRAINT chk_mascotas_sujeto
    CHECK (sujeto IN ('individuo', 'acuario')),
  ADD CONSTRAINT chk_mascotas_acuario_solo_pez
    CHECK (sujeto = 'individuo' OR especie = 'pez'),
  ADD CONSTRAINT chk_mascotas_acuario_sin_raza
    CHECK (sujeto = 'individuo' OR raza IS NULL),
  ADD CONSTRAINT chk_mascotas_tipo_agua
    CHECK (tipo_agua IS NULL OR tipo_agua IN ('dulce', 'marino')),
  ADD CONSTRAINT chk_mascotas_tipo_agua_solo_acuario
    CHECK (tipo_agua IS NULL OR sujeto = 'acuario');

COMMENT ON COLUMN public.mascotas.sujeto IS
  'Cláusula del pez (S91, firma founder): ''acuario'' = la fila registra el SISTEMA, no un individuo. La marca la estampa el motor en el alta cuando especie=pez; el cliente jamás la manda. El arco del acuario (D-685) ensancha sobre esta marca.';
COMMENT ON COLUMN public.mascotas.tipo_agua IS
  'Solo acuarios (sujeto=acuario): dulce | marino. Es el campo dos del alta de pez, en espejo de la raza (que un acuario no tiene).';

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_acuarios int;
  v_agua     int;
BEGIN
  -- Estado que esta migración deja: cero acuarios (el motor que los crea es
  -- la migración hermana 183000; acá solo nace el schema).
  SELECT count(*) INTO v_acuarios FROM mascotas WHERE sujeto <> 'individuo';
  IF v_acuarios <> 0 THEN
    RAISE EXCEPTION 'cinturon_pez: % filas no-individuo tras el ALTER — el DEFAULT no rigio', v_acuarios;
  END IF;

  SELECT count(*) INTO v_agua FROM mascotas WHERE tipo_agua IS NOT NULL;
  IF v_agua <> 0 THEN
    RAISE EXCEPTION 'cinturon_pez: % filas con tipo_agua — debia nacer vacio', v_agua;
  END IF;

  -- La coherencia rechaza lo incoherente (rojo producido en el fixture
  -- aparte; acá se verifica que los 5 CHECKs EXISTEN con su nombre).
  IF (SELECT count(*) FROM pg_constraint
      WHERE conrelid = 'public.mascotas'::regclass
        AND conname IN ('chk_mascotas_sujeto','chk_mascotas_acuario_solo_pez',
                        'chk_mascotas_acuario_sin_raza','chk_mascotas_tipo_agua',
                        'chk_mascotas_tipo_agua_solo_acuario')) <> 5 THEN
    RAISE EXCEPTION 'cinturon_pez: faltan CHECKs de coherencia';
  END IF;
END $$;

COMMIT;

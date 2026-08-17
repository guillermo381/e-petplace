-- S100-A · SE JUBILA `envio_eventos` — UNA AFIRMACIÓN FALSA CON INFRAESTRUCTURA.
--
-- ── EL HALLAZGO (H-09 de D, verificado acá contra la base) ───────────────────
-- `envio_eventos` tenía tabla, FK, RLS, policy de INSERT y grants — **toda la
-- apariencia de una capacidad viva** — y:
--   · **0 filas**
--   · **CERO funciones que insertaran en ella** (buscado por
--     `insert into envio_eventos` sobre `pg_proc` entero)
--   · **CERO migraciones que escribieran en ella** (grep sobre
--     `supabase/migrations/`)
-- Los hitos que SÍ se escriben viven en `envios`: `salio_en` y
-- `hacia_destino_en` (los estampan el despacho y `marcar_en_camino_a_destino`),
-- y `entregado_en` / `verificado_en` (los estampa `entregar_pedido`).
--
-- ── 🔴 POR QUÉ SE JUBILA EN VEZ DE DEJARLA «PARA CUANDO SE USE» ──────────────
-- Porque su modo de falla no es romperse: es **dar verde**. Una sección de
-- «hitos con hora» montada sobre esta tabla **no podría aparecer nunca**, y
-- ningún instrumento la cazaría, porque **una lista vacía es un estado legal**
-- y no se distingue de «todavía no pasó nada».
--
-- **LEY AL CANON (firmada por mesa, S100):** *una tabla con policy y sin
-- escritor no es una capacidad pendiente — es una afirmación falsa con
-- infraestructura.* Misma familia que el índice inexistente citado en un
-- comentario (curado esta misma sesión) y que el token legado con nombre
-- plausible. **Lo caro de estas tres no es el defecto: es que se leen como
-- garantía.**
--
-- ── CENSO DE CONSUMIDORES, ANTES DE TOCAR NADA ──────────────────────────────
-- Medido sobre `origin/main`, `origin/pista-b`, `origin/pista-c` y
-- `origin/pista-d`: los únicos archivos que la nombran son
-- `packages/api/src/wrappers/despensa-seguimiento.ts` (este lector, que deja de
-- leerla en el mismo commit) y `database.types.ts` (generado). **Ninguna
-- pantalla la consume**, y D lo confirmó por su propia medición sobre
-- `apps/cliente/src` entero.
--
-- ── VEDA 76(g): **NO RIGE.** ────────────────────────────────────────────────
-- No hay backfill ni reescritura de filas: la tabla está vacía y se elimina.
--
-- ── REVERSA ─────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-17-s100a-REVERSA-jubilar-envio-eventos.sql`,
-- escrita ANTES, y declarando que **revertirla no recupera dato alguno**: solo
-- vuelve a poner de pie la trampa, y que si alguna vez se revierte **tiene que
-- traer su productor en el mismo acto**.

BEGIN;

-- CINTURÓN ①: no se jubila una tabla con datos. Si alguien escribió mientras
-- tanto, esta migración ABORTA en vez de borrarlos.
DO $$
DECLARE v_n bigint;
BEGIN
  SELECT count(*) INTO v_n FROM public.envio_eventos;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: envio_eventos tiene % fila(s) — apareció un escritor y la premisa de esta migración ya no vale', v_n;
  END IF;
END $$;

DROP TABLE IF EXISTS public.envio_eventos;

-- CINTURÓN ②: se verifica que la tabla YA NO EXISTE. Un `DROP ... IF EXISTS`
-- sobre un nombre mal escrito sale en verde sin haber borrado nada — el mismo
-- silencio que esta migración vino a sacar del sistema.
DO $$
BEGIN
  IF to_regclass('public.envio_eventos') IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN: envio_eventos sigue existiendo después del DROP';
  END IF;
  RAISE NOTICE 'JUBILADA: envio_eventos ya no existe · los hitos vivos son salio_en · hacia_destino_en · entregado_en, en envios';
END $$;

COMMIT;

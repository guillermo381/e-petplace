-- ═══════════════════════════════════════════════════════════════════════════
-- S100d-A · EL LOTE DE LAS CUATRO SIN CONSUMIDORES DEJA DE SALTAR LA RLS
-- Firma del founder, 18-ago-2026, sobre el censo de consumidores.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── QUÉ SON Y POR QUÉ ESTAS CUATRO ────────────────────────────────────────
-- El censo de S100d halló **once** vistas sin `security_invoker` legibles por
-- `anon` ⇒ corren con los privilegios de su dueño (`postgres`) y **la RLS de
-- las tablas de abajo no se evalúa**. Con la anon key —que **viaja pública en
-- cada bundle, por diseño**— las once devolvían `HTTP 200`.
--
-- El lote se partió por su **censo de consumidores**, medido sobre los SIETE
-- repos (`e-petplace-admin`, `-prestadores`, `-v2`, `-B`, `-C`,
-- `-sistema-pruebas`, monorepo), excluyendo `node_modules`, `dist/` y tipos
-- generados:
--
--     v_conversion_funnel      → 0 consumidores
--     v_resenas_todas          → 0 consumidores   (S95 midió lo mismo: dos censos, un cero)
--     v_daas_eligible_users    → 0 consumidores
--     v_criaderos_publicos     → 0 consumidores
--     ───────────────────────────────────────────
--     las otras SEIS            → solo `e-petplace-admin`  ⇒ NO entran acá
--
-- **Éstas cuatro no pueden romper un tablero que no las lee.** Las seis del
-- admin quedan como deuda con dueño founder: cerrarlas le deja el tablero en
-- blanco **con certeza**, y eso se decide con fecha.
--
-- ── ⚠️ POR QUÉ AHORA Y NO DESPUÉS, que es la parte que se malinterpreta ────
-- Dos de las cuatro devuelven **cero filas** hoy (`v_resenas_todas`,
-- `v_conversion_funnel`). **Devuelven cero porque están VACÍAS, no porque
-- estén cerradas.** Se pueblan solas con la primera venta y la primera reseña.
-- *Un cero de hoy no es un control* — la puerta está abierta y el cuarto se va
-- a llenar solo.
--
-- Lo que exponen cuando se llenen:
--   · `v_resenas_todas` → `user_id`, `autor_nombre`, `comentario` y
--     **`es_visible`**: incluidas las reseñas marcadas como NO visibles.
--   · `v_daas_eligible_users` → `user_id` y su consentimiento DaaS.
--   · `v_conversion_funnel` → registros, carritos y checkouts por día.
--   · `v_criaderos_publicos` → criaderos y su calificación (el más benigno; va
--     en el lote porque tiene cero consumidores y el costo es cero).
--
-- ── VEDA 76(g): NO RIGE ───────────────────────────────────────────────────
-- DDL sobre vistas. Cero backfill, cero filas tocadas, cero anclas.
--
-- ── REVERSA ───────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar, en
-- `docs/relevamientos/2026-08-18-s100d-REVERSA-lote-cuatro-vistas.sql`, y
-- declara que revertirla **REABRE cuatro puertas a internet** — con el
-- argumento «total, hoy dan cero» explícitamente descartado adentro.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER VIEW public.v_conversion_funnel     SET (security_invoker = true);
ALTER VIEW public.v_resenas_todas         SET (security_invoker = true);
ALTER VIEW public.v_daas_eligible_users   SET (security_invoker = true);
ALTER VIEW public.v_criaderos_publicos    SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — con sus DOS brazos
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_vista   text;
  v_invoker text;
  v_faltan  int := 0;
BEGIN
  -- (a) las cuatro quedaron con la opción puesta
  FOREACH v_vista IN ARRAY ARRAY[
    'v_conversion_funnel', 'v_resenas_todas', 'v_daas_eligible_users', 'v_criaderos_publicos'
  ] LOOP
    SELECT option_value INTO v_invoker
      FROM pg_class c, pg_options_to_table(c.reloptions)
     WHERE c.oid = ('public.' || v_vista)::regclass
       AND option_name = 'security_invoker';

    IF v_invoker IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION
        'CINTURÓN (a): % sigue sin security_invoker (valor: %) — seguiría saltando la RLS',
        v_vista, coalesce(v_invoker, 'ausente');
    END IF;
    v_faltan := v_faltan + 1;
  END LOOP;

  IF v_faltan <> 4 THEN
    RAISE EXCEPTION 'CINTURÓN (a): se verificaron % vistas y son 4', v_faltan;
  END IF;

  -- (b) EL BRAZO QUE PROTEGE LO QUE **NO** SE VINO A TOCAR.
  -- Las seis del admin quedan ABIERTAS a propósito, por decisión con fecha. Si
  -- alguien las cerrara «de paso» por prolijidad, el tablero del founder se
  -- apaga sin que nadie lo haya decidido. *Esta migración también protege lo
  -- que deliberadamente dejó como estaba.*
  SELECT count(*) INTO v_faltan
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN ('v_pitch_metrics','v_mrr','v_gmv_mensual',
                       'v_metricas_tiempo_real','v_crecimiento_usuarios','v_ranking_usuarios')
     AND coalesce((SELECT option_value FROM pg_options_to_table(c.reloptions)
                   WHERE option_name = 'security_invoker'), 'false') = 'true';

  IF v_faltan <> 0 THEN
    RAISE EXCEPTION
      'CINTURÓN (b): % de las SEIS del admin quedaron con security_invoker — no era el alcance de esta migración',
      v_faltan;
  END IF;
END
$cinturon$;

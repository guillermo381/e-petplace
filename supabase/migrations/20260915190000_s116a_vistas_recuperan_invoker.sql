-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · LAS DOS VISTAS RECUPERAN `security_invoker` — cura de un defecto
-- que introdujo la migración de al lado, HOY, y que cazó un gate.
--
-- 🔴 QUÉ PASÓ: `20260915180000` recreó `v_prestadores_publicos` y
-- `v_vitrina_publicada` con `CREATE OR REPLACE VIEW` **sin repetir sus
-- opciones**, y eso les borró `security_invoker`. `verify:vistas-invoker` lo
-- marcó al instante — *con `anon` con SELECT encima, que es lo que lo vuelve
-- grave: una vista sin invoker corre como su DUEÑO y atraviesa la RLS.*
--
-- ── MEDIDO, no recordado ───────────────────────────────────────────────────
-- Se creó una vista sonda con la opción, se la reemplazó sin ella, y se leyó
-- `pg_class.reloptions` en los dos momentos:
--     ① con la opción ............ security_invoker=on
--     ② tras CREATE OR REPLACE ... (ninguna)
-- ⇒ **la opción NO sobrevive a un `CREATE OR REPLACE` que no la repita.** No es
-- una particularidad de estas dos vistas: es cómo funciona, y por eso la sonda
-- valía más que buscarlo en la documentación. La sonda se borró.
--
-- ⚠️ **LA LECCIÓN, que es más cara que la cura:** *una vista se recrea con
-- TODAS sus opciones o se recrea a medias, y lo que se cae en silencio es
-- justamente lo que la protege.* El `CREATE OR REPLACE` no falla, no avisa, y
-- deja una vista que **funciona igual y protege menos**.
--
-- ⚠️ ALCANCE: SÓLO las dos que toqué. `v_gmv_mensual`, `v_metricas_tiempo_real`
-- y `v_motivos_resueltos` **también están sin invoker y NO son de esta tanda**:
-- estaban así antes (medido), son de otro dominio, y curarlas de paso sería
-- cambiar el alcance de una RLS que nadie de esta sesión revisó.
--
-- 76(g): NO RIGE — sólo reloptions, cero datos.
-- REVERSA: no la necesita — devolver una vista a «sin invoker» es el defecto.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER VIEW public.v_prestadores_publicos SET (security_invoker = on);
ALTER VIEW public.v_vitrina_publicada    SET (security_invoker = on);

DO $cint$
DECLARE v text; v_n int := 0;
BEGIN
  FOREACH v IN ARRAY ARRAY['v_prestadores_publicos','v_vitrina_publicada'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relname=v
         AND 'security_invoker=on' = ANY(coalesce(c.reloptions,'{}'::text[]))
    ) THEN
      RAISE EXCEPTION 'cinturon: % sigue SIN security_invoker', v;
    END IF;
    v_n := v_n + 1;
  END LOOP;

  -- CONTROL POSITIVO: el censo ve de verdad las opciones, así que su «sí» vale.
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname='v_gmv_mensual'
       AND 'security_invoker=on' = ANY(coalesce(c.reloptions,'{}'::text[]))
  ) THEN
    RAISE EXCEPTION 'cinturon: el control negativo falló — v_gmv_mensual aparece con invoker y no debería';
  END IF;

  -- Y que la cura no cambió lo que la vista MUESTRA.
  IF (SELECT count(*) FROM v_prestadores_publicos) <> 4 THEN
    RAISE EXCEPTION 'cinturon: la vista dejó de devolver 4 prestadores';
  END IF;

  RAISE NOTICE 'cinturon: % vista(s) con security_invoker · control negativo OK · la vista sigue devolviendo 4', v_n;
END $cint$;

COMMIT;

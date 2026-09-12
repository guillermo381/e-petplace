-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · UNA MIGRACIÓN DECLARA SUS EDGES, Y EL MOTOR LO PUEDE PREGUNTAR
--                                                                  (`D-1073`)
-- 🔴 EL PROBLEMA QUE HAY QUE RESOLVER BIEN: una edge **no puede calcular la
--    firma del repo** — no ve el árbol. Así que «que se niegue a emitir con
--    código viejo» no se puede hacer comparando firmas desde adentro.
--
--    Lo que SÍ puede preguntar es otra cosa, y alcanza: **¿se aplicó alguna
--    migración que me nombre, DESPUÉS de mi último despliegue?** Eso es
--    exactamente el caso que quemó el secuencial `000000005`.
--
-- 🔴 Y ESO CONVIERTE EL COROLARIO EN UN HECHO. Hasta hoy «toda migración nombra
--    las edges que hay que desplegar con ella» vivía en un COMENTARIO del
--    encabezado: cierto, escrito, y **no consultable por nadie**. Ahora la
--    migración INSERTA la fila, y el motor la lee. *Un corolario que sólo se
--    puede leer no frena a nadie; uno que se puede consultar, sí.*
--
-- ⚠️ LO QUE ESTE GUARD **NO** VE, declarado para que nadie le pida de más: una
--    edge cuyo código cambió **sin** migración —un bug curado en TypeScript,
--    como el `sendEmail` de hoy— *no deja rastro acá*. Para eso sigue estando
--    `verify:edge-desplegada`, que compara firmas de verdad desde afuera.
--    **Son dos instrumentos y ninguno reemplaza al otro.**
--
-- EDGES A DESPLEGAR CON ESTA MIGRACIÓN (`L-536`): fiscal-emitir.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912740000-exige-edge.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.migracion_exige_edge (
  migracion    text        NOT NULL,
  slug         text        NOT NULL,
  declarado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (migracion, slug)
);

ALTER TABLE public.migracion_exige_edge ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.migracion_exige_edge FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.migracion_exige_edge IS
  'Qué edges invalida cada migración. La escribe la propia migración; la lee '
  'el motor para negarse a actuar con código anterior a ella.';

/**
 * ¿Esta edge está al día respecto de las migraciones que la nombran?
 *
 * 🔴 FAIL-CLOSED CON UNA EXCEPCIÓN DECLARADA: si la edge **nunca se registró**
 *    no se puede saber, y se contesta `al_dia: false` con `motivo:
 *    sin_registro`. *Contestar «sí» sobre algo que no se midió es el default
 *    cómodo que produce exactamente el silencio que esto viene a romper.*
 *    La excepción: si NINGUNA migración la nombra, está al día por definición —
 *    no hay nada que la invalide.
 */
CREATE OR REPLACE FUNCTION public.edge_esta_al_dia(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_desplegado timestamptz; v_exigen int; v_tarde text;
BEGIN
  SELECT count(*) INTO v_exigen FROM public.migracion_exige_edge WHERE slug = p_slug;
  IF v_exigen = 0 THEN
    RETURN jsonb_build_object('al_dia', true, 'motivo', 'ninguna_migracion_la_nombra');
  END IF;

  SELECT desplegado_en INTO v_desplegado
    FROM public.edge_despliegues WHERE slug = p_slug;
  IF v_desplegado IS NULL THEN
    RETURN jsonb_build_object('al_dia', false, 'motivo', 'sin_registro',
      'detalle', 'La edge nunca se desplego con `pnpm edge:desplegar`, asi que no hay con que comparar.');
  END IF;

  /* 🔴 SE COMPARA `declarado_en`, NO EL NOMBRE DE LA MIGRACIÓN — y eso lo
     enseñó un rebote: **los timestamps de las migraciones de esta casa no son
     horas reales.** Este archivo se llama `…740000`, o sea «hora 74», y
     `to_timestamp` rebotó con `date/time field value out of range`. *El prefijo
     ordena y no fecha: sirve para saber cuál va antes, jamás cuándo fue.*
     `declarado_en` es `now()` en el momento en que la migración APLICA, que es
     el hecho que de verdad importa comparar contra el despliegue. */
  SELECT string_agg(m.migracion, ' · ' ORDER BY m.migracion) INTO v_tarde
    FROM public.migracion_exige_edge m
   WHERE m.slug = p_slug AND m.declarado_en > v_desplegado;

  IF v_tarde IS NOT NULL THEN
    RETURN jsonb_build_object('al_dia', false, 'motivo', 'migracion_posterior',
      'migraciones', v_tarde, 'desplegada_en', v_desplegado);
  END IF;
  RETURN jsonb_build_object('al_dia', true, 'desplegada_en', v_desplegado);
END $function$;

REVOKE EXECUTE ON FUNCTION public.edge_esta_al_dia(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.edge_esta_al_dia(text) TO service_role;

/* Esta misma migración se declara: es la primera fila y su propio ejemplo. */
INSERT INTO public.migracion_exige_edge (migracion, slug)
VALUES ('20260912740000_s115a_exige_edge', 'fiscal-emitir')
ON CONFLICT DO NOTHING;

DO $cint$
DECLARE v jsonb;
BEGIN
  /* 🔴 ROJO · con la fila recién insertada y el despliegue ANTERIOR, la edge
     tiene que salir NO al día. Es el caso de hoy, reproducido. */
  v := public.edge_esta_al_dia('fiscal-emitir');
  IF (v->>'al_dia')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon ROJO: fiscal-emitir salio al dia con una migracion posterior — %', v;
  END IF;

  /* VERDE · una edge que ninguna migracion nombra esta al dia por definicion.
     Sin este brazo, una funcion que siempre dijera «no» pasaria el rojo. */
  v := public.edge_esta_al_dia('despachar-correo');
  IF (v->>'al_dia')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: una edge sin migraciones que la nombren salio NO al dia — %', v;
  END IF;

  /* Y el borde: una edge que NUNCA se desplego no se da por buena. */
  INSERT INTO public.migracion_exige_edge VALUES ('20260101000000_inventada','edge-fantasma')
    ON CONFLICT DO NOTHING;
  v := public.edge_esta_al_dia('edge-fantasma');
  IF (v->>'motivo') <> 'sin_registro' THEN
    RAISE EXCEPTION 'cinturon: una edge sin registro no dijo sin_registro — %', v;
  END IF;
  DELETE FROM public.migracion_exige_edge WHERE slug='edge-fantasma';

  RAISE NOTICE 'cinturon exige_edge: rojo con migracion posterior · verde sin migraciones · sin_registro';
END $cint$;

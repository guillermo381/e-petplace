-- S84-A5 · REORDENAR LA GALERÍA, ATÓMICAMENTE
--
-- POR QUÉ ESTO NO PUEDE VIVIR EN EL CLIENTE: `prestador_fotos` tiene
-- `UNIQUE (prestador_id, orden)` —la pieza que hace que «dos portadas»
-- sea inexpresable— y **cualquier renumeración pasa por estados
-- intermedios que violan ese UNIQUE**. Mover la foto 3 al lugar 1 exige
-- que 1 y 2 se corran, y entre un UPDATE y el siguiente hay una colisión.
-- Desde el cliente eso son N round-trips **sin transacción**: la
-- colisión no es un riesgo, es el camino normal.
--
-- LA CURA es renumerar en DOS PASADAS dentro de UNA transacción:
--   ① todos los orden a NEGATIVOS (espacio libre garantizado: los orden
--      vivos son >= 0 por construcción de esta misma función)
--   ② de negativos a 0..N-1, en el orden que pidió el llamador
-- Es el patrón estándar para renombrar bajo UNIQUE, y acá vale la pena
-- escribirlo porque el UNIQUE **es la decisión de diseño**, no un detalle:
-- si alguien lo quitara para "simplificar el reorden", perdería la
-- garantía de portada única sin darse cuenta.
--
-- LA PORTADA NO SE PASA COMO ARGUMENTO: es `p_ids[1]`. **Una sola verdad**
-- — pedir orden Y portada por separado permitiría que se contradigan.
--
-- GATE: titular-only, igual que las policies de la tabla (D-513). Es
-- SECURITY INVOKER a propósito — **la RLS ya dice quién puede escribir y
-- no hace falta un DEFINER que la salte** (L-167: un DEFINER se pone
-- cuando hay que ver algo que la RLS tapa; acá no).
--
-- 76(g): NO RIGE — crea función, sin backfill.
-- REVERSA: `DROP FUNCTION public.reordenar_fotos_prestador(uuid, uuid[]);`

BEGIN;

CREATE OR REPLACE FUNCTION public.reordenar_fotos_prestador(
  p_prestador_id uuid,
  p_ids uuid[]
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_total int;
  v_recibidos int := array_length(p_ids, 1);
BEGIN
  IF v_recibidos IS NULL OR v_recibidos = 0 THEN
    RAISE EXCEPTION 'lista_vacia' USING ERRCODE = '22023';
  END IF;

  -- La lista tiene que ser la galería COMPLETA de ese prestador. Aceptar
  -- una parcial dejaría filas fuera de la numeración nueva, con orden
  -- viejo, y el resultado sería un orden que nadie pidió.
  SELECT count(*) INTO v_total FROM public.prestador_fotos
   WHERE prestador_id = p_prestador_id;

  IF v_total <> v_recibidos THEN
    RAISE EXCEPTION 'lista_incompleta' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_ids) AS x(id)
     WHERE NOT EXISTS (
       SELECT 1 FROM public.prestador_fotos f
        WHERE f.id = x.id AND f.prestador_id = p_prestador_id)
  ) THEN
    RAISE EXCEPTION 'foto_ajena' USING ERRCODE = '22023';
  END IF;

  -- ① a negativos: libera el rango 0..N-1 sin colisionar
  UPDATE public.prestador_fotos
     SET orden = -1 - orden
   WHERE prestador_id = p_prestador_id AND orden >= 0;

  -- ② a su lugar definitivo. p_ids[1] queda en 0 ⇒ ES LA PORTADA.
  UPDATE public.prestador_fotos f
     SET orden = pos.i - 1
    FROM unnest(p_ids) WITH ORDINALITY AS pos(id, i)
   WHERE f.id = pos.id AND f.prestador_id = p_prestador_id;

  -- si la RLS bloqueó las escrituras, esto lo destapa en vez de mentir un éxito
  IF EXISTS (SELECT 1 FROM public.prestador_fotos
              WHERE prestador_id = p_prestador_id AND orden < 0) THEN
    RAISE EXCEPTION 'reorden_incompleto' USING ERRCODE = '22023';
  END IF;
END $$;

-- L-140: nace sin anon/PUBLIC, y se concede explícito.
REVOKE ALL ON FUNCTION public.reordenar_fotos_prestador(uuid, uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reordenar_fotos_prestador(uuid, uuid[]) TO authenticated;

-- ── CINTURÓN + AUTO-PRUEBA con su control positivo (L-192) ────────────
DO $$
DECLARE v_p uuid; v_a uuid; v_b uuid; v_c uuid; v_orden int[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='reordenar_fotos_prestador') THEN
    RAISE EXCEPTION 'la función no quedó creada';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.role_routine_grants
              WHERE routine_schema='public' AND routine_name='reordenar_fotos_prestador'
                AND grantee IN ('anon','PUBLIC')) THEN
    RAISE EXCEPTION 'quedó EXECUTE para anon/PUBLIC';
  END IF;

  SELECT id INTO v_p FROM public.prestadores LIMIT 1;
  IF v_p IS NULL THEN RAISE NOTICE 'sin prestadores: la auto-prueba no corre'; RETURN; END IF;

  INSERT INTO public.prestador_fotos (prestador_id, url, orden)
  VALUES (v_p,'ap/a.jpg',0),(v_p,'ap/b.jpg',1),(v_p,'ap/c.jpg',2);
  SELECT id INTO v_a FROM public.prestador_fotos WHERE prestador_id=v_p AND url='ap/a.jpg';
  SELECT id INTO v_b FROM public.prestador_fotos WHERE prestador_id=v_p AND url='ap/b.jpg';
  SELECT id INTO v_c FROM public.prestador_fotos WHERE prestador_id=v_p AND url='ap/c.jpg';

  -- CONTROL POSITIVO: el reorden que cruza posiciones DEBE funcionar.
  -- Es el caso que sin las dos pasadas colisionaría contra el UNIQUE.
  PERFORM public.reordenar_fotos_prestador(v_p, ARRAY[v_c, v_a, v_b]);
  SELECT array_agg(orden ORDER BY url) INTO v_orden
    FROM public.prestador_fotos WHERE prestador_id=v_p;
  IF v_orden <> ARRAY[1,2,0] THEN  -- a=1, b=2, c=0
    RAISE EXCEPTION 'el reorden no dejó lo pedido: %', v_orden;
  END IF;
  IF (SELECT url FROM public.prestador_fotos
       WHERE prestador_id=v_p ORDER BY orden LIMIT 1) <> 'ap/c.jpg' THEN
    RAISE EXCEPTION 'la portada no es la primera de la lista';
  END IF;

  -- ROJO ①: una lista incompleta rebota
  BEGIN
    PERFORM public.reordenar_fotos_prestador(v_p, ARRAY[v_a]);
    RAISE EXCEPTION 'ACEPTÓ una lista incompleta';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;

  -- ROJO ②: una foto ajena rebota
  BEGIN
    PERFORM public.reordenar_fotos_prestador(v_p, ARRAY[v_a, v_b, gen_random_uuid()]);
    RAISE EXCEPTION 'ACEPTÓ una foto ajena';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;

  DELETE FROM public.prestador_fotos WHERE prestador_id=v_p AND url LIKE 'ap/%';
  IF EXISTS (SELECT 1 FROM public.prestador_fotos) THEN
    RAISE EXCEPTION 'la auto-prueba dejó residuo';
  END IF;
END $$;

COMMIT;

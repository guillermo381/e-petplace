-- ===========================================================================
-- S105-A . EL ALTA DEVUELVE SU uid ESTABLE — D-921, pieza que faltaba
-- ===========================================================================
--
-- 76(g) VEDA: **NO RIGE.** DDL sobre una funcion. Cero backfill, cero filas
-- tocadas.
--
-- REVERSA: docs/relevamientos/S105-A-REVERSA-20260825190000-alta-devuelve-uid.sql
--   Su nota dice que la reversa quita la SALIDA, no la identidad.
--
-- -- POR QUE EXISTE ESTA PIEZA, y es un hueco de MI propio contrato -----------
-- El pedido a C (S105-A-PEDIDO-UID-ESTABLE-para-C.md §2) le decia que pusiera
-- `uid` en la URL **y no decia de donde sacarlo**. Lo levanto C, midiendolo tres
-- veces: `obtener_uid_proveedor` esta REVOKE para authenticated (correcto: es
-- server-side), `crearAltaTarjeta` devolvia solo {altaId, expiraEn}, y el grep
-- de consumidores en TS daba CERO.
--
-- **Un contrato que dice que poner y no de donde sacarlo no es un contrato: es
-- una instruccion sin insumo.** Y C hizo lo correcto: freno en vez de inventar
-- un wrapper contra una funcion que no puede ejecutar.
--
-- -- LA FORMA, con la razon de C, que es la buena -----------------------------
-- Devolverlo JUNTO al alta y no por un wrapper aparte: **el alta y su uid se
-- deciden en el MISMO acto**, asi que viajan juntos por construccion y no hay
-- ventana donde uno exista sin el otro. Y es un viaje y no dos.
--
-- ⚠️ TRAMPA DE NOMBRE, evitada a proposito: la funcion ya usa `v_uid` para el
-- USER de la sesion. El uid del proveedor va en `v_uid_prov`. **Reusar `v_uid`
-- habria mandado nuestro user_id al tercero** — exactamente lo que la firma del
-- founder prohibe, y sin que ningun typecheck lo viera.
--
-- -- SIGUE INERTE ------------------------------------------------------------
-- Devolver el uid no lo activa: la app tiene que ponerlo en la URL (C, pieza 2)
-- y la pagina pasarlo a addCard (C, pieza 3, YA HECHA en 59ed5010). Y la pieza 4
-- --la formula del stoken-- espera la respuesta de Erick sobre que campo espera.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.crear_alta_tarjeta(p_proveedor text DEFAULT 'nuvei'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_exp timestamptz;
  v_uid_prov text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  IF p_proveedor NOT IN ('nuvei','deuna') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_invalido');
  END IF;

  -- 🔴 TTL de 15 minutos: el mismo número que el hold de la agenda (S54).
  --    No es una constante nueva — es la ventana que la casa ya considera
  --    razonable para que una persona termine un trámite en una pantalla.
  v_exp := now() + interval '15 minutes';

  INSERT INTO public.altas_tarjeta (user_id, proveedor, expira_en)
  VALUES (v_uid, p_proveedor, v_exp)
  RETURNING id INTO v_id;

  /* 🔴 D-921 · EL uid ESTABLE SALE EN EL MISMO ACTO QUE EL ALTA.
     Y no es comodidad: el alta y su identidad ante el proveedor **se deciden
     juntas**, asi que viajan juntas por construccion y no hay ventana donde una
     exista sin la otra. Ademas es UN viaje y no dos (L-223: el costo esta en
     el viaje, no en los datos).
     ⚠️ `v_uid` de arriba es el USER de la sesion. El uid del proveedor va en
     `v_uid_prov` a proposito: pisar `v_uid` habria mandado el user_id nuestro
     al tercero, que es exactamente lo que la firma prohibe. */
  v_uid_prov := public.obtener_uid_proveedor(v_uid, p_proveedor);

  RETURN jsonb_build_object(
    'ok', true, 'alta_id', v_id, 'expira_en', v_exp, 'uid', v_uid_prov
  );
END;
$function$
;


-- -- CINTURON -----------------------------------------------------------------
DO $cint$
DECLARE d text; v_u uuid; v_a jsonb; v_b jsonb; BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='crear_alta_tarjeta';

  IF position('obtener_uid_proveedor' in d) = 0 THEN
    RAISE EXCEPTION 'cinturon: el alta no llama al productor del uid';
  END IF;
  IF position('''uid'', v_uid_prov' in d) = 0 THEN
    RAISE EXCEPTION 'cinturon: el alta no devuelve el uid en su payload';
  END IF;
  -- 🔴 que NO se pise el user de la sesion: si devolviera v_uid, mandariamos
  --    nuestro user_id al proveedor.
  IF position('''uid'', v_uid)' in d) > 0 THEN
    RAISE EXCEPTION 'cinturon: el alta devuelve el USER de la sesion como uid del proveedor';
  END IF;

  -- discriminador funcional, con sesion simulada
  SELECT id INTO v_u FROM auth.users ORDER BY created_at LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);

  v_a := public.crear_alta_tarjeta('nuvei');
  v_b := public.crear_alta_tarjeta('nuvei');

  IF (v_a->>'ok')::boolean IS NOT TRUE OR (v_a->>'uid') IS NULL THEN
    RAISE EXCEPTION 'cinturon: el alta no devolvio uid: %', v_a::text;
  END IF;
  IF (v_a->>'uid') IS DISTINCT FROM (v_b->>'uid') THEN
    RAISE EXCEPTION 'cinturon: DOS altas dieron uid distintos (% vs %) — es el defecto D-921', v_a->>'uid', v_b->>'uid';
  END IF;
  IF (v_a->>'alta_id') = (v_b->>'alta_id') THEN
    RAISE EXCEPTION 'cinturon: las dos altas son la misma fila, el discriminador no discrimina';
  END IF;
  IF (v_a->>'uid') = v_u::text THEN
    RAISE EXCEPTION 'cinturon: el uid es el user_id de la sesion';
  END IF;

  -- residuo 0 (L-406)
  DELETE FROM public.altas_tarjeta WHERE id IN ((v_a->>'alta_id')::uuid, (v_b->>'alta_id')::uuid);
  DELETE FROM public.usuario_proveedor_uid WHERE user_id = v_u AND proveedor = 'nuvei';

  RAISE NOTICE 'cinturon OK: dos altas distintas, MISMO uid, y no es el user_id';
END $cint$;

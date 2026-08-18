-- ═══════════════════════════════════════════════════════════════════════════
-- S100c-A · LAS DOS PUERTAS QUE FALTABAN
--   ① el alias de dirección  ② «¿cuántas puedo llevar?»
--
-- VEDA 76(g): **NO RIGE.** Migración ADITIVA PURA — dos funciones nuevas,
-- cero ALTER, cero backfill, cero escritura sobre datos vivos. No hay anclas
-- que congelar.
-- REVERSA: `docs/relevamientos/2026-08-18-s100c-REVERSA-alias-y-maximo.sql`,
-- escrita ANTES de aplicar, con su declaración de qué NO deshace.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- ① EL ALIAS — la tabla se había adelantado y la puerta se quedó
-- ───────────────────────────────────────────────────────────────────────────
--
-- MEDIDO ANTES DE ESCRIBIR (18-ago-2026, contra la base viva):
--  · `direcciones_guardadas.alias` es **NOT NULL** y la tabla admite N filas
--    por usuario: el índice único es PARCIAL (`uq_direccion_principal ...
--    WHERE es_principal`), o sea que solo hay UNA principal, no una sola fila.
--  · `guardar_direccion_hogar` **hardcodea `'Hogar'` y `es_principal = true`**
--    y hace `ON CONFLICT (user_id) WHERE es_principal DO UPDATE`.
--  · El lector del cliente filtra `.eq('es_principal', true)`.
--
-- ⇒ el esquema soportaba «oficina» y «suegra» desde siempre; lo que no
-- existía era una puerta para crearlas. *La tabla se adelantó y la puerta se
-- quedó* — el mismo patrón, invertido, que el lector de carrito construido
-- sin consumidores.
--
-- 🔴 POR QUÉ UNA FUNCIÓN NUEVA Y NO ENSANCHAR LA VIEJA:
-- `guardar_direccion_hogar` es la puerta del HOGAR y la consumen paseo,
-- grooming, veterinaria y adiestramiento. Agregarle un `p_alias` la
-- convertiría en «guardá cualquier dirección» conservando un nombre que
-- promete otra cosa, y su `ON CONFLICT ... WHERE es_principal` **pisaría la
-- principal** cada vez que alguien guardara una oficina. *Ensanchar una
-- puerta cuyo nombre miente es cómo se fabrica el próximo hallazgo.*
-- Esta función NO toca la vieja: no la reemplaza, no cambia su firma, y
-- **nunca escribe `es_principal = true`** — la principal solo se mueve por
-- su propia puerta.

CREATE OR REPLACE FUNCTION public.guardar_direccion_con_alias(
  p_alias        text,
  p_direccion    text,
  p_ciudad       text,
  p_sector       text DEFAULT NULL,
  p_referencias  text DEFAULT NULL,
  p_telefono     text DEFAULT NULL,
  p_lat          double precision DEFAULT NULL,
  p_lon          double precision DEFAULT NULL,
  -- Presente = EDITA esa dirección (si es del usuario). Ausente = crea una.
  p_direccion_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER              -- la RLS `dir_own` ES la puerta; no se saltea.
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id   uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_alias IS NULL OR btrim(p_alias) = '' THEN
    RAISE EXCEPTION 'alias_requerido' USING ERRCODE = '22023';
  END IF;
  -- 60 es el techo del renglón que lo pinta; más largo no se lee, se trunca.
  IF length(btrim(p_alias)) > 60 THEN
    RAISE EXCEPTION 'alias_muy_largo' USING ERRCODE = '22023';
  END IF;
  IF p_direccion IS NULL OR btrim(p_direccion) = '' THEN
    RAISE EXCEPTION 'direccion_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
    RAISE EXCEPTION 'ciudad_requerida' USING ERRCODE = '22023';
  END IF;
  -- Espejo tipado del CHECK `direcciones_guardadas_telefono_sin_plus`
  -- (regla 28: E.164 sin '+'). El error tipado gana al constraint crudo.
  IF p_telefono IS NOT NULL AND p_telefono ~ '^\+' THEN
    RAISE EXCEPTION 'telefono_invalido' USING ERRCODE = '22023';
  END IF;
  -- 🔴 EL PUNTO ES OBLIGATORIO ACÁ, y no es una decisión mía: la tabla lleva
  -- `chk_direccion_con_punto CHECK (lat IS NOT NULL AND lon IS NOT NULL)`
  -- (NOT VALID ⇒ las filas viejas quedan, las NUEVAS lo cumplen). Se rebota
  -- con voz propia en vez de dejar que explote el constraint: *un error de
  -- constraint es `datos_invalidos`, y esa voz no le dice a nadie qué hacer*
  -- (la deuda D-827 en su forma más chica).
  IF p_lat IS NULL OR p_lon IS NULL THEN
    RAISE EXCEPTION 'punto_requerido' USING ERRCODE = '22023';
  END IF;
  IF abs(p_lat) > 90 OR abs(p_lon) > 180 THEN
    RAISE EXCEPTION 'coordenadas_invalidas' USING ERRCODE = '22023';
  END IF;

  IF p_direccion_id IS NOT NULL THEN
    UPDATE direcciones_guardadas
       SET alias       = btrim(p_alias),
           direccion   = btrim(p_direccion),
           ciudad      = btrim(p_ciudad),
           sector      = NULLIF(btrim(p_sector), ''),
           referencias = NULLIF(btrim(p_referencias), ''),
           telefono    = NULLIF(btrim(p_telefono), ''),
           lat         = p_lat,
           lon         = p_lon
     WHERE id = p_direccion_id
       -- El dueño se exige EN EL CUERPO además de la RLS: un DEFINER futuro
       -- que llame a esto no debe poder editar la dirección de otro.
       AND user_id = v_auth
     RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'direccion_no_encontrada' USING ERRCODE = '42501';
    END IF;
  ELSE
    INSERT INTO direcciones_guardadas
      (user_id, alias, direccion, ciudad, sector, referencias, telefono,
       lat, lon, es_principal)
    VALUES
      (v_auth, btrim(p_alias), btrim(p_direccion), btrim(p_ciudad),
       NULLIF(btrim(p_sector), ''), NULLIF(btrim(p_referencias), ''),
       NULLIF(btrim(p_telefono), ''), p_lat, p_lon,
       -- ⬇️ SIEMPRE false. La principal tiene su propia puerta y su propio
       --    índice único; esta función no puede desplazarla ni por error.
       false)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'direccion_id', v_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.guardar_direccion_con_alias(text, text, text, text, text, text, double precision, double precision, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_direccion_con_alias(text, text, text, text, text, text, double precision, double precision, uuid) TO authenticated;


-- ───────────────────────────────────────────────────────────────────────────
-- ② «¿CUÁNTAS PUEDO LLEVAR?» — la otra mitad de la mala noticia en la puerta
-- ───────────────────────────────────────────────────────────────────────────
--
-- EL PROBLEMA, con su literal: el founder pagó y le dijeron que no había
-- stock suficiente de algo que acababa de agregar. La mitad «se agotó» se
-- cerró del lado del cliente (`hay_stock` entró al gate de la ficha). La
-- mitad **«pedí 3 y hay 1»** no se puede cerrar ahí, y se midió por qué:
--
--   skus_select ON vendedor_skus = (es_vendedor_de(cuenta_comercial_id) OR is_admin())
--
-- ⇒ **la familia NO puede leer `stock_disponible`.** No es un olvido de
-- permisos: es deliberado. Y `ofertas` solo expone `hay_stock`, booleano.
-- Sin una función que conteste, la única forma de enterarse sigue siendo el
-- rebote de `reservar_stock_pedido` — o sea, con el dedo sobre «Pagar».
--
-- ═══ 🔴 LA TENSIÓN CON LA FIRMA DE S99, DECLARADA Y NO DISIMULADA ═══
-- S99 firmó: *«`hay_stock` BOOLEANO y jamás un número — la familia necesita
-- "¿puedo comprar esto?", no el inventario ajeno»*. Contestar «podemos
-- entregarte 2» **es un número**.
--
-- LA FORMA ELEGIDA NO REVELA INVENTARIO, Y ESA ES SU DEFENSA:
-- la función devuelve **`LEAST(lo que pediste, lo que hay)`**, jamás el
-- stock. Si hay 500 y pedís 3, contesta **3** — no se aprende nada de las
-- 500. El número real solo aparece **cuando es menor que lo que pediste**,
-- que es exactamente el caso en que la familia lo necesita para decidir.
-- ⇒ **no se puede recorrer la vitrina midiendo el inventario del vendedor**:
-- cada respuesta está acotada por arriba por la pregunta.
--
-- *Igual es una enmienda a una firma, y por eso se escribe acá y en el parte
-- en vez de deslizarse: si el founder la quiere revertir, la reversa ya está
-- escrita y el cliente vuelve a la mitad (a) sin tocar nada más.*
--
-- DEFINER porque tiene que leer `vendedor_skus`, que la familia no alcanza.
-- Su gate es la FORMA de la respuesta, no un rol: no hay nada que autorizar
-- porque no devuelve nada que no hayas preguntado.

CREATE OR REPLACE FUNCTION public.maximo_comprable_de_ofertas(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_out jsonb := '[]'::jsonb;
  v_it  jsonb;
  v_oferta uuid;
  v_pedida int;
  v_hay  int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'items_invalidos' USING ERRCODE = '22023';
  END IF;
  -- Techo de lote: sin él, un `p_items` gigante vuelve esto un barrido del
  -- inventario a fuerza de repetir la pregunta. 50 cubre cualquier carrito
  -- real por un orden de magnitud.
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'demasiados_items' USING ERRCODE = '22023';
  END IF;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_oferta := NULLIF(v_it->>'oferta_id', '')::uuid;
    v_pedida := GREATEST(COALESCE((v_it->>'cantidad')::int, 0), 0);
    CONTINUE WHEN v_oferta IS NULL;

    SELECT COALESCE(vs.stock_disponible, 0)
      INTO v_hay
      FROM ofertas o
      JOIN vendedor_skus vs
        ON vs.variante_id = o.variante_id
       AND vs.cuenta_comercial_id = o.cuenta_comercial_id
     WHERE o.id = v_oferta
       AND o.estado = 'publicada';

    -- Oferta que no existe, no está publicada, o sin fila de stock: 0.
    -- **No se distingue de «agotado» a propósito**: las tres significan lo
    -- mismo para quien compra, y separarlas acá sí filtraría información
    -- del vendedor.
    v_hay := COALESCE(v_hay, 0);

    v_out := v_out || jsonb_build_object(
      'oferta_id', v_oferta,
      -- ⬇️ ACÁ VIVE LA PROPIEDAD: acotado por la pregunta.
      'maximo', LEAST(v_pedida, v_hay)
    );
  END LOOP;

  RETURN v_out;
END;
$function$;

REVOKE ALL ON FUNCTION public.maximo_comprable_de_ofertas(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.maximo_comprable_de_ofertas(jsonb) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- UN ENVÍO VIVO CON POSICIONES — S100 (pedido de mesa a D)
--
-- PARA QUÉ: la pantalla EN CAMINO no se puede declarar probada sin sujeto
-- vivo. Medido por A contra la base: **`track_gps` no nulo = 0** y
-- **`hacia_destino_en` = 0**. *Un mapa probado contra cero puntos se ve
-- exactamente igual que un mapa que anda* — y esa es justo la trampa que esta
-- sesión ya esquivó dos veces (la tabla `envio_eventos` sin escritor, y la
-- lista vacía que es un estado legal).
--
-- 🔴 NO ALCANZA CON SEMBRAR PUNTOS: HAY QUE ABRIR LA VENTANA.
-- El motor solo acepta track con el envío en `hacia_destino`
-- (`track_fuera_de_ventana`, migración `20260813030000`). Con
-- `hacia_destino_en = 0` no existe hoy un solo envío en esa ventana ⇒ esta
-- siembra **mueve el envío por su puerta real primero** y recién después
-- escribe. *Escribir la columna a mano habría fabricado un estado que el
-- motor no puede producir, y la pantalla lo habría dibujado igual.*
--
-- 🔴 CERO IDENTIFICADORES INVENTADOS. Este bloque **deriva sus objetivos de
-- la base en tiempo de corrida** y **ABORTA si no los encuentra**. Se escribió
-- desde un worktree sin `link` a Supabase: hardcodear un uuid "plausible"
-- habría sido exactamente el verosímil-falso que esta sesión viene cazando
-- todo el día. *Un seed que aborta es honesto; uno que inventa un id corre
-- verde contra la fila equivocada.*
--
-- 🔴 NO ESCRIBE UNA SOLA PALABRA EN CAMPO QUE LA FAMILIA LEA.
-- Es la lección de H-03 de esta misma sesión: dos siembras de S99 pusieron
-- vocabulario de ingeniería en `entrega_referencias`, que **no es un campo de
-- notas internas — es copy que el repartidor lee EN LA PUERTA**. Acá el único
-- artefacto es la columna `track_gps`, que no tiene voz. **No se agrega una
-- tercera fuente.**
--
-- CÓMO SE RETIRA (y por eso no hace falta marcarlo con texto):
--   UPDATE envios SET track_gps = NULL WHERE id = '<el que imprime abajo>';
--   -- y, si se quiere revertir la ventana:
--   UPDATE envios SET estado='en_reparto', hacia_destino_en=NULL WHERE id = …;
--
-- ⚠️ ESTE ARCHIVO NO SE CORRIÓ. Se escribió desde un worktree sin `link`, así
-- que **no está verificado contra la base**. Quien lo corra: leer el NOTICE
-- final, que dice qué envío tocó y cuántos puntos quedaron.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig  text := current_user;
  v_envio    uuid;
  v_pedido   uuid;
  v_rep_id   uuid;
  v_rep_uid  uuid;
  v_cta      uuid;
  v_owner    uuid;
  v_puntos   jsonb;
  v_base     bigint;
  v_res      jsonb;
  v_total    int;
BEGIN
  -- ── ① EL SUJETO, DERIVADO — con DOS caminos y ninguno inventado ─────────
  -- Camino A (el barato): un envío que YA SALIÓ y todavía no va hacia el
  -- destino. `marcar_en_camino_a_destino` lo mueve sin inventar historia.
  SELECT e.id, r.user_id
    INTO v_envio, v_rep_uid
  FROM envios e
  JOIN repartidores r ON r.id = e.repartidor_id
  WHERE e.salio_en IS NOT NULL
    AND e.hacia_destino_en IS NULL
    AND e.estado = 'en_reparto'
    AND r.user_id IS NOT NULL
  ORDER BY e.salio_en DESC
  LIMIT 1;

  -- Camino B: no hay ninguno despachado ⇒ se despacha uno. **Es el paso que
  -- A señaló y que faltaba**: con `hacia_destino_en = 0` medido, puede que
  -- tampoco haya nadie en `en_reparto`, y entonces el camino A aborta sin
  -- haber intentado lo que sí se puede hacer por una puerta real.
  --
  -- Corre SIN claim a propósito: `despachar_pedido` gatea con
  -- `auth.uid() IS NOT NULL AND NOT es_vendedor_de(...)`, o sea que **sin
  -- sesión pasa** — y así la siembra no suplanta a un vendedor real para
  -- hacer algo que es del vendedor.
  IF v_envio IS NULL THEN
    SELECT p.id, r.id, r.user_id
      INTO v_pedido, v_rep_id, v_rep_uid
    FROM pedidos p
    JOIN repartidores r ON r.cuenta_comercial_id = p.cuenta_comercial_id
    WHERE p.metodo_entrega = 'despacho'
      AND r.activo
      AND r.user_id IS NOT NULL          -- `repartidor_sin_cuenta` rebota
      AND NOT EXISTS (SELECT 1 FROM envios e WHERE e.pedido_id = p.id)
    ORDER BY p.created_at DESC
    LIMIT 1;

    IF v_pedido IS NULL THEN
      RAISE EXCEPTION 'ABORTA: ni envío en `en_reparto`, ni pedido de despacho sin envío con repartidor que haya reclamado su cuenta. NO se fabrica una compra entera acá — eso ya lo hacen los seeds de S99, y duplicarlos sería tener dos verdades del mismo camino.';
    END IF;

    v_res := despachar_pedido(v_pedido, v_rep_id);
    SELECT id INTO v_envio FROM envios WHERE pedido_id = v_pedido;
    IF v_envio IS NULL THEN
      RAISE EXCEPTION 'ABORTA: `despachar_pedido` no dejó envío para el pedido %. No se sigue a ciegas.', v_pedido;
    END IF;
  END IF;

  -- ── ①bis EL SUJETO VIVO ES TRES COSAS, NO UNA (orden de mesa) ───────────
  -- *Si A reporta cero repartidores con vehículo cargado, la siembra tiene que
  -- crear uno — o el gate no va a poder distinguir «falta el dato» de «está
  -- roto».* Eso es exactamente lo que esta sesión frenó dos veces, así que la
  -- siembra se hace cargo de las tres patas: **track · destino · placa**.

  -- (a) EL DESTINO. `despachar_pedido` lo copia del pedido — medido en su
  -- INSERT—, así que si viene NULL el problema es del PEDIDO, no del despacho.
  -- **Se aborta en vez de inventar una coordenada:** un punto fabricado
  -- dibujaría un mapa creíble apuntando a una casa que no es.
  SELECT e.repartidor_id, r.cuenta_comercial_id
    INTO v_rep_id, v_cta
  FROM envios e JOIN repartidores r ON r.id = e.repartidor_id
  WHERE e.id = v_envio;

  PERFORM 1 FROM envios
   WHERE id = v_envio AND destino_lat IS NOT NULL AND destino_lon IS NOT NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: el envío % no tiene destino_lat/lon. Sin destino no hay mapa aunque haya track —el encuadre se calcula entre los dos extremos—, y una coordenada inventada apunta a la casa equivocada. Sembrá un pedido con punto en el mapa.', v_envio;
  END IF;

  -- (b) LA PLACA. Sin vehículo, la ficha del repartidor (F3) no existe, y la
  -- placa es la que la receta ⑤ pone mandando *porque es lo que se verifica
  -- en la calle*. La puerta EXIGE ser el vendedor (no tiene el escape de
  -- `auth.uid()` nulo que sí tiene `despachar_pedido`), así que se actúa como
  -- el dueño de la cuenta — y por su puerta, que además es idempotente.
  --
  -- ⚠️ LA PLACA VA CON FORMATO PLAUSIBLE, Y NO CONTRADICE H-03. Allá el
  -- defecto era vocabulario de ingeniería en `entrega_referencias`, un campo
  -- cuyo único propósito es leerse como instrucción — y lo desplazaba. Acá el
  -- propósito del dato ES mostrarse, y **el propósito de la siembra es que se
  -- pueda juzgar la pantalla**: una placa que dijera «SIEMBRA» volvería la
  -- ficha injuzgable, que es justo lo que esta siembra viene a evitar.
  IF NOT EXISTS (SELECT 1 FROM repartidor_vehiculos WHERE repartidor_id = v_rep_id) THEN
    SELECT owner_profile_id INTO v_owner FROM cuentas_comerciales WHERE id = v_cta;
    IF v_owner IS NULL THEN
      RAISE EXCEPTION 'ABORTA: la cuenta % no tiene dueño, y la puerta del vehículo exige ser el vendedor. No se suplanta a nadie ni se escribe la tabla a mano.', v_cta;
    END IF;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM registrar_vehiculo_repartidor(v_rep_id, 'moto', 'PBA-0142');
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    PERFORM set_config('request.jwt.claims', NULL, true);
  END IF;

  -- ── ② LA VENTANA, POR SU PUERTA REAL ────────────────────────────────────
  -- Se actúa COMO EL REPARTIDOR ASIGNADO: la puerta lo exige
  -- (`no_sos_el_repartidor_asignado`) y saltarla escribiendo la columna a
  -- mano dejaría un estado que el motor no produce.
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_rep_uid, 'role', 'authenticated')::text,
                     true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  PERFORM marcar_en_camino_a_destino(v_envio);

  -- ── ③ LAS POSICIONES ────────────────────────────────────────────────────
  -- Seis puntos a ~60 s, que es LA CADENCIA REAL del capturador. No se
  -- siembran puntos densos: con puntos cada segundo el pin se vería fluido
  -- **y la pantalla no probaría nada**, porque lo que hay que ver es si la
  -- INTERPOLACIÓN del consumidor tapa el salto de un minuto (N14).
  --
  -- `t` va en EPOCH MS y la key es `lng` — la forma que ESCRIBE el
  -- repartidor, heredada del paseo. Convertirla acá rompería la herencia que
  -- justifica que el track tenga esta forma.
  --
  -- Trayectoria corta sobre Quito, avanzando en una dirección: seis fixes
  -- consecutivos de una moto, no un paseo aleatorio.
  v_base := (extract(epoch from now()) * 1000)::bigint - (6 * 60 * 1000);
  v_puntos := jsonb_build_array(
    jsonb_build_object('lat', -0.17610, 'lng', -78.48120, 't', v_base),
    jsonb_build_object('lat', -0.17520, 'lng', -78.48035, 't', v_base + 60000),
    jsonb_build_object('lat', -0.17425, 'lng', -78.47960, 't', v_base + 120000),
    jsonb_build_object('lat', -0.17318, 'lng', -78.47890, 't', v_base + 180000),
    jsonb_build_object('lat', -0.17205, 'lng', -78.47822, 't', v_base + 240000),
    jsonb_build_object('lat', -0.17090, 'lng', -78.47755, 't', v_base + 300000)
  );

  v_res := registrar_track_envio(v_envio, v_puntos);

  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  -- ── ④ EL CINTURÓN: LAS TRES PATAS, no solo el track ─────────────────────
  -- *Antes de declararla probada, exigí el sujeto vivo: envío con track Y
  -- destino Y un repartidor con placa* (orden de mesa). El cinturón mide las
  -- tres **después** de escribir, porque una siembra que no verifica su
  -- resultado es una siembra que se cree.
  SELECT jsonb_array_length(track_gps) INTO v_total FROM envios WHERE id = v_envio;
  IF v_total IS NULL OR v_total < 2 THEN
    RAISE EXCEPTION 'ABORTA: el track quedó con % punto(s). Con menos de 2 no hay trayectoria y la pantalla no se puede juzgar.', COALESCE(v_total, 0);
  END IF;

  PERFORM 1 FROM envios
   WHERE id = v_envio AND hacia_destino_en IS NOT NULL
     AND destino_lat IS NOT NULL AND destino_lon IS NOT NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: el envío % quedó sin ventana abierta o sin destino. El track solo, sin destino, dibuja una moto que se mueve sin decir hacia dónde.', v_envio;
  END IF;

  PERFORM 1 FROM repartidor_vehiculos WHERE repartidor_id = v_rep_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORTA: el repartidor % quedó sin vehículo. Sin placa la ficha de F3 no existe, y el gate no podría distinguir «falta el dato» de «está roto».', v_rep_id;
  END IF;

  RAISE NOTICE 'SIEMBRA S100 · envío % · % puntos · ventana abierta · destino OK · repartidor % con placa. RETIRO: UPDATE envios SET track_gps=NULL, hacia_destino_en=NULL, estado=''en_reparto'' WHERE id=''%'';',
               v_envio, v_total, v_rep_id, v_envio;
END $$;

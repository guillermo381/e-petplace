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
  v_rep_uid  uuid;
  v_puntos   jsonb;
  v_base     bigint;
  v_res      jsonb;
  v_total    int;
BEGIN
  -- ── ① EL SUJETO, DERIVADO ───────────────────────────────────────────────
  -- Un envío que YA SALIÓ y todavía no va hacia el destino: es el que la
  -- puerta `marcar_en_camino_a_destino` puede mover sin inventar historia.
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

  IF v_envio IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay envío en `en_reparto` con repartidor que tenga cuenta. NO se inventa uno — la siembra existe para dar sujeto vivo, no para fabricar uno.';
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

  -- ── ④ EL CINTURÓN: que el sujeto quedó VIVO de verdad ───────────────────
  SELECT jsonb_array_length(track_gps) INTO v_total FROM envios WHERE id = v_envio;
  IF v_total IS NULL OR v_total < 2 THEN
    RAISE EXCEPTION 'ABORTA: el track quedó con % punto(s). Con menos de 2 no hay trayectoria y la pantalla no se puede juzgar.', COALESCE(v_total, 0);
  END IF;

  RAISE NOTICE 'SIEMBRA S100 · envío % · % puntos · ventana `hacia_destino` abierta. Retiro: UPDATE envios SET track_gps=NULL WHERE id=''%'';',
               v_envio, v_total, v_envio;
END $$;

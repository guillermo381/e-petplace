-- ═══════════════════════════════════════════════════════════════════════════
-- S108-B2 · EL MOTOR DE RENOVACIÓN DE LA MENSUALIDAD — CONSTRUIDO Y APAGADO
--
-- 🔴 EL HUECO, medido antes de escribir una línea: el ÚNICO llamador de
--    `cobrar_periodo_mensualidad_guarderia` es `aplicar_evento_de_pago`, y
--    **ningún cron la llama**. Los cuatro motores de renovación que existen
--    —`cerrar_y_renovar_planes`, `ejecutar_recurrencias_vencidas`,
--    `planes_vencidos_pendientes`, `recurrencias_vencidas_pendientes`— **no
--    tocan `guarderia_suscripciones`** (medido, los cuatro).
--    ⇒ **El mes 1 cobra por el checkout («pagar es arrancar»). El mes 2 no lo
--    cobra nada.**
--
-- 🔴 POR QUÉ UN SELECTOR PROPIO Y NO EXTENDER UNO DE LOS CUATRO, con lo medido:
--    los TRES selectores van por su propia tabla (`suscripciones_servicio`,
--    `pedidos_recurrencias`) y **devuelven formas distintas**; ninguno puede
--    tomar la guardería sin deformarse. El CUARTO —`ejecutar_recurrencias_
--    vencidas`— **ya es genérico y no hay que tocarlo**: su propio comentario
--    dice *«EL TIMBRE Y NADA MÁS. No elige, no congela, no cobra»*.
--    ⇒ Lo que enumera sujetos no es ninguno de los cuatro: **es la edge
--    `pagos-cobro-recurrente`, que nombra DOS selectores.** Ahí está el mismo
--    defecto del barrido un nivel más arriba, y **se declara sin curarlo acá**:
--    unificar las tres formas de retorno es reescribir dos selectores vivos que
--    hoy cobran, y eso no se hace de paso.
--
-- ═══ LA LLAVE ES UNA SOLA, Y ESO ES ESTRUCTURAL ═══════════════════════════
-- 🔴 Firma del founder (31-ago): **el aviso previo y el cron que cobra se
--    encienden con la MISMA clave, nunca por separado, en ninguna de las dos
--    direcciones.** Hoy el aviso existe y el cron no ⇒ el aviso anunciaría un
--    cobro que nadie ejecuta. *Y una promesa de cobro que no ocurre entrena a
--    la familia a ignorar el próximo aviso, que sí va a ser verdad.*
--
-- 🔴 CÓMO SE VUELVE INCONSTRUIBLE el estado «una encendida y la otra apagada»:
--    **no hay dos lugares donde leer.** Nace `guarderia_recurrente_vivo()`,
--    que es el ÚNICO lector de la clave, y las dos piezas la consumen a ella.
--    *Una nota que diga «usen la misma clave» se cumple mientras alguien se
--    acuerde; un accesor único no se puede desobedecer sin dejar de gatear.*
--    Y `verificar_llave_unica_guarderia()` lo MIDE.
--
-- ⚠️ EL CRON NACE INERTE. La clave NO se crea acá: sin fila,
--    `guarderia_recurrente_vivo()` devuelve `false` y el timbre dice
--    `guarderia_recurrente_apagado`. **La llave es del founder** — precedente
--    literal de S103: *un cable que se tiende bajo presión se tiende mal*.
--
-- 🔴 VEDA 76(g): NO RIGE. Cuatro funciones nuevas + un cron inerte. Cero DDL de
--    tablas, cero backfill, cero filas tocadas.
--
-- REVERSA: docs/relevamientos/2026-09-04-s108b2-REVERSA-M5.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL ACCESOR — el único lugar donde se lee la llave ────────────────────
CREATE OR REPLACE FUNCTION public.guarderia_recurrente_vivo()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  /* Sin fila ⇒ `false`. **Apagado es el default y no se declara en ningún
     lado**: un motor de cobro que arranca encendido porque falta una fila es
     la clase de arranque que nadie decidió. */
  SELECT COALESCE((SELECT valor = 'true' FROM app_config
                    WHERE clave = 'guarderia_recurrente_vivo'), false);
$fn$;

COMMENT ON FUNCTION public.guarderia_recurrente_vivo() IS
  'S108-B2 · EL ÚNICO lector de app_config.guarderia_recurrente_vivo. El cron '
  'que cobra y el aviso previo de renovación consumen ESTA función y ninguna '
  'otra: por eso no se puede encender una y dejar la otra apagada.';

-- ── ② EL SELECTOR — qué mandato vence ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mensualidades_vencidas_pendientes()
RETURNS TABLE(
  suscripcion_id uuid, familia_id uuid, prestador_id uuid, tarjeta_id uuid,
  pagador_user_id uuid, proximo_periodo date, precio_mensual numeric,
  monto_esperado numeric, dia_de_cobro smallint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT s.id, s.familia_id, s.prestador_id, s.tarjeta_id, s.autorizada_por,
         public.guarderia_proximo_cobro(s.dia_de_cobro, s.periodo_desde),
         s.precio_mensual, s.monto_esperado, s.dia_de_cobro
    FROM guarderia_suscripciones s
   WHERE s.estado = 'activa'
     /* Sólo RENUEVA: un mandato que nunca cobró arranca por el checkout
        —«pagar es arrancar»—, no por el reloj. *Dejar que el reloj arranque un
        plan sería cobrarle a una familia el día que el reloj corre y no el día
        que ella contrató.* */
     AND s.periodo_desde IS NOT NULL
     AND s.periodo_hasta IS NOT NULL
     AND s.dia_de_cobro  IS NOT NULL
     /* El período vigente se terminó. */
     AND s.periodo_hasta < public.hoy_local()
     /* 🔴 NO SE RE-COBRA UN PERÍODO YA COBRADO. Se pregunta por el intento del
        próximo período, que es la misma llave que usa el XOR. */
     AND NOT EXISTS (
       SELECT 1 FROM pagos_intentos i
        WHERE i.guarderia_suscripcion_id = s.id
          AND i.guarderia_suscripcion_periodo =
              public.guarderia_proximo_cobro(s.dia_de_cobro, s.periodo_desde)
          AND i.estado IN ('iniciado','pendiente','aprobado'))
   ORDER BY s.periodo_hasta;
$fn$;

-- ── ③ EL TIMBRE — gateado por el accesor, y nada más ───────────────────────
CREATE OR REPLACE FUNCTION public.ejecutar_renovaciones_guarderia()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp','net'
AS $fn$
DECLARE v_url text; v_secreto text; v_req bigint; v_n int;
BEGIN
  /* 🔴 LA MISMA LLAVE QUE EL AVISO, por el mismo accesor. Si está apagado esto
     NO falla: dice que está apagado. *Un timbre que suena con la casa cerrada
     llena el buzón de nadie.* */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
                              'motivo', 'guarderia_recurrente_apagado');
  END IF;

  SELECT count(*) INTO v_n FROM mensualidades_vencidas_pendientes();
  IF v_n = 0 THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
                              'motivo', 'sin_mandatos_vencidos');
  END IF;

  SELECT valor INTO v_url FROM app_config WHERE clave = 'url_cobro_recurrente';
  SELECT decrypted_secret INTO v_secreto
    FROM vault.decrypted_secrets WHERE name = 'despacho_secret';
  IF v_url IS NULL OR v_secreto IS NULL THEN
    /* Se niega NOMBRANDO el artefacto que la abre (`L-171`). */
    RETURN jsonb_build_object('ok', false, 'ejecutado', false, 'motivo', 'sin_configurar',
      'falta', CASE WHEN v_url IS NULL THEN 'url_cobro_recurrente' ELSE 'secreto_despacho' END);
  END IF;

  /* EL TIMBRE Y NADA MÁS — copiado del criterio de `ejecutar_recurrencias_
     vencidas`. No elige, no congela, no cobra. *Meterle lógica acá sería partir
     la decisión entre dos lugares, y algún día van a decir cosas distintas.* */
  SELECT net.http_post(
           url     := v_url,
           headers := jsonb_build_object('Content-Type','application/json',
                                         'x-despacho-secret', v_secreto),
           body    := jsonb_build_object('sujeto','mensualidad_guarderia'),
           timeout_milliseconds := 30000) INTO v_req;

  RETURN jsonb_build_object('ok', true, 'ejecutado', true,
                            'mandatos', v_n, 'request_id', v_req);
END $fn$;

-- ── ④ EL GUARD DE LA LLAVE ÚNICA ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verificar_llave_unica_guarderia()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_piezas text[] := ARRAY['ejecutar_renovaciones_guarderia','avisar_renovaciones_guarderia'];
  v_p text; v_def text; v_faltan text[] := '{}'; v_sueltas text[] := '{}';
BEGIN
  FOREACH v_p IN ARRAY v_piezas LOOP
    IF to_regproc('public.'||v_p) IS NULL THEN
      v_faltan := v_faltan || (v_p || ' (no existe)'); CONTINUE;
    END IF;
    v_def := pg_get_functiondef(to_regproc('public.'||v_p));
    /* ¿Consume el accesor único? */
    IF v_def NOT LIKE '%guarderia_recurrente_vivo%' THEN
      v_faltan := v_faltan || v_p;
    END IF;
    /* 🔴 ¿Y lee la clave POR SU CUENTA? Ése es el estado que hay que volver
       inconstruible: una pieza con su propio lector puede quedar encendida
       cuando la otra está apagada. */
    IF v_def LIKE '%guarderia_recurrente_vivo''%' AND v_def LIKE '%app_config%'
       AND v_def NOT LIKE '%public.guarderia_recurrente_vivo()%' THEN
      v_sueltas := v_sueltas || v_p;
    END IF;
  END LOOP;

  IF array_length(v_sueltas,1) IS NOT NULL THEN
    RAISE EXCEPTION 'llave_unica: % lee la clave por su cuenta — se puede '
      'encender una y dejar la otra apagada', v_sueltas USING ERRCODE='22023';
  END IF;
  IF array_length(v_faltan,1) IS NOT NULL THEN
    RAISE EXCEPTION 'llave_unica: % no consume guarderia_recurrente_vivo() — '
      'sin el accesor la pieza NO gatea, o gatea por otro lado', v_faltan
      USING ERRCODE='22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'piezas', v_piezas,
                            'encendida', public.guarderia_recurrente_vivo());
END $fn$;

COMMENT ON FUNCTION public.verificar_llave_unica_guarderia() IS
  'S108-B2 · mide que el cron que cobra y el aviso previo consuman LA MISMA '
  'llave por el MISMO accesor. Si podés construir el estado «una encendida y la '
  'otra apagada», no está hecho. Se corre en toda migración que toque cualquiera '
  'de las dos piezas.';

REVOKE ALL ON FUNCTION public.guarderia_recurrente_vivo() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.mensualidades_vencidas_pendientes() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.ejecutar_renovaciones_guarderia() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_llave_unica_guarderia() FROM anon, authenticated, PUBLIC;

-- ── ⑤ EL CABLE, INERTE ─────────────────────────────────────────────────────
/* 03:00 America/Guayaquil = 08:00 UTC. Mismo criterio que `cobrar-recurrencias`
   (09:00 Guayaquil = `0 14 * * *`). **El cable se tiende ahora y la llave la
   pone el founder**: sin la fila de `app_config` esto corre todos los días y
   dice `guarderia_recurrente_apagado`, que es exactamente lo que tiene que
   decir. *Un cron que no existe es «reescribir para pasar a producción»; uno
   que existe y está apagado hace que encender sea encender.* */
SELECT cron.unschedule('renovar-mensualidades-guarderia')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='renovar-mensualidades-guarderia');
SELECT cron.schedule('renovar-mensualidades-guarderia', '0 8 * * *',
                     'SELECT public.ejecutar_renovaciones_guarderia();');

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_r jsonb; v_grito text; v_cron int;
BEGIN
  -- (a) APAGADO ES EL DEFAULT, y se prueba: sin fila, false.
  IF guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON: el motor NACE ENCENDIDO — la llave es del founder';
  END IF;
  v_r := ejecutar_renovaciones_guarderia();
  IF v_r->>'motivo' <> 'guarderia_recurrente_apagado' THEN
    RAISE EXCEPTION 'CINTURON: el timbre no se declaró apagado · %', v_r;
  END IF;

  -- (b) 🔴 CONTROL POSITIVO: con la llave puesta, el accesor DICE QUE SÍ.
  --     Sin esto, un accesor que devuelve `false` siempre pasaría (a) igual.
  BEGIN
    INSERT INTO app_config (clave, valor) VALUES ('guarderia_recurrente_vivo','true')
      ON CONFLICT (clave) DO UPDATE SET valor='true';
    IF guarderia_recurrente_vivo() IS NOT TRUE THEN
      RAISE EXCEPTION 'CINTURON: con la llave puesta el accesor sigue diciendo que no';
    END IF;
    RAISE EXCEPTION '__DESHACER__';   -- la subtransacción borra la llave de prueba
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURON:%' THEN RAISE; END IF;
    IF SQLERRM <> '__DESHACER__' THEN RAISE; END IF;
  END;
  /* 🔴 Y SE VERIFICA QUE LA LLAVE DE PRUEBA NO QUEDÓ PUESTA. *Un cinturón que
     enciende un motor de cobro y no comprueba haberlo apagado es peor que no
     tener cinturón.* */
  IF guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON: la llave de prueba QUEDÓ PUESTA';
  END IF;

  -- (c) 🔴 EL GUARD ESTÁ ROJO HOY, Y ES CORRECTO QUE LO ESTÉ.
  --     `avisar_renovaciones_guarderia` (de la pista A) todavía no consume el
  --     accesor. Se exige que el guard LO DIGA, nombrándola: un guard que
  --     aprobara este estado sería el que deja pasar «aviso encendido, cobro
  --     apagado», que es justo lo que la firma prohíbe.
  /* 🔴 Y NO SE ACEPTA EL VERDE A CIEGAS. La primera versión de esta rama daba
     por buenos los DOS desenlaces —«gritó» o «ya lo cableó A»—, y un sabotaje
     que hiciera aprobar al guard la pasaba entera. *Un cinturón que acepta
     cualquier resultado no está midiendo: está mirando.*
     Si el guard aprueba, se EXIGE la prueba de por qué: que el aviso consuma
     el accesor de verdad. */
  BEGIN
    PERFORM verificar_llave_unica_guarderia();
    IF to_regproc('public.avisar_renovaciones_guarderia') IS NULL
       OR pg_get_functiondef(to_regproc('public.avisar_renovaciones_guarderia'))
          NOT LIKE '%guarderia_recurrente_vivo%' THEN
      RAISE EXCEPTION 'CINTURON: el guard APROBÓ y el aviso NO consume el accesor '
        '— es el estado «aviso encendido, cobro apagado» pasando en verde';
    END IF;
    RAISE NOTICE 'CINTURON: guard verde y el aviso consume el accesor — A ya cableó';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    GET STACKED DIAGNOSTICS v_grito = MESSAGE_TEXT;
    IF v_grito NOT LIKE '%avisar_renovaciones_guarderia%' THEN
      RAISE EXCEPTION 'CINTURON: el guard gritó por otra cosa · %', v_grito;
    END IF;
    RAISE NOTICE 'CINTURON: guard ROJO como corresponde — falta que A cablee el aviso';
  END;

  -- (d) el cable existe
  SELECT count(*) INTO v_cron FROM cron.job WHERE jobname='renovar-mensualidades-guarderia';
  IF v_cron <> 1 THEN RAISE EXCEPTION 'CINTURON: el cron no quedó tendido (%)', v_cron; END IF;

  -- (e) 🔴 EL SELECTOR NO ARRANCA PLANES: SÓLO RENUEVA — y se PRODUCE el caso.
  /* La primera versión preguntaba si algún seleccionado tenía `periodo_desde`
     NULL. **No discriminaba**: con `periodo_hasta` también NULL, la fila queda
     afuera por otra condición y la aserción da verde sin haber probado el
     freno. *Una aserción que no puede fallar es una aserción que no mide.*
     Ahora se FABRICA el estado contradictorio —vencido pero nunca arrancado— y
     se exige que el selector lo deje afuera. */
  DECLARE v_s uuid; v_sel int;
  BEGIN
    SELECT id INTO v_s FROM guarderia_suscripciones WHERE estado='activa' LIMIT 1;
    IF v_s IS NULL THEN
      RAISE EXCEPTION 'CINTURON: sin suscripción con que DISCRIMINAR el freno de arranque';
    END IF;
    BEGIN
      UPDATE guarderia_suscripciones
         SET periodo_desde = NULL, periodo_hasta = public.hoy_local() - 1,
             dia_de_cobro = 15
       WHERE id = v_s;
      SELECT count(*) INTO v_sel FROM mensualidades_vencidas_pendientes()
       WHERE suscripcion_id = v_s;
      IF v_sel <> 0 THEN
        RAISE EXCEPTION 'CINTURON: el selector propuso ARRANCAR un plan (%) — eso es del checkout', v_sel;
      END IF;
      RAISE EXCEPTION '__DESHACER_E__';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM LIKE 'CINTURON:%' THEN RAISE; END IF;
      IF SQLERRM <> '__DESHACER_E__' THEN RAISE; END IF;
    END;
    /* Y el mandato quedó como estaba: el ensayo se deshizo. */
    IF (SELECT periodo_hasta FROM guarderia_suscripciones WHERE id=v_s) IS NOT NULL
       AND (SELECT periodo_desde FROM guarderia_suscripciones WHERE id=v_s) IS NULL THEN
      RAISE EXCEPTION 'CINTURON: el ensayo del freno DEJÓ el mandato contradictorio';
    END IF;
  END;

  RAISE NOTICE 'CINTURON S108B2-M5 OK · nace apagado · accesor discrimina · llave de prueba retirada · guard rojo con su nombre · cable tendido';
END $cinturon$;

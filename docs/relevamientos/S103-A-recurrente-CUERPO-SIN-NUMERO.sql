-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL CUERPO DEL COBRO RECURRENTE — **SIN NÚMERO, SIN APLICAR**
--
-- Va DESPUÉS de `S103-A-recurrente-SIN-NUMERO.sql` (que crea las columnas y
-- `recurrencia_desglose`). **Las dos se numeran y aplican JUNTAS**, y sólo
-- cuando el arnés esté recorrido — precondición del founder, vigente.
--
-- ── EL REPARTO, firmado por la mesa y escrito acá para que no se re-litigue ──
--
--   **LA BASE ELIGE Y CONGELA · LA EDGE COBRA · EL CRON LLAMA POR net.http_post**
--
-- 🔴 Y la razón de que la base NO cobre no es de arquitectura, es una PROHIBICIÓN
--    del founder con su porqué: **el cron no puede fabricar un JWT de usuario con
--    `service_role`.** *Un motor que se auto-emite la identidad de la persona a
--    la que le está cobrando no tiene a quién rendirle cuentas: la autorización
--    deja de venir del cliente y pasa a venir del que cobra.* (`L-340`)
--    ⇒ la edge cobra con la credencial del servidor **contra el proveedor**, y
--    la autorización del CLIENTE vive en la fila de la serie, no en un token.
--
-- ── QUÉ HACE CADA PIEZA ────────────────────────────────────────────────────
--
--   ① `recurrencias_vencidas_pendientes()` — LA BASE. Elige las vencidas,
--      corre las compuertas E3, **congela el desglose del período** y abre el
--      intento con **pagador explícito**. Devuelve la lista para cobrar.
--      *No cobra. No llama a nadie. No sabe qué es una tarjeta del proveedor.*
--
--   ② `pagos-cobro-recurrente` (edge, S103-D/A) — COBRA cada fila que ① le da,
--      por el MISMO motor que el cobro con tarjeta. **No elige, no congela.**
--
--   ③ `ejecutar_recurrencias_vencidas()` — EL CRON. Deja de ser un stub: hace
--      `net.http_post` a ②. *Nada más. Es un timbre, no un motor.*
--
-- ⚠️ **LO QUE ESTE ARCHIVO NO CUBRE, declarado:** la edge ② (territorio D/A,
--    tanda propia) y el arnés. **Sin el arnés recorrido —incluida la serie que
--    falla a propósito hasta la pausa— `§6` NO está probada y nada se aplica.**
--
-- 🔴 **TRES SUPUESTOS MÍOS QUE LA MEDICIÓN FALSÓ AL ESCRIBIR ESTE CUERPO** —
--    se declaran porque son la prueba de que la precondición del founder («no
--    se aplica hasta que el cuerpo esté escrito») sigue rindiendo:
--      ① `verificar_compuertas_pre_cobro` es **COMPRA-ONLY** y dos de sus
--         compuertas **no aplican** al recurrente ⇒ decisión de mesa abierta,
--         y esta rama **frena todo** hasta que se firme.
--      ② `cat_tasas_impuesto` tiene **`pct`**, no `tasa`.
--      ③ `app_config` **no tiene** `recurrente_vivo`, `url_cobro_recurrente`
--         ni `secreto_despacho` — hay que crearlas. *El cron se niega bien
--         mientras falten, pero «se niega bien» no es «está configurado».*
--
-- 📌 76(g) — LA VEDA: **NO RIGE.** Reemplaza cuerpos y crea funciones. Cero
--    backfill, cero anclas a filas vivas. *La escritura que sí toca datos —el
--    INSERT del intento y el UPSERT del desglose— ocurre EN EJECUCIÓN, no en la
--    migración.*
--
-- ── REVERSA (escrita ANTES) ────────────────────────────────────────────────
-- `DROP FUNCTION recurrencias_vencidas_pendientes();` y volver
-- `ejecutar_recurrencias_vencidas` a su stub de `pasarela_no_afiliada`.
-- ⚠️ QUÉ NO DESHACE: **los cobros ya hechos no se revierten** — los intentos
-- aprobados y sus desgloses quedan. Revertir apaga el motor hacia adelante;
-- para atrás hay que ir por el camino de reverso del proveedor, a mano.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ①  LA BASE ELIGE Y CONGELA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recurrencias_vencidas_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r          record;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_compuertas jsonb;
  v_total      numeric(12,2);
  v_subtotal   numeric(12,2);
  v_impuesto   numeric(12,2);
  v_envio      numeric(12,2);
  v_intento    uuid;
  v_listas     jsonb := '[]'::jsonb;
  v_frenadas   jsonb := '[]'::jsonb;
BEGIN
  /* 🔴 EL RELOJ ES DE GUAYAQUIL Y NO DE UTC. *Una serie que vence «el 13» vence
     el 13 donde vive la familia. Con UTC, un cobro de las 20:00 locales cae al
     día siguiente y el aviso de 48 h se corre solo.* */

  FOR v_r IN
    SELECT r.*
      FROM pedidos_recurrencias r
     WHERE r.estado = 'activa'
       AND r.proximo_pedido_fecha <= v_hoy
       /* 🔴 EL CANDADO CONTRA EL CRON QUE CORRE DOS VECES, en el SELECT y no
          solo en el índice: si ya hay un intento APROBADO de este período, la
          fila no vuelve a entrar. *El UNIQUE parcial es el piso; esto evita
          que siquiera se intente y se llene el buzón de rechazos por
          duplicado.* */
       AND NOT EXISTS (
             SELECT 1 FROM pagos_intentos i
              WHERE i.recurrencia_id = r.id
                AND i.recurrencia_periodo = r.proximo_pedido_fecha
                AND i.estado = 'aprobado')
     ORDER BY r.proximo_pedido_fecha, r.id
     FOR UPDATE OF r SKIP LOCKED
  LOOP
    /* ── ⓐ LA RAÍZ DE AUTORIZACIÓN, verificada fila por fila ───────────────
       §2: la autorización nombra QUIÉN, CUÁNDO y SOBRE QUÉ MEDIO. Las tres
       viven en la fila; si falta una, **no se cobra y se dice cuál falta**.
       🔴 *«Si ese medio muere, la serie no salta a otro por su cuenta: jamás
       se cobra a una tarjeta que el cliente no eligió para esto.»* Por eso se
       verifica que la tarjeta siga siendo SUYA y siga GUARDADA — no alcanza
       con que el id no sea nulo. */
    IF v_r.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_medio_autorizado');
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                    WHERE t.id = v_r.tarjeta_id
                      AND t.user_id = v_r.user_id
                      AND t.estado = 'guardada') THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'medio_no_disponible');
      CONTINUE;
    END IF;

    /* ── ⓑ LAS COMPUERTAS ───────────────────────────────────────────────────
       🔴 **ACÁ HAY UNA DECISIÓN DE MESA PENDIENTE, Y NO LA TOMO SOLO.**

       La mesa firmó *«compuertas E3 enteras»*. **Medido contra el objeto:
       `verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text)` es
       COMPRA-ONLY** — lee `compras`, `pedidos` e `inventario_reservas`, y **una
       recurrencia no tiene ninguna de las tres.** *Llamarla pasando el
       `recurrencia_id` como `compra_id` habría devuelto `compra_no_existe` en
       el 100 % de los casos: un freno que se ve como una compuerta funcionando.*

       **Y no es que falte adaptarla: DOS DE SUS COMPUERTAS NO APLICAN, con su
       razón:**
         · **1 · reserva de stock** — no hay pedido todavía. **§6 firma que
           primero se cobra y DESPUÉS sale la entrega**; exigir reserva antes
           del cobro invertiría esa firma.
         · **compra sin pedidos** — por lo mismo: el pedido nace después.
       **Y DOS SÍ, con el mismo espíritu y otro sujeto:**
         · **0 · intento en vuelo** — íntegra. *Protege la tarjeta del cliente
           del segundo débito, que es lo caro.*
         · **monto contra desglose congelado** — construida arriba, en ⓒ.

       ⚖️ **LAS DOS SALIDAS, servidas para la mesa:**
       **(a) ensanchar `verificar_compuertas_pre_cobro` a tres sujetos** — es
       cirugía sobre la función que HOY cobra plata real de Nuvei, exactamente
       lo que S103-D se negó a hacer por el mismo motivo.
       **(b) `verificar_compuertas_recurrencia(uuid, date)` propia**, con cada
       predicado **extraído del cuerpo vivo** y con las dos que no aplican
       **declaradas por nombre**. ⚠️ Riesgo declarado: `L-375` — reimplementar
       es medir el propio eco; se mitiga extrayendo, no reescribiendo.
       **Voto de A: (b)**, porque la mitad que no aplica no se puede parametrizar
       sin volver la compuerta de compras más difícil de leer, *y porque una
       firma que no se puede cumplir literalmente se declara, no se fuerza.*

       **MIENTRAS LA MESA NO FIRME, ESTA RAMA FRENA TODO** — fail-closed con
       nombre. *Cobrar sin compuerta porque «la que hay no encaja» sería la peor
       de las tres salidas.* */
    v_compuertas := jsonb_build_object('ok', false, 'codigo', 'compuerta_recurrente_sin_firmar');
    IF COALESCE((v_compuertas->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', COALESCE(v_compuertas->>'codigo', 'compuerta_sin_codigo'),
        'compuertas', v_compuertas);
      CONTINUE;
    END IF;

    /* ── ⓒ EL DESGLOSE DEL PERÍODO, CONGELADO AL PRECIO DE HOY ─────────────
       §5: **precio VIGENTE al momento del cobro**, no el del día en que el
       cliente se suscribió. Por eso la PK lleva el período adentro.
       ⚠️ El cálculo sale del catálogo VIVO, y si no da un total > 0 **no se
       inventa**: se frena. *Un total cero que se cobra es un cobro sin
       concepto; uno que se estima es un número que nosotros elegimos.* */
    SELECT
      COALESCE(SUM((it->>'cantidad')::int * o.precio), 0)
      INTO v_subtotal
      FROM jsonb_array_elements(v_r.items) it
      JOIN ofertas o ON o.id = (it->>'oferta_id')::uuid
     WHERE o.estado = 'publicada';

    v_impuesto := ROUND(v_subtotal * COALESCE(
                    /* 🔴 La columna es `pct`, NO `tasa` — medido. *Escribirla
                       de memoria habría hecho fallar el cálculo entero, y el
                       cuerpo se ve igual de correcto leyéndolo.* */
                    (SELECT pct FROM cat_tasas_impuesto
                      WHERE codigo = 'EC_IVA_0' AND activo
                        AND (vigencia_hasta IS NULL OR vigencia_hasta > now())
                      LIMIT 1), 0), 2);
    v_envio    := 0;   -- §7.2(4): hoy vale cero y lo paga el vendedor
    v_total    := v_subtotal + v_impuesto + v_envio;

    IF v_total IS NULL OR v_total <= 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_total_calculable');
      CONTINUE;
    END IF;

    /* 🔴 Y EL MONTO ESPERADO ES UN FRENO, NO UN ADORNO. §2: la autorización
       nombra un monto. Si el precio de hoy se fue muy por encima del que el
       cliente autorizó, **no se cobra: se avisa**. *Cobrar «lo que salga» es
       exactamente lo que una autorización recurrente no autoriza.* */
    IF v_r.monto_esperado IS NOT NULL AND v_total > v_r.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'monto_supera_lo_autorizado',
        'autorizado', v_r.monto_esperado, 'calculado', v_total);
      CONTINUE;
    END IF;

    INSERT INTO recurrencia_desglose
      (recurrencia_id, periodo, subtotal, impuesto, envio, total, moneda)
    VALUES (v_r.id, v_r.proximo_pedido_fecha, v_subtotal, v_impuesto, v_envio, v_total, 'USD')
    ON CONFLICT (recurrencia_id, periodo) DO NOTHING;
    /* `DO NOTHING` y no `DO UPDATE`, a propósito: **el desglose de un período
       se congela UNA vez.** *Si un reintento lo recalculara, el segundo intento
       podría cobrar un monto distinto del que el primero rechazó — y el
       cliente vería dos números para el mismo mes.* */

    /* ── ⓓ EL INTENTO, CON PAGADOR EXPLÍCITO ───────────────────────────────
       🔴 `pagador_user_id` NO se deriva: se escribe. *El defecto que S102 curó
       era exactamente éste en la cita — un intento sin pagador declarado
       obliga a adivinar de quién era la plata cuando hay que devolverla.*
       Y `pagador_origen = 'recurrencia'` distingue este cobro de uno que la
       persona hizo con el dedo: **no hubo nadie mirando la pantalla**, y eso
       cambia qué se le puede reclamar y cómo se le avisa. */
    INSERT INTO pagos_intentos (
      recurrencia_id, recurrencia_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia
    ) VALUES (
      v_r.id, v_r.proximo_pedido_fecha, v_total, 'USD', 'iniciado', 'tokenizacion',
      'nuvei', v_r.user_id, 'recurrencia',
      'rec:' || v_r.id::text || ':' || v_r.proximo_pedido_fecha::text
    )
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'recurrencia_id', v_r.id,
      'periodo',        v_r.proximo_pedido_fecha,
      'intento_id',     v_intento,
      'user_id',        v_r.user_id,
      'tarjeta_id',     v_r.tarjeta_id,
      'monto',          v_total,
      'moneda',         'USD',
      'autorizada_en',  v_r.autorizada_en,
      'reintentos',     v_r.reintentos);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'fecha', v_hoy,
    'para_cobrar', v_listas,
    'frenadas', v_frenadas,
    /* 🔴 LOS DOS NÚMEROS VAN SIEMPRE, incluso en cero. *Un `para_cobrar` vacío
       sin su `frenadas` al lado es indistinguible de «no había nada que
       cobrar» — y son dos hechos muy distintos.* (`L-364`) */
    'cuantas_listas',   jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

REVOKE ALL ON FUNCTION public.recurrencias_vencidas_pendientes() FROM anon, authenticated, PUBLIC;
/* Sólo el motor. **Ni siquiera `authenticated`**: esta función CONGELA MONTOS y
   ABRE INTENTOS. *Una puerta que el pagador puede llamar es la compuerta 2
   verificando un número que el pagador provocó.* */

COMMENT ON FUNCTION public.recurrencias_vencidas_pendientes() IS
  'LA BASE ELIGE Y CONGELA. Corre compuertas E3, congela el desglose del '
  'periodo al precio VIGENTE (§5) y abre el intento con pagador explicito. '
  'NO COBRA — la edge pagos-cobro-recurrente cobra lo que esta funcion '
  'devuelve. El cron no puede fabricar un JWT de usuario con service_role '
  '(L-340), y por eso la autorizacion del cliente vive en la fila de la serie.';


-- ═══════════════════════════════════════════════════════════════════════════
-- ③  EL CRON DEJA DE SER UN STUB — y deja de negarse por una condición vencida
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 SU CUERPO ANTERIOR ES EL CASO TESTIGO DE `L-372`: se negaba con
--    `pasarela_no_afiliada` **y nombraba el artefacto que lo abriría** (`D-778`).
--    La pasarela existe desde S101. **Nadie volvió.** *Una guarda que se niega
--    citando una condición vencida es indistinguible de una que funciona.*

CREATE OR REPLACE FUNCTION public.ejecutar_recurrencias_vencidas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net'
AS $function$
DECLARE v_url text; v_secreto text; v_req bigint; v_vivo boolean;
BEGIN
  /* El mismo interruptor que el actuador: si el motor está apagado, esto NO
     falla — dice que está apagado. *Un timbre que suena con la casa cerrada
     llena el buzón de nadie.* */
  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'recurrente_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false, 'motivo', 'recurrente_apagado');
  END IF;

  SELECT valor INTO v_url     FROM app_config WHERE clave = 'url_cobro_recurrente';
  SELECT valor INTO v_secreto FROM app_config WHERE clave = 'secreto_despacho';

  IF v_url IS NULL OR v_secreto IS NULL THEN
    /* 🔴 SE NIEGA NOMBRANDO EL ARTEFACTO QUE LA ABRE (`L-171`) — y esta vez el
       artefacto es VERIFICABLE por una consulta, no por prosa: son dos filas
       de `app_config`. *`D-883` existe para que algo pregunte si ya están.* */
    RETURN jsonb_build_object('ok', false, 'ejecutado', false,
      'motivo', 'sin_configurar',
      'falta', CASE WHEN v_url IS NULL THEN 'url_cobro_recurrente' ELSE 'secreto_despacho' END);
  END IF;

  /* 🔴 EL TIMBRE Y NADA MÁS. No elige, no congela, no cobra. *Meterle lógica
     acá sería partir la decisión entre dos lugares, y algún día van a decir
     cosas distintas.* */
  SELECT net.http_post(
           url     := v_url,
           headers := jsonb_build_object('Content-Type','application/json',
                                         'x-despacho-secret', v_secreto),
           body    := '{}'::jsonb,
           timeout_milliseconds := 30000
         ) INTO v_req;

  RETURN jsonb_build_object('ok', true, 'ejecutado', true, 'request_id', v_req);
END $function$;

REVOKE ALL ON FUNCTION public.ejecutar_recurrencias_vencidas() FROM anon, authenticated, PUBLIC;


-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_def text; v_r jsonb;
BEGIN
  -- (a) El cron dejó de negarse por la condición vencida.
  SELECT pg_get_functiondef(to_regprocedure('public.ejecutar_recurrencias_vencidas()')) INTO v_def;
  IF position('pasarela_no_afiliada' IN v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA: el cron sigue negandose por una condicion vencida (L-372)';
  END IF;
  IF position('net.http_post' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el cron no llama a la edge';
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR DEL REPARTO: la base NO cobra. Si algún día alguien
  --     le mete el cobro adentro, esto aborta. *El reparto es una decisión
  --     firmada, no una convención.*
  SELECT pg_get_functiondef(to_regprocedure('public.recurrencias_vencidas_pendientes()')) INTO v_def;
  IF position('net.http_post' IN v_def) > 0 OR position('service_role' IN v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA: la base intenta cobrar o fabricar identidad (L-340)';
  END IF;

  -- (c) Llama a la compuerta, no la reimplementa (L-375).
  IF position('verificar_compuertas_pre_cobro' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: no llama a las compuertas E3';
  END IF;

  -- (d) El pagador se ESCRIBE, no se deriva.
  IF position('pagador_user_id' IN v_def) = 0 OR position('pagador_origen' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el intento nace sin pagador declarado';
  END IF;

  -- (e) 🔴 CORRE DE VERDAD, con 0 series activas: tiene que devolver los DOS
  --     contadores en cero, no fallar. *Un motor que sólo se prueba con datos
  --     no está probado para el día que no los haya.*
  v_r := recurrencias_vencidas_pendientes();
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: la seleccion fallo en vacio: %', v_r;
  END IF;
  IF v_r->'para_cobrar' IS NULL OR v_r->'frenadas' IS NULL THEN
    RAISE EXCEPTION 'ABORTA: falta uno de los dos contadores — vacio y frenado se confunden';
  END IF;

  -- (f) Ninguna de las dos es alcanzable por el cliente.
  IF has_function_privilege('authenticated','public.recurrencias_vencidas_pendientes()','EXECUTE')
     OR has_function_privilege('anon','public.recurrencias_vencidas_pendientes()','EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: el pagador puede congelar su propio monto';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — el cron es timbre · la base elige y congela y NO cobra · compuertas llamadas · pagador escrito · corre en vacio · fuera del alcance del cliente';
END $cinturon$;

COMMIT;

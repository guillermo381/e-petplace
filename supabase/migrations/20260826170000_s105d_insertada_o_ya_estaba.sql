-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · `insertada` — DISTINGUIR UN ALTA NUEVA DE UNA RE-CARGA
--
-- 76(g) — VEDA: **NO RIGE.** `CREATE OR REPLACE` de una función. Sin backfill,
-- sin DDL de tabla, sin anclas. El único cambio de comportamiento es un campo
-- NUEVO en el retorno: nada de lo que ya se leía cambia de valor.
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-D-REVERSA-20260826170000-insertada.sql
--   Capturada del OBJETO con `pg_get_functiondef`, no de memoria, y declara
--   que revertir **rompe a quien ya lo consuma** con su orden.
--
-- ── EL PEDIDO, Y DE DÓNDE SALE ─────────────────────────────────────────────
--
-- Firma del founder sobre re-cargar una tarjeta que ya se tiene: *«se le dice
-- "Esa tarjeta ya está agregada" y NO SE HACE NADA MÁS… Lo único que sí se
-- revisa es el ESTADO.»*
--
-- La segunda mitad **ya está construida** (`20260826150000`: el `ON CONFLICT`
-- hace `estado='guardada', motivo_rechazo=NULL`, sólo hacia arriba). La
-- primera no se podía escribir: la RPC devolvía `ok:true, estado:'guardada'`
-- **igual en los dos casos** ⇒ la superficie no tenía dónde ramificar.
--
-- > ### Y C hizo lo correcto: **no escribió la rama.** *Una rama inerte se lee
-- > como hecha* — el que la encuentre el mes que viene va a creer que la voz
-- > existe y va a buscar el defecto en otro lado.
--
-- ── POR QUÉ `xmax` Y NO UN `EXISTS` PREVIO ─────────────────────────────────
--
-- La alternativa legible era preguntar antes del INSERT si el token ya estaba.
-- Se descartó: **tiene carrera** —entre la pregunta y el INSERT otra
-- transacción puede insertar— y contestaría «nueva» sobre una que ya existía.
-- `xmax` lo decide **dentro de la misma escritura**, sin ventana.
--
-- ⚠️ El costo del cambio: `xmax = 0` es un detalle de implementación, no una
-- garantía del contrato de Postgres. **Por eso el cinturón ejerce LAS DOS
-- RAMAS con el mismo token** — no confiamos en el truco, lo medimos acá.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.resolver_alta_tarjeta(p_alta_id uuid, p_desenlace text, p_token text DEFAULT NULL::text, p_bin text DEFAULT NULL::text, p_ultimos4 text DEFAULT NULL::text, p_marca text DEFAULT NULL::text, p_titular text DEFAULT NULL::text, p_motivo text DEFAULT NULL::text, p_alias text DEFAULT NULL::text, p_stoken_valido boolean DEFAULT NULL::boolean, p_stoken_detalle text DEFAULT NULL::text, p_expira_mes smallint DEFAULT NULL::smallint, p_expira_anio smallint DEFAULT NULL::smallint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_a public.altas_tarjeta%ROWTYPE; v_t uuid; v_insertada boolean;
BEGIN
  IF p_desenlace NOT IN ('guardada','rechazada','abandonada') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'desenlace_invalido');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe'); END IF;

  IF v_a.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
      'estado', v_a.estado, 'tarjeta_id', v_a.tarjeta_id);
  END IF;

  IF now() > v_a.expira_en THEN
    UPDATE public.altas_tarjeta SET estado='abandonada', cerrada_en=now(), motivo='alta_vencida'
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_vencida');
  END IF;

  IF p_desenlace = 'guardada' THEN
    IF p_token IS NULL OR btrim(p_token) = '' THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_ausente');
    END IF;

    INSERT INTO public.tarjetas_guardadas
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado, alias, proveedor_uid,
       -- 🔴 FASE 5: el proveedor manda el vencimiento en el alta y lo estábamos
       --    tirando. Se guarda ACÁ porque es el único momento en que llega.
       expira_mes, expira_anio)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca, p_titular,
       'guardada', NULLIF(btrim(COALESCE(p_alias,'')),''),
       /* 🔴 `D-921`, LA MITAD QUE FALTABA. Acá decía `v_a.id::text` con el
          comentario *«el handle del alta ES el uid ante el proveedor»* — que
          era cierto **hasta esta jornada** y es exactamente el defecto: cada
          alta tokenizaba bajo un uid nuevo ⇒ **una persona, nueve uid**
          (medido en la tabla).

          `crear_alta_tarjeta` ya devuelve el uid ESTABLE desde `20260825190000`
          — pero **nadie lo guardaba acá**. *Curar la puerta de entrada y no
          seguir el camino hasta donde el dato se escribe deja la mitad de una
          cura mirando a la otra.*

          ⚠️ Y su consecuencia era diferida, que es lo que la volvía peligrosa:
          hoy la página manda `alta` (la pieza ② no existe), así que los dos
          coinciden por accidente. **El día que ② salga, el token nace bajo el
          uid estable y nosotros anotaríamos otro ⇒ `card/list` consultaría con
          el uid equivocado y no encontraría la tarjeta.** */
       public.obtener_uid_proveedor(v_a.user_id, v_a.proveedor),
       p_expira_mes, p_expira_anio)
    ON CONFLICT (proveedor, token) DO UPDATE
      SET actualizada_en = now(),
          /* 🔴 EL ESTADO QUE REVIVE **NO ES MUDO** — matiz firmado por el
             founder sobre el UPDATE mudo. El resto se calla a propósito
             *(quien intentó guardar queda con lo que quería, y decirle «ya la
             tenías» le informa de un error que no cometió)*, **pero un cambio
             de estado hacia arriba es información buena**: una tarjeta que
             estaba `rechazada` y ahora el proveedor tokeniza bien **está
             disponible otra vez**, y dejarla `rechazada` la esconde.
             ⚠️ Sólo HACIA ARRIBA: no se degrada una `guardada` — este camino
             sólo corre con `p_desenlace = 'guardada'`. */
          estado = 'guardada',
          motivo_rechazo = NULL,
          alias = COALESCE(NULLIF(btrim(COALESCE(EXCLUDED.alias,'')),''),
                           public.tarjetas_guardadas.alias),
          -- El uid NO se pisa: el token sigue atado al uid con el que nació.
          proveedor_uid = COALESCE(public.tarjetas_guardadas.proveedor_uid, EXCLUDED.proveedor_uid),
          -- El vencimiento se completa si faltaba; una re-presentación no lo borra.
          expira_mes  = COALESCE(EXCLUDED.expira_mes,  public.tarjetas_guardadas.expira_mes),
          expira_anio = COALESCE(EXCLUDED.expira_anio, public.tarjetas_guardadas.expira_anio)
      WHERE public.tarjetas_guardadas.user_id = v_a.user_id
    RETURNING id, (xmax = 0) INTO v_t, v_insertada;
    /* 🔴 `xmax = 0` DISTINGUE INSERT DE UPDATE en un ON CONFLICT. Es la
       tecnica estandar y **no esta en el contrato de Postgres**: es un detalle
       de implementacion. Por eso no se confia en ella, se MIDE -- el cinturon
       de esta migracion ejerce las dos ramas con el mismo token.
       *Un truco que funciona y no se probo es un verde prestado.* */

    IF v_t IS NULL THEN
      UPDATE public.altas_tarjeta
         SET estado='rechazada', cerrada_en=now(), motivo='token_de_otro_dueno',
             stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
       WHERE id = p_alta_id;
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_de_otro_dueno');
    END IF;

    UPDATE public.altas_tarjeta
       SET estado='guardada', tarjeta_id=v_t, cerrada_en=now(),
           stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', true, 'estado', 'guardada', 'tarjeta_id', v_t,
      /* Lo unico que agrega esta migracion al CONTRATO: si la tarjeta nacio
         ahora o ya estaba. Sin esto la superficie no tiene donde ramificar la
         voz «Esa tarjeta ya esta agregada» -- y C no escribe una rama muerta,
         porque una rama muerta se lee como hecha. */
      'insertada', COALESCE(v_insertada, true));
  END IF;

  UPDATE public.altas_tarjeta
     SET estado=p_desenlace, cerrada_en=now(),
         motivo=COALESCE(NULLIF(btrim(COALESCE(p_motivo,'')),''),
                         'sin_motivo_declarado:'||p_desenlace),
         stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
   WHERE id = p_alta_id;
  RETURN jsonb_build_object('ok', true, 'estado', p_desenlace);
END;
$function$
;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — en SUBTRANSACCIÓN QUE SE DESHACE SOLA (`L-406`).
-- 🔴 Su trabajo NO es ver si la función corre: es **ejercer las dos ramas del
--    `xmax` con el mismo token**, que es lo único que convierte un truco
--    indocumentado en comportamiento medido.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_user  uuid;
  v_a1    uuid;
  v_a2    uuid;
  v_tok   text := 'CINTURON-S105D-INS-' || gen_random_uuid()::text;
  v_r     jsonb;
BEGIN
  BEGIN  -- ← subtransacción

    SELECT user_id INTO v_user FROM public.altas_tarjeta ORDER BY creada_en DESC LIMIT 1;
    IF v_user IS NULL THEN
      RAISE EXCEPTION 'CINTURON: no hay un user_id real del cual colgar el fixture';
    END IF;

    INSERT INTO public.altas_tarjeta (user_id, proveedor, estado, expira_en)
    VALUES (v_user, 'nuvei', 'pendiente', now() + interval '15 minutes') RETURNING id INTO v_a1;
    INSERT INTO public.altas_tarjeta (user_id, proveedor, estado, expira_en)
    VALUES (v_user, 'nuvei', 'pendiente', now() + interval '15 minutes') RETURNING id INTO v_a2;

    -- ① PRIMERA VEZ: la tarjeta nace ⇒ insertada = true.
    v_r := resolver_alta_tarjeta(p_alta_id => v_a1, p_desenlace => 'guardada',
             p_token => v_tok, p_bin => '411111', p_ultimos4 => '1111', p_marca => 'vi');
    IF (v_r->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'CINTURON ①: el alta nueva no entro: %', v_r;
    END IF;
    IF (v_r->>'insertada')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'CINTURON ①: una tarjeta NUEVA se reporto como re-carga: %', v_r;
    END IF;

    -- ② 🔴 SEGUNDA VEZ, MISMO TOKEN, OTRO HANDLE: es la re-carga.
    --    Si `xmax` no discriminara, acá saldría `true` y la voz mentiría.
    v_r := resolver_alta_tarjeta(p_alta_id => v_a2, p_desenlace => 'guardada',
             p_token => v_tok, p_bin => '411111', p_ultimos4 => '1111', p_marca => 'vi');
    IF (v_r->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'CINTURON ②: la re-carga rebotó y no debería: %', v_r;
    END IF;
    IF (v_r->>'insertada')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON ②: una RE-CARGA se reporto como nueva -- xmax NO discrimina: %', v_r;
    END IF;

    -- ③ Y no nacieron dos filas: el ON CONFLICT hizo su trabajo.
    IF (SELECT count(*) FROM public.tarjetas_guardadas WHERE token = v_tok) <> 1 THEN
      RAISE EXCEPTION 'CINTURON ③: la re-carga duplico la fila';
    END IF;

    RAISE NOTICE 'CINTURON INSERTADA: 3/3 verde -- xmax discrimina de verdad. Deshaciendo.';
    RAISE EXCEPTION 'CINTURON_OK_DESHACER';

  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'CINTURON_OK_DESHACER' THEN RAISE; END IF;
  END;

  IF EXISTS (SELECT 1 FROM public.tarjetas_guardadas WHERE token LIKE 'CINTURON-S105D-INS-%') THEN
    RAISE EXCEPTION 'CINTURON: quedo residuo de fixture';
  END IF;
  RAISE NOTICE 'CINTURON: residuo 0 verificado.';
END $cinturon$;

COMMIT;

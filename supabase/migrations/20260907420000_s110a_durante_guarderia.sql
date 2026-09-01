/* ═══════════════════════════════════════════════════════════════════════════
   S110-A · EL DURANTE DE GUARDERÍA — el escritor de transición que no existía
   ═══════════════════════════════════════════════════════════════════════════

   ── EL HECHO QUE LA FUNDA, medido contra el objeto ───────────────────────
   El CHECK de `guarderia_estadias.estado` declara SIETE valores. Medido:
   **`reservada` la escribe un DEFAULT y `cancelada` la escribe
   `mover_sujeto_por_reverso`. Los otros CINCO no tienen escritor.**
   95 estadías vivas, las 95 en `reservada`, con `a_bordo_en`, `llegada_en` y
   `entregada_en` en CERO. (Censo: `docs/loop/S110-A-CENSO-Y-MAPA.md`.)

   ── 🔴 Y LO QUE ESO ROMPÍA SIN FALLAR ────────────────────────────────────
   `abrir_tramo_guarderia` ata la estadía al tramo y **no toca el estado**;
   `obtener_tramo_vivo_de_mi_mascota` y `obtener_punto_vivo` filtran por
   `estado IN ('recogida_en_curso','retorno_en_curso')`.
   > ### ⇒ El cuidador emite puntos y la familia no ve ninguno. **No falla:
   > DESCARTA** — y una omisión no tiene síntoma (`L-456`).
   *Las dos piezas del punto vivo estaban bien construidas y su resultado no
   llegaba a nadie porque faltaba quien moviera el estado.*

   ── LA FORMA: LA MÁQUINA VA COMO DATO, no como `IF` ──────────────────────
   Precedente de la casa: `cat_transiciones_pedido` (S95). Acá nacen
   **`cat_guarderia_estados`** (el vocabulario) y
   **`cat_guarderia_transiciones`** (los actos). Un solo escritor privado
   —`_guarderia_aplicar_acto`— las LEE; las cinco RPC públicas son su puerta;
   y `obtener_maquina_estadia_guarderia` publica **las mismas filas** que el
   escritor obedece.
   🔴 *Si el lector derivara la máquina de otro lado, la pantalla podría
   mostrar una transición que el motor rechaza. Leen la misma tabla.*

   ── LAS DOS HORAS, Y NO SON LA MISMA (pedido de C, aceptado) ─────────────
   **El ESTADO y su timestamp los pone el SERVIDOR, siempre `now()`.** Ninguna
   de las cinco firmas acepta una hora para el estado — un reloj de teléfono no
   decide un hecho de negocio ni esquiva una compuerta de franja.
   **El ACTA conserva `p_cerrada_en`, la hora de la PUERTA**, porque eso ya lo
   firmó S107 y su modo de falla es peor: el acta existe para contestar
   *cuándo apareció la lesión*, y sellarla con la hora en que volvió la señal
   mete cuarenta minutos de error en el único instrumento que mide eso.
   ⇒ **Las dos viajan en el retorno** (`a_bordo_en` del servidor y
   `acta_cerrada_en` de la puerta): *son dos hechos distintos y se muestran los
   dos*, exactamente como `cerrada_en` y `recibida_en` desde S107.

   ── EL GATE, y por qué NO lo ensancho ────────────────────────────────────
   `user_gestiona_prestador` = titular OR administrador OR is_admin. **El
   cuidador empleado sin rol no pasa** — mismo techo que el acta y el tramo
   tienen desde S107. Uso EL MISMO predicado porque los actos únicos levantan
   el acta en la misma transacción: **dos gates distintos en un acto único
   producen una transacción que puede autorizar la mitad.** Ensancharlo es
   decisión de producto y va como ficha, no como default de A.

   ── EL PERÍMETRO, honrado y escrito ──────────────────────────────────────
   🔴 **De `no_recogida` NO CUELGA NADA**: sin conteo de días, sin aviso de
   mora, sin camino a refugio, sin columna de protocolo. `no_recogida_motivo`
   es **por qué cerró la franja**, no el día 1 de la mora (§6 de
   `LETRA_GUARDERIA` sigue frenado por riesgo penal y no se toca).
   **Ningún cron la escribe:** la declara una persona, en la app, en el momento.
   Cero texto legal. Cero llave de `app_config`.

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   DDL aditiva (cuatro columnas nullable, dos catálogos nuevos) + funciones
   nuevas. **CERO BACKFILL**: las 95 estadías vivas quedan en `reservada`, que
   es la verdad — no las movió nadie. El cinturón corre en subtransacción que
   **se deshace sola** y no ancla snapshots sobre datos vivos.

   **Reversa:** `docs/relevamientos/S110-A-REVERSA-durante-guarderia.sql`,
   escrita ANTES. Declara que **NO devuelve a `reservada` lo ya movido, NO
   borra actas, y que el DROP de las columnas destruye el motivo de toda
   `no_recogida`.**
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LAS COLUMNAS QUE FALTABAN ══════════════════════════════════════════
/* Había TRES timestamps para CUATRO transiciones del día. `retorno_en_curso`
   no tenía ninguna ⇒ la hora en que el animal sale de vuelta vivía en
   `updated_at`… **hasta que `entregada` la pisaba.** *Ese hecho se perdía en
   silencio.* Es el espejo exacto de `a_bordo_en`, no una columna inventada
   para que una fila entre en una lista ajena. */
ALTER TABLE public.guarderia_estadias
  ADD COLUMN IF NOT EXISTS retorno_en           timestamptz,
  ADD COLUMN IF NOT EXISTS no_recogida_en       timestamptz,
  ADD COLUMN IF NOT EXISTS no_recogida_motivo   text,
  ADD COLUMN IF NOT EXISTS no_recogida_detalle  text;

COMMENT ON COLUMN public.guarderia_estadias.retorno_en IS
  'S110-A · cuándo el animal salió de vuelta al domicilio. Espejo de a_bordo_en.';
COMMENT ON COLUMN public.guarderia_estadias.no_recogida_motivo IS
  'S110-A · POR QUÉ la franja de recogida cerró sin animal a bordo. NO es el día 1 de la mora: de este campo no cuelga ningún protocolo (LETRA_GUARDERIA §6 frenado).';

/* 🔴 LA COHERENCIA ES SIMÉTRICA Y A PROPÓSITO **NO** SE ATA AL ESTADO.
   Un `CHECK (motivo IS NULL OR estado='no_recogida')` sería la forma obvia y
   sería una MINA: `mover_sujeto_por_reverso` mueve a `cancelada` toda estadía
   futura de un bono revertido — incluida una `no_recogida` —, y ese CHECK
   haría **explotar el reverso de un pago** por un campo del durante.
   *Una restricción correcta en su propia tabla puede romper un motor que no la
   conoce.* ⇒ se ata el motivo a SU hora, que es lo que de verdad viaja junto. */
ALTER TABLE public.guarderia_estadias
  ADD CONSTRAINT chk_no_recogida_coherente CHECK (
    (no_recogida_en IS NULL     AND no_recogida_motivo IS NULL)
 OR (no_recogida_en IS NOT NULL AND no_recogida_motivo IS NOT NULL)),
  ADD CONSTRAINT chk_no_recogida_motivo CHECK (
    no_recogida_motivo IS NULL OR no_recogida_motivo IN
      ('nadie_en_domicilio','animal_no_entregado','familia_cancelo_en_puerta','otro')),
  /* «Otro» sin detalle es un motivo que no dice nada. **Inexpresable**, no un
     guard en el body: un atajo que puede producir un valor equivocado no se
     declara — se hace imposible (`L-439`). */
  ADD CONSTRAINT chk_no_recogida_otro_exige_detalle CHECK (
    no_recogida_motivo IS DISTINCT FROM 'otro'
 OR (no_recogida_detalle IS NOT NULL AND btrim(no_recogida_detalle) <> ''));

-- ══ ② EL VOCABULARIO, COMO DATO ══════════════════════════════════════════
CREATE TABLE public.cat_guarderia_estados (
  estado      text PRIMARY KEY,
  es_terminal boolean NOT NULL,
  orden       int     NOT NULL,
  /* Quién lo escribe. `reservada` y `cancelada` NO son destino de ningún acto
     del durante y por eso se declaran: *un estado con escritor ajeno no queda
     huérfano por no estar en mi lista.* */
  escritor    text    NOT NULL
);
INSERT INTO public.cat_guarderia_estados (estado, es_terminal, orden, escritor) VALUES
  ('reservada',          false, 1, 'default_de_la_columna'),
  ('recogida_en_curso',  false, 2, 'acto_del_durante'),
  ('en_guarderia',       false, 3, 'acto_del_durante'),
  ('retorno_en_curso',   false, 4, 'acto_del_durante'),
  ('entregada',          true,  5, 'acto_del_durante'),
  ('no_recogida',        true,  6, 'acto_del_durante'),
  ('cancelada',          true,  7, 'mover_sujeto_por_reverso');

CREATE TABLE public.cat_guarderia_transiciones (
  acto          text PRIMARY KEY,
  desde         text NOT NULL REFERENCES public.cat_guarderia_estados(estado),
  hasta         text NOT NULL REFERENCES public.cat_guarderia_estados(estado),
  columna_ts    text NOT NULL,
  exige_tramo   text,          -- null | 'recogida' | 'devolucion'
  es_lote       boolean NOT NULL,
  levanta_acta  text,          -- null | 'recogida' | 'devolucion'
  orden         int NOT NULL,
  CHECK (exige_tramo  IS NULL OR exige_tramo  IN ('recogida','devolucion')),
  CHECK (levanta_acta IS NULL OR levanta_acta IN ('recogida','devolucion'))
);
INSERT INTO public.cat_guarderia_transiciones
  (acto, desde, hasta, columna_ts, exige_tramo, es_lote, levanta_acta, orden) VALUES
  ('a_bordo',     'reservada',         'recogida_en_curso', 'a_bordo_en',     'recogida',   false, 'recogida',   1),
  ('llegada',     'recogida_en_curso', 'en_guarderia',      'llegada_en',     NULL,         true,  NULL,         2),
  ('retorno',     'en_guarderia',      'retorno_en_curso',  'retorno_en',     'devolucion', true,  NULL,         3),
  ('entregada',   'retorno_en_curso',  'entregada',         'entregada_en',   NULL,         false, 'devolucion', 4),
  ('no_recogida', 'reservada',         'no_recogida',       'no_recogida_en', NULL,         false, NULL,         5);

ALTER TABLE public.cat_guarderia_estados       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_guarderia_transiciones  ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_guarderia_estados_lectura      ON public.cat_guarderia_estados      FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_guarderia_transiciones_lectura ON public.cat_guarderia_transiciones FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.cat_guarderia_estados, public.cat_guarderia_transiciones TO authenticated;

-- ══ ③ EL GUARD QUE PUEDE DAR SU ROJO ═════════════════════════════════════
/* 🔴 El catálogo y el CHECK declaran los MISMOS siete valores en dos lugares.
   *Una regla duplicada por copia se cura dos veces o no se cura.* Esta función
   existe para que la divergencia SUENE: compara el catálogo contra el texto
   vivo del CHECK, en las dos direcciones. Molde:
   `verificar_coherencia_tablas_tipadas()` (S67). */
CREATE OR REPLACE FUNCTION public.verificar_coherencia_estados_guarderia()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_check text; v_falta text[]; v_sobra text[];
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_check
    FROM pg_constraint WHERE conname = 'guarderia_estadias_estado_check';
  IF v_check IS NULL THEN
    RAISE EXCEPTION 'el CHECK de estado no existe — el instrumento no puede medir nada';
  END IF;

  -- (a) del catálogo, ¿alguno NO está en el CHECK?
  SELECT array_agg(estado) INTO v_falta
    FROM cat_guarderia_estados WHERE position('''' || estado || '''' in v_check) = 0;

  -- (b) del CHECK, ¿algún literal NO está en el catálogo?
  SELECT array_agg(m[1]) INTO v_sobra
    FROM regexp_matches(v_check, '''([a-z_]+)''::text', 'g') m
   WHERE NOT EXISTS (SELECT 1 FROM cat_guarderia_estados c WHERE c.estado = m[1]);

  RETURN jsonb_build_object(
    'ok', v_falta IS NULL AND v_sobra IS NULL,
    'en_catalogo_y_no_en_check', COALESCE(to_jsonb(v_falta), '[]'::jsonb),
    'en_check_y_no_en_catalogo', COALESCE(to_jsonb(v_sobra), '[]'::jsonb));
END $$;

-- ══ ④ EL GATE, UNA VEZ ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._guarderia_estadia_gestionable(p_estadia_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_prest uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT c.prestador_id INTO v_prest
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.id = p_estadia_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;
  RETURN v_prest;
END $$;

-- ══ ⑤ EL ESCRITOR DE TRANSICIÓN — el único ═══════════════════════════════
CREATE OR REPLACE FUNCTION public._guarderia_aplicar_acto(
  p_estadia_id uuid, p_acto text,
  /* 🔴 EL MOTIVO VIAJA CON EL ESTADO, EN LA MISMA SENTENCIA — y no es
     elegancia: `chk_no_recogida_coherente` exige que la hora y el motivo
     estén los dos o ninguno, y **un CHECK se evalúa por SENTENCIA, no al
     final de la transacción** (en Postgres un CHECK ni siquiera puede ser
     DEFERRABLE). Escribir el estado primero y el motivo después deja una
     fila intermedia ilegal y la sentencia rebota.
     > ### Lo encontró el cinturón, no el razonamiento: yo había escrito las
     > dos sentencias convencido de que la transacción las cubría.
     *Una restricción simétrica correcta vuelve imposible la escritura en dos
     pasos — y eso es lo que la restricción quería decir.* */
  p_motivo text DEFAULT NULL, p_detalle text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE t record; v_estado text; v_ts timestamptz; v_tramo uuid; v_tramo_estado text;
BEGIN
  SELECT * INTO t FROM cat_guarderia_transiciones WHERE acto = p_acto;
  IF t IS NULL THEN RAISE EXCEPTION 'acto_invalido' USING ERRCODE='22023'; END IF;

  /* FOR UPDATE: dos teléfonos tocando el mismo animal no pueden decidir a la
     vez. El segundo espera y encuentra el estado ya movido ⇒ cae en el brazo
     idempotente, no en el ilegal. */
  SELECT estado INTO v_estado FROM guarderia_estadias WHERE id = p_estadia_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;

  -- ── IDEMPOTENCIA por (estadía, acto): NO pisa la hora original ─────────
  IF v_estado = t.hasta THEN
    EXECUTE format('SELECT %I FROM guarderia_estadias WHERE id = $1', t.columna_ts)
       INTO v_ts USING p_estadia_id;
    RETURN jsonb_build_object('ok', true, 'movida', false, 'ya_estaba', true,
                              'estado', v_estado, 'ts', v_ts);
  END IF;

  /* ── 🔴 EL ESTADO FINAL SE REBOTA HABLANDO, NO CON EL GENÉRICO ─────────
     Medido por C y por otra sesión, y verificado acá: el ÚNICO escritor vivo
     de `estado` es `mover_sujeto_por_reverso`, que escribe `'cancelada'`.
     **El guard positivo (`estado = desde`) ya impide la resurrección** — una
     estadía cancelada por reverso jamás vuelve a `recogida_en_curso`, porque
     `cancelada <> reservada`. *Lo que faltaba no era el freno: era la VOZ.*
     > Un guard que frena bien y explica mal manda a alguien a reintentar algo
     > que no se arregla reintentando.
     `es_terminal` sale del catálogo, no de un literal: el día que nazca un
     octavo estado terminal, este brazo lo cubre sin que nadie lo edite. */
  IF v_estado <> t.desde THEN
    IF v_estado = 'cancelada' THEN
      RAISE EXCEPTION 'estadia_cancelada' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM cat_guarderia_estados
                WHERE estado = v_estado AND es_terminal) THEN
      RAISE EXCEPTION 'estadia_en_estado_final: %', v_estado USING ERRCODE='22023';
    END IF;
    /* Transición ilegal NO terminal: código + estado actual en el MENSAJE, que
       es la forma discriminada de la casa (`ya_tienes_plan_activo: <uuid>`). El
       wrapper matchea por PREFIJO de código, jamás por prosa (regla 35). */
    RAISE EXCEPTION 'transicion_ilegal: % (esperaba %, acto %)', v_estado, t.desde, p_acto
      USING ERRCODE='22023';
  END IF;

  -- ── El tramo, cuando el acto lo exige ─────────────────────────────────
  IF t.exige_tramo IS NOT NULL THEN
    EXECUTE format('SELECT %I FROM guarderia_estadias WHERE id = $1',
                   'tramo_' || CASE t.exige_tramo WHEN 'recogida' THEN 'recogida' ELSE 'devolucion' END || '_id')
       INTO v_tramo USING p_estadia_id;
    IF v_tramo IS NULL THEN
      RAISE EXCEPTION 'sin_tramo_abierto: la estadia no esta atada a un tramo de %', t.exige_tramo
        USING ERRCODE='22023';
    END IF;
    SELECT estado INTO v_tramo_estado FROM guarderia_tramos WHERE id = v_tramo;
    IF v_tramo_estado <> 'abierto' THEN
      RAISE EXCEPTION 'sin_tramo_abierto: el tramo de % esta %', t.exige_tramo, v_tramo_estado
        USING ERRCODE='22023';
    END IF;
  END IF;

  /* 🔴 LA HORA DEL ESTADO LA PONE EL SERVIDOR. `now()`, siempre, en las cinco.
     Un reloj de teléfono no decide un hecho de negocio ni esquiva una franja. */
  v_ts := now();
  IF p_acto = 'no_recogida' THEN
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, '
                   'no_recogida_motivo = $4, no_recogida_detalle = $5, '
                   'updated_at = now() WHERE id = $3', t.columna_ts)
      USING t.hasta, v_ts, p_estadia_id, p_motivo, p_detalle;
  ELSE
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, updated_at = now() WHERE id = $3',
                   t.columna_ts) USING t.hasta, v_ts, p_estadia_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'movida', true, 'ya_estaba', false,
                            'estado', t.hasta, 'ts', v_ts);
END $$;

-- ══ ⑥ LOS DOS ACTOS ÚNICOS — acta y estado en LA MISMA transacción ═══════
/* «Un solo toque, no son dos botones» (founder). Si el acta falla, el estado
   no se mueve: **es una sola transacción, no dos llamadas que la pantalla
   coordina.** */
CREATE OR REPLACE FUNCTION public.marcar_a_bordo_guarderia(
  p_estadia_id uuid,
  p_carnet_verificado boolean,
  p_objetos text DEFAULT NULL,
  p_observaciones text DEFAULT NULL,
  p_clave_idempotencia text DEFAULT NULL,
  /* LA HORA DE LA PUERTA — sólo para el ACTA, jamás para el estado. Sin señal
     el acta se levanta local con su hora real y se reproduce después; el acta
     existe para contestar CUÁNDO apareció la lesión y sellarla con la hora en
     que volvió la señal mete cuarenta minutos de error justo ahí. */
  p_cerrada_en timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_mov jsonb; v_acta jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  v_mov  := public._guarderia_aplicar_acto(p_estadia_id, 'a_bordo');
  v_acta := public.levantar_acta_guarderia(p_estadia_id, 'recogida', p_carnet_verificado,
                                           p_objetos, p_observaciones, p_cerrada_en,
                                           p_clave_idempotencia);
  RETURN jsonb_build_object(
    'ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'a_bordo_en', v_mov->>'ts',                     -- del SERVIDOR
    'acta_id', v_acta->>'acta_id',
    'acta_ya_existia', (v_acta->>'ya_existia')::boolean,
    'acta_cerrada_en', p_cerrada_en);               -- de la PUERTA
END $$;

CREATE OR REPLACE FUNCTION public.marcar_entregada_guarderia(
  p_estadia_id uuid,
  p_carnet_verificado boolean,
  p_objetos text DEFAULT NULL,
  p_observaciones text DEFAULT NULL,
  p_clave_idempotencia text DEFAULT NULL,
  p_cerrada_en timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_mov jsonb; v_acta jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  v_mov  := public._guarderia_aplicar_acto(p_estadia_id, 'entregada');
  v_acta := public.levantar_acta_guarderia(p_estadia_id, 'devolucion', p_carnet_verificado,
                                           p_objetos, p_observaciones, p_cerrada_en,
                                           p_clave_idempotencia);
  RETURN jsonb_build_object(
    'ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'entregada_en', v_mov->>'ts',
    'acta_id', v_acta->>'acta_id',
    'acta_ya_existia', (v_acta->>'ya_existia')::boolean,
    'acta_cerrada_en', p_cerrada_en);
END $$;

-- ══ ⑦ LOS DOS ACTOS DE LOTE — la camioneta llega con todos ═══════════════
/* El lote NO aborta por un ítem: reporta por ítem y sigue. *Negarse a
   registrar ocho llegadas porque una estadía estaba cancelada es peor que el
   problema que evita.*
   🔴 PERO un lote que no movió NADA **no devuelve `ok:true`**: rebota
   `ninguna_transicion_posible`. Un contador en cero leído como éxito es
   exactamente el modo de falla silencioso que esta sesión vino a curar. */
CREATE OR REPLACE FUNCTION public.marcar_llegada_guarderia(p_estadias uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_id uuid; v_r jsonb; v_mov int := 0; v_ya int := 0; v_rech jsonb := '[]'::jsonb;
BEGIN
  IF p_estadias IS NULL OR cardinality(p_estadias) = 0 THEN
    RAISE EXCEPTION 'sin_estadias' USING ERRCODE='22023';
  END IF;
  FOREACH v_id IN ARRAY p_estadias LOOP
    BEGIN
      PERFORM public._guarderia_estadia_gestionable(v_id);
      v_r := public._guarderia_aplicar_acto(v_id, 'llegada');
      IF (v_r->>'ya_estaba')::boolean THEN v_ya := v_ya + 1; ELSE v_mov := v_mov + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      v_rech := v_rech || jsonb_build_array(
        jsonb_build_object('estadiaId', v_id, 'motivo', SQLERRM));
    END;
  END LOOP;
  IF v_mov = 0 AND v_ya = 0 THEN
    RAISE EXCEPTION 'ninguna_transicion_posible: % rechazadas', jsonb_array_length(v_rech)
      USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'movidas', v_mov, 'ya_estaban', v_ya,
                            'rechazadas', v_rech);
END $$;

CREATE OR REPLACE FUNCTION public.marcar_retorno_guarderia(p_estadias uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_id uuid; v_r jsonb; v_mov int := 0; v_ya int := 0; v_rech jsonb := '[]'::jsonb;
BEGIN
  IF p_estadias IS NULL OR cardinality(p_estadias) = 0 THEN
    RAISE EXCEPTION 'sin_estadias' USING ERRCODE='22023';
  END IF;
  FOREACH v_id IN ARRAY p_estadias LOOP
    BEGIN
      PERFORM public._guarderia_estadia_gestionable(v_id);
      v_r := public._guarderia_aplicar_acto(v_id, 'retorno');
      IF (v_r->>'ya_estaba')::boolean THEN v_ya := v_ya + 1; ELSE v_mov := v_mov + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      v_rech := v_rech || jsonb_build_array(
        jsonb_build_object('estadiaId', v_id, 'motivo', SQLERRM));
    END;
  END LOOP;
  IF v_mov = 0 AND v_ya = 0 THEN
    RAISE EXCEPTION 'ninguna_transicion_posible: % rechazadas', jsonb_array_length(v_rech)
      USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'movidas', v_mov, 'ya_estaban', v_ya,
                            'rechazadas', v_rech);
END $$;

-- ══ ⑧ NO-RECOGIDA — con motivo, y sin nada colgando ══════════════════════
CREATE OR REPLACE FUNCTION public.marcar_no_recogida_guarderia(
  p_estadia_id uuid, p_motivo text, p_detalle text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_mov jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  IF p_motivo IS NULL OR p_motivo NOT IN
     ('nadie_en_domicilio','animal_no_entregado','familia_cancelo_en_puerta','otro') THEN
    RAISE EXCEPTION 'motivo_invalido' USING ERRCODE='22023';
  END IF;
  IF p_motivo = 'otro' AND (p_detalle IS NULL OR btrim(p_detalle) = '') THEN
    RAISE EXCEPTION 'motivo_otro_exige_detalle' USING ERRCODE='22023';
  END IF;

  /* El motivo entra EN LA MISMA sentencia que el estado (ver el escritor).
     Idempotente de verdad: si ya estaba, el escritor devuelve temprano y
     **no se pisa el motivo original** — *el segundo toque no reescribe por qué
     no estaba el animal.* */
  v_mov := public._guarderia_aplicar_acto(p_estadia_id, 'no_recogida', p_motivo, p_detalle);

  RETURN jsonb_build_object('ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'no_recogida_en', v_mov->>'ts',
    'motivo', (SELECT no_recogida_motivo FROM guarderia_estadias WHERE id = p_estadia_id));
END $$;

-- ══ ⑨ LA MÁQUINA COMO DATO — el lector publica lo que el escritor obedece ═
CREATE OR REPLACE FUNCTION public.obtener_maquina_estadia_guarderia()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'estados', (SELECT jsonb_agg(jsonb_build_object(
                  'estado', estado, 'esTerminal', es_terminal, 'escritor', escritor)
                ORDER BY orden) FROM cat_guarderia_estados),
    'actos',   (SELECT jsonb_agg(jsonb_build_object(
                  'acto', acto, 'desde', desde, 'hasta', hasta,
                  'exigeTramo', exige_tramo, 'esLote', es_lote, 'levantaActa', levanta_acta)
                ORDER BY orden) FROM cat_guarderia_transiciones),
    'motivosNoRecogida', jsonb_build_array(
      'nadie_en_domicilio','animal_no_entregado','familia_cancelo_en_puerta','otro'));
END $$;

-- ══ ⑩ L-140 · anon fuera, authenticated adentro ══════════════════════════
REVOKE EXECUTE ON FUNCTION public.marcar_a_bordo_guarderia(uuid,boolean,text,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,boolean,text,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_llegada_guarderia(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_retorno_guarderia(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_no_recogida_guarderia(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_maquina_estadia_guarderia() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verificar_coherencia_estados_guarderia() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._guarderia_aplicar_acto(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._guarderia_estadia_gestionable(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.marcar_a_bordo_guarderia(uuid,boolean,text,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,boolean,text,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_llegada_guarderia(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_retorno_guarderia(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_no_recogida_guarderia(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_maquina_estadia_guarderia() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_coherencia_estados_guarderia() TO authenticated;

-- ══ ⑪ CINTURÓN — EL ROJO PRIMERO, SOBRE EL PRIMER CASO REAL ══════════════
/* 🔴 `L-459`: la primera prueba de un guard nuevo NO es que dé verde — es que
   dé **ROJO sobre el primer caso real**. Los brazos R1 y R2 corren contra las
   **95 estadías vivas tal como están** (`reservada`, sin tramo): *no las
   preparé yo, y por eso pueden desmentirme.* Recién después vienen los verdes.
   Todo lo que escribe corre en subtransacción que **se deshace sola** (`L-406`). */
DO $cint$
DECLARE
  v_rol   text := current_user;     -- ⚠️ jamás RESET ROLE bajo db push
  v_est   uuid; v_prest uuid; v_fecha date; v_titular uuid; v_ajeno uuid;
  v_est2  uuid;
  v_tramo uuid; v_r jsonb; v_h1 timestamptz; v_h2 timestamptz;
  v_puerta timestamptz := now() - interval '41 minutes';   -- la hora de la PUERTA
  v_acl   text; v_msg text; v_rojo boolean;
BEGIN
  -- El primer caso REAL: una estadía viva, sin tocarla.
  SELECT g.id, c.prestador_id, c.fecha INTO v_est, v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado = 'reservada' ORDER BY c.fecha LIMIT 1;
  IF v_est IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin estadia real en reservada — el arnes no puede medir nada';
  END IF;
  SELECT user_id INTO v_titular FROM prestadores WHERE id = v_prest;
  IF v_titular IS NULL THEN RAISE EXCEPTION 'CINTURON: el prestador no tiene titular'; END IF;
  SELECT u.id INTO v_ajeno FROM auth.users u
   WHERE u.id <> v_titular AND NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.user_id = u.id)
   LIMIT 1;
  IF v_ajeno IS NULL THEN RAISE EXCEPTION 'CINTURON: sin usuario ajeno para el par'; END IF;

  BEGIN   -- ← subtransacción: se deshace sola
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);

    -- ══ R1 · ROJO: llegada sobre una estadía REAL en `reservada` ═════════
    v_rojo := false;
    BEGIN
      PERFORM public.marcar_llegada_guarderia(ARRAY[v_est]);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo THEN
      RAISE EXCEPTION 'CINTURON R1: una estadia `reservada` acepto `llegada` — el guard NO frena';
    END IF;
    IF v_msg NOT LIKE 'ninguna_transicion_posible%' THEN
      RAISE EXCEPTION 'CINTURON R1: rebote por el motivo equivocado: %', v_msg;
    END IF;

    -- ══ R2 · ROJO: a bordo sin tramo, sobre la misma estadía real ════════
    /* Las 95 vivas tienen `tramo_recogida_id` NULL (medido). *Este rojo lo
       produce el estado del mundo, no un fixture.* */
    v_rojo := false;
    BEGIN
      PERFORM public.marcar_a_bordo_guarderia(v_est, true, NULL, NULL, NULL, now());
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'sin_tramo_abierto%' THEN
      RAISE EXCEPTION 'CINTURON R2: se subio un animal sin tramo abierto (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ══ R3 · ROJO: el AJENO no pasa ══════════════════════════════════════
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_ajeno, 'role','authenticated')::text);
    v_rojo := false;
    BEGIN
      PERFORM public.marcar_no_recogida_guarderia(v_est, 'nadie_en_domicilio', NULL);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'no_gestionas_este_prestador%' THEN
      RAISE EXCEPTION 'CINTURON R3: un ajeno movio una estadia (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);

    -- ══ R4 · ROJO: `cancelada` NO RESUCITA, y lo dice hablando ═══════════
    /* Fixture DECLARADO: hoy no hay ninguna `cancelada` viva, así que la
       produzco. *Lo que NO fabrico es el guard: el freno es el predicado
       positivo `estado = desde`, que ya estaba.* */
    UPDATE guarderia_estadias SET estado = 'cancelada' WHERE id = v_est;
    v_rojo := false;
    BEGIN
      PERFORM public.marcar_a_bordo_guarderia(v_est, true, NULL, NULL, NULL, now());
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'estadia_cancelada%' THEN
      RAISE EXCEPTION 'CINTURON R4: una estadia CANCELADA volvio al durante (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    UPDATE guarderia_estadias SET estado = 'reservada' WHERE id = v_est;

    -- ══ R5 · ROJO DEL INSTRUMENTO: el verificador de coherencia miente? ══
    /* *Un instrumento que no puede producir su rojo no está midiendo.* */
    INSERT INTO cat_guarderia_estados (estado, es_terminal, orden, escritor)
         VALUES ('estado_que_no_existe', true, 99, 'arnes');
    IF (public.verificar_coherencia_estados_guarderia()->>'ok')::boolean THEN
      RAISE EXCEPTION 'CINTURON R5: el verificador dio VERDE con un estado que el CHECK no tiene';
    END IF;
    DELETE FROM cat_guarderia_estados WHERE estado = 'estado_que_no_existe';
    IF NOT (public.verificar_coherencia_estados_guarderia()->>'ok')::boolean THEN
      RAISE EXCEPTION 'CINTURON R5b: el verificador da ROJO sobre el catalogo correcto: %',
        public.verificar_coherencia_estados_guarderia();
    END IF;

    -- ══ V1 · EL RECORRIDO ENTERO, los cinco actos ════════════════════════
    v_r := public.abrir_tramo_guarderia(v_prest, v_fecha, 'recogida', ARRAY[v_est]);
    IF (v_r->>'estadias_atadas')::int <> 1 THEN
      RAISE EXCEPTION 'CINTURON V1: el tramo no ato la estadia (%)', v_r;
    END IF;

    v_r := public.marcar_a_bordo_guarderia(v_est, true, 'correa y manta', 'sin novedad', 'k1', v_puerta);
    IF v_r->>'estado' <> 'recogida_en_curso' OR v_r->>'acta_id' IS NULL THEN
      RAISE EXCEPTION 'CINTURON V1: el acto unico no dejo estado+acta (%)', v_r;
    END IF;
    v_h1 := (v_r->>'a_bordo_en')::timestamptz;

    -- ══ V2 · LAS DOS HORAS SON DISTINTAS, Y CADA UNA ES LA SUYA ══════════
    /* 🔴 El par que discrimina: `a_bordo_en` la pone el SERVIDOR (now()) y
       `cerrada_en` es la de la PUERTA (41 minutos antes). Si el server pisara
       la hora de la puerta, este brazo se pone rojo — es el defecto que la
       casa ya se cobró una vez en esta misma función. */
    IF (SELECT cerrada_en FROM guarderia_actas
         WHERE estadia_id = v_est AND direccion = 'recogida') <> v_puerta THEN
      RAISE EXCEPTION 'CINTURON V2: el server piso la hora de la PUERTA en el acta';
    END IF;
    IF v_h1 <= v_puerta THEN
      RAISE EXCEPTION 'CINTURON V2: a_bordo_en no es del servidor (h1=% puerta=%)', v_h1, v_puerta;
    END IF;

    -- ══ V3 · IDEMPOTENCIA QUE DISCRIMINA: el reintento NO pisa la hora ═══
    /* La trampa que C y otra sesión apuntaron: `levantar_acta_guarderia`
       retorna temprano con `ya_existia`. **Acá se mide, no se razona.** */
    PERFORM pg_sleep(0.05);
    v_r := public.marcar_a_bordo_guarderia(v_est, true, 'correa y manta', 'sin novedad', 'k1', now());
    IF NOT (v_r->>'ya_estaba')::boolean THEN
      RAISE EXCEPTION 'CINTURON V3: el reintento no se declaro idempotente (%)', v_r;
    END IF;
    v_h2 := (v_r->>'a_bordo_en')::timestamptz;
    IF v_h2 <> v_h1 THEN
      RAISE EXCEPTION 'CINTURON V3: el reintento PISO la hora original (% -> %)', v_h1, v_h2;
    END IF;
    IF NOT (v_r->>'acta_ya_existia')::boolean THEN
      RAISE EXCEPTION 'CINTURON V3: el acta se duplico en el reintento';
    END IF;

    -- ══ V4 · LOTE ════════════════════════════════════════════════════════
    v_r := public.marcar_llegada_guarderia(ARRAY[v_est]);
    IF (v_r->>'movidas')::int <> 1 THEN
      RAISE EXCEPTION 'CINTURON V4: la llegada no movio (%)', v_r;
    END IF;
    -- el lote reporta POR ÍTEM: un id ajeno al lote se rechaza y los demás pasan
    /* Del MISMO prestador: si tomara una de otro negocio, el rechazo vendría
       del gate y no de la transición, y el brazo mediría otra cosa. */
    SELECT g.id INTO v_est2 FROM guarderia_estadias g
      JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE g.estado = 'reservada' AND g.id <> v_est AND c.prestador_id = v_prest LIMIT 1;
    IF v_est2 IS NOT NULL THEN
      v_r := public.marcar_llegada_guarderia(ARRAY[v_est, v_est2]);
      IF (v_r->>'ya_estaban')::int <> 1 OR jsonb_array_length(v_r->'rechazadas') <> 1 THEN
        RAISE EXCEPTION 'CINTURON V4b: el lote no reporto por item (%)', v_r;
      END IF;
    END IF;

    v_r := public.abrir_tramo_guarderia(v_prest, v_fecha, 'devolucion', ARRAY[v_est]);
    v_r := public.marcar_retorno_guarderia(ARRAY[v_est]);
    IF (v_r->>'movidas')::int <> 1 THEN
      RAISE EXCEPTION 'CINTURON V5: el retorno no movio (%)', v_r;
    END IF;
    IF (SELECT retorno_en FROM guarderia_estadias WHERE id = v_est) IS NULL THEN
      RAISE EXCEPTION 'CINTURON V5: retorno_en quedo NULL — la hora se perdio otra vez';
    END IF;

    v_r := public.marcar_entregada_guarderia(v_est, true, 'correa y manta', NULL, 'k2', now());
    IF v_r->>'estado' <> 'entregada' OR v_r->>'acta_id' IS NULL THEN
      RAISE EXCEPTION 'CINTURON V6: la entrega no cerro con acta (%)', v_r;
    END IF;
    IF (SELECT count(*) FROM guarderia_actas WHERE estadia_id = v_est) <> 2 THEN
      RAISE EXCEPTION 'CINTURON V6: no quedaron las DOS actas';
    END IF;

    -- ══ V7 · `no_recogida` con su motivo, y `otro` inexpresable sin detalle
    IF v_est2 IS NOT NULL THEN
      v_r := public.marcar_no_recogida_guarderia(v_est2, 'nadie_en_domicilio', NULL);
      IF v_r->>'estado' <> 'no_recogida' OR v_r->>'motivo' <> 'nadie_en_domicilio' THEN
        RAISE EXCEPTION 'CINTURON V7: no_recogida no dejo su motivo (%)', v_r;
      END IF;
    END IF;
    v_rojo := false;
    BEGIN
      UPDATE guarderia_estadias
         SET no_recogida_en = now(), no_recogida_motivo = 'otro', no_recogida_detalle = NULL
       WHERE id = v_est;
    EXCEPTION WHEN OTHERS THEN v_rojo := true; END;
    IF NOT v_rojo THEN
      RAISE EXCEPTION 'CINTURON V7b: `otro` sin detalle entro — el CHECK no lo hace inexpresable';
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  -- ══ ⑫ L-140 · anon fuera, authenticated adentro (L-436) ════════════════
  FOR v_acl IN
    SELECT COALESCE(array_to_string(p.proacl,' '), '(null=PUBLIC)')
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname IN
       ('marcar_a_bordo_guarderia','marcar_llegada_guarderia','marcar_retorno_guarderia',
        'marcar_entregada_guarderia','marcar_no_recogida_guarderia',
        'obtener_maquina_estadia_guarderia','verificar_coherencia_estados_guarderia')
  LOOP
    IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON L-140: anon con EXECUTE (%)', v_acl; END IF;
    IF v_acl NOT ILIKE '%authenticated=%' THEN
      RAISE EXCEPTION 'CINTURON L-140: authenticated NO puede ejecutar una RPC de app (%)', v_acl;
    END IF;
  END LOOP;

  -- los privados NO son alcanzables desde la app
  FOR v_acl IN
    SELECT COALESCE(array_to_string(p.proacl,' '), '(null=PUBLIC)')
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname IN ('_guarderia_aplicar_acto','_guarderia_estadia_gestionable')
  LOOP
    IF v_acl ILIKE '%authenticated=%' OR v_acl ILIKE '%anon=%' OR v_acl = '(null=PUBLIC)' THEN
      RAISE EXCEPTION 'CINTURON L-140: un helper privado quedo alcanzable (%)', v_acl;
    END IF;
  END LOOP;

  RAISE NOTICE 'CINTURON VERDE · 5 rojos producidos (R1 llegada ilegal · R2 sin tramo · R3 ajeno · R4 cancelada no resucita · R5 el verificador da su rojo) · recorrido entero de los 5 actos · las DOS horas distintas y cada una la suya · el reintento NO piso la hora · anon fuera y helpers privados cerrados';
END
$cint$;

COMMIT;

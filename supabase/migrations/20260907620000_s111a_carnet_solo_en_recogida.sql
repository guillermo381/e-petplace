/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · EL CARNET SE PREGUNTA AL RECIBIR, NO AL DEVOLVER — freno ⑤ de C.
   ═══════════════════════════════════════════════════════════════════════════

   ── EL HECHO ─────────────────────────────────────────────────────────────
   `guarderia_actas.carnet_verificado` nació `NOT NULL` (S107,
   `20260829120000`) y `levantar_acta_guarderia` lo exigía en **las dos**
   direcciones. El gate del founder (hallazgo ⑤) dijo que **la devolución no
   debe pedir el carnet**, y el criterio legal §4 lo confirma: el acta espejo
   lleva *estado con fotos · incidentes · objetos devueltos · conformidad*.

   > ### Sacada la pregunta, no queda valor honesto que mandar: `false` afirma que se miró y no estaba en orden; `true` miente. **Las dos escriben un hecho que nadie verificó, en el instrumento que existe para un litigio.**

   ── LO QUE C **NO** HIZO, y es la mitad que salva el registro ────────────
   **No mandó `false` para desbloquear la pantalla.** Bloqueó el acta espejo y
   pidió la decisión. *Escribir `false` habría dejado, en cada acta de
   devolución, la afirmación de que el carnet se revisó y no estaba bien — y eso
   no se arregla después: queda escrito con su sello de tiempo.*

   ── LA FORMA: INEXPRESABLE EN LAS DOS CAPAS ─────────────────────────────
   No alcanza con permitir `NULL`: eso deja que cada pantalla mande lo que
   quiera. **El CHECK exige el valor en `recogida` y lo PROHÍBE en
   `devolucion`** ⇒ el estado malo **no se puede escribir** (`L-222`: la cura no
   es leer mejor, es volver el estado malo inexpresable), y de paso **el esquema
   queda diciendo qué acta pregunta qué**.

   Y la segunda capa: **`marcar_entregada_guarderia` DEJA DE PEDIR el
   booleano.** *Una prop que se acepta y se ignora se lee como cableado*
   (`L-460`): si la entrega siguiera recibiéndolo y lo tirara, la pantalla
   seguiría mandándolo convencida de que viaja.

   ── SIN BACKFILL, y medido ──────────────────────────────────────────────
   Las **2 actas vivas son de `recogida`** y tienen `carnet_verificado = true`
   ⇒ **las dos cumplen el CHECK nuevo sin tocarlas.** *No hay una sola fila que
   corregir, y por eso esta migración no escribe ningún dato.*

   **76(g): NO RIGE.** Un CHECK, un `DROP NOT NULL` y dos funciones.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-carnet-devolucion.sql`,
   escrita ANTES; declara que **volver atrás exige escribir el `false` que esto
   vino a impedir**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

ALTER TABLE public.guarderia_actas ALTER COLUMN carnet_verificado DROP NOT NULL;

ALTER TABLE public.guarderia_actas
  ADD CONSTRAINT chk_carnet_solo_en_recogida CHECK (
    (direccion = 'recogida'   AND carnet_verificado IS NOT NULL)
 OR (direccion = 'devolucion' AND carnet_verificado IS NULL));

COMMENT ON COLUMN public.guarderia_actas.carnet_verificado IS
  'S111-A · SÓLO en el acta de recogida. En devolución es NULL por CHECK: el carnet se verifica al recibir, y un booleano ahí sería un hecho que nadie verificó.';

-- ══ ① EL ACTA: el parámetro pasa a opcional, y su ausencia es la verdad ══
CREATE OR REPLACE FUNCTION public.levantar_acta_guarderia(
  p_estadia_id uuid, p_direccion text,
  p_carnet_verificado boolean DEFAULT NULL,
  p_objetos text DEFAULT NULL, p_observaciones text DEFAULT NULL,
  p_cerrada_en timestamptz DEFAULT now(), p_clave_idempotencia text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
DECLARE v_user uuid := auth.uid(); v_prest uuid; v_acta uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT c.prestador_id INTO v_prest
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.id = p_estadia_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;

  /* 🔴 LOS DOS REBOTES HABLAN, en vez de dejar salir el CHECK crudo. *Un
     `23514` pelado le dice a la cola «algo del acta está mal» y a la persona
     nada.* */
  IF p_direccion = 'recogida' AND p_carnet_verificado IS NULL THEN
    RAISE EXCEPTION 'carnet_requerido_en_recogida' USING ERRCODE = '22023';
  END IF;
  IF p_direccion = 'devolucion' AND p_carnet_verificado IS NOT NULL THEN
    RAISE EXCEPTION 'carnet_no_se_pregunta_en_devolucion' USING ERRCODE = '22023';
  END IF;

  /* El segundo intento es un ÉXITO, no un 23505 pelado (S107). */
  SELECT id INTO v_acta FROM guarderia_actas
   WHERE estadia_id = p_estadia_id AND direccion = p_direccion;
  IF v_acta IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'acta_id', v_acta, 'ya_existia', true);
  END IF;

  INSERT INTO guarderia_actas (estadia_id, direccion, levantada_por, carnet_verificado,
                               objetos, observaciones, cerrada_en, clave_idempotencia)
       VALUES (p_estadia_id, p_direccion, v_user, p_carnet_verificado,
               p_objetos, p_observaciones, p_cerrada_en, p_clave_idempotencia)
    RETURNING id INTO v_acta;

  RETURN jsonb_build_object('ok', true, 'acta_id', v_acta, 'ya_existia', false);
END $function$;

-- ══ ② LA ENTREGA DEJA DE PEDIR LO QUE NO PUEDE USAR ═════════════════════
/* L-119: la firma cambia ⇒ DROP explícito. Un `CREATE OR REPLACE` con otra
   lista de parámetros crea una SOBRECARGA, y la app resuelve la que quiera. */
DROP FUNCTION IF EXISTS public.marcar_entregada_guarderia(uuid, boolean, timestamptz, text, text, text);
CREATE FUNCTION public.marcar_entregada_guarderia(
  p_estadia_id uuid, p_ocurrido_en timestamptz,
  p_objetos text DEFAULT NULL, p_observaciones text DEFAULT NULL,
  p_clave_idempotencia text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
DECLARE v_mov jsonb; v_acta jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  v_mov  := public._guarderia_aplicar_acto(p_estadia_id, 'entregada', p_ocurrido_en);
  /* 🔴 Sin carnet, y a propósito: en la devolución no se pregunta. El
     parámetro no está para que nadie lo mande creyendo que viaja (`L-460`). */
  v_acta := public.levantar_acta_guarderia(p_estadia_id, 'devolucion', NULL,
                                           p_objetos, p_observaciones, p_ocurrido_en,
                                           p_clave_idempotencia);
  RETURN jsonb_build_object('ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'ocurrido_en', v_mov->>'ocurrido_en', 'registrado_en', v_mov->>'registrado_en',
    'acta_id', v_acta->>'acta_id', 'acta_ya_existia', (v_acta->>'ya_existia')::boolean);
END $function$;

REVOKE EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,timestamptz,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,timestamptz,text,text,text) TO authenticated;

-- ══ ③ CINTURÓN — EL ROJO PRIMERO ═════════════════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_est uuid; v_prest uuid; v_fecha date; v_titular uuid;
  v_rojo boolean; v_msg text; v_n int; v_ahora timestamptz := now();
BEGIN
  -- L-119: una sola firma de la entrega
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='marcar_entregada_guarderia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: quedaron % firmas de la entrega', v_n; END IF;

  -- Las 2 actas VIVAS cumplen el CHECK nuevo sin tocarlas (sin backfill)
  SELECT count(*) INTO v_n FROM guarderia_actas
   WHERE NOT ((direccion='recogida' AND carnet_verificado IS NOT NULL)
           OR (direccion='devolucion' AND carnet_verificado IS NULL));
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: % actas vivas violan el CHECK nuevo', v_n; END IF;

  SELECT g.id, c.prestador_id, c.fecha INTO v_est, v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado='reservada' ORDER BY c.fecha LIMIT 1;
  SELECT user_id INTO v_titular FROM prestadores WHERE id = v_prest;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    -- ══ ROJO ① · una DEVOLUCIÓN con carnet no entra, y lo dice HABLANDO ══
    v_rojo := false;
    BEGIN PERFORM public.levantar_acta_guarderia(v_est, 'devolucion', false, NULL, NULL, v_ahora, 'r1');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'carnet_no_se_pregunta_en_devolucion%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: la devolucion acepto un carnet (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    /* Y con `true` tampoco: el brazo de arriba con `false` solo no distingue
       «no acepta un valor» de «no acepta un valor FALSO». */
    v_rojo := false;
    BEGIN PERFORM public.levantar_acta_guarderia(v_est, 'devolucion', true, NULL, NULL, v_ahora, 'r1b');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'carnet_no_se_pregunta_en_devolucion%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1b: la devolucion acepto carnet=true (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ══ ROJO ② · una RECOGIDA sin carnet tampoco ════════════════════════
    v_rojo := false;
    BEGIN PERFORM public.levantar_acta_guarderia(v_est, 'recogida', NULL, NULL, NULL, v_ahora, 'r2');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'carnet_requerido_en_recogida%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: la recogida paso sin carnet (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ══ VERDE · el recorrido entero, con la entrega SIN carnet ══════════
    PERFORM public.abrir_tramo_guarderia(v_prest, v_fecha, 'recogida', ARRAY[v_est]);
    PERFORM public.marcar_a_bordo_guarderia(v_est, true, v_ahora, NULL, NULL, 'k1');
    PERFORM public.marcar_llegada_guarderia(ARRAY[v_est], v_ahora);
    PERFORM public.abrir_tramo_guarderia(v_prest, v_fecha, 'devolucion', ARRAY[v_est]);
    PERFORM public.marcar_retorno_guarderia(ARRAY[v_est], v_ahora);
    PERFORM public.marcar_entregada_guarderia(v_est, v_ahora, 'correa', NULL, 'k2');

    IF (SELECT estado FROM guarderia_estadias WHERE id = v_est) <> 'entregada' THEN
      RAISE EXCEPTION 'CINTURON VERDE: no llego a entregada';
    END IF;
    SELECT count(*) INTO v_n FROM guarderia_actas
     WHERE estadia_id = v_est AND direccion = 'devolucion' AND carnet_verificado IS NULL;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON VERDE: el acta espejo no quedo con carnet NULL (n=%)', v_n;
    END IF;
    -- y la de recogida SÍ lo tiene: el par que discrimina
    SELECT count(*) INTO v_n FROM guarderia_actas
     WHERE estadia_id = v_est AND direccion = 'recogida' AND carnet_verificado IS NOT NULL;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON VERDE: la de recogida perdio su carnet — el brazo anterior no discrimina';
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · ROJO-1 la devolucion no acepta carnet, ni false ni true, y lo dice HABLANDO · ROJO-2 la recogida sin carnet tampoco · VERDE el recorrido entero termina en entregada, con el acta espejo en NULL y la de recogida CON su carnet · una sola firma de la entrega · cero actas vivas violan el CHECK (sin backfill)';
END
$cint$;

COMMIT;

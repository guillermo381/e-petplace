/* ═══════════════════════════════════════════════════════════════════════════
   S110-A · LAS DOS HORAS, Y LA IDEMPOTENCIA DEL ACTO
   Enmienda de mesa sobre `20260907420000`, del mismo día.
   ═══════════════════════════════════════════════════════════════════════════

   ── ① LA MESA DEROGA «LA HORA LA PONE EL SERVIDOR, SIEMPRE» ──────────────
   Lo hace **sobre este dato y sólo sobre éste**, y la razón es medible:
   > ### Con cola offline, el `now()` del servidor es la hora de la SEÑAL, no la del ACTO.

   ⇒ **`ocurrido_en` la declara el aparato EN LA PUERTA** y viaja dentro del
   payload encolado. **`registrado_en` la pone el servidor y no se edita jamás.**
   El acta y la familia muestran `ocurrido_en`; la auditoría conserva las dos y
   **su divergencia queda visible**. Ninguna se edita después: corregir sigue
   siendo soporte.
   *La trampa ya la había pagado `levantar_acta_guarderia`: su cinturón tiene el
   brazo que dice «el server pisó la hora de la puerta con la de la subida».
   La migración anterior la respetaba en el ACTA y la volvía a cometer en el
   ESTADO.*

   ── ② LA IDEMPOTENCIA ES DEL ACTO, NO DEL ACTA ───────────────────────────
   La clave es **(estadía, acto)**, y su piso es un **índice único**, no una
   rama del código. Consecuencia que la versión anterior no tenía: repetir
   `a_bordo` cuando la estadía ya avanzó a `en_guarderia` **devuelve el
   resultado original**, en vez de rebotar `transicion_ilegal` sobre un acto
   que sí ocurrió. *Con idempotencia por ESTADO, la cola que reintenta tarde
   recibía un error sobre algo que ya había hecho bien.*
   Y el escritor de transición es el **LLAMADOR** de `levantar_acta_guarderia`,
   jamás un cuelgue de su retorno: **su `ya_existia:true` no puede saltear la
   transición ni pisar `ocurrido_en`.**

   ── ⑥ LA VENTANA «VOY EN CAMINO A BUSCARLO» NO SE DESCARTA ───────────────
   Adjudicación de mesa: *«7:40, en camino a buscar a Thor»* está en el
   recorrido firmado. El punto vivo se enciende **cuando el tramo abre**, no
   cuando el animal sube, y se apaga después de `entregada` o `no_recogida`.
   La versión de S107 exigía `estado IN ('recogida_en_curso','retorno_en_curso')`
   ⇒ **apagaba justo el tramo del viaje que la familia más mira.**

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Tabla nueva vacía + reemplazo de funciones. **CERO BACKFILL** — y no hay
   qué backfillear: `guarderia_estadia_actos` nace vacía porque **ninguna
   estadía se movió todavía** (95, las 95 en `reservada`, medido).
   **Reversa:** `docs/relevamientos/S110-A-REVERSA-dos-horas.sql`, escrita
   ANTES; declara que **el DROP destruye la auditoría de las dos horas**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LA AUDITORÍA — las dos horas juntas, y el piso de la idempotencia ══
CREATE TABLE public.guarderia_estadia_actos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estadia_id    uuid NOT NULL REFERENCES public.guarderia_estadias(id) ON DELETE CASCADE,
  acto          text NOT NULL REFERENCES public.cat_guarderia_transiciones(acto),
  /* LA HORA DE LA PUERTA — la declara el aparato. */
  ocurrido_en   timestamptz NOT NULL,
  /* LA HORA DEL SERVIDOR — no se edita jamás. */
  registrado_en timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  /* 🔴 EL PISO. Un guard que vive sólo en el código se saltea con una llamada
     concurrente; éste no. Y arriba va el guard tipado que EXPLICA — las dos
     capas, como el índice del plan activo (`L-424`). */
  CONSTRAINT uq_acto_por_estadia UNIQUE (estadia_id, acto)
);
COMMENT ON TABLE public.guarderia_estadia_actos IS
  'S110-A · un renglón por acto del durante. `ocurrido_en` = la puerta (la declara el aparato) · `registrado_en` = el servidor. Append-only: corregir es soporte, no un UPDATE.';

ALTER TABLE public.guarderia_estadia_actos ENABLE ROW LEVEL SECURITY;
/* Misma audiencia que la estadía: el negocio que la opera y la familia del
   animal. *Un registro de auditoría que el auditado no puede leer no le sirve
   a la familia, que es de quien es el animal.* */
CREATE POLICY guarderia_estadia_actos_select ON public.guarderia_estadia_actos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.guarderia_estadias g
              JOIN public.evento_cita_servicio c ON c.id = g.cita_id
             WHERE g.id = guarderia_estadia_actos.estadia_id
               AND (public.user_gestiona_prestador(c.prestador_id)
                    OR public.user_tiene_acceso_a_mascota(c.mascota_id)))
    OR public.is_admin());
GRANT SELECT ON public.guarderia_estadia_actos TO authenticated;

-- ══ ② EL ESCRITOR, con las dos horas y la idempotencia por ACTO ══════════
DROP FUNCTION IF EXISTS public._guarderia_aplicar_acto(uuid, text, text, text);
CREATE OR REPLACE FUNCTION public._guarderia_aplicar_acto(
  p_estadia_id uuid, p_acto text, p_ocurrido_en timestamptz,
  p_motivo text DEFAULT NULL, p_detalle text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE t record; v_estado text; v_prev record;
BEGIN
  SELECT * INTO t FROM cat_guarderia_transiciones WHERE acto = p_acto;
  IF t IS NULL THEN RAISE EXCEPTION 'acto_invalido' USING ERRCODE='22023'; END IF;
  IF p_ocurrido_en IS NULL THEN
    RAISE EXCEPTION 'falta_hora_de_la_puerta' USING ERRCODE='22023';
  END IF;
  /* Una hora del futuro no es «la puerta»: es un reloj mal puesto o algo peor.
     Se deja holgura de un minuto por deriva de reloj y nada más. */
  IF p_ocurrido_en > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'hora_de_la_puerta_en_el_futuro' USING ERRCODE='22023';
  END IF;

  SELECT estado INTO v_estado FROM guarderia_estadias WHERE id = p_estadia_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;

  /* ── IDEMPOTENCIA POR (ESTADÍA, ACTO) ────────────────────────────────────
     Se pregunta por el ACTO, no por el estado. **Devuelve el resultado
     ORIGINAL con su hora original y no escribe nada.** Repetir `a_bordo`
     cuando la estadía ya llegó devuelve lo de antes, no un error. */
  SELECT * INTO v_prev FROM guarderia_estadia_actos
   WHERE estadia_id = p_estadia_id AND acto = p_acto;
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'movida', false, 'ya_estaba', true,
      'estado', v_estado, 'ocurrido_en', v_prev.ocurrido_en,
      'registrado_en', v_prev.registrado_en);
  END IF;

  -- ── ③ GUARD DE ESTADO TERMINAL, hablado y derivado del catálogo ────────
  IF v_estado <> t.desde THEN
    IF v_estado = 'cancelada' THEN
      RAISE EXCEPTION 'estadia_cancelada' USING ERRCODE='22023';
    END IF;
    IF EXISTS (SELECT 1 FROM cat_guarderia_estados WHERE estado = v_estado AND es_terminal) THEN
      RAISE EXCEPTION 'estadia_en_estado_final: %', v_estado USING ERRCODE='22023';
    END IF;
    RAISE EXCEPTION 'transicion_ilegal: % (esperaba %, acto %)', v_estado, t.desde, p_acto
      USING ERRCODE='22023';
  END IF;

  -- ── El tramo, cuando el acto lo exige ─────────────────────────────────
  IF t.exige_tramo IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM guarderia_estadias e JOIN guarderia_tramos tr
        ON tr.id = CASE t.exige_tramo WHEN 'recogida' THEN e.tramo_recogida_id
                                      ELSE e.tramo_devolucion_id END
       WHERE e.id = p_estadia_id AND tr.estado = 'abierto')
    THEN
      RAISE EXCEPTION 'sin_tramo_abierto: no hay tramo de % abierto para esta estadia', t.exige_tramo
        USING ERRCODE='22023';
    END IF;
  END IF;

  /* 🔴 La columna del estado guarda LA HORA DE LA PUERTA — es la que el acta y
     la familia muestran. La del servidor vive en el renglón de auditoría. */
  IF p_acto = 'no_recogida' THEN
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, '
                   'no_recogida_motivo = $4, no_recogida_detalle = $5, '
                   'updated_at = now() WHERE id = $3', t.columna_ts)
      USING t.hasta, p_ocurrido_en, p_estadia_id, p_motivo, p_detalle;
  ELSE
    EXECUTE format('UPDATE guarderia_estadias SET estado = $1, %I = $2, updated_at = now() WHERE id = $3',
                   t.columna_ts) USING t.hasta, p_ocurrido_en, p_estadia_id;
  END IF;

  INSERT INTO guarderia_estadia_actos (estadia_id, acto, ocurrido_en, actor_user_id)
       VALUES (p_estadia_id, p_acto, p_ocurrido_en, auth.uid())
    RETURNING * INTO v_prev;

  RETURN jsonb_build_object('ok', true, 'movida', true, 'ya_estaba', false,
    'estado', t.hasta, 'ocurrido_en', v_prev.ocurrido_en,
    'registrado_en', v_prev.registrado_en);
END $$;

-- ══ ③ LAS CINCO PUERTAS, con `p_ocurrido_en` ═════════════════════════════
DROP FUNCTION IF EXISTS public.marcar_a_bordo_guarderia(uuid, boolean, text, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.marcar_a_bordo_guarderia(
  p_estadia_id uuid, p_carnet_verificado boolean,
  p_ocurrido_en timestamptz,                       -- LA PUERTA, no la señal
  p_objetos text DEFAULT NULL, p_observaciones text DEFAULT NULL,
  p_clave_idempotencia text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_mov jsonb; v_acta jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  /* 🔴 EL ORDEN IMPORTA Y ES LA ENMIENDA ②: la transición se aplica ACÁ, como
     LLAMADOR del acta. Si colgara del retorno de `levantar_acta_guarderia`,
     su `ya_existia:true` —que retorna ANTES de todo INSERT— saltearía la
     transición, y el reintento por señal perdida no movería nada. */
  v_mov  := public._guarderia_aplicar_acto(p_estadia_id, 'a_bordo', p_ocurrido_en);
  v_acta := public.levantar_acta_guarderia(p_estadia_id, 'recogida', p_carnet_verificado,
                                           p_objetos, p_observaciones, p_ocurrido_en,
                                           p_clave_idempotencia);
  RETURN jsonb_build_object('ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'ocurrido_en', v_mov->>'ocurrido_en', 'registrado_en', v_mov->>'registrado_en',
    'acta_id', v_acta->>'acta_id', 'acta_ya_existia', (v_acta->>'ya_existia')::boolean);
END $$;

DROP FUNCTION IF EXISTS public.marcar_entregada_guarderia(uuid, boolean, text, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.marcar_entregada_guarderia(
  p_estadia_id uuid, p_carnet_verificado boolean, p_ocurrido_en timestamptz,
  p_objetos text DEFAULT NULL, p_observaciones text DEFAULT NULL,
  p_clave_idempotencia text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_mov jsonb; v_acta jsonb;
BEGIN
  PERFORM public._guarderia_estadia_gestionable(p_estadia_id);
  v_mov  := public._guarderia_aplicar_acto(p_estadia_id, 'entregada', p_ocurrido_en);
  v_acta := public.levantar_acta_guarderia(p_estadia_id, 'devolucion', p_carnet_verificado,
                                           p_objetos, p_observaciones, p_ocurrido_en,
                                           p_clave_idempotencia);
  RETURN jsonb_build_object('ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'ocurrido_en', v_mov->>'ocurrido_en', 'registrado_en', v_mov->>'registrado_en',
    'acta_id', v_acta->>'acta_id', 'acta_ya_existia', (v_acta->>'ya_existia')::boolean);
END $$;

DROP FUNCTION IF EXISTS public.marcar_llegada_guarderia(uuid[]);
CREATE OR REPLACE FUNCTION public.marcar_llegada_guarderia(
  p_estadias uuid[], p_ocurrido_en timestamptz)
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
      v_r := public._guarderia_aplicar_acto(v_id, 'llegada', p_ocurrido_en);
      IF (v_r->>'ya_estaba')::boolean THEN v_ya := v_ya + 1; ELSE v_mov := v_mov + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      v_rech := v_rech || jsonb_build_array(jsonb_build_object('estadiaId', v_id, 'motivo', SQLERRM));
    END;
  END LOOP;
  IF v_mov = 0 AND v_ya = 0 THEN
    RAISE EXCEPTION 'ninguna_transicion_posible: % rechazadas', jsonb_array_length(v_rech)
      USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'movidas', v_mov, 'ya_estaban', v_ya, 'rechazadas', v_rech);
END $$;

DROP FUNCTION IF EXISTS public.marcar_retorno_guarderia(uuid[]);
CREATE OR REPLACE FUNCTION public.marcar_retorno_guarderia(
  p_estadias uuid[], p_ocurrido_en timestamptz)
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
      v_r := public._guarderia_aplicar_acto(v_id, 'retorno', p_ocurrido_en);
      IF (v_r->>'ya_estaba')::boolean THEN v_ya := v_ya + 1; ELSE v_mov := v_mov + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      v_rech := v_rech || jsonb_build_array(jsonb_build_object('estadiaId', v_id, 'motivo', SQLERRM));
    END;
  END LOOP;
  IF v_mov = 0 AND v_ya = 0 THEN
    RAISE EXCEPTION 'ninguna_transicion_posible: % rechazadas', jsonb_array_length(v_rech)
      USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'movidas', v_mov, 'ya_estaban', v_ya, 'rechazadas', v_rech);
END $$;

DROP FUNCTION IF EXISTS public.marcar_no_recogida_guarderia(uuid, text, text);
CREATE OR REPLACE FUNCTION public.marcar_no_recogida_guarderia(
  p_estadia_id uuid, p_motivo text, p_ocurrido_en timestamptz, p_detalle text DEFAULT NULL)
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
  v_mov := public._guarderia_aplicar_acto(p_estadia_id, 'no_recogida', p_ocurrido_en, p_motivo, p_detalle);
  RETURN jsonb_build_object('ok', true, 'estadia_id', p_estadia_id,
    'estado', v_mov->>'estado', 'ya_estaba', (v_mov->>'ya_estaba')::boolean,
    'ocurrido_en', v_mov->>'ocurrido_en', 'registrado_en', v_mov->>'registrado_en',
    'motivo', (SELECT no_recogida_motivo FROM guarderia_estadias WHERE id = p_estadia_id));
END $$;

-- ══ ④ ⑥ EL PUNTO VIVO SE ENCIENDE CUANDO EL TRAMO ABRE ═══════════════════
CREATE OR REPLACE FUNCTION public.obtener_tramo_vivo_de_mi_mascota(p_mascota_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  /* 🔴 ENMIENDA DE MESA S110 (⑥). Antes exigía
     `estado IN ('recogida_en_curso','retorno_en_curso')` ⇒ **la familia no veía
     el vehículo entre que el tramo abría y su animal subía** — justo *«7:40, en
     camino a buscar a Thor»*, que está en el recorrido firmado.
     Ahora manda **el TRAMO ABIERTO**, y el estado sólo APAGA: después de
     `entregada`, `no_recogida` o `cancelada` no hay viaje que mirar. */
  SELECT jsonb_build_object('tramoId', t.id, 'direccion', t.direccion)
    INTO v
    FROM guarderia_estadias e
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN guarderia_tramos t
      ON t.id = CASE
           WHEN e.estado IN ('reservada','recogida_en_curso')   THEN e.tramo_recogida_id
           WHEN e.estado IN ('en_guarderia','retorno_en_curso') THEN e.tramo_devolucion_id END
   WHERE c.mascota_id = p_mascota_id
     AND e.estado NOT IN ('entregada','no_recogida','cancelada')
     AND t.estado = 'abierto'
   ORDER BY t.abierto_en DESC
   LIMIT 1;

  RETURN COALESCE(v, 'null'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.obtener_punto_vivo(p_tramo_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v jsonb; v_prest uuid; v_puede boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT prestador_id INTO v_prest FROM guarderia_tramos WHERE id = p_tramo_id;
  /* Tramo inexistente: `null`, jamás un error que confirme qué ids existen. */
  IF v_prest IS NULL THEN RETURN 'null'::jsonb; END IF;

  v_puede := user_gestiona_prestador(v_prest) OR is_admin();

  /* La familia, mientras su animal esté EN ESE VIAJE — con la ventana de ⑥
     abierta desde que el tramo abre. Se apaga con los terminales. */
  IF NOT v_puede THEN
    SELECT EXISTS (
      SELECT 1 FROM guarderia_estadias e
        JOIN evento_cita_servicio c ON c.id = e.cita_id
       WHERE (e.tramo_recogida_id = p_tramo_id OR e.tramo_devolucion_id = p_tramo_id)
         AND e.estado NOT IN ('entregada','no_recogida','cancelada')
         AND user_tiene_acceso_a_mascota(c.mascota_id)
    ) INTO v_puede;
  END IF;

  IF NOT v_puede THEN RETURN 'null'::jsonb; END IF;

  SELECT jsonb_build_object('lat', p.lat, 'lon', p.lon, 'vistoEn', p.visto_en)
    INTO v FROM guarderia_tramo_punto p WHERE p.tramo_id = p_tramo_id;
  RETURN COALESCE(v, 'null'::jsonb);
END $$;

-- ══ ⑤ L-140 ══════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.marcar_a_bordo_guarderia(uuid,boolean,timestamptz,text,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,boolean,timestamptz,text,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_llegada_guarderia(uuid[],timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_retorno_guarderia(uuid[],timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_no_recogida_guarderia(uuid,text,timestamptz,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._guarderia_aplicar_acto(uuid,text,timestamptz,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_a_bordo_guarderia(uuid,boolean,timestamptz,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_entregada_guarderia(uuid,boolean,timestamptz,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_llegada_guarderia(uuid[],timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_retorno_guarderia(uuid[],timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_no_recogida_guarderia(uuid,text,timestamptz,text) TO authenticated;

-- ══ ⑥ CINTURÓN — LOS DOS ROJOS QUE LA MESA PIDIÓ, PRIMERO ════════════════
/* 🔴 `L-459`: el primer test de un guard nuevo no es que dé verde — es que dé
   ROJO sobre el caso real. Los dos rojos los dictó la mesa, no los elegí yo:
   **no son el fixture del mismo que escribió el guard.** */
DO $cint$
DECLARE
  v_rol text := current_user;
  v_est uuid; v_prest uuid; v_fecha date; v_titular uuid;
  v_r jsonb; v_acta uuid; v_puerta timestamptz := now() - interval '47 minutes';
  v_ocu timestamptz; v_reg timestamptz; v_rojo boolean; v_msg text;
BEGIN
  SELECT g.id, c.prestador_id, c.fecha INTO v_est, v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado = 'reservada' ORDER BY c.fecha LIMIT 1;
  IF v_est IS NULL THEN RAISE EXCEPTION 'CINTURON: sin estadia real en reservada'; END IF;
  SELECT user_id INTO v_titular FROM prestadores WHERE id = v_prest;

  BEGIN   -- subtransacción que se deshace sola (L-406)
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);

    -- ══ ROJO 1 (mesa ⑤) · acto sobre una estadía CANCELADA POR REVERSO ═══
    UPDATE guarderia_estadias SET estado = 'cancelada' WHERE id = v_est;
    v_rojo := false;
    BEGIN
      PERFORM public.marcar_a_bordo_guarderia(v_est, true, v_puerta, NULL, NULL, 'r1');
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'estadia_cancelada%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: se levanto acta sobre una estadia CANCELADA (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    IF EXISTS (SELECT 1 FROM guarderia_actas WHERE estadia_id = v_est) THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: el acta se escribio igual — la transaccion no las ata';
    END IF;
    UPDATE guarderia_estadias SET estado = 'reservada' WHERE id = v_est;

    -- ══ ROJO 2 (mesa ⑤) · ACTA YA EXISTENTE, estadía todavía en `reservada`
    /* El caso que la enmienda ② existe para cubrir: alguien levantó el acta por
       la puerta vieja (o la cola la subió y se cortó antes de mover el estado).
       **La transición TIENE que ocurrir igual, y `ocurrido_en` TIENE que ser la
       hora de la puerta, no la del reintento.** */
    v_r := public.levantar_acta_guarderia(v_est, 'recogida', true, NULL, NULL, v_puerta, 'r2-previa');
    v_acta := (v_r->>'acta_id')::uuid;
    IF v_acta IS NULL THEN RAISE EXCEPTION 'CINTURON ROJO-2: no se pudo sembrar el acta previa'; END IF;
    IF (SELECT estado FROM guarderia_estadias WHERE id = v_est) <> 'reservada' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: el acta sola movio el estado — el arnes no discrimina nada';
    END IF;

    PERFORM public.abrir_tramo_guarderia(v_prest, v_fecha, 'recogida', ARRAY[v_est]);
    v_r := public.marcar_a_bordo_guarderia(v_est, true, v_puerta, NULL, NULL, 'r2');

    IF v_r->>'estado' <> 'recogida_en_curso' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: LA TRANSICION NO OCURRIO con acta previa (%) — el ya_existia del acta la salteo', v_r;
    END IF;
    IF NOT (v_r->>'acta_ya_existia')::boolean THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: el acta se duplico en vez de reconocerse';
    END IF;
    v_ocu := (v_r->>'ocurrido_en')::timestamptz;
    IF v_ocu <> v_puerta THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: ocurrido_en NO es la hora de la puerta (% vs %)', v_ocu, v_puerta;
    END IF;
    IF (SELECT a_bordo_en FROM guarderia_estadias WHERE id = v_est) <> v_puerta THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: la estadia guardo otra hora que la de la puerta';
    END IF;

    -- ══ LAS DOS HORAS, Y SU DIVERGENCIA VISIBLE ══════════════════════════
    SELECT ocurrido_en, registrado_en INTO v_ocu, v_reg
      FROM guarderia_estadia_actos WHERE estadia_id = v_est AND acto = 'a_bordo';
    IF v_ocu IS NULL THEN RAISE EXCEPTION 'CINTURON: no quedo renglon de auditoria'; END IF;
    IF v_ocu <> v_puerta THEN RAISE EXCEPTION 'CINTURON: la auditoria no guardo la hora de la PUERTA'; END IF;
    IF v_reg <= v_ocu THEN
      RAISE EXCEPTION 'CINTURON: registrado_en no es del servidor — la divergencia no se ve (ocu=% reg=%)', v_ocu, v_reg;
    END IF;

    -- ══ IDEMPOTENCIA POR ACTO, incluso DESPUÉS de avanzar ════════════════
    /* Lo que la versión por ESTADO no podía: reintentar `a_bordo` cuando la
       estadía ya llegó devuelve **el original**, no `transicion_ilegal`. */
    PERFORM public.marcar_llegada_guarderia(ARRAY[v_est], now());
    v_r := public.marcar_a_bordo_guarderia(v_est, true, now(), NULL, NULL, 'r2');
    IF NOT (v_r->>'ya_estaba')::boolean THEN
      RAISE EXCEPTION 'CINTURON: el reintento tardio no se declaro idempotente (%)', v_r;
    END IF;
    IF (v_r->>'ocurrido_en')::timestamptz <> v_puerta THEN
      RAISE EXCEPTION 'CINTURON: el reintento tardio PISO la hora original (%)', v_r;
    END IF;

    -- ══ ⑥ LA VENTANA «VOY EN CAMINO A BUSCARLO» ══════════════════════════
    /* Discriminador: con la estadía en `reservada` y el tramo ABIERTO, la
       familia TIENE que ver el viaje. Antes de esta migración devolvía null. */
    UPDATE guarderia_estadias SET estado = 'reservada', a_bordo_en = NULL WHERE id = v_est;
    DELETE FROM guarderia_estadia_actos WHERE estadia_id = v_est;
    DECLARE v_duenio uuid; v_masc uuid;
    BEGIN
      SELECT c.user_id, c.mascota_id INTO v_duenio, v_masc
        FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
       WHERE g.id = v_est;
      IF v_duenio IS NOT NULL THEN
        EXECUTE format('SET LOCAL request.jwt.claims = %L',
                       json_build_object('sub', v_duenio, 'role','authenticated')::text);
        IF public.obtener_tramo_vivo_de_mi_mascota(v_masc) = 'null'::jsonb THEN
          RAISE EXCEPTION 'CINTURON ⑥: con el tramo ABIERTO y la estadia en `reservada`, la familia NO ve el viaje — la ventana «voy en camino a buscarlo» sigue apagada';
        END IF;
        EXECUTE format('SET LOCAL request.jwt.claims = %L',
                       json_build_object('sub', v_titular, 'role','authenticated')::text);
      END IF;
    END;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · ROJO-1 acta sobre cancelada RECHAZADA y sin residuo · ROJO-2 la transicion OCURRE con acta previa y ocurrido_en es la hora de la PUERTA · las dos horas divergen y se ven · idempotencia por ACTO incluso despues de avanzar · la ventana «voy en camino a buscarlo» ENCENDIDA';
END
$cint$;

COMMIT;

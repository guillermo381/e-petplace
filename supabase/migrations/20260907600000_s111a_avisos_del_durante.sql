/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · EL DURANTE DE GUARDERÍA AVISA — el décimo hallazgo del gate.
   ═══════════════════════════════════════════════════════════════════════════

   ── EL HECHO, MEDIDO CON CONTROL POSITIVO ────────────────────────────────
   El founder reportó que **la familia no recibe nada en recogida ni en
   llegada**. Medido antes de decidir de quién era:

   | pregunta | respuesta |
   |---|---|
   | ¿`_guarderia_aplicar_acto` registra intención? | **NO** |
   | ¿alguna de las cinco RPC lo hace? | **NINGUNA** |
   | ¿escriben `eventos_mascota`? | **NINGUNA** |
   | notificaciones de guardería emitidas | **0** |
   | **CONTROL+** ¿el instrumento encuentra quién SÍ registra? | **sí** — `crear_solicitud_autorizacion`, `revisar_documento_prestador`, `barrer_solicitudes_expiradas`, `fijar_fecha_procedimiento` |

   ⇒ **No falta el enchufe: falta el emisor.** Es de A.

   > ### Y es la MISMA CLASE que ya pagué dos veces en esta sesión: motor completo, probado, con su cinturón verde — y sin la pieza que lo hace visible.
   *Primero fueron los wrappers de la mensajería; después el lector del hilo;
   ahora el aviso del durante. Tres veces el mismo hueco, y las tres el motor
   pasaba todas sus pruebas.*

   ── QUIÉN AVISA VA COMO DATO, NO COMO `IF` ──────────────────────────────
   `cat_guarderia_transiciones` gana **`tipo_notificacion`**. El escritor de
   transición —que ya es UNO solo— lo lee y emite. *Agregar un acto que avisa
   es una fila, no una rama.*

   ── 🔴 CUÁLES AVISAN, Y CUÁL NO — porque avisar todo es no avisar ───────
   `MODELO_DESPENSA` ya firmó la ley: *«preparado y empacado NO se notifican —
   avisar todo enseña a ignorar los avisos»*.

   | acto | avisa | por qué |
   |---|---|---|
   | `a_bordo` | ✅ | **lo nombró el founder.** Su animal se subió a un vehículo |
   | `llegada` | ✅ | **lo nombró el founder.** Llegó y está a salvo |
   | `entregada` | ✅ | cierra el día: *está en casa* |
   | `no_recogida` | ✅ | el día se cobró y el animal no salió — **la familia no puede enterarse por casualidad** |
   | `retorno` | ❌ | **default del arquitecto, reversible con una palabra** |

   **El porqué del único que NO avisa:** *«salimos a devolverlo» y «está en
   casa» pasan con veinte minutos de diferencia — dos avisos casi pegados son
   exactamente el ruido que la ley de la despensa nombra.* Y no deja a la
   familia a ciegas: **el punto vivo se enciende con el TRAMO**, no con el acto,
   así que el mapa ya está prendido cuando el vehículo sale.

   ── LA VOZ NO VIVE ACÁ ──────────────────────────────────────────────────
   Se compone con `_voz_notificacion`, como todos los demás. *El vocabulario del
   motor no sale a la pantalla.*

   ── LA IDEMPOTENCIA SALE DE LA CLAVE, NO DE UNA COLUMNA ─────────────────
   `p_clave_dedup = 'guarderia-acto:<estadia>:<acto>'`. El acto ya es idempotente
   por `(estadía, acto)`, así que **el reintento de la cola no puede duplicar el
   aviso** aunque llegue tarde. *Molde del resumen de media: la idempotencia sale
   de la clave, no de una columna que alguien tenga que acordarse de escribir.*

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Una columna nueva, cuatro filas de catálogo y el reemplazo del escritor.
   **CERO BACKFILL** — y no hay qué backfillear: **0 notificaciones de guardería
   emitidas**, y las 95 estadías siguen en `reservada`.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-avisos-durante.sql`, escrita
   ANTES; declara que **correrla vuelve invisible el durante**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① QUIÉN AVISA, COMO DATO ═════════════════════════════════════════════
ALTER TABLE public.cat_guarderia_transiciones
  ADD COLUMN IF NOT EXISTS tipo_notificacion text;

COMMENT ON COLUMN public.cat_guarderia_transiciones.tipo_notificacion IS
  'S111-A · NULL = ese acto no avisa. El escritor de transición lo lee: agregar un acto que avisa es una fila, no una rama.';

-- ══ ② LOS CUATRO TIPOS ═══════════════════════════════════════════════════
ALTER TABLE public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE public.notificaciones ADD CONSTRAINT notificaciones_tipo_check CHECK (tipo = ANY (ARRAY[
  'pedido_estado','cita_recordatorio','cita_confirmada','vacuna_vencida','wearable_alerta',
  'mensaje_nuevo','promocion','sistema','pago_confirmado','devolucion_estado','pedido_recurrente',
  'cita_rechazada','cita_completada','cita_no_show','cita_solicitada','cita_cancelada_cliente',
  'cita_calificada','prestador_aprobado','prestador_rechazado','prestador_suspendido',
  'documento_aprobado','documento_rechazado','liquidacion_disponible',
  'alta_asistida_pendiente_enviar_email','alta_asistida_completada_por_cliente',
  'alta_asistida_vencida_soporte','pedido_confirmado','pedido_en_camino','pedido_hacia_destino',
  'pedido_entregado','pedido_entrega_fallida',
  'adopcion_solicitud_nueva','adopcion_mensaje_nuevo','adopcion_solicitud_respondida',
  'adopcion_sin_respuesta','padrinazgo_ahijado_adoptado','padrinazgo_refugio_inactivo',
  -- S111-A · el durante de guardería
  'guarderia_a_bordo','guarderia_llegada','guarderia_entregada','guarderia_no_recogida']));

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion, audiencia, activo, en_sombra)
VALUES
  ('guarderia_a_bordo',     'relacional', 'Recogimos a tu animal y va en camino.',        'cliente', true, false),
  ('guarderia_llegada',     'relacional', 'Tu animal llegó a la guardería.',              'cliente', true, false),
  ('guarderia_entregada',   'relacional', 'Tu animal ya está en casa.',                   'cliente', true, false),
  /* 🔴 `operacion` y no `relacional`, con el criterio firmado en S87: *la
     categoría la decide de QUIÉN es el hecho*. Acá el hecho es que **la franja
     cerró sin el animal a bordo** — es el estado de un proceso, no algo que una
     persona le dice a otra. Mismo precedente que `adopcion_sin_respuesta`. */
  ('guarderia_no_recogida', 'operacion',  'No se pudo recoger a tu animal.',              'cliente', true, false)
ON CONFLICT (codigo) DO NOTHING;

UPDATE public.cat_guarderia_transiciones SET tipo_notificacion = 'guarderia_a_bordo'     WHERE acto = 'a_bordo';
UPDATE public.cat_guarderia_transiciones SET tipo_notificacion = 'guarderia_llegada'     WHERE acto = 'llegada';
UPDATE public.cat_guarderia_transiciones SET tipo_notificacion = 'guarderia_entregada'   WHERE acto = 'entregada';
UPDATE public.cat_guarderia_transiciones SET tipo_notificacion = 'guarderia_no_recogida' WHERE acto = 'no_recogida';
/* `retorno` queda en NULL a propósito — ver la cabecera. */

-- ══ ③ EL ESCRITOR EMITE ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._guarderia_aplicar_acto(
  p_estadia_id uuid, p_acto text, p_ocurrido_en timestamptz,
  p_motivo text DEFAULT NULL, p_detalle text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
DECLARE t record; v_estado text; v_prev record; v_user uuid; v_masc uuid;
BEGIN
  SELECT * INTO t FROM cat_guarderia_transiciones WHERE acto = p_acto;
  IF t IS NULL THEN RAISE EXCEPTION 'acto_invalido' USING ERRCODE='22023'; END IF;
  IF p_ocurrido_en IS NULL THEN
    RAISE EXCEPTION 'falta_hora_de_la_puerta' USING ERRCODE='22023';
  END IF;
  IF p_ocurrido_en > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'hora_de_la_puerta_en_el_futuro' USING ERRCODE='22023';
  END IF;

  SELECT estado INTO v_estado FROM guarderia_estadias WHERE id = p_estadia_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE='22023'; END IF;

  /* IDEMPOTENCIA POR (ESTADÍA, ACTO): devuelve el original y NO escribe nada —
     tampoco un segundo aviso. */
  SELECT * INTO v_prev FROM guarderia_estadia_actos
   WHERE estadia_id = p_estadia_id AND acto = p_acto;
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'movida', false, 'ya_estaba', true,
      'estado', v_estado, 'ocurrido_en', v_prev.ocurrido_en,
      'registrado_en', v_prev.registrado_en);
  END IF;

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

  /* ══ S111-A · EL AVISO — décimo hallazgo del gate ═══════════════════════
     🔴 Va DESPUÉS de la escritura y del renglón de auditoría, a propósito: si
     algo de arriba rebota, **no sale un aviso sobre un acto que no ocurrió**.
     Y va DENTRO del brazo que movió: el reintento retorna antes y **no vuelve a
     avisar**. */
  IF t.tipo_notificacion IS NOT NULL THEN
    SELECT c.user_id, c.mascota_id INTO v_user, v_masc
      FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE g.id = p_estadia_id;
    IF v_user IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => t.tipo_notificacion,
        p_destinatario_user_id => v_user,
        p_mascota_id           => v_masc,
        p_datos                => jsonb_build_object(
                                    'estadiaId', p_estadia_id,
                                    'acto', p_acto,
                                    /* la hora de la PUERTA, que es la que se muestra */
                                    'ocurridoEn', p_ocurrido_en)
                                  || _voz_notificacion(t.tipo_notificacion, v_user, v_masc, '{}'::jsonb),
        /* La clave es (estadía, acto): el acto ya es idempotente, así que el
           aviso también. *La idempotencia sale de la clave, no de una columna.* */
        p_clave_dedup          => 'guarderia-acto:' || p_estadia_id || ':' || p_acto);
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'movida', true, 'ya_estaba', false,
    'estado', t.hasta, 'ocurrido_en', v_prev.ocurrido_en,
    'registrado_en', v_prev.registrado_en);
END $function$;

-- ══ ④ CINTURÓN — el rojo primero ═════════════════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_est uuid; v_prest uuid; v_fecha date; v_titular uuid;
  v_n int; v_puerta timestamptz := now() - interval '10 minutes'; v_tipo text;
BEGIN
  /* CONTROL DEL CATÁLOGO: cuatro avisan y `retorno` NO. Si esto cambia sin que
     nadie lo decida, el arnés lo grita. */
  SELECT count(*) INTO v_n FROM cat_guarderia_transiciones WHERE tipo_notificacion IS NOT NULL;
  IF v_n <> 4 THEN RAISE EXCEPTION 'CINTURON: avisan % actos y deberian avisar 4', v_n; END IF;
  SELECT tipo_notificacion INTO v_tipo FROM cat_guarderia_transiciones WHERE acto='retorno';
  IF v_tipo IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON: `retorno` quedo avisando — la decision fue que NO, y su porque esta en la cabecera';
  END IF;

  SELECT g.id, c.prestador_id, c.fecha INTO v_est, v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado='reservada' AND c.user_id IS NOT NULL ORDER BY c.fecha LIMIT 1;
  IF v_est IS NULL THEN RAISE EXCEPTION 'CINTURON: sin estadia real con dueno'; END IF;
  SELECT user_id INTO v_titular FROM prestadores WHERE id = v_prest;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    -- ROJO · antes del acto NO hay intención (si no, el verde no prueba nada)
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'guarderia-acto:' || v_est || ':a_bordo';
    IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: ya habia intencion antes del acto (n=%)', v_n; END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.abrir_tramo_guarderia(v_prest, v_fecha, 'recogida', ARRAY[v_est]);
    PERFORM public.marcar_a_bordo_guarderia(v_est, true, v_puerta, NULL, NULL, 'k1');

    -- VERDE · el acto dejó SU intención
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'guarderia-acto:' || v_est || ':a_bordo';
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON: el acto NO dejo intencion (n=%) — el durante sigue invisible', v_n;
    END IF;

    -- VERDE · el REINTENTO no duplica el aviso
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.marcar_a_bordo_guarderia(v_est, true, now(), NULL, NULL, 'k1');
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'guarderia-acto:' || v_est || ':a_bordo';
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el reintento DUPLICO el aviso (n=%)', v_n; END IF;

    -- VERDE · `llegada` avisa con SU tipo, y no con el del acto anterior
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.marcar_llegada_guarderia(ARRAY[v_est], now());
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_n FROM notificacion_intencion
     WHERE clave_dedup = 'guarderia-acto:' || v_est || ':llegada' AND tipo = 'guarderia_llegada';
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: `llegada` no aviso con su tipo (n=%)', v_n; END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · ROJO: antes del acto no hay intencion · VERDE: a_bordo deja la suya, el REINTENTO no la duplica, y llegada avisa con SU tipo · el catalogo dice 4 y `retorno` sigue en NULL a proposito';
END
$cint$;

COMMIT;

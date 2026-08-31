-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · M3 · LOS REVERSOS APRENDEN LOS DOS SUJETOS DE GUARDERÍA
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de una función. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-01-s108a-REVERSA-M3.sql` (cuerpo original
--   embebido: es su única fuente).
--
-- ═══ LA FORMA YA ESTABA BIEN, Y ESO ES EL HALLAZGO ═════════════════════════
-- `D-923` dejó escrito que **el sujeto se mueve por TRIGGER sobre la transición
-- del intento, jamás cableado dentro de cada registrador** — y el censo lo
-- confirmó vivo: `trg_pagos_intentos_reverso_mueve_sujeto` (AFTER UPDATE OF
-- estado) → `_trg_reverso_mueve_sujeto` → `mover_sujeto_por_reverso`.
--
-- ⇒ **Esta migración NO toca el trigger ni cablea nada por riel.** Enseña al
--   único lugar que ya decide. *Si hubiera que tocar los registradores de Nuvei
--   y de DeUna, el segundo se olvidaría — que es exactamente lo que pasó en
--   S105 y por lo que esta forma existe.*
--
-- 🔴 LO QUE FALTABA: `mover_sujeto_por_reverso` conocía CUATRO sujetos y el XOR
--   ya admitía cinco. Un reverso de bono caía en `sujeto_indeterminado` —
--   honesto, y sin mover nada: la plata volvía y el paquete seguía dando días.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.mover_sujeto_por_reverso(p_intento_id uuid, p_motivo text DEFAULT 'reverso del proveedor'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_id uuid; v_ahora timestamptz := now();
  v_ped record; v_dest uuid; v_negocio text; v_prest uuid; v_avisos int := 0;
  v_futuras int := 0; v_pasadas int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','intento_no_existe'); END IF;

  /* 🔴 SÓLO SOBRE UN INTENTO YA REVERSADO. *Mover el sujeto de un intento vivo
     sería cancelar un pedido pagado por una llamada equivocada* — y esta
     función tiene poder para hacerlo. El estado terminal ES la autorización. */
  IF v_i.estado NOT IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'codigo','intento_no_reversado','estado', v_i.estado);
  END IF;

  /* ¿QUÉ SUJETO? — del intento, sin `else` que asuma.
     ✏️ El comentario decía «el CHECK admite cuatro» y **admitía cinco desde que
     nació `bono_id`**; hoy admite SEIS. *Un comentario que cuenta de menos es
     como el guard que sabe de menos: el que lee cree que la lista está completa.* */
  IF    v_i.cita_id IS NOT NULL THEN v_sujeto := 'cita';         v_id := v_i.cita_id;
  ELSIF v_i.compra_id IS NOT NULL THEN v_sujeto := 'compra';     v_id := v_i.compra_id;
  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN v_sujeto := 'suscripcion'; v_id := v_i.suscripcion_servicio_id;
  ELSIF v_i.recurrencia_id IS NOT NULL THEN v_sujeto := 'recurrencia'; v_id := v_i.recurrencia_id;
  ELSIF v_i.bono_id IS NOT NULL THEN v_sujeto := 'bono';         v_id := v_i.bono_id;
  ELSIF v_i.guarderia_suscripcion_id IS NOT NULL THEN v_sujeto := 'mensualidad_guarderia'; v_id := v_i.guarderia_suscripcion_id;
  ELSE RETURN jsonb_build_object('ok', false, 'codigo','sujeto_indeterminado'); END IF;

  -- ══ CITA ══ se cancela, libera el horario, y se enteran LOS DOS:
  --    la familia (le devolvieron la plata) y el prestador (recupera la hora)
  IF v_sujeto = 'cita' THEN
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* El aviso va al PRESTADOR: *es su agenda y su tiempo.* Se resuelve el
       destinatario desde el prestador, no desde la cita, porque la cita no
       guarda a quién avisarle. */
    SELECT c.prestador_id INTO v_prest FROM evento_cita_servicio c WHERE c.id = v_id;
    SELECT p.user_id INTO v_dest FROM prestadores p WHERE p.id = v_prest;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
        p_mascota_id => NULL, p_evento_id => NULL,
        /* 🔴 EL TEXTO SE PIDE, NO SE ESCRIBE ACÁ. Antes viajaba inline y eso
           lo dejaba **fuera del único lugar donde las voces se firman y se
           traducen** — quince productores usan `_voz_notificacion` y éste no.
           *Un aviso que nace donde nadie lo revisa nace en español y se queda
           en español.* */
        p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                     jsonb_build_object('sujeto','cita'))
                   || jsonb_build_object('sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:cita:' || v_id::text || ':prestador');
      v_avisos := v_avisos + 1;
    END IF;

    /* 🔴 Y A LA FAMILIA — firma del founder, 27-ago: *un movimiento de plata se
       le avisa a quien puso la plata.* Antes solo se avisaba al prestador, con
       la razon escrita «es su agenda y su tiempo» — que decidia a quien avisar
       de una CANCELACION, no de una DEVOLUCION. **Que la cita desaparezca sin
       explicacion es peor que cualquier voz.**

       El destinatario es el PAGADOR del intento, no el titular de la familia:
       *quien puso la plata es quien la recupera.* Medido: 0 de 24 intentos de
       cita tienen `pagador_user_id` nulo. */
    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','cita','para','familia'))
                   || jsonb_build_object('sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        /* 🔴 LA CLAVE LLEVA AL DESTINATARIO. Sin eso el dedup se come el
           segundo aviso: la clave vieja era `reverso:cita:<id>` para los dos, y
           **la familia nunca se habria enterado, en silencio.** */
        p_clave_dedup => 'reverso:cita:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ COMPRA + PEDIDOS ══ por la PUERTA, que además libera el inventario
  ELSIF v_sujeto = 'compra' THEN
    FOR v_ped IN SELECT p.* FROM pedidos p WHERE p.compra_id = v_id
                  AND p.estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
    LOOP
      /* 🔴 EL FALLO DE UN PEDIDO NO TUMBA LA CANCELACIÓN DE LOS OTROS ni la de
         la compra: *la plata ya volvió y el estado tiene que reflejarlo aunque
         una transición puntual rebote.* El motivo queda escrito igual. */
      BEGIN
        /* 🔴 `'sistema'`, no `'admin'`: esto corre desde un trigger, **sin
           sesión**. Con `'admin'` rebotaba `auth_requerido` y el pedido
           quedaba vivo con su reserva apartada. *El actor no es una etiqueta
           decorativa: es lo que decide si la puerta abre.* */
        PERFORM cancelar_pedido_despensa(v_ped.id, 'sistema', p_motivo);
      EXCEPTION WHEN OTHERS THEN
        UPDATE pedidos SET notas_admin = COALESCE(notas_admin,'') ||
               ' · reverso no pudo cancelar: ' || SQLERRM WHERE id = v_ped.id;
      END;

      -- si estaba en preparación o más allá, el VENDEDOR se entera
      IF v_ped.estado IN ('liberado_preparacion','documentado','en_reparto','hacia_destino') THEN
        SELECT cc.nombre_comercial INTO v_negocio FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        SELECT cc.owner_profile_id INTO v_dest FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        IF v_dest IS NOT NULL THEN
          PERFORM registrar_intencion_notificacion(
            p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
            p_mascota_id => NULL, p_evento_id => NULL,
            /* Mismo tipo, otro destinatario: la voz bifurca por `sujeto`.
               Va el `numero_orden` porque **es lo que el vendedor tiene
               pegado en la caja** — un uuid no le sirve para encontrarla. */
            p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                         jsonb_build_object('sujeto','pedido',
                           'numero_orden', v_ped.numero_orden))
                       || jsonb_build_object('sujeto','pedido','sujeto_id', v_ped.id,
                            'negocio', v_negocio, 'motivo', p_motivo),
            p_clave_dedup => 'reverso:pedido:' || v_ped.id::text);
          v_avisos := v_avisos + 1;
        END IF;
      END IF;
    END LOOP;

    UPDATE compras SET estado = 'cancelada', updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ SUSCRIPCIÓN ══ se corta y NO renueva
  ELSIF v_sujeto = 'suscripcion' THEN
    UPDATE suscripciones_servicio
       SET estado = 'cancelada', auto_renovar = false,
           cancelado_en = v_ahora, motivo_cancelacion = p_motivo
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ BONO (paquete de guardería) ══ el saldo muere y los días futuros con él
  ELSIF v_sujeto = 'bono' THEN
    /* La plata volvió ⇒ el saldo no puede seguir en pie. `reembolsado` ya
       existe en `bonos_estado_pago_valido`: no se inventa un estado. */
    UPDATE bonos SET estado = 'cancelado', estado_pago = 'reembolsado',
           pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                           || jsonb_build_object('reversado_en', v_ahora, 'motivo', p_motivo)
     WHERE id = v_id AND estado_pago <> 'reembolsado';

    /* 🔴 SÓLO LOS DÍAS QUE TODAVÍA NO OCURRIERON. *Cancelar una estadía que el
       perro ya vivió sería escribir que no pasó algo que pasó* — el prestador
       ya trabajó ese día. Se cancela lo futuro y **lo ya ocurrido se CUENTA y
       se devuelve**, para que una persona vea que hubo servicio prestado contra
       plata devuelta. La casa no decide sola qué hacer con eso. */
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE bono_id = v_id AND fecha >= public.hoy_local() AND estado <> 'cancelada';
    GET DIAGNOSTICS v_futuras = ROW_COUNT;

    SELECT count(*) INTO v_pasadas FROM evento_cita_servicio
     WHERE bono_id = v_id AND fecha < public.hoy_local() AND estado <> 'cancelada';

    UPDATE guarderia_estadias e SET estado = 'cancelada'
     WHERE e.estado NOT IN ('cancelada','cerrada')
       AND EXISTS (SELECT 1 FROM evento_cita_servicio c
                    WHERE c.id = e.cita_id AND c.bono_id = v_id
                      AND c.fecha >= public.hoy_local());

    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','bono','para','familia'))
                   || jsonb_build_object('sujeto','bono','sujeto_id', v_id,
                        'dias_cancelados', v_futuras, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:bono:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ MENSUALIDAD DE GUARDERÍA ══ el mandato se corta y no vuelve a cobrar
  ELSIF v_sujeto = 'mensualidad_guarderia' THEN
    UPDATE guarderia_suscripciones
       SET estado = 'cancelada', cancelada_en = v_ahora, updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* Los días del mes que todavía no ocurrieron. **No hay FK**: la cita guarda
       su origen en `metadata`, así que el vínculo se lee de ahí — y se declara
       acá para que nadie lo busque como columna. */
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE metadata->>'suscripcion_id' = v_id::text
       AND fecha >= public.hoy_local() AND estado <> 'cancelada';
    GET DIAGNOSTICS v_futuras = ROW_COUNT;

    SELECT count(*) INTO v_pasadas FROM evento_cita_servicio
     WHERE metadata->>'suscripcion_id' = v_id::text
       AND fecha < public.hoy_local() AND estado <> 'cancelada';

    UPDATE guarderia_estadias e SET estado = 'cancelada'
     WHERE e.estado NOT IN ('cancelada','cerrada')
       AND EXISTS (SELECT 1 FROM evento_cita_servicio c
                    WHERE c.id = e.cita_id
                      AND c.metadata->>'suscripcion_id' = v_id::text
                      AND c.fecha >= public.hoy_local());

    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','mensualidad_guarderia','para','familia'))
                   || jsonb_build_object('sujeto','mensualidad_guarderia','sujeto_id', v_id,
                        'dias_cancelados', v_futuras, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:guarderia_susc:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ RECURRENCIA ══
  ELSE
    UPDATE pedidos_recurrencias SET estado = 'cancelada' WHERE id = v_id AND estado <> 'cancelada';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujeto', v_sujeto, 'sujeto_id', v_id,
                            'avisos', v_avisos, 'motivo', p_motivo,
                            /* Se DEVUELVEN los dos números: lo que se canceló y
                               lo que ya había ocurrido y NO se tocó. */
                            'dias_cancelados', v_futuras,
                            'dias_ya_ocurridos', v_pasadas);
END $function$

;

-- ── LA VERDAD DEL PAGO EN LA CITA DEL PAQUETE ─────────────────────────────
/* ☠️ Sale `pago_simulado` de la estadía que nace de un paquete. El día se cubre
   con un paquete que **ahora se cobra de verdad**; dejar la bandera diría que
   no. *Una bandera de simulación que sobrevive al cobro real es letra que miente
   con cara de dato.* */
DO $lim$
DECLARE v_def text;
BEGIN
  v_def := pg_get_functiondef('public.reservar_dia_de_paquete_guarderia(uuid,date,uuid,uuid)'::regprocedure);
  IF position('''pago_simulado'',true' in v_def) = 0 THEN
    RAISE EXCEPTION 'la bandera no está donde se esperaba — no se toca a ciegas';
  END IF;
  EXECUTE replace(v_def,
    'jsonb_build_object(''origen'',''paquete'',''pago_simulado'',true,',
    'jsonb_build_object(''origen'',''paquete'',');
END $lim$;

-- ═══ CINTURÓN — el reverso se EJERCE, no se lee ═══════════════════════════
DO $c$
DECLARE v_fam uuid; v_prest uuid; v_user uuid; v_bono uuid; v_int uuid;
        v_estado text; v_pago text; v_susc uuid; v_mov jsonb;
BEGIN
  SELECT b.familia_id, b.prestador_id, b.user_id INTO v_fam, v_prest, v_user
    FROM bonos b WHERE b.tipo_servicio='guarderia_dia' LIMIT 1;

  -- (a) un bono pagado + su intento aprobado
  INSERT INTO bonos (prestador_id, user_id, familia_id, tipo_servicio,
    unidades_total, unidades_usadas, precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago, country_code)
  VALUES (v_prest, v_user, v_fam, 'guarderia_dia', 5, 0, 50, 10,
          public.hoy_local(), (public.hoy_local() + interval '1 month')::date,
          'activo', 'pagado', 'EC')
  RETURNING id INTO v_bono;

  INSERT INTO pagos_intentos (bono_id, proveedor, monto, moneda, forma, estado,
                              clave_idempotencia, payload_crudo, pagador_user_id, pagador_origen)
  VALUES (v_bono, 'nuvei', 50, 'USD', 'tokenizacion', 'aprobado',
          'cinturon:m3:'||v_bono::text, '{}'::jsonb, v_user, 'sesion')
  RETURNING id INTO v_int;

  -- (b) 🔴 EL DISCRIMINADOR: el TRIGGER mueve el sujeto solo, sin llamarlo
  UPDATE pagos_intentos SET estado='reversado' WHERE id=v_int;

  SELECT estado, estado_pago INTO v_estado, v_pago FROM bonos WHERE id=v_bono;
  IF v_estado <> 'cancelado' OR v_pago <> 'reembolsado' THEN
    RAISE EXCEPTION 'cinturon: el bono no se movio por reverso (estado=% pago=%)', v_estado, v_pago;
  END IF;

  -- (c) el mandato: mismo camino, otro sujeto
  /* 🔴 `uq_susc_viva_por_lugar` — el índice de `L-424` — impide dos mandatos
     activos del mismo hogar en el mismo lugar, así que el fixture **no puede
     clonar uno vivo**. Se aparta el existente primero; todo esto se deshace con
     la subtransacción. *El arnés se adapta al invariante; el invariante no se
     afloja para que el arnés pase.* */
  /* `chk_susc_cancelacion_coherente` exige la fecha junto al estado — el mismo
     invariante que la rama de producción cumple escribiendo `cancelada_en`. */
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE estado='activa';

  INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado)
  SELECT g.familia_id, g.prestador_id, g.prestador_servicio_id, g.tarjeta_id,
         g.autorizada_por, g.monto_esperado, g.precio_mensual, 'activa'
    FROM guarderia_suscripciones g LIMIT 1
  RETURNING id INTO v_susc;
  IF v_susc IS NULL THEN RAISE EXCEPTION 'cinturon: sin mandato de referencia'; END IF;

  INSERT INTO pagos_intentos (guarderia_suscripcion_id, guarderia_suscripcion_periodo,
                              proveedor, monto, moneda, forma, estado,
                              clave_idempotencia, payload_crudo, pagador_user_id, pagador_origen)
  VALUES (v_susc, public.hoy_local(), 'nuvei', 100, 'USD', 'tokenizacion', 'aprobado',
          'cinturon:m3s:'||v_susc::text, '{}'::jsonb, v_user, 'sesion')
  RETURNING id INTO v_int;

  UPDATE pagos_intentos SET estado='reversado' WHERE id=v_int;
  SELECT estado INTO v_estado FROM guarderia_suscripciones WHERE id=v_susc;
  IF v_estado <> 'cancelada' THEN
    RAISE EXCEPTION 'cinturon: el mandato no se corto por reverso (estado=%)', v_estado;
  END IF;

  -- (d) el resolvedor ya no devuelve `sujeto_indeterminado` para estos dos
  SELECT public.mover_sujeto_por_reverso(v_int, 'cinturon') INTO v_mov;
  IF v_mov->>'sujeto' <> 'mensualidad_guarderia' THEN
    RAISE EXCEPTION 'cinturon: el sujeto no se nombro: %', v_mov::text;
  END IF;

  RAISE NOTICE 'cinturon M3: 4/4 OK (bono reversado por TRIGGER · mandato cortado · sujeto nombrado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M3: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;

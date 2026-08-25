-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · EL SISTEMA PUEDE CANCELAR UN PEDIDO — el callejón que el reverso destapó
--
-- EL DEFECTO, medido en carne hace un minuto: las dos compras de un reverso
-- quedaron `cancelada` **y sus pedidos siguieron en `pago_capturado`, con la
-- reserva de inventario `vigente`** — mercadería apartada para pedidos que
-- nadie iba a despachar. La causa quedó escrita por el propio guard:
--     ` · reverso no pudo cancelar: auth_requerido`
--
-- 🔴 LA CADENA, y es un callejón entre dos piezas correctas:
--   · `_mover_estado_pedido` deja pasar **sin sesión** sólo a `p_actor='sistema'`
--   · `cancelar_pedido_despensa` aceptaba **`cliente | vendedor | admin`**
--   · `cat_transiciones_pedido` declara `'sistema'` como actor válido ✅
-- ⇒ **el motor no tenía por dónde entrar.** *Un actor que el catálogo declara
-- válido y la puerta no acepta es un callejón que sólo se descubre cuando algo
-- del servidor necesita pasar* — y acá pasó con plata devuelta de por medio.
--
-- ⚠️ LA LISTA SIGUE CERRADA. El comentario histórico de esa función advierte
-- que su `ELSE` era la puerta *(«un ELSE que elige el camino más poderoso es un
-- ELSE mal puesto»)*: **no se restaura el ELSE**, se suma un valor nombrado.
--
-- 76(g) — VEDA: 🔴 **RIGE.** Termina de mover DOS PEDIDOS vivos y **libera sus
-- reservas de inventario**. Acotado por su intento reversado, verificado antes
-- y después.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826070000.sql`
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cancelar_pedido_despensa(p_pedido_id uuid, p_actor text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_hasta text;
BEGIN
  -- 🔴 EL `ELSE` ERA LA PUERTA. La versión de S95-D hacía
  --    `CASE p_actor WHEN 'cliente' … WHEN 'vendedor' … ELSE 'cancelado_sistema'`,
  --    así que **cualquier palabra que no fuera esas dos** caía en el camino
  --    del sistema y cancelaba el pedido de otro. Un `ELSE` que elige el
  --    camino más poderoso es un `ELSE` mal puesto.
  /* 🔴 `'sistema'` SE SUMA A LA LISTA — y la lista SIGUE CERRADA, que era el
     punto del `ELSE` que se quitó en su día. Sin él, el motor no tenía camino:
     `_mover_estado_pedido` deja pasar sin sesión **sólo** a `'sistema'`, y esta
     función no lo aceptaba ⇒ todo intento del servidor rebotaba
     `auth_requerido`. **Medido en carne**: las dos compras de un reverso
     quedaron canceladas y **sus pedidos no**, con la mercadería apartada para
     pedidos que nadie iba a despachar.
     *Un actor que el catálogo declara válido y la puerta no acepta es un
     callejón que sólo se descubre cuando algo del servidor necesita entrar.* */
  IF p_actor NOT IN ('cliente','vendedor','admin','sistema') THEN
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  v_hasta := CASE p_actor WHEN 'cliente' THEN 'cancelado_cliente'
                          WHEN 'vendedor' THEN 'cancelado_vendedor'
                          ELSE 'cancelado_sistema' END;  -- admin y sistema
  -- Por la puerta INTERNA, pero con el actor declarado: los gates de
  -- cliente/vendedor/admin del anillo interno hacen la verificación.
  PERFORM _mover_estado_pedido(p_pedido_id, v_hasta, p_actor, p_motivo);

  FOR v_r IN SELECT * FROM inventario_reservas
              WHERE pedido_id = p_pedido_id AND estado='vigente' FOR UPDATE LOOP
    INSERT INTO inventario_movimientos (sku_id, tipo, cantidad, motivo, referencia_tipo, referencia_id)
      VALUES (v_r.sku_id, 'liberacion_reserva', v_r.cantidad,
              COALESCE(p_motivo,'pedido cancelado'), 'pedido', p_pedido_id);
    UPDATE inventario_reservas SET estado='liberada', cerrada_en=now() WHERE id = v_r.id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'estado', v_hasta);
END $function$
;

CREATE OR REPLACE FUNCTION public.mover_sujeto_por_reverso(p_intento_id uuid, p_motivo text DEFAULT 'reverso del proveedor'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_id uuid; v_ahora timestamptz := now();
  v_ped record; v_dest uuid; v_negocio text; v_prest uuid; v_avisos int := 0;
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

  -- ¿QUÉ SUJETO? — del intento, sin `else` que asuma (el CHECK admite cuatro)
  IF    v_i.cita_id IS NOT NULL THEN v_sujeto := 'cita';         v_id := v_i.cita_id;
  ELSIF v_i.compra_id IS NOT NULL THEN v_sujeto := 'compra';     v_id := v_i.compra_id;
  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN v_sujeto := 'suscripcion'; v_id := v_i.suscripcion_servicio_id;
  ELSIF v_i.recurrencia_id IS NOT NULL THEN v_sujeto := 'recurrencia'; v_id := v_i.recurrencia_id;
  ELSE RETURN jsonb_build_object('ok', false, 'codigo','sujeto_indeterminado'); END IF;

  -- ══ CITA ══ se cancela, libera el horario, y el PRESTADOR se entera
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
        p_clave_dedup => 'reverso:cita:' || v_id::text);
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

  -- ══ RECURRENCIA ══
  ELSE
    UPDATE pedidos_recurrencias SET estado = 'cancelada' WHERE id = v_id AND estado <> 'cancelada';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujeto', v_sujeto, 'sujeto_id', v_id,
                            'avisos', v_avisos, 'motivo', p_motivo);
END $function$
;


/* LOS DOS PEDIDOS VIVOS — 76(g) RIGE. Se re-corre la MISMA función sobre los
   intentos ya reversados: es idempotente (salta lo ya cancelado) y ahora sí
   tiene camino. */
DO $viva$
DECLARE r jsonb; v_id uuid;
BEGIN
  FOR v_id IN SELECT i.id FROM pagos_intentos i
               WHERE i.estado IN ('reversado','reverso_fallido')
  LOOP
    r := mover_sujeto_por_reverso(v_id, 'reverso confirmado por el proveedor (S105)');
    RAISE NOTICE 'pedido re-corrido · intento=% · %', left(v_id::text,8), r::text;
  END LOOP;
END $viva$;

-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — 🔴 lo que 76(g) obliga: qué quedó DE VERDAD en las filas vivas.
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_ped_vivos int; v_res_vivas int; v_compras int; v_avisos int;
BEGIN
  SELECT count(*) INTO v_compras FROM compras c JOIN pagos_intentos i ON i.compra_id=c.id
   WHERE i.estado IN ('reversado','reverso_fallido') AND c.estado='pagada';

  SELECT count(*) INTO v_ped_vivos FROM pedidos p JOIN pagos_intentos i ON i.compra_id=p.compra_id
   WHERE i.estado IN ('reversado','reverso_fallido')
     AND p.estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor');

  SELECT count(*) INTO v_res_vivas FROM inventario_reservas r
    JOIN pedidos p ON p.id=r.pedido_id JOIN pagos_intentos i ON i.compra_id=p.compra_id
   WHERE i.estado IN ('reversado','reverso_fallido') AND r.estado='vigente';

  IF v_compras > 0 THEN RAISE EXCEPTION 'CINTURÓN: % compras PAGADAS con plata devuelta', v_compras; END IF;
  IF v_ped_vivos > 0 THEN RAISE EXCEPTION 'CINTURÓN: % pedidos VIVOS sobre plata devuelta', v_ped_vivos; END IF;
  IF v_res_vivas > 0 THEN
    RAISE EXCEPTION 'CINTURÓN: % reservas de inventario APARTADAS para pedidos muertos', v_res_vivas;
  END IF;

  SELECT count(*) INTO v_avisos FROM notificacion_intencion WHERE clave_dedup LIKE 'reverso:%';

  RAISE NOTICE 'CINTURÓN VERDE · compras pagadas=% · pedidos vivos=% · reservas apartadas=% · avisos generados=%',
    v_compras, v_ped_vivos, v_res_vivas, v_avisos;
END $cint$;

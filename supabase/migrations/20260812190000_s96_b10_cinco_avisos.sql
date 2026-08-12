-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B10 — LOS CINCO AVISOS, SOBRE EL MOTOR QUE YA EXISTE
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §8.2 — **se notifica lo
-- que cambia lo que la persona puede hacer**:
--
--   confirmado · en ruta · 🔴 vamos hacia vos (el único que hace que alguien
--   se quede en casa) · entregado · (entrega fallida, solo si pasa)
--
-- **Preparado y empacado NO notifican.** Son operación interna del vendedor
-- y no le cambian nada al cliente — *avisar todo enseña a ignorar los
-- avisos.* En el mapa de abajo, `picking`/`empacado`/`documentado`
-- simplemente NO tienen entrada, y el juez lo vigila.
--
-- CÓMO: cinco tipos nuevos al vocabulario cerrado (el CHECK de
-- `notificaciones` + el catálogo de S87 con su categoría `operacion`,
-- audiencia `cliente`, EN VIVO — push está vivo desde S90) y un trigger
-- AFTER INSERT sobre `pedido_estados` — el sedimento ES la señal
-- (MODELO_NOTIFICACIONES §2): cero polling, cero lógica en pantallas. La
-- intención pasa por `registrar_intencion_notificacion`, que ya trae los
-- gates (memorial, menores, consentimiento, techo) y el dedup.
--
-- LA LEY DE LA PANTALLA BLOQUEADA (§4): los `datos` llevan pedido_id y
-- número de orden — jamás el código de la puerta, jamás una palabra de la
-- mascota.
--
-- Y UNA DECISIÓN DECLARADA: si registrar la intención falla, el aviso se
-- pierde CON WARNING — jamás aborta la transición. Un pedido que no se pudo
-- entregar porque el catálogo de avisos tenía un hueco sería el motor de
-- avisos mandando sobre el motor de pedidos, y es al revés.
--
-- Reversa: scripts/s96/2026-08-12-s96-m8-REVERSA.sql
-- ── DECLARACIÓN 76(g): rige solo en el cinturón (fixture in-txn, residuo 0;
--    las intenciones del fixture se borran antes del COMMIT — ningún tick de
--    despacho puede verlas).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ① El vocabulario cerrado gana los cinco tipos.
ALTER TABLE public.notificaciones DROP CONSTRAINT notificaciones_tipo_check;
ALTER TABLE public.notificaciones ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo = ANY (ARRAY['pedido_estado','cita_recordatorio','cita_confirmada',
    'vacuna_vencida','wearable_alerta','mensaje_nuevo','promocion','sistema',
    'pago_confirmado','devolucion_estado','pedido_recurrente','cita_rechazada',
    'cita_completada','cita_no_show','cita_solicitada','cita_cancelada_cliente',
    'cita_calificada','prestador_aprobado','prestador_rechazado','prestador_suspendido',
    'documento_aprobado','documento_rechazado','liquidacion_disponible',
    'alta_asistida_pendiente_enviar_email','alta_asistida_completada_por_cliente',
    'alta_asistida_vencida_soporte',
    'pedido_confirmado','pedido_en_camino','pedido_hacia_destino',
    'pedido_entregado','pedido_entrega_fallida']::text[]));

INSERT INTO cat_notificacion_tipos (codigo, categoria, audiencia, en_sombra, activo, descripcion) VALUES
  ('pedido_confirmado', 'operacion', 'cliente', false, true,
   'S96 · El recibo: el pago entró y el pedido es del vendedor.'),
  ('pedido_en_camino', 'operacion', 'cliente', false, true,
   'S96 · Salió del local.'),
  ('pedido_hacia_destino', 'operacion', 'cliente', false, true,
   'S96 · «Vamos hacia vos»: sos el próximo. El único aviso que hace que alguien se quede en casa.'),
  ('pedido_entregado', 'operacion', 'cliente', false, true,
   'S96 · Cerró. El evento del expediente ya se depositó.'),
  ('pedido_entrega_fallida', 'operacion', 'cliente', false, true,
   'S96 · Solo si pasa. El pedido vuelve y se reagenda.');

-- ② El trigger: el sedimento es la señal.
CREATE FUNCTION public._trg_pedido_avisa_familia()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_tipo text; v_ped record;
BEGIN
  v_tipo := CASE NEW.estado_codigo
    WHEN 'pago_capturado'  THEN 'pedido_confirmado'
    WHEN 'en_reparto'      THEN 'pedido_en_camino'
    WHEN 'hacia_destino'   THEN 'pedido_hacia_destino'
    WHEN 'entregado'       THEN 'pedido_entregado'
    WHEN 'entrega_fallida' THEN 'pedido_entrega_fallida'
    ELSE NULL
  END;
  IF v_tipo IS NULL THEN RETURN NEW; END IF;   -- preparado/empacado: silencio

  SELECT user_id, numero_orden INTO v_ped FROM pedidos WHERE id = NEW.pedido_id;
  IF v_ped.user_id IS NULL THEN RETURN NEW; END IF;

  BEGIN
    -- La clave de dedup es la FILA de la historia: el mismo pedido que vuelve
    -- a entrar en `en_reparto` tras una fallida avisa de nuevo — correcto,
    -- porque para la familia ES una novedad.
    PERFORM registrar_intencion_notificacion(
      v_tipo, v_ped.user_id, NULL, NULL,
      jsonb_build_object('pedido_id', NEW.pedido_id,
                         'numero_orden', v_ped.numero_orden,
                         'estado', NEW.estado_codigo),
      'pedido_estado:' || NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aviso de pedido no registrado (%): %', v_tipo, SQLERRM;
  END;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public._trg_pedido_avisa_familia() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_pedido_avisa_familia
  AFTER INSERT ON public.pedido_estados
  FOR EACH ROW EXECUTE FUNCTION public._trg_pedido_avisa_familia();

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_buyer uuid; v_ped uuid;
  v_int_antes int; v_ped_antes int; v_n int;
BEGIN
  SELECT count(*) INTO v_int_antes FROM notificacion_intencion;
  SELECT count(*) INTO v_ped_antes FROM pedidos;

  SELECT cc.id INTO v_cc
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT fm.user_id INTO v_buyer FROM familia_miembro fm
   WHERE fm.hasta IS NULL AND fm.rol IN ('adulto_titular','adulto_autorizado') LIMIT 1;

  -- Un pedido sintético que recorre la historia SIN el motor (INSERT directo a
  -- pedido_estados: acá se prueba el TRIGGER, no la máquina — la máquina ya
  -- tiene sus cinturones en M1/M2).
  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, metodo_entrega, entrega_direccion)
    VALUES (v_buyer, v_cc, 0,0,0,0,0, '__cint_s96m8', 'P-CINT-M8', 'despacho', 'x')
    RETURNING id INTO v_ped;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_buyer, 'cliente'),
           (v_ped, 'pago_capturado', NULL, 'sistema'),
           (v_ped, 'picking', v_buyer, 'vendedor'),
           (v_ped, 'empacado', v_buyer, 'vendedor'),
           (v_ped, 'en_reparto', v_buyer, 'vendedor'),
           (v_ped, 'hacia_destino', v_buyer, 'repartidor'),
           (v_ped, 'entregado', v_buyer, 'repartidor');

  -- Nacieron EXACTAMENTE los avisos de la letra: confirmado, en camino,
  -- hacia destino, entregado — y NADA por creado/picking/empacado.
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE datos->>'pedido_id' = v_ped::text;
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'ABORTA: se esperaban 4 intenciones (confirmado/en_camino/hacia_destino/entregado) y hay % — preparado y empacado NO notifican.', v_n;
  END IF;
  IF EXISTS (SELECT 1 FROM notificacion_intencion
             WHERE datos->>'pedido_id' = v_ped::text
               AND datos->>'estado' IN ('picking','empacado','creado')) THEN
    RAISE EXCEPTION 'ABORTA: un escalón interno del vendedor notificó a la familia.';
  END IF;
  -- Y ninguno filtra datos de pantalla bloqueada: ni código, ni mascota.
  IF EXISTS (SELECT 1 FROM notificacion_intencion
             WHERE datos->>'pedido_id' = v_ped::text
               AND (datos ? 'codigo_verificacion' OR datos ? 'mascota_id')) THEN
    RAISE EXCEPTION 'ABORTA §4: un aviso lleva el código o la mascota en su carga.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  DELETE FROM notificacion_intencion WHERE datos->>'pedido_id' = v_ped::text;
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedidos WHERE id = v_ped;

  SELECT count(*) INTO v_n FROM notificacion_intencion;
  IF v_n <> v_int_antes THEN RAISE EXCEPTION 'ABORTA 76(g): intenciones % vs %', v_n, v_int_antes; END IF;
  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN RAISE EXCEPTION 'ABORTA 76(g): pedidos % vs %', v_n, v_ped_antes; END IF;

  RAISE NOTICE 'CINTURÓN S96-M8: nacen los 4 avisos del recorrido feliz y NINGUNO por preparado/empacado; la carga no lleva código ni mascota. Residuo 0.';
END $$;

COMMIT;
